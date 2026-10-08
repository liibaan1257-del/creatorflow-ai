import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/** Supabase origin for connect/img sources (null if unset or malformed). */
function supabaseOrigin(): string | null {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/[`'"\s]/g, "");
  try {
    return raw ? new URL(raw).origin : null;
  } catch {
    return null;
  }
}

/**
 * Content Security Policy. Partial Prerendering serves static shells, so a
 * per-request nonce isn't possible; inline scripts are allowed ('unsafe-inline')
 * but everything else is locked down: no plugins, no framing, no foreign form
 * targets or <base> hijacking, and network requests only to this site and
 * Supabase.
 */
function contentSecurityPolicy(): string {
  const supabase = supabaseOrigin();
  const supabaseWs = supabase?.replace(/^http/, "ws");
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    // Signed Storage URLs, provider avatars (https only), previews (blob/data).
    "img-src": ["'self'", "data:", "blob:", "https:", ...(supabase ? [supabase] : [])],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...(supabase ? [supabase] : []), ...(supabaseWs ? [supabaseWs] : [])],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
