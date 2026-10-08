import "server-only";
import { AIError, getAIProvider } from "@/lib/ai";
import { getWriterType } from "@/features/writer/config";
import { buildWriterPrompt } from "@/features/writer/prompts";
import type { WriterInput } from "@/features/writer/validation";
import { createClient } from "@/lib/supabase/server";

export type GenerateSuccess = {
  ok: true;
  output: string;
  truncated: boolean;
  generationId: string;
  creditsUsed: number;
  balance: number;
};

export type GenerateFailure = {
  ok: false;
  status: number;
  code: "insufficient_credits" | "no_credits_account" | "ai_error" | "save_failed";
  message: string;
  balance?: number;
  required?: number;
};

/**
 * Generates content for the signed-in user and charges credits.
 *
 * 1. Pre-check: the balance must cover the price before calling the AI.
 * 2. Generate with the configured AI provider.
 * 3. Charge + record atomically via public.record_generation(). The database
 *    re-checks the balance under a row lock, so concurrent requests can never
 *    overspend; if it fails, the output is not returned.
 */
export async function generateForUser(
  userId: string,
  input: WriterInput,
  signal?: AbortSignal,
  projectId?: string,
): Promise<GenerateSuccess | GenerateFailure> {
  const type = getWriterType(input.type)!;
  const supabase = await createClient();

  const { data: credits, error: creditsError } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  if (creditsError) throw new Error(`Failed to load credits: ${creditsError.message}`);
  if (!credits) {
    return { ok: false, status: 403, code: "no_credits_account", message: "Your account has no credit balance set up." };
  }
  if (credits.balance < type.credits) {
    return insufficient(credits.balance, type.credits);
  }

  if (projectId) {
    // Check ownership before spending on the AI call (RLS + explicit filter).
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!project) {
      return { ok: false, status: 404, code: "save_failed", message: "Project not found. You were not charged." };
    }
  }

  const { system, prompt } = buildWriterPrompt(input);
  let result;
  try {
    result = await getAIProvider().generateText({ system, prompt, maxOutputTokens: type.maxOutputTokens, signal });
  } catch (error) {
    if (error instanceof AIError) {
      if (error.code !== "refused") console.error("[writer] AI error", error.code, error.cause ?? error);
      const status = error.code === "rate_limited" ? 429 : error.code === "not_configured" ? 503 : error.code === "refused" ? 422 : 502;
      return { ok: false, status, code: "ai_error", message: error.message };
    }
    throw error;
  }

  const { data, error } = await supabase
    .rpc("record_generation", {
      p_type: input.type,
      p_prompt: prompt.slice(0, 20000),
      p_output: result.text,
      p_project_id: projectId,
    })
    .single();

  if (error) {
    if (error.message.includes("insufficient_credits")) {
      return insufficient(credits.balance, type.credits);
    }
    if (error.code === "23503") {
      // Foreign key: the project doesn't exist or isn't this user's.
      return { ok: false, status: 404, code: "save_failed", message: "Project not found. You were not charged." };
    }
    console.error("[writer] record_generation failed", error);
    return { ok: false, status: 500, code: "save_failed", message: "Could not save the result. You were not charged." };
  }

  return {
    ok: true,
    output: result.text,
    truncated: result.truncated,
    generationId: data.generation_id,
    creditsUsed: data.credits_used,
    balance: data.balance,
  };
}

function insufficient(balance: number, required: number): GenerateFailure {
  return {
    ok: false,
    status: 402,
    code: "insufficient_credits",
    message: `This needs ${required} credit${required === 1 ? "" : "s"}, but you have ${balance}.`,
    balance,
    required,
  };
}
