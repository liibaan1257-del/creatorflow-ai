"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getWriterType } from "@/features/writer/config";
import type { ContentType } from "@/types/database";

export type SaveProjectResult =
  | { ok: true; projectId: string }
  | { ok: false; error: string };

const TITLE_MAX = 200;
const CONTENT_MAX = 200_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Creates a project, or updates it when `projectId` is given. Runs as the
 * signed-in user, so Row Level Security only allows touching their own rows.
 */
export async function saveProject(input: {
  projectId?: string;
  title: string;
  type: string;
  content: string;
}): Promise<SaveProjectResult> {
  const user = await requireUser();

  const title = typeof input.title === "string" ? input.title.trim() : "";
  const content = typeof input.content === "string" ? input.content : "";
  const type = getWriterType(String(input.type))?.id as ContentType | undefined;
  const projectId = typeof input.projectId === "string" && UUID.test(input.projectId) ? input.projectId : undefined;

  if (!title) return { ok: false, error: "Give your project a title." };
  if (title.length > TITLE_MAX) return { ok: false, error: `Keep the title under ${TITLE_MAX} characters.` };
  if (!content.trim()) return { ok: false, error: "There is no content to save yet." };
  if (content.length > CONTENT_MAX) return { ok: false, error: "This content is too long to save." };
  if (!type) return { ok: false, error: "Unknown content type." };

  const supabase = await createClient();

  if (projectId) {
    const { data, error } = await supabase
      .from("projects")
      .update({ title, content, type })
      .eq("id", projectId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();
    if (error || !data) return { ok: false, error: "Could not save your changes. Please try again." };
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { ok: true, projectId: data.id };
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ title, content, type, status: "draft" })
    .select("id")
    .single();
  if (error) return { ok: false, error: "Could not save your project. Please try again." };
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true, projectId: data.id };
}
