import type { AspectRatio } from "@/lib/ai/types";
import { ASPECT_RATIOS, IMAGE_PROMPT_LIMITS, IMAGE_STYLES, type ImageStyle } from "@/features/images/config";

export type ImageInput = { prompt: string; style: ImageStyle; aspectRatio: AspectRatio };
export type ImageField = keyof ImageInput;

export type ImageValidation =
  | { ok: true; data: ImageInput }
  | { ok: false; fieldErrors: Partial<Record<ImageField, string>> };

/** Server-side validation of an image request (the source of truth). */
export function parseImageInput(body: unknown): ImageValidation {
  const raw = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const input = { prompt: str(raw.prompt), style: str(raw.style), aspectRatio: str(raw.aspectRatio) };

  const fieldErrors: Partial<Record<ImageField, string>> = {};
  if (input.prompt.length < IMAGE_PROMPT_LIMITS.min) {
    fieldErrors.prompt = `Describe the image in at least ${IMAGE_PROMPT_LIMITS.min} characters.`;
  } else if (input.prompt.length > IMAGE_PROMPT_LIMITS.max) {
    fieldErrors.prompt = `Keep the description under ${IMAGE_PROMPT_LIMITS.max} characters.`;
  }
  if (!IMAGE_STYLES.some((s) => s.value === input.style)) fieldErrors.style = "Choose a style.";
  if (!ASPECT_RATIOS.some((r) => r.value === input.aspectRatio)) fieldErrors.aspectRatio = "Choose an aspect ratio.";

  return Object.keys(fieldErrors).length ? { ok: false, fieldErrors } : { ok: true, data: input as ImageInput };
}
