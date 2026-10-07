import { Alert } from "@/components/ui/alert";
import type { AuthFormState } from "@/features/auth/types";

export function FormStatus({ state }: { state: AuthFormState }) {
  if (state.error) return <Alert variant="error">{state.error}</Alert>;
  if (state.message) return <Alert variant="success">{state.message}</Alert>;
  return null;
}
