import "server-only";
import { createHash } from "node:crypto";
import { AIError, getImageProvider } from "@/lib/ai";
import { buildImagePrompt } from "@/features/images/prompts";
import { parseImageInput, type ImageInput } from "@/features/images/validation";
import { checkCredits, insufficientCredits, isInsufficientCreditsError, type InsufficientCredits } from "@/lib/credits";
import { deleteUserFile, getUserFileUrl, storeUserBytes } from "@/lib/storage/server";
import { createClient } from "@/lib/supabase/server";

export type GeneratedImageView = {
  id: string;
  prompt: string;
  style: string | null;
  aspectRatio: string | null;
  width: number | null;
  height: number | null;
  projectId: string | null;
  createdAt: string;
  url: string;
  downloadUrl: string;
};

export type ImageGenerateSuccess = { ok: true; image: GeneratedImageView; creditsUsed: number; balance: number };
export type ImageGenerateFailure =
  | InsufficientCredits
  | {
      ok: false;
      status: number;
      code: "no_credits_account" | "not_found" | "ai_error" | "storage_failed" | "save_failed";
      message: string;
    };

/** A new image from the form, or a new take on one of the user's images. */
export type ImageRequest = { input: ImageInput } | { sourceImageId: string };

/**
 * Generates an image for the signed-in user:
 * 1. pre-check credits (database price: new image or regeneration),
 * 2. generate (provider key stays on the server),
 * 3. store the file in the user's private Storage folder, 4. charge credits and
 * record generation + image atomically. If step 4 fails the file is removed
 * and nothing is charged.
 */
export async function generateImageForUser(
  userId: string,
  request: ImageRequest,
  signal?: AbortSignal,
): Promise<ImageGenerateSuccess | ImageGenerateFailure> {
  const supabase = await createClient();

  // A regeneration reuses the settings stored with the user's own image (RLS +
  // explicit owner filter), so the client can't get a cheap "regeneration"
  // of an arbitrary prompt. The database re-checks ownership when charging.
  let input: ImageInput;
  let sourceImageId: string | undefined;
  if ("sourceImageId" in request) {
    const { data: source } = await supabase
      .from("generated_images")
      .select("id, prompt, style, aspect_ratio")
      .eq("id", request.sourceImageId)
      .eq("user_id", userId)
      .maybeSingle();
    const parsed = source ? parseImageInput({ prompt: source.prompt, style: source.style, aspectRatio: source.aspect_ratio }) : null;
    if (!source || !parsed?.ok) {
      return { ok: false, status: 404, code: "not_found", message: "Image not found. You were not charged." };
    }
    input = parsed.data;
    sourceImageId = source.id;
  } else {
    input = request.input;
  }

  const check = await checkCredits(supabase, sourceImageId ? "image_regeneration" : "image");
  if (!check.ok) return check;

  let image;
  try {
    image = await getImageProvider().generateImage({
      prompt: buildImagePrompt(input),
      aspectRatio: input.aspectRatio,
      // Hashed so the provider never receives the real user id.
      endUserId: createHash("sha256").update(userId).digest("hex").slice(0, 32),
      signal,
    });
  } catch (error) {
    if (error instanceof AIError) {
      if (error.code !== "refused") console.error("[images] provider error", error.code, error.cause ?? error);
      const status = error.code === "rate_limited" ? 429 : error.code === "not_configured" ? 503 : error.code === "refused" ? 422 : 502;
      return { ok: false, status, code: "ai_error", message: error.message };
    }
    throw error;
  }

  const stored = await storeUserBytes("images", image.data, image.mimeType);
  if (!stored.ok) {
    return { ok: false, status: 500, code: "storage_failed", message: "Could not store the image. You were not charged." };
  }

  const { data, error } = await supabase
    .rpc("record_image_generation", {
      p_prompt: input.prompt,
      p_image_path: stored.path,
      p_style: input.style,
      p_aspect_ratio: input.aspectRatio,
      p_width: image.width,
      p_height: image.height,
      p_model: image.model,
      p_source_image_id: sourceImageId,
    })
    .single();

  if (error) {
    await deleteUserFile(stored.path);
    if (isInsufficientCreditsError(error)) return insufficientCredits(check.credits.balance, check.cost);
    console.error("[images] record_image_generation failed", error);
    return { ok: false, status: 500, code: "save_failed", message: "Could not save the image. You were not charged." };
  }

  const view = await toView({
    id: data.image_id,
    prompt: input.prompt,
    style: input.style,
    aspect_ratio: input.aspectRatio,
    width: image.width,
    height: image.height,
    project_id: null,
    created_at: new Date().toISOString(),
    image_url: stored.path,
  });
  if (!view) {
    return { ok: false, status: 500, code: "storage_failed", message: "The image was created but couldn't be loaded. Find it in your recent images." };
  }
  return { ok: true, image: view, creditsUsed: data.credits_used, balance: data.balance };
}

type ImageRow = {
  id: string;
  prompt: string;
  style: string | null;
  aspect_ratio: string | null;
  width: number | null;
  height: number | null;
  project_id: string | null;
  created_at: string;
  image_url: string;
};

/** Adds short-lived signed URLs (preview + download) to an image row. */
export async function toView(row: ImageRow): Promise<GeneratedImageView | null> {
  const extension = row.image_url.split(".").pop() ?? "webp";
  const [url, downloadUrl] = await Promise.all([
    getUserFileUrl(row.image_url),
    getUserFileUrl(row.image_url, { download: `creatorflow-${row.id.slice(0, 8)}.${extension}` }),
  ]);
  if (!url || !downloadUrl) return null;
  return {
    id: row.id,
    prompt: row.prompt,
    style: row.style,
    aspectRatio: row.aspect_ratio,
    width: row.width,
    height: row.height,
    projectId: row.project_id,
    createdAt: row.created_at,
    url,
    downloadUrl,
  };
}
