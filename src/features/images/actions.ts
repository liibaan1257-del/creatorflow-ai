"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type SaveImageResult = { ok: true; projectId: string } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * "Save": creates an image project in My Projects and links the image to it.
 * Runs as the user; RLS + the composite foreign key ensure both belong to them.
 */
export async function saveImageToProjects(input: { imageId: string; title: string }): Promise<SaveImageResult> {
  const user = await requireUser();
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (typeof input.imageId !== "string" || !UUID.test(input.imageId)) return { ok: false, error: "Unknown image." };
  if (!title) return { ok: false, error: "Give the image a title." };
  if (title.length > 200) return { ok: false, error: "Keep the title under 200 characters." };

  const supabase = await createClient();
  const { data: image } = await supabase
    .from("generated_images")
    .select("id, prompt, project_id")
    .eq("id", input.imageId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!image) return { ok: false, error: "Unknown image." };
  if (image.project_id) return { ok: true, projectId: image.project_id };

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ title, type: "image", content: image.prompt, status: "completed" })
    .select("id")
    .single();
  if (error) return { ok: false, error: "Could not save the image. Please try again." };

  const { error: linkError } = await supabase
    .from("generated_images")
    .update({ project_id: project.id })
    .eq("id", image.id)
    .eq("user_id", user.id);
  if (linkError) {
    await supabase.from("projects").delete().eq("id", project.id);
    return { ok: false, error: "Could not save the image. Please try again." };
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true, projectId: project.id };
}
