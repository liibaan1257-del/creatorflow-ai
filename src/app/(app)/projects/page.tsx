import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { FolderIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/state-message";
import { ProjectList, ProjectListSkeleton } from "@/features/projects/components/project-list";
import { getProjectCount, listProjects } from "@/features/projects/queries";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "My Projects" };

const PAGE_SIZE = 50;

export default function ProjectsPage() {
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
        <AllProjects />
      </Suspense>
    </>
  );
}

async function AllProjects() {
  const [projects, total] = await Promise.all([listProjects(PAGE_SIZE), getProjectCount()]);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderIcon />}
        title="No projects yet"
        description="Projects you create with the AI Writer will appear here."
      />
    );
  }

  return (
    <>
      <Card>
        <ProjectList projects={projects} />
      </Card>
      {total > projects.length ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Showing the {formatNumber(projects.length)} most recent of {formatNumber(total)} projects.
        </p>
      ) : null}
    </>
  );
}
