import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
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

export const listProjects = cache(async (limit: number): Promise<ProjectSummary[]> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(SUMMARY_COLUMNS)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load projects: ${error.message}`);
  return data;
});
