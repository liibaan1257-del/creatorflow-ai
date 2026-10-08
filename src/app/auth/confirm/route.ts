import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ROUTES, safeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return EMAIL_OTP_TYPES.includes(value as EmailOtpType);
}

/**
 * Landing point for links in Supabase auth emails (sign-up confirmation,
 * password reset, email change). Supports both link formats:
 * - `?token_hash=...&type=...` (works across devices; needs custom templates)
 * - `?code=...` (PKCE, used by Supabase's default templates)
 * On success the session cookie is set and the user is sent to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeRedirectPath(searchParams.get("next"));
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");

  // With "Secure email change", the first of the two confirmation links only
  // returns a message (no code); the change completes with the second link.
  if (!tokenHash && !code && searchParams.has("message") && !searchParams.has("error")) {
    return NextResponse.redirect(new URL("/settings?notice=email_confirm_other", request.nextUrl.origin));
  }

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  const destination = ok
    ? new URL(next, request.nextUrl.origin)
    : new URL(`${AUTH_ROUTES.login}?error=link_invalid`, request.nextUrl.origin);
  return NextResponse.redirect(destination);
}
