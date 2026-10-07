"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { AUTH_ROUTES, safeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import {
  parseEmailOnly,
  parseLogin,
  parseNewPassword,
  parseSignup,
} from "@/features/auth/validation";
import type { AuthFormState } from "@/features/auth/types";

/**
 * Origin of the current request, used to build email links. Next.js already
 * rejects Server Action requests whose Origin doesn't match the host.
 */
async function getOrigin(): Promise<string> {
  const origin = (await headers()).get("origin");
  return origin ?? publicEnv.appUrl;
}

/** Never echo passwords back to the client. */
function echoValues(formData: FormData): AuthFormState["values"] {
  const pick = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };
  return { email: pick("email"), fullName: pick("fullName") };
}

function isRateLimited(code: string | undefined): boolean {
  return (
    code === "over_request_rate_limit" || code === "over_email_send_rate_limit"
  );
}

function confirmUrl(origin: string, next: string): string {
  return `${origin}/auth/confirm?next=${encodeURIComponent(next)}`;
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseLogin(formData);
  const values = echoValues(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (isRateLimited(error.code)) {
      return { error: "Too many attempts. Please try again later.", values };
    }
    if (error.code === "email_not_confirmed") {
      return {
        error: "Please confirm your email address first. Check your inbox.",
        values,
      };
    }
    if (error.code === "invalid_credentials") {
      // Same message for unknown email and wrong password, so the form
      // can't be used to discover which accounts exist.
      return { error: "Invalid email or password.", values };
    }
    return { error: "Could not sign you in. Please try again.", values };
  }

  redirect(safeRedirectPath(formData.get("next")));
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseSignup(formData);
  const values = echoValues(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, values };

  const { fullName, email: cleanEmail, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: confirmUrl(await getOrigin(), AUTH_ROUTES.afterLogin),
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { fieldErrors: { password: error.message }, values };
    }
    if (isRateLimited(error.code)) {
      return { error: "Too many attempts. Please try again later.", values };
    }
    return { error: "Could not create your account. Please try again.", values };
  }

  // Email confirmation disabled in Supabase → the user is signed in already.
  if (data.session) redirect(AUTH_ROUTES.afterLogin);

  // Same message whether or not the email was already registered, so the
  // form can't be used to discover existing accounts.
  return {
    message: `We sent a confirmation link to ${cleanEmail}. Open it to activate your account.`,
  };
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseEmailOnly(formData);
  const values = echoValues(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: confirmUrl(await getOrigin(), AUTH_ROUTES.resetPassword) },
  );

  if (isRateLimited(error?.code)) {
    return { error: "Too many attempts. Please try again later.", values };
  }

  return {
    message:
      "If an account exists for that email, we sent a link to reset your password.",
  };
}

export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseNewPassword(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return {
      error: "Your reset link has expired. Please request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    if (error.code === "same_password") {
      return {
        fieldErrors: {
          password: "Choose a password different from your current one.",
        },
      };
    }
    if (error.code === "weak_password") {
      return { fieldErrors: { password: error.message } };
    }
    return { error: "Could not update your password. Please try again." };
  }

  redirect(AUTH_ROUTES.afterLogin);
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(AUTH_ROUTES.login);
}
