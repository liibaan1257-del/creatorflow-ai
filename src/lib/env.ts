/**
 * Centralised environment variable access.
 *
 * - `publicEnv` only contains `NEXT_PUBLIC_*` values. These are inlined into
 *   the client bundle at build time, so never put secrets here.
 * - Server-only secrets (Supabase service role key, AI provider keys, payment
 *   keys) live in `src/lib/server-env.ts`, guarded by `import "server-only"`,
 *   so they can never be bundled into client code.
 *
 * Each variable must be referenced literally (`process.env.NEXT_PUBLIC_X`) so
 * Next.js can inline it; dynamic lookups are not replaced at build time.
 */

/** Trims whitespace and stray wrapping quotes pasted into dashboards. */
function clean(value: string | undefined): string {
  return (value ?? "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();
}

function normalizeUrl(value: string | undefined, fallback: string): string {
  const url = value?.trim() || fallback;
  return url.replace(/\/+$/, "");
}

export const publicEnv = {
  // Canonical site URL (metadata, Open Graph, sitemap). Falls back to
  // Vercel's system variables: production domain first, then this deployment.
  appUrl: normalizeUrl(
    clean(process.env.NEXT_PUBLIC_APP_URL) ||
      (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.NEXT_PUBLIC_VERCEL_URL
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
          : undefined),
    "http://localhost:3000",
  ),
  supabaseUrl: clean(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, ""),
  // Public client key: the anon key or the newer publishable key
  // (sb_publishable_...). Safe in the browser: Row Level Security enforces
  // data access. Either variable name is accepted.
  supabasePublishableKey:
    clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    clean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
} as const;

export type SupabaseConfigStatus = "ok" | "missing" | "invalid_url";

/** Non-secret summary of the Supabase configuration (safe to expose). */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const { supabaseUrl, supabasePublishableKey } = publicEnv;
  if (!supabaseUrl || !supabasePublishableKey) return "missing";
  try {
    const { protocol } = new URL(supabaseUrl);
    return protocol === "https:" || protocol === "http:" ? "ok" : "invalid_url";
  } catch {
    return "invalid_url";
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus() === "ok";
}

export function getSupabaseEnv(): { url: string; publishableKey: string } {
  const status = getSupabaseConfigStatus();
  if (status !== "ok") {
    throw new Error(
      status === "missing"
        ? "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example)."
        : "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Expected e.g. https://<project-ref>.supabase.co",
    );
  }
  return {
    url: publicEnv.supabaseUrl,
    publishableKey: publicEnv.supabasePublishableKey,
  };
}
