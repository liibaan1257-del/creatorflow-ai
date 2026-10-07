import type { Metadata } from "next";
import Link from "next/link";
import { AuthCardHeader } from "@/features/auth/components/auth-card-header";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { AUTH_ROUTES } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthCardHeader
        title="Reset your password"
        description="Enter your email and we'll send you a reset link."
      />
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href={AUTH_ROUTES.login} className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </>
  );
}
