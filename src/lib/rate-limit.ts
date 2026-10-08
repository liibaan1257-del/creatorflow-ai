import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Per-user rate limits, counted in Postgres (public.hit_rate_limit) so they
 * hold across serverless instances. Limits are defined in the database.
 *
 * Credits are the hard limit on usage; this caps bursts (e.g. many parallel
 * requests that would otherwise all reach the AI provider before the credit
 * check rejects them). If the check itself fails, the request is allowed and
 * the error logged, so an outage here never blocks paying users.
 */
export type RateLimitBucket = "ai_writer" | "ai_image";

/** Returns 0 when allowed, otherwise the seconds until the next allowed request. */
export async function hitRateLimit(bucket: RateLimitBucket): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hit_rate_limit", { p_bucket: bucket });
  if (error) {
    console.error("[rate-limit] check failed", bucket, error.code);
    return 0;
  }
  return data ?? 0;
}

export function rateLimitedResponse(retryAfter: number) {
  return Response.json(
    { error: { code: "rate_limited", message: `Too many requests. Please wait ${retryAfter}s and try again.` } },
    { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(retryAfter) } },
  );
}
