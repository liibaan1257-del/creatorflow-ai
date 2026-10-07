import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  AIError,
  type AIProvider,
  type TextGenerationRequest,
  type TextGenerationResult,
} from "@/lib/ai/types";

const DEFAULT_MODEL = "claude-opus-5-5";

/**
 * Claude via the official Anthropic SDK. Runs on the server only; the API key
 * never reaches the browser.
 */
export function createAnthropicProvider({
  apiKey,
  model = DEFAULT_MODEL,
}: {
  apiKey: string;
  model?: string;
}): AIProvider {
  // The SDK retries 408/409/429/5xx and connection errors (2 retries).
  const client = new Anthropic({ apiKey });

  return {
    name: "anthropic",
    async generateText({ system, prompt, maxOutputTokens, signal }: TextGenerationRequest): Promise<TextGenerationResult> {
      let message: Anthropic.Beta.BetaMessage;
      try {
        // Streaming keeps long generations (e.g. blog posts) clear of HTTP
        // timeouts; finalMessage() resolves with the complete response.
        const stream = client.beta.messages.stream(
          {
            model,
            max_tokens: maxOutputTokens,
            system,
            messages: [{ role: "user", content: prompt }],
            // Writing tasks: adaptive thinking at an explicit, moderate effort.
            thinking: { type: "adaptive" },
            output_config: { effort: "medium" },
            // If the model declines, the API retries on a fallback model.
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
          },
          { signal },
        );
        message = await stream.finalMessage();
      } catch (error) {
        throw toAIError(error);
      }

      if (message.stop_reason === "refusal") {
        throw new AIError(
          "refused",
          "The AI declined this request. Try rephrasing your topic or instructions.",
        );
      }

      const text = message.content
        .flatMap((block) => (block.type === "text" ? [block.text] : []))
        .join("")
        .trim();

      if (!text) throw new AIError("empty", "The AI returned an empty response. Please try again.");

      return { text, model: message.model, truncated: message.stop_reason === "max_tokens" };
    },
  };
}

/** Maps SDK errors (typed classes, most specific first) to AIError. */
function toAIError(error: unknown): AIError {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new AIError("not_configured", "The AI service is not configured correctly.", { cause: error });
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AIError("rate_limited", "The AI service is busy right now. Please try again in a minute.", { cause: error });
  }
  if (error instanceof Anthropic.APIUserAbortError) {
    return new AIError("unavailable", "The request was cancelled.", { cause: error });
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new AIError("unavailable", "Could not reach the AI service. Please try again.", { cause: error });
  }
  if (error instanceof Anthropic.APIError) {
    // 529 (overloaded) and other 5xx are transient.
    const code = error.status === 529 ? "rate_limited" : "unavailable";
    return new AIError(code, "The AI service had a problem. Please try again.", { cause: error });
  }
  return new AIError("unavailable", "Something went wrong while generating. Please try again.", { cause: error });
}
