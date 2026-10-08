/**
 * AI Images options, shared by the UI and the API. The credit price is for
 * DISPLAY ONLY: public.generation_cost('image') is the source of truth.
 */

import { CREDIT_COSTS } from "@/config/credits";

export const IMAGE_CREDITS = CREDIT_COSTS.image;
export const IMAGE_REGENERATION_CREDITS = CREDIT_COSTS.regeneration;

export const IMAGE_STYLES = [
  { value: "realistic", label: "Realistic", hint: "Photographic, natural light" },
  { value: "cinematic", label: "Cinematic", hint: "Film still, dramatic lighting" },
  { value: "illustration", label: "Illustration", hint: "Digital art, clean lines" },
  { value: "3d", label: "3D", hint: "Rendered, soft shadows" },
  { value: "minimal", label: "Minimal", hint: "Simple shapes, lots of space" },
] as const;

export type ImageStyle = (typeof IMAGE_STYLES)[number]["value"];

export const ASPECT_RATIOS = [
  { value: "1:1", label: "Square", hint: "1:1 · Posts" },
  { value: "16:9", label: "Landscape", hint: "16:9 · Thumbnails" },
  { value: "9:16", label: "Portrait", hint: "9:16 · Stories" },
] as const;

export const IMAGE_PROMPT_LIMITS = { min: 3, max: 1000 } as const;
