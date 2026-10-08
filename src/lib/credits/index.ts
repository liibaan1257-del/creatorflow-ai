import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { CreditSummary } from "@/types/database";

/**
 * Reusable server-side credit helpers. Spending never happens here: balances
 * change only inside the database functions (record_generation,
 * record_image_generation), which lock the user's credits row, re-check the
 * balance and write the ledger in one transaction.
 *
 * These helpers give a fast, friendly "not enough credits" answer BEFORE an
 * expensive AI call. The database check is still the one that counts.
 */

type Client = Awaited<ReturnType<typeof createClient>>;

/** What the database will charge for a priced action. */
export type CreditAction = "writer" | "regeneration" | "image" | "image_regeneration";

export type InsufficientCredits = {
  ok: false;
  status: 402;
  code: "insufficient_credits";
  message: string;
  balance: number;
  required: number;
};

export type CreditCheck =
  | { ok: true; cost: number; credits: CreditSummary }
  | InsufficientCredits
  | { ok: false; status: 403; code: "no_credits_account"; message: string };

/** The signed-in user's credits (applies a due monthly reset). Null if missing. */
export async function fetchMyCredits(supabase: Client): Promise<CreditSummary | null> {
  const { data, error } = await supabase.rpc("get_my_credits").maybeSingle();
  if (error) throw new Error(`Failed to load credits: ${error.message}`);
  return data;
}

/** The price of an action, read from public.generation_cost(). */
export async function getCreditCost(supabase: Client, action: CreditAction, writerType?: string): Promise<number> {
  const p_type = action === "writer" ? (writerType ?? "") : action;
  const { data, error } = await supabase.rpc("generation_cost", { p_type });
  if (error || data == null) throw new Error(`Unknown price for ${p_type}: ${error?.message ?? "no price"}`);
  return data;
}

/** Pre-check that the signed-in user can afford an action. */
export async function checkCredits(supabase: Client, action: CreditAction, writerType?: string): Promise<CreditCheck> {
  const [credits, cost] = await Promise.all([fetchMyCredits(supabase), getCreditCost(supabase, action, writerType)]);
  if (!credits) {
    return { ok: false, status: 403, code: "no_credits_account", message: "Your account has no credit balance set up." };
  }
  if (credits.balance < cost) return insufficientCredits(credits.balance, cost);
  return { ok: true, cost, credits };
}

export function insufficientCredits(balance: number, required: number): InsufficientCredits {
  return {
    ok: false,
    status: 402,
    code: "insufficient_credits",
    message: `This needs ${required} credit${required === 1 ? "" : "s"}, but you have ${balance}.`,
    balance,
    required,
  };
}

/** True when a database error is the balance check failing under the row lock. */
export function isInsufficientCreditsError(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes("insufficient_credits"));
}
