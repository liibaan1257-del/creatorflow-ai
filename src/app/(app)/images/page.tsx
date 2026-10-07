import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageStudio } from "@/features/images/components/image-studio";
import { listRecentImages } from "@/features/images/queries";
import { isImageGenerationConfigured } from "@/lib/ai";
import { getCurrentCredits } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "AI Images" };

export default function ImagesPage() {
  return (
    <>
      <PageHeader
        title="AI Images"
        description="Thumbnails, featured images and social graphics from a short description."
      />
      <Suspense fallback={<ImagesSkeleton />}>
        <Images />
      </Suspense>
    </>
  );
}

async function Images() {
  const [credits, recent] = await Promise.all([getCurrentCredits(), listRecentImages()]);
  const ready = isImageGenerationConfigured();

  return (
    <div className="space-y-4">
      {!ready ? (
        <Alert variant="warning" title="Image generation is not configured">
          Add an image provider API key on the server to enable image generation.
        </Alert>
      ) : null}
      <ImageStudio initialBalance={credits?.balance ?? 0} ready={ready} recent={recent} />
    </div>
  );
}

function ImagesSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]" aria-busy="true" aria-label="Loading AI Images">
      <Skeleton className="h-[34rem] rounded-xl" />
      <Skeleton className="h-[28rem] rounded-xl" />
    </div>
  );
}
