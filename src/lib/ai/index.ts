import "server-only";
import { createAnthropicProvider } from "@/lib/ai/providers/anthropic";
import { createOpenAIImageProvider } from "@/lib/ai/providers/openai-images";
import { AIError, type AIProvider, type ImageProvider } from "@/lib/ai/types";
import { serverEnv } from "@/lib/server-env";

export { AIError } from "@/lib/ai/types";
export type {
  AIProvider,
  AspectRatio,
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageProvider,
  TextGenerationRequest,
  TextGenerationResult,
} from "@/lib/ai/types";

let cached: { key: string; provider: AIProvider } | undefined;

/**
 * Returns the configured AI provider. To add a provider, implement AIProvider
 * in src/lib/ai/providers/ and add a case here; feature code is unchanged.
 */
export function getAIProvider(): AIProvider {
  const name = serverEnv.aiProvider;
  const model = serverEnv.aiModel;

  switch (name) {
    case "anthropic": {
      const apiKey = serverEnv.anthropicApiKey;
      if (!apiKey) {
        throw new AIError("not_configured", "AI generation is not configured yet (missing ANTHROPIC_API_KEY).");
      }
      const key = `${name}:${model ?? ""}:${apiKey.slice(-6)}`;
      if (cached?.key !== key) cached = { key, provider: createAnthropicProvider({ apiKey, model }) };
      return cached.provider;
    }
    default:
      throw new AIError("not_configured", `Unknown AI_PROVIDER "${name}".`);
  }
}

let cachedImage: { key: string; provider: ImageProvider } | undefined;

/** Returns the configured image provider (default: OpenAI GPT Image). */
export function getImageProvider(): ImageProvider {
  const name = serverEnv.imageProvider;
  const model = serverEnv.imageModel;

  switch (name) {
    case "openai": {
      const apiKey = serverEnv.openaiApiKey;
      if (!apiKey) {
        throw new AIError("not_configured", "Image generation is not configured yet (missing OPENAI_API_KEY).");
      }
      const key = `${name}:${model ?? ""}:${apiKey.slice(-6)}`;
      if (cachedImage?.key !== key) cachedImage = { key, provider: createOpenAIImageProvider({ apiKey, model }) };
      return cachedImage.provider;
    }
    default:
      throw new AIError("not_configured", `Unknown IMAGE_PROVIDER "${name}".`);
  }
}

/** True when an image provider has credentials (only a boolean leaves the server). */
export function isImageGenerationConfigured(): boolean {
  return serverEnv.imageProvider !== "openai" || Boolean(serverEnv.openaiApiKey);
}
