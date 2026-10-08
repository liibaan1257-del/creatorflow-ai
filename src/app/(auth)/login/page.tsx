import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Alert } from "@/components/ui/alert";
import { AuthCardHeader } from "@/features/auth/components/auth-card-header";
import { LoginForm } from "@/features/auth/components/login-form";
import { authErrorMessage, authNoticeMessage } from "@/features/auth/messages";
import { AUTH_ROUTES, safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <AuthCardHeader
        title="Welcome back"
        description="Log in to your CreatorFlow AI account."
      />
      {/* searchParams are request data, so the form streams in. */}
      <Suspense fallback={<LoginForm />}>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={AUTH_ROUTES.signup} className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}

async function LoginFormWithParams({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const error = authErrorMessage(params.error);
  const notice = authNoticeMessage(params.notice);
  const next = typeof params.next === "string" ? safeRedirectPath(params.next) : undefined;

  return (
    <div className="space-y-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}
      <LoginForm next={next} />
    </div>
  );
}
