import type { Metadata } from "next";
import { AuthCardHeader } from "@/features/auth/components/auth-card-header";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

/**
 * Reached from the password-reset email via /auth/confirm, which signs the
 * user in. The proxy redirects visitors without a session to /login, and
 * the `updatePassword` action re-checks the session itself.
 */
export default function ResetPasswordPage() {
  return (
    <>
      <AuthCardHeader
        title="Choose a new password"
        description="Enter a new password for your account."
      />
      <ResetPasswordForm />
    </>
  );
}
