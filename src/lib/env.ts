/**
 * Centralised environment variable access.
 *
 * - `publicEnv` only contains `NEXT_PUBLIC_*` values. These are inlined into
 *   the client bundle at build time, so never put secrets here.
 * - Server-only secrets (Supabase service role, AI provider keys, payment
 *   keys) will live in `src/lib/server-env.ts`, guarded by `import "server-only"`,
 *   so they can never be bundled into client code.
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
} as const;
