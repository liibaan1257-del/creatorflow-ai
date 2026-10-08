/** Errors passed between routes as `?error=<code>`; only known codes render. */
export const AUTH_ERROR_MESSAGES = {
  link_invalid:
    "That link is invalid or has expired. Please request a new one.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES;

export function authErrorMessage(code: unknown): string | undefined {
  return typeof code === "string" && code in AUTH_ERROR_MESSAGES
    ? AUTH_ERROR_MESSAGES[code as AuthErrorCode]
    : undefined;
}

/** Success notices passed between routes as `?notice=<code>`; only known codes render. */
export const AUTH_NOTICE_MESSAGES = {
  account_deleted: "Your account and all of its data have been permanently deleted.",
  email_updated: "Your email address has been confirmed and updated.",
  email_confirm_other:
    "Link accepted. To finish changing your email, also open the confirmation link sent to your other address.",
} as const;

export type AuthNoticeCode = keyof typeof AUTH_NOTICE_MESSAGES;

export function authNoticeMessage(code: unknown): string | undefined {
  return typeof code === "string" && code in AUTH_NOTICE_MESSAGES
    ? AUTH_NOTICE_MESSAGES[code as AuthNoticeCode]
    : undefined;
}
