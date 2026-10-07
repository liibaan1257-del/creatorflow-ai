import { connection } from "next/server";

/**
 * Liveness probe for uptime monitoring and deployment checks.
 * `connection()` opts out of prerendering so every request hits the running
 * server. A readiness check (database reachability) can be added once
 * Supabase is wired up.
 */
export async function GET() {
  await connection();
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}
