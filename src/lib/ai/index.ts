import "server-only";
import { createAnthropicProvider } from "@/lib/ai/providers/anthropic";
import { AIError, type AIProvider } from "@/lib/ai/types";
import { serverEnv } from "@/lib/server-env";

export { AIError } from "@/lib/ai/types";
export type { AIProvider, TextGenerationRequest, TextGenerationResult } from "@/lib/ai/types";

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
