import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUTH_ROUTES } from "@/lib/auth/redirect";
import { fetchMyCredits } from "@/lib/credits";
import type { CreditSummary, CreditTransaction, Profile, Subscription } from "@/types/database";

/**
 * Data Access Layer: the single place that resolves the current user.
 * Every protected page and Server Action goes through here, so authorization
 * never relies on the proxy alone. Reads cookies, so callers must render
 * inside a <Suspense> boundary.
 */

export type CurrentUser = {
  id: string;
  email: string | null;
};

/** Returns the verified user, or null when signed out. Deduped per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(AUTH_ROUTES.login);
  return user;
}

/** The signed-in user's profile. RLS guarantees only their own row is visible. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return data;
});

/**
 * The signed-in user's balance, allowance, next reset and effective plan
 * (null if the row is missing). Applies a due monthly reset first, so the
 * number shown is always current.
 */
export const getCurrentCredits = cache(async (): Promise<CreditSummary | null> => {
  await requireUser();
  return fetchMyCredits(await createClient());
});

/** The signed-in user's most recent credit ledger entries (RLS: own rows only). */
export const getCreditHistory = cache(async (limit = 20): Promise<CreditTransaction[]> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load credit history: ${error.message}`);
  return data;
});

/** The signed-in user's current plan (null if the row is missing). */
export const getCurrentSubscription = cache(async (): Promise<Subscription | null> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load subscription: ${error.message}`);
  return data;
});

/**
 * Auth details for the settings page, verified with Supabase Auth (a network
 * call, so only used where needed). `pendingEmail` is set while an email
 * change waits for confirmation.
 */
export const getAuthAccount = cache(async (): Promise<{ email: string | null; pendingEmail: string | null } | null> => {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { email: data.user.email ?? null, pendingEmail: data.user.new_email ?? null };
});
