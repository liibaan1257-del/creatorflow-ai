/**
 * Storage buckets and upload rules. Must match
 * supabase/migrations/*_create_storage_buckets.sql.
 * Shared by server code and (later) client-side upload forms.
 */
export const STORAGE_BUCKETS = {
  /** Private per-user files. Object paths start with the owner's user id. */
  userUploads: "user-uploads",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const UPLOAD_LIMITS = {
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB, also enforced by the bucket
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
} as const;

/** Signed URL lifetime for private files. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60;
