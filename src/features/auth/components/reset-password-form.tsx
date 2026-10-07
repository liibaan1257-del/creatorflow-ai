"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePassword } from "@/features/auth/actions";
import { FormStatus } from "@/features/auth/components/form-status";
import { initialAuthFormState } from "@/features/auth/types";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/features/auth/validation";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(
    updatePassword,
    initialAuthFormState,
  );

  return (
    <form action={action} className="space-y-4" noValidate>
      <Input
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={PASSWORD_MAX_LENGTH}
        error={state.fieldErrors?.password}
      />
      <Input
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirmPassword}
      />
      <FormStatus state={state} />
      <Button type="submit" className="w-full" loading={pending}>
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
