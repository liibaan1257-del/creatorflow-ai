import "server-only";
import type { ImageInput } from "@/features/images/validation";

const STYLE_PROMPTS: Record<ImageInput["style"], string> = {
  realistic: "Photorealistic photograph, natural lighting, true-to-life colours, sharp focus, high detail.",
  cinematic: "Cinematic film still, dramatic lighting, shallow depth of field, rich colour grading, wide composition.",
  illustration: "Polished digital illustration, clean lines, vibrant harmonious colours, professional editorial style.",
  "3d": "High-quality 3D render, soft global illumination, realistic materials, subtle shadows.",
  minimal: "Minimalist design, simple shapes, generous negative space, limited colour palette, clean and modern.",
};

const FRAMING: Record<ImageInput["aspectRatio"], string> = {
  "1:1": "Square composition with the subject centred.",
  "16:9": "Wide landscape composition; keep the main subject within the central area.",
  "9:16": "Tall portrait composition; keep the main subject within the central area.",
};

/** Builds the provider prompt: the user's description plus style and framing. */
export function buildImagePrompt(input: ImageInput): string {
  return `${input.prompt}\n\nStyle: ${STYLE_PROMPTS[input.style]}\nFraming: ${FRAMING[input.aspectRatio]}\nNo text, captions or watermarks unless explicitly requested above.`;
}
