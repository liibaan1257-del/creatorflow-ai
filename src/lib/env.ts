/**
 * Centralised environment variable access.
 *
 * - `publicEnv` only contains `NEXT_PUBLIC_*` values. These are inlined into
 *   the client bundle at build time, so never put secrets here.
 * - Server-only secrets (Supabase secret key, AI provider keys, payment keys)
 *   will live in a module guarded by `import "server-only"`, so they can never
 *   be bundled into client code.
 *
 * Each variable must be referenced literally (`process.env.NEXT_PUBLIC_X`) so
 * Next.js can inline it; dynamic lookups are not replaced at build time.
 */

function normalizeUrl(value: string | undefined, fallback: string): string {
  const url = value?.trim() || fallback;
  return url.replace(/\/+$/, "");
}

export const publicEnv = {
  appUrl: normalizeUrl(
    process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : undefined),
    "http://localhost:3000",
  ),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
  // Publishable (sb_publishable_...) or legacy anon key. Safe in the browser:
  // data access is enforced by Row Level Security.
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublishableKey);
}

export function getSupabaseEnv(): { url: string; publishableKey: string } {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).",
    );
  }
  return {
    url: publicEnv.supabaseUrl,
    publishableKey: publicEnv.supabasePublishableKey,
  };
}
