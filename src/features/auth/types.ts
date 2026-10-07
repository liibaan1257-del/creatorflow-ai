export type AuthFormState = {
  /** Form-level error shown above the submit button. */
  error?: string;
  /** Success message (e.g. "check your email"). */
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
  /** Non-secret inputs echoed back so the user doesn't retype them. */
  values?: { email?: string; fullName?: string };
};

export const initialAuthFormState: AuthFormState = {};
