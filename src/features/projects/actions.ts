"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { getWriterType } from "@/features/writer/config";
import { parseWriterInput } from "@/features/writer/validation";
import type { ContentType, ProjectStatus } from "@/types/database";

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
  /** The AI Writer brief, so the project can be regenerated later. */
  brief?: unknown;
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

  // Only a brief that passes the same server-side validation is stored.
  const parsedBrief = input.brief === undefined ? null : parseWriterInput(input.brief);
  const brief = parsedBrief?.ok && parsedBrief.data.type === type ? parsedBrief.data : null;

  const { data, error } = await supabase
    .from("projects")
    .insert({ title, content, type, status: "draft", brief })
    .select("id")
    .single();
  if (error) return { ok: false, error: "Could not save your project. Please try again." };
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true, projectId: data.id };
}

const STATUSES: readonly ProjectStatus[] = ["draft", "in_progress", "completed", "archived"];

export type ProjectMutationResult = { ok: true } | { ok: false; error: string };

/** Updates the title, content and status of one of the user's projects. */
export async function updateProject(input: {
  id: string;
  title: string;
  content: string;
  status: string;
}): Promise<ProjectMutationResult> {
  const user = await requireUser();
  const id = typeof input.id === "string" && UUID.test(input.id) ? input.id : null;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const content = typeof input.content === "string" ? input.content : "";
  const status = STATUSES.find((s) => s === input.status);

  if (!id) return { ok: false, error: "Unknown project." };
  if (!title) return { ok: false, error: "Give your project a title." };
  if (title.length > TITLE_MAX) return { ok: false, error: `Keep the title under ${TITLE_MAX} characters.` };
  if (content.length > CONTENT_MAX) return { ok: false, error: "This content is too long to save." };
  if (!status) return { ok: false, error: "Choose a valid status." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ title, content, status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Could not save your changes. Please try again." };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Deletes one of the user's projects. Linked images stay in the user's image
 * history (the link is cleared by the database).
 */
export async function deleteProject(id: string): Promise<ProjectMutationResult> {
  const user = await requireUser();
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, error: "Unknown project." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Could not delete the project. Please try again." };

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true };
}
