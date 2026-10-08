import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { parseWriterInput, type WriterInput } from "@/features/writer/validation";
import { PROJECT_TYPE_LABELS } from "@/features/projects/labels";
import type { Project } from "@/types/database";

/**
 * Project reads for the signed-in user. Row Level Security already limits
 * results to the user's own rows; the explicit user_id filter is defence in
 * depth and lets Postgres use the (user_id, updated_at) index.
 */

export type ProjectSummary = Pick<Project, "id" | "title" | "type" | "status" | "updated_at">;

const SUMMARY_COLUMNS = "id, title, type, status, updated_at";

export const getProjectCount = cache(async (): Promise<number> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to count projects: ${error.message}`);
  return count ?? 0;
});

export const PROJECT_STATUSES = ["draft", "in_progress", "completed", "archived"] as const;
export const PROJECT_SORTS = ["updated", "newest", "oldest"] as const;
export type ProjectSort = (typeof PROJECT_SORTS)[number];

/** Escapes LIKE wildcards so user search text is matched literally. */
function likePattern(text: string) {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * The user's projects, optionally filtered by title search, status and type,
 * sorted by last update (default), newest or oldest. Unknown filter values are
 * ignored. Arguments are primitives so React's per-request cache dedupes.
 */
export const listProjects = cache(
  async (limit: number, search = "", status = "", type = "", sort = "updated"): Promise<ProjectSummary[]> => {
    const user = await requireUser();
    const supabase = await createClient();
    const order =
      sort === "newest"
        ? { column: "created_at", ascending: false }
        : sort === "oldest"
          ? { column: "created_at", ascending: true }
          : { column: "updated_at", ascending: false };
    let query = supabase
      .from("projects")
      .select(SUMMARY_COLUMNS)
      .eq("user_id", user.id)
      .order(order.column, { ascending: order.ascending })
      .limit(limit);

    const q = search.trim().slice(0, 100);
    if (q) query = query.ilike("title", likePattern(q));
    if ((PROJECT_STATUSES as readonly string[]).includes(status)) {
      query = query.eq("status", status as Project["status"]);
    }
    if (Object.hasOwn(PROJECT_TYPE_LABELS, type)) {
      query = query.eq("type", type as Project["type"]);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to load projects: ${error.message}`);
    return data;
  },
);

export type ProjectImage = {
  id: string;
  prompt: string;
  imagePath: string;
  aspectRatio: string | null;
  width: number | null;
  height: number | null;
};

export type ProjectDetail = Omit<Project, "brief"> & {
  images: ProjectImage[];
  /** The validated AI Writer brief, when the project can be regenerated. */
  brief: WriterInput | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One of the user's projects with its linked images, or null if not theirs. */
export const getProject = cache(async (id: string): Promise<ProjectDetail | null> => {
  if (!UUID.test(id)) return null;
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: project, error }, { data: images, error: imagesError }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase
      .from("generated_images")
      .select("id, prompt, image_url, aspect_ratio, width, height")
      .eq("project_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  if (error) throw new Error(`Failed to load project: ${error.message}`);
  if (imagesError) throw new Error(`Failed to load project images: ${imagesError.message}`);
  if (!project) return null;

  const parsedBrief = project.brief ? parseWriterInput(project.brief) : null;
  return {
    ...project,
    brief: parsedBrief?.ok && parsedBrief.data.type === project.type ? parsedBrief.data : null,
    images: (images ?? []).map((image) => ({
      id: image.id,
      prompt: image.prompt,
      imagePath: image.image_url,
      aspectRatio: image.aspect_ratio,
      width: image.width,
      height: image.height,
    })),
  };
});
