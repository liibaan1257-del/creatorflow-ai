import "server-only";
import OpenAI from "openai";
import sharp from "sharp";
import {
  AIError,
  type AspectRatio,
  type ImageGenerationRequest,
  type ImageGenerationResult,
  type ImageProvider,
} from "@/lib/ai/types";

const DEFAULT_MODEL = "gpt-image-1";

/** Exact target dimensions per aspect ratio. */
const TARGET: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1536, height: 864 },
  "9:16": { width: 864, height: 1536 },
};

/** The fixed sizes every GPT image model supports. */
const STANDARD_SIZE: Record<AspectRatio, "1024x1024" | "1536x1024" | "1024x1536"> = {
  "1:1": "1024x1024",
  "16:9": "1536x1024",
  "9:16": "1024x1536",
};

/** gpt-image-2 and later accept arbitrary WIDTHxHEIGHT (multiples of 16). */
function supportsCustomSize(model: string) {
  return /^gpt-image-(2|[3-9])/.test(model);
}

/**
 * OpenAI GPT Image models via the official SDK (server-only). Models without
 * custom sizes return 3:2 / 2:3 for wide / tall requests; those are
 * centre-cropped to exact 16:9 / 9:16 here.
 */
export function createOpenAIImageProvider({
  apiKey,
  model = DEFAULT_MODEL,
}: {
  apiKey: string;
  model?: string;
}): ImageProvider {
  // The SDK retries 408/409/429/5xx and connection errors (2 retries).
  const client = new OpenAI({ apiKey, timeout: 180_000 });

  return {
    name: "openai",
    async generateImage({ prompt, aspectRatio, endUserId, signal }: ImageGenerationRequest): Promise<ImageGenerationResult> {
      const target = TARGET[aspectRatio];
      const custom = supportsCustomSize(model);

      let response: OpenAI.Images.ImagesResponse;
      try {
        response = await client.images.generate(
          {
            model,
            prompt,
            n: 1,
            size: custom ? `${target.width}x${target.height}` : STANDARD_SIZE[aspectRatio],
            quality: "medium",
            output_format: "webp",
            output_compression: 90,
            moderation: "auto",
            user: endUserId,
          },
          { signal },
        );
      } catch (error) {
        throw toAIError(error);
      }

      const b64 = response.data?.[0]?.b64_json;
      if (!b64) throw new AIError("empty", "The image service returned no image. Please try again.");

      let image = sharp(Buffer.from(b64, "base64"));
      const meta = await image.metadata();
      if (!meta.width || !meta.height) throw new AIError("empty", "The image service returned an unreadable image.");

      // Centre-crop to the exact ratio when the model returned a different one.
      const wanted = target.width / target.height;
      if (Math.abs(meta.width / meta.height - wanted) > 0.01) {
        image = image.resize({ width: target.width, height: target.height, fit: "cover", position: "centre" });
      }
      const { data, info } = await image.webp({ quality: 90 }).toBuffer({ resolveWithObject: true });

      return { data, mimeType: "image/webp", width: info.width, height: info.height, model };
    },
  };
}

/** Maps SDK errors (typed classes, most specific first) to AIError. */
function toAIError(error: unknown): AIError {
  if (error instanceof OpenAI.AuthenticationError || error instanceof OpenAI.PermissionDeniedError) {
    return new AIError("not_configured", "The image service is not configured correctly.", { cause: error });
  }
  if (error instanceof OpenAI.BadRequestError) {
    // Includes safety-system rejections (e.g. code "moderation_blocked").
    return new AIError(
      "refused",
      "This prompt can't be used to create an image. Try describing it differently.",
      { cause: error },
    );
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new AIError("rate_limited", "The image service is busy or out of quota. Please try again later.", { cause: error });
  }
  if (error instanceof OpenAI.APIUserAbortError) {
    return new AIError("unavailable", "The request was cancelled.", { cause: error });
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return new AIError("unavailable", "Could not reach the image service. Please try again.", { cause: error });
  }
  if (error instanceof OpenAI.APIError) {
    return new AIError("unavailable", "The image service had a problem. Please try again.", { cause: error });
  }
  return new AIError("unavailable", "Something went wrong while creating the image. Please try again.", { cause: error });
}
