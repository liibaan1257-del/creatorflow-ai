"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/features/auth/actions";
import { FormStatus } from "@/features/auth/components/form-status";
import { initialAuthFormState } from "@/features/auth/types";
import { AUTH_ROUTES } from "@/lib/auth/redirect";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, initialAuthFormState);

  return (
    <form action={action} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <div className="flex justify-end">
        <Link
          href={AUTH_ROUTES.forgotPassword}
          className="text-sm font-medium text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <FormStatus state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
