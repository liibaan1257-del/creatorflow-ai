import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { FolderIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/state-message";
import { ProjectFilters } from "@/features/projects/components/project-filters";
import { ProjectList, ProjectListSkeleton } from "@/features/projects/components/project-list";
import { getProjectCount, listProjects } from "@/features/projects/queries";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "My Projects" };

const PAGE_SIZE = 50;

export default function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  return (
    <>
      <PageHeader title="My Projects" description="Everything you've created, most recent first." />
      <Suspense
        fallback={
          <Card aria-busy="true" aria-label="Loading projects">
            <ProjectListSkeleton rows={5} />
          </Card>
        }
      >
        <AllProjects searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AllProjects({ searchParams }: Pick<PageProps<"/projects">, "searchParams">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const status = typeof params.status === "string" ? params.status : "";
  const [projects, total] = await Promise.all([listProjects(PAGE_SIZE, q, status), getProjectCount()]);

  if (total === 0) {
    return (
      <EmptyState
        icon={<FolderIcon />}
        title="No projects yet"
        description="Content you save from the AI Writer or AI Images will appear here."
      />
    );
  }

  return (
    <>
      <ProjectFilters q={q} status={status} />
      {projects.length === 0 ? (
        <EmptyState icon={<FolderIcon />} title="No matching projects" description="Try a different search or status." />
      ) : (
        <Card>
          <ProjectList projects={projects} />
        </Card>
      )}
      {!q && !status && total > projects.length ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Showing the {formatNumber(projects.length)} most recent of {formatNumber(total)} projects.
        </p>
      ) : null}
    </>
  );
}
