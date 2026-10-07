/**
 * Provider-neutral contract for text generation. Feature code depends only on
 * these types, so the AI provider can be swapped without touching it.
 */

export type TextGenerationRequest = {
  /** Stable instructions (role, rules, output format). */
  system: string;
  /** The task itself, including user-supplied input. */
  prompt: string;
  /** Hard ceiling for the response length. */
  maxOutputTokens: number;
  /** Aborts the provider call (e.g. when the HTTP request is cancelled). */
  signal?: AbortSignal;
};

export type TextGenerationResult = {
  text: string;
  /** The model that actually produced the text (may differ after a fallback). */
  model: string;
  /** True when the response stopped at maxOutputTokens. */
  truncated: boolean;
};

export interface AIProvider {
  readonly name: string;
  generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;
}

export type AIErrorCode =
  | "not_configured" // missing/invalid credentials or provider
  | "rate_limited" // provider is throttling or overloaded
  | "refused" // the model declined the request
  | "empty" // the model returned no text
  | "unavailable"; // network or provider-side failure

/** Normalised provider error; `message` is safe to show to end users. */
export class AIError extends Error {
  constructor(
    readonly code: AIErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AIError";
  }
}
