import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";
import { serverEnv } from "@/lib/server-env";
import type { Database } from "@/types/database";

/**
 * Privileged Supabase client (service role). It BYPASSES Row Level Security.
 *
 * Use only in trusted server code that is not acting on behalf of the current
 * user: webhooks (e.g. payments), admin tasks, background jobs. For anything
 * a signed-in user does, use `createClient()` from `@/lib/supabase/server`
 * so RLS keeps applying. Never pass its results to the client unfiltered.
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = serverEnv.supabaseServiceRoleKey;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. It is required only for privileged server-side operations.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      // No user session: this client never reads or writes auth cookies.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
