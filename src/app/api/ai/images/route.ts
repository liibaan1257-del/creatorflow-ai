import { generateImageForUser } from "@/features/images/service";
import { parseImageInput } from "@/features/images/validation";
import { getCurrentUser } from "@/lib/auth/dal";

/**
 * POST /api/ai/images: AI image generation. Verifies the Supabase session,
 * validates input, checks and charges credits server-side. The provider key
 * never leaves the server; the response only carries short-lived signed URLs.
 */

export const maxDuration = 300;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Please sign in to create images." } }, 401);

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: { code: "bad_request", message: "Expected a JSON body." } }, 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: { code: "bad_request", message: "Invalid JSON." } }, 400);
  }

  const parsed = parseImageInput(body);
  if (!parsed.ok) {
    return json({ error: { code: "validation", message: "Please check the form.", fieldErrors: parsed.fieldErrors } }, 400);
  }

  const result = await generateImageForUser(user.id, parsed.data, request.signal);
  if (!result.ok) {
    return json({ error: { code: result.code, message: result.message, balance: result.balance } }, result.status);
  }
  return json({ image: result.image, creditsUsed: result.creditsUsed, balance: result.balance });
}
