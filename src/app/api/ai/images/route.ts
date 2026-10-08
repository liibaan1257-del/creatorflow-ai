import { generateImageForUser, type ImageRequest } from "@/features/images/service";
import { parseImageInput } from "@/features/images/validation";
import { getCurrentUser } from "@/lib/auth/dal";

/**
 * POST /api/ai/images: AI image generation. Verifies the Supabase session,
 * validates input, checks and charges credits server-side. The provider key
 * never leaves the server; the response only carries short-lived signed URLs.
 */

export const maxDuration = 300;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  // { sourceImageId } regenerates one of the user's images (regeneration price);
  // otherwise the body is a new image request.
  const sourceImageId = (body as { sourceImageId?: unknown } | null)?.sourceImageId;
  let imageRequest: ImageRequest;
  if (sourceImageId !== undefined) {
    if (typeof sourceImageId !== "string" || !UUID.test(sourceImageId)) {
      return json({ error: { code: "validation", message: "Unknown image." } }, 400);
    }
    imageRequest = { sourceImageId };
  } else {
    const parsed = parseImageInput(body);
    if (!parsed.ok) {
      return json({ error: { code: "validation", message: "Please check the form.", fieldErrors: parsed.fieldErrors } }, 400);
    }
    imageRequest = { input: parsed.data };
  }

  const result = await generateImageForUser(user.id, imageRequest, request.signal);
  if (!result.ok) {
    const { status, ...error } = result;
    return json({ error }, status);
  }
  return json({ image: result.image, creditsUsed: result.creditsUsed, balance: result.balance });
}
