"use server";

import sharp from "sharp";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { AUTH_ROUTES } from "@/lib/auth/redirect";
import { publicEnv } from "@/lib/env";
import { deleteAllUserFiles, deleteUserFile, storeUserBytes } from "@/lib/storage/server";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_LIMITS,
  parseDeleteAccount,
  parseEmailChange,
  parsePasswordChange,
  parsePreferences,
  parseProfile,
  type SettingsFormState,
} from "@/features/settings/validation";

/**
 * Settings actions. Every one derives the user from the server-side session
 * (never from form data) and runs with the user's own Supabase session, so
 * RLS and column grants limit writes to their own profile row and folder.
 * Passwords are only passed through to Supabase Auth, never stored or logged.
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;

function isRateLimited(code: string | undefined) {
  return code === "over_request_rate_limit" || code === "over_email_send_rate_limit";
}

/**
 * Re-checks the current password with Supabase Auth. On success the session
 * is renewed, which also satisfies "recent sign-in" requirements.
 */
async function verifyPassword(
  supabase: Supabase,
  email: string | null,
  password: string,
): Promise<SettingsFormState | null> {
  if (!email) return { error: "Your account has no email address. Please contact support." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return null;
  if (isRateLimited(error.code)) return { error: "Too many attempts. Please wait a few minutes and try again." };
  if (error.code === "invalid_credentials") return { fieldErrors: { currentPassword: "Incorrect password." } };
  return { error: "Could not verify your password. Please try again." };
}

// ----------------------------------------------------------------- profile

export async function updateProfile(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = parseProfile(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", user.id);
  if (error) return { error: "Could not save your profile. Please try again." };

  revalidatePath("/", "layout");
  return { message: "Profile saved.", savedAt: Date.now() };
}

export async function updateAvatar(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const user = await requireUser();
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image." };
  if (file.size > AVATAR_LIMITS.maxUploadBytes) return { error: "That image is too large. Try a smaller one." };
  if (!(AVATAR_LIMITS.allowedTypes as readonly string[]).includes(file.type)) {
    return { error: "Use a JPEG, PNG or WebP image." };
  }

  // Re-encode on the server: normalises the format and size, drops any
  // metadata (e.g. GPS location in photos) and rejects files that aren't
  // really images.
  let bytes: Buffer;
  try {
    bytes = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(AVATAR_LIMITS.storedSize, AVATAR_LIMITS.storedSize, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    return { error: "That file couldn't be read as an image." };
  }

  const stored = await storeUserBytes("avatars", bytes, "image/webp");
  if (!stored.ok) return { error: "Could not upload your photo. Please try again." };

  const supabase = await createClient();
  const { data: previous } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
  const { error } = await supabase.from("profiles").update({ avatar_url: stored.path }).eq("id", user.id);
  if (error) {
    await deleteUserFile(stored.path);
    return { error: "Could not save your photo. Please try again." };
  }
  // Only remove a previous file from our own storage (deleteUserFile checks the owner).
  if (previous?.avatar_url && !previous.avatar_url.startsWith("https://")) await deleteUserFile(previous.avatar_url);

  revalidatePath("/", "layout");
  return { message: "Photo updated.", savedAt: Date.now() };
}

export async function removeAvatar(): Promise<SettingsFormState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: previous } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { error: "Could not remove your photo. Please try again." };
  if (previous?.avatar_url && !previous.avatar_url.startsWith("https://")) await deleteUserFile(previous.avatar_url);

  revalidatePath("/", "layout");
  return { message: "Photo removed.", savedAt: Date.now() };
}

// ----------------------------------------------------------------- preferences

export async function updatePreferences(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = parsePreferences(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ default_tone: parsed.data.defaultTone, default_language: parsed.data.defaultLanguage })
    .eq("id", user.id);
  if (error) return { error: "Could not save your preferences. Please try again." };

  revalidatePath("/writer");
  revalidatePath("/settings");
  return { message: "Preferences saved. The AI Writer will start with these.", savedAt: Date.now() };
}

// ----------------------------------------------------------------- email

export async function changeEmail(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = parseEmailChange(formData, user.email);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const failed = await verifyPassword(supabase, user.email, parsed.data.currentPassword);
  if (failed) return failed;

  // Supabase Auth sends the confirmation email(s); the address only changes
  // (and profiles.email follows via a database trigger) once confirmed.
  const origin = (await headers()).get("origin") ?? publicEnv.appUrl;
  const next = encodeURIComponent("/settings?notice=email_updated");
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: `${origin}/auth/confirm?next=${next}` },
  );

  if (error) {
    if (isRateLimited(error.code)) return { error: "Too many emails sent. Please try again later." };
    if (error.code === "email_exists") return { fieldErrors: { email: "That email address is already in use." } };
    if (error.code === "email_address_invalid") return { fieldErrors: { email: "Enter a valid email address." } };
    return { error: "Could not start the email change. Please try again." };
  }

  revalidatePath("/settings");
  return {
    message: `Almost done: open the confirmation link sent to ${parsed.data.email}. Your email stays the same until you confirm.`,
    savedAt: Date.now(),
  };
}

// ----------------------------------------------------------------- password

export async function changePassword(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = parsePasswordChange(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const failed = await verifyPassword(supabase, user.email, parsed.data.currentPassword);
  if (failed) return failed;

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { fieldErrors: { password: "Choose a password different from your current one." } };
    if (error.code === "weak_password") return { fieldErrors: { password: error.message } };
    if (isRateLimited(error.code)) return { error: "Too many attempts. Please try again later." };
    return { error: "Could not change your password. Please try again." };
  }

  // Sign out every other device that knew the old password.
  await supabase.auth.signOut({ scope: "others" });
  return { message: "Password changed. Other devices have been signed out.", savedAt: Date.now() };
}

// ----------------------------------------------------------------- sessions

export async function logoutEverywhere(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect(AUTH_ROUTES.login);
}

// ----------------------------------------------------------------- delete

export async function deleteAccount(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = parseDeleteAccount(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const failed = await verifyPassword(supabase, user.email, parsed.data.currentPassword);
  if (failed) return failed;

  // 1. Files first, while the session can still reach them. If this fails,
  //    nothing else is deleted and the user can try again.
  if (!(await deleteAllUserFiles())) {
    return { error: "Could not delete your files. Your account was not deleted; please try again." };
  }

  // 2. The account; the database cascades to every row the user owns and
  //    refuses unless the session was authenticated in the last few minutes.
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("[settings] delete_my_account failed", error.code);
    return { error: "Could not delete your account. Please try again." };
  }

  // 3. Clear this browser's session cookies.
  await supabase.auth.signOut({ scope: "local" });
  redirect(`${AUTH_ROUTES.login}?notice=account_deleted`);
}
