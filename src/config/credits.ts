/**
 * Credit prices and plan allowances for DISPLAY ONLY. The database is the
 * source of truth: public.generation_cost() decides what is charged and
 * public.plans holds the allowances. Keep these in sync with the latest
 * credit migration.
 */

export const CREDIT_COSTS = {
  writer: 5,
  image: 10,
  regeneration: 5,
} as const;

export const PLAN_CREDITS = {
  free: 100,
  pro: 1000,
  business: 5000,
} as const;

export function creditLabel(amount: number): string {
  return `${amount.toLocaleString("en-US")} credit${amount === 1 ? "" : "s"}`;
}
