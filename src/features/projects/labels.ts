import type { ProjectStatus, ProjectType } from "@/types/database";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive";

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  blog_post: "Blog post",
  video_script: "Video script",
  social_caption: "Social caption",
  image: "Image",
  other: "Other",
};

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: "Draft", variant: "neutral" },
  in_progress: { label: "In progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  archived: { label: "Archived", variant: "neutral" },
};
