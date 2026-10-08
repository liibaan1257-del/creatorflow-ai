import { generateForUser } from "@/features/writer/service";
import { parseWriterInput } from "@/features/writer/validation";
import { getCurrentUser } from "@/lib/auth/dal";

/**
 * POST /api/ai/generate — AI Writer endpoint.
 *
 * Verifies the Supabase session server-side, validates the body, and lets the
 * writer service check/charge credits. The AI provider key stays on the
 * server. Requests must be same-origin JSON: auth cookies are SameSite=Lax and
 * cross-site JSON POSTs require a CORS preflight that we never approve.
 */

// Long-form generations can take a while.
export const maxDuration = 300;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Please sign in to generate content." } }, 401);

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: { code: "bad_request", message: "Expected a JSON body." } }, 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: { code: "bad_request", message: "Invalid JSON." } }, 400);
  }

  const parsed = parseWriterInput(body);
  if (!parsed.ok) {
    return json({ error: { code: "validation", message: "Please check the form.", fieldErrors: parsed.fieldErrors } }, 400);
  }

  // Optional: link the generation to one of the user's projects (Regenerate in
  // the project editor). Ownership is enforced by the database foreign key.
  const rawProjectId = (body as { projectId?: unknown }).projectId;
  const projectId =
    typeof rawProjectId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawProjectId)
      ? rawProjectId
      : undefined;
  if (rawProjectId !== undefined && !projectId) {
    return json({ error: { code: "validation", message: "Unknown project." } }, 400);
  }

  const result = await generateForUser(user.id, parsed.data, request.signal, projectId);
  if (!result.ok) {
    const { status, ...error } = result;
    return json({ error }, status);
  }

  return json({
    output: result.output,
    truncated: result.truncated,
    generationId: result.generationId,
    creditsUsed: result.creditsUsed,
    balance: result.balance,
  });
}
