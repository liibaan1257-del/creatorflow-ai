import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy";
import {
  AUTH_ROUTES,
  GUEST_ONLY_PATHS,
  PROTECTED_PREFIXES,
  matchesPrefix,
} from "@/lib/auth/redirect";

/**
 * Keeps the Supabase session fresh and does fast, optimistic redirects.
 * This is a UX layer only: pages and Server Actions re-check auth via the
 * Data Access Layer (`src/lib/auth/dal.ts`).
 */
export async function proxy(request: NextRequest) {
  // Without valid Supabase credentials, public pages still work; protected
  // pages fail loudly in the Data Access Layer.
  if (!isSupabaseConfigured()) return NextResponse.next();

  let session: Awaited<ReturnType<typeof updateSession>>;
  try {
    session = await updateSession(request);
  } catch (error) {
    // Never take the whole site down because the auth backend misbehaves.
    console.error("[proxy] Failed to refresh Supabase session:", error);
    return NextResponse.next();
  }
  const { response, isAuthenticated } = session;
  const { pathname, search } = request.nextUrl;

  if (!isAuthenticated && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_ROUTES.login;
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(url, response);
  }

  if (isAuthenticated && matchesPrefix(pathname, GUEST_ONLY_PATHS)) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_ROUTES.afterLogin;
    url.search = "";
    return redirectWithCookies(url, response);
  }

  return response;
}

/** Carries refreshed session cookies over to a redirect response. */
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  const cacheControl = from.headers.get("cache-control");
  if (cacheControl) redirect.headers.set("cache-control", cacheControl);
  return redirect;
}

export const config = {
  matcher: [
    // Everything except static assets, image optimisation and metadata files.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
