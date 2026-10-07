import type { Metadata } from "next";
import Link from "next/link";
import { AuthCardHeader } from "@/features/auth/components/auth-card-header";
import { SignupForm } from "@/features/auth/components/signup-form";
import { AUTH_ROUTES } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <>
      <AuthCardHeader
        title="Create your account"
        description="Start creating content with CreatorFlow AI."
      />
      <SignupForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={AUTH_ROUTES.login} className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
