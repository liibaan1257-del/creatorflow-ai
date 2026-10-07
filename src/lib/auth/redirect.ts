export const AUTH_ROUTES = {
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  afterLogin: "/dashboard",
} as const;

/**
 * Private app areas. Everything under these prefixes requires a signed-in
 * user; signed-out visitors are redirected to /login?next=<path>.
 */
export const APP_ROUTES = [
  "/dashboard",
  "/writer",
  "/images",
  "/projects",
  "/templates",
  "/settings",
] as const;

/** Route prefixes that require an authenticated user. */
export const PROTECTED_PREFIXES: readonly string[] = [...APP_ROUTES, AUTH_ROUTES.resetPassword];

/** Pages a signed-in user has no reason to see. */
export const GUEST_ONLY_PATHS = [AUTH_ROUTES.login, AUTH_ROUTES.signup];

export function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Only allows same-origin relative paths, preventing open redirects through
 * `?next=https://evil.example` or protocol-relative `//evil.example`.
 */
export function safeRedirectPath(
  value: unknown,
  fallback: string = AUTH_ROUTES.afterLogin,
): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
