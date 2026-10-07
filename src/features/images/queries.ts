import "server-only";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { toView, type GeneratedImageView } from "@/features/images/service";

/** The signed-in user's most recent images with signed URLs. */
export async function listRecentImages(limit = 8): Promise<GeneratedImageView[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_images")
    .select("id, prompt, style, aspect_ratio, width, height, project_id, created_at, image_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load images: ${error.message}`);
  const views = await Promise.all(data.map(toView));
  return views.filter((v): v is GeneratedImageView => v !== null);
}
