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
