"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup } from "@/features/auth/actions";
import { FormStatus } from "@/features/auth/components/form-status";
import { initialAuthFormState } from "@/features/auth/types";
import {
  FULL_NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/features/auth/validation";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, initialAuthFormState);

  if (state.message) return <FormStatus state={state} />;

  return (
    <form action={action} className="space-y-4" noValidate>
      <Input
        label="Full name"
        name="fullName"
        autoComplete="name"
        required
        maxLength={FULL_NAME_MAX_LENGTH}
        defaultValue={state.values?.fullName}
        error={state.fieldErrors?.fullName}
      />
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
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={PASSWORD_MAX_LENGTH}
        error={state.fieldErrors?.password}
      />
      <FormStatus state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
