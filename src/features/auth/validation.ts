/**
 * Server-side validation for auth forms. Client-side `required`/`minLength`
 * attributes are a convenience only; these checks are the source of truth.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt limit used by Supabase Auth
export const FULL_NAME_MAX_LENGTH = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function validateEmail(email: string): string | undefined {
  if (!email) return "Email is required.";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }
}

function validatePassword(password: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
}

type Result<T, K extends string> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: FieldErrors<K> };

function result<T, K extends string>(
  data: T,
  fieldErrors: FieldErrors<K>,
): Result<T, K> {
  return Object.values(fieldErrors).some(Boolean)
    ? { ok: false, fieldErrors }
    : { ok: true, data };
}

export function parseLogin(formData: FormData) {
  const email = readString(formData, "email").trim().toLowerCase();
  const password = readString(formData, "password");
  return result(
    { email, password },
    {
      email: validateEmail(email),
      password: password ? undefined : "Password is required.",
    },
  );
}

export function parseSignup(formData: FormData) {
  const fullName = readString(formData, "fullName").trim();
  const email = readString(formData, "email").trim().toLowerCase();
  const password = readString(formData, "password");
  return result(
    { fullName, email, password },
    {
      fullName: !fullName
        ? "Name is required."
        : fullName.length > FULL_NAME_MAX_LENGTH
          ? `Name must be at most ${FULL_NAME_MAX_LENGTH} characters.`
          : undefined,
      email: validateEmail(email),
      password: validatePassword(password),
    },
  );
}

export function parseEmailOnly(formData: FormData) {
  const email = readString(formData, "email").trim().toLowerCase();
  return result({ email }, { email: validateEmail(email) });
}

export function parseNewPassword(formData: FormData) {
  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");
  return result(
    { password },
    {
      password: validatePassword(password),
      confirmPassword:
        password === confirmPassword ? undefined : "Passwords do not match.",
    },
  );
}
