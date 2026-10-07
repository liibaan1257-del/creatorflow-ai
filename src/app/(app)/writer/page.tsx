import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { WriterWorkspace } from "@/features/writer/components/writer-workspace";
import { getCurrentCredits } from "@/lib/auth/dal";
import { serverEnv } from "@/lib/server-env";

export const metadata: Metadata = { title: "AI Writer" };

export default function WriterPage() {
  return (
    <>
      <PageHeader
        title="AI Writer"
        description="Blog posts, outlines, social posts, YouTube and SEO copy in your tone and language."
      />
      <Suspense fallback={<WriterSkeleton />}>
        <Writer />
      </Suspense>
    </>
  );
}

async function Writer() {
  const credits = await getCurrentCredits();
  // Only a boolean leaves the server; the key itself never does.
  const aiReady = serverEnv.aiProvider !== "anthropic" || Boolean(serverEnv.anthropicApiKey);

  return (
    <div className="space-y-4">
      {!aiReady ? (
        <Alert variant="warning" title="AI generation is not configured">
          Add an AI provider API key on the server to enable generation.
        </Alert>
      ) : null}
      <WriterWorkspace initialBalance={credits?.balance ?? 0} aiReady={aiReady} />
    </div>
  );
}

function WriterSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]" aria-busy="true" aria-label="Loading AI Writer">
      <Skeleton className="h-[36rem] rounded-xl" />
      <Skeleton className="h-[28rem] rounded-xl" />
    </div>
  );
}
