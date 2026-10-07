import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FileTextIcon, ImageIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { PROJECT_STATUS, PROJECT_TYPE_LABELS } from "@/features/projects/labels";
import type { ProjectSummary } from "@/features/projects/queries";
import { formatDate, formatRelativeTime } from "@/lib/format";

/** List of projects; each row opens the project. */
export function ProjectList({ projects }: { projects: readonly ProjectSummary[] }) {
  return (
    <ul className="divide-y divide-border">
      {projects.map((project) => {
        const status = PROJECT_STATUS[project.status];
        return (
          <li key={project.id}>
            <Link
              href={`/projects/${project.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/60 sm:px-6"
            >
              <span className="hidden size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground sm:grid">
                {project.type === "image" ? <ImageIcon className="size-5" /> : <FileTextIcon className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{project.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {PROJECT_TYPE_LABELS[project.type]} ·{" "}
                  <time dateTime={project.updated_at} title={formatDate(project.updated_at, "long")}>
                    Updated {formatRelativeTime(project.updated_at)}
                  </time>
                </p>
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ProjectListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-border" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
          <Skeleton className="hidden size-10 rounded-lg sm:block" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
