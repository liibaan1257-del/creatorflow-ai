import { FULL_NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/features/auth/validation";
import { LANGUAGES, TONES, type Language, type Tone } from "@/features/writer/config";

/**
 * Server-side validation for the settings forms (the source of truth; the
 * browser checks are a convenience only).
 */

export const DELETE_CONFIRMATION = "DELETE";

/** Avatars are resized in the browser before upload; the server re-encodes them. */
export const AVATAR_LIMITS = {
  maxUploadBytes: 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  /** Longest side the browser resizes to before uploading. */
  uploadSize: 512,
  /** Stored size (square). */
  storedSize: 256,
} as const;

export type SettingsFormState = {
  error?: string;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
  /** Changes on every successful submit, so forms can react (toast, reset). */
  savedAt?: number;
};

export const initialSettingsState: SettingsFormState = {};

type Parsed<T> = { ok: true; data: T } | { ok: false; fieldErrors: Partial<Record<string, string>> };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function read(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function done<T>(data: T, fieldErrors: Partial<Record<string, string | undefined>>): Parsed<T> {
  const errors = Object.fromEntries(Object.entries(fieldErrors).filter(([, v]) => v)) as Record<string, string>;
  return Object.keys(errors).length ? { ok: false, fieldErrors: errors } : { ok: true, data };
}

function newPasswordError(password: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (password.length > PASSWORD_MAX_LENGTH) return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
}

export function parseProfile(formData: FormData) {
  const fullName = read(formData, "fullName").trim().replace(/\s+/g, " ");
  return done(
    { fullName: fullName || null },
    {
      fullName: !fullName
        ? "Name is required."
        : fullName.length > FULL_NAME_MAX_LENGTH
          ? `Name must be at most ${FULL_NAME_MAX_LENGTH} characters.`
          : undefined,
    },
  );
}

export function parsePreferences(formData: FormData) {
  const tone = read(formData, "defaultTone");
  const language = read(formData, "defaultLanguage");
  return done(
    {
      defaultTone: (tone || null) as Tone | null,
      defaultLanguage: (language || null) as Language | null,
    },
    {
      defaultTone: tone && !TONES.some((t) => t.value === tone) ? "Choose a tone." : undefined,
      defaultLanguage: language && !LANGUAGES.some((l) => l.value === language) ? "Choose a language." : undefined,
    },
  );
}

export function parseEmailChange(formData: FormData, currentEmail: string | null) {
  const email = read(formData, "email").trim().toLowerCase();
  const currentPassword = read(formData, "currentPassword");
  return done(
    { email, currentPassword },
    {
      email: !email
        ? "Email is required."
        : email.length > 254 || !EMAIL_PATTERN.test(email)
          ? "Enter a valid email address."
          : email === currentEmail?.toLowerCase()
            ? "This is already your email address."
            : undefined,
      currentPassword: currentPassword ? undefined : "Enter your current password.",
    },
  );
}

export function parsePasswordChange(formData: FormData) {
  const currentPassword = read(formData, "currentPassword");
  const password = read(formData, "password");
  const confirmPassword = read(formData, "confirmPassword");
  return done(
    { currentPassword, password },
    {
      currentPassword: currentPassword ? undefined : "Enter your current password.",
      password:
        newPasswordError(password) ??
        (currentPassword && password === currentPassword ? "Choose a password different from your current one." : undefined),
      confirmPassword: password === confirmPassword ? undefined : "Passwords do not match.",
    },
  );
}

export function parseDeleteAccount(formData: FormData) {
  const currentPassword = read(formData, "currentPassword");
  const confirmation = read(formData, "confirmation").trim();
  return done(
    { currentPassword },
    {
      currentPassword: currentPassword ? undefined : "Enter your password.",
      confirmation: confirmation === DELETE_CONFIRMATION ? undefined : `Type ${DELETE_CONFIRMATION} to confirm.`,
    },
  );
}
