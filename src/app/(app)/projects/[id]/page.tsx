import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRightIcon, DownloadIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectEditor } from "@/features/projects/components/project-editor";
import { PROJECT_TYPE_LABELS } from "@/features/projects/labels";
import { getProject, type ProjectImage } from "@/features/projects/queries";
import { formatDate } from "@/lib/format";
import { getUserFileUrl } from "@/lib/storage/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Project" };

/** params are request data (no generateStaticParams), so they're read inside <Suspense>. */
export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <>
      <Link href="/projects" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRightIcon className="size-4 rotate-180" />
        My Projects
      </Link>
      <Suspense fallback={<ProjectSkeleton />}>
        <ProjectDetail params={params} />
      </Suspense>
    </>
  );
}

async function ProjectDetail({ params }: Pick<PageProps<"/projects/[id]">, "params">) {
  const { id } = await params;
  const project = await getProject(id);
  // Missing, malformed, or someone else's (RLS hides it): all look the same.
  if (!project) notFound();

  const isImage = project.type === "image";
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">{project.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <Badge variant="primary">{PROJECT_TYPE_LABELS[project.type]}</Badge>
          <span>Created {formatDate(project.created_at)}</span>
          <span aria-hidden="true">·</span>
          <span>Updated {formatDate(project.updated_at)}</span>
        </div>
      </div>

      {project.images.length ? <ProjectImages images={project.images} /> : null}

      <ProjectEditor
        isImage={isImage}
        brief={project.brief}
        project={{ id: project.id, title: project.title, content: project.content, status: project.status }}
      />
    </div>
  );
}

async function ProjectImages({ images }: { images: ProjectImage[] }) {
  const withUrls = await Promise.all(
    images.map(async (image) => ({
      ...image,
      url: await getUserFileUrl(image.imagePath),
      downloadUrl: await getUserFileUrl(image.imagePath, {
        download: `creatorflow-${image.id.slice(0, 8)}.${image.imagePath.split(".").pop() ?? "webp"}`,
      }),
    })),
  );

  return (
    <Card className="overflow-hidden">
      {withUrls.map((image) =>
        image.url ? (
          <figure key={image.id} className="flex flex-col items-center gap-4 bg-muted/40 p-5 sm:p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.prompt}
              width={image.width ?? undefined}
              height={image.height ?? undefined}
              className={cn(
                "w-full max-w-xl rounded-lg object-cover shadow-card",
                image.aspectRatio === "9:16" && "max-w-xs",
              )}
            />
            {image.downloadUrl ? (
              <a href={image.downloadUrl} className={buttonClasses({ variant: "outline", size: "sm" })}>
                <DownloadIcon />
                Download
              </a>
            ) : null}
          </figure>
        ) : null,
      )}
    </Card>
  );
}

function ProjectSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading project">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
