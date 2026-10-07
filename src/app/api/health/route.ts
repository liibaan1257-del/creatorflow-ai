import { connection } from "next/server";
import { getSupabaseConfigStatus } from "@/lib/env";

/**
 * Liveness probe for uptime monitoring and deployment checks.
 * `connection()` opts out of prerendering so every request hits the running
 * server. Reports only non-secret configuration status.
 */
export async function GET() {
  await connection();
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabase: getSupabaseConfigStatus(),
  });
}
