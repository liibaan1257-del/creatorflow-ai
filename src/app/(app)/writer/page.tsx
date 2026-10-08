import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getTemplate } from "@/features/templates/data";
import { WriterWorkspace, type WriterTemplatePreset } from "@/features/writer/components/writer-workspace";
import { LANGUAGES, TONES, type Language, type Tone } from "@/features/writer/config";
import { getCurrentCredits, getCurrentProfile } from "@/lib/auth/dal";
import { serverEnv } from "@/lib/server-env";

export const metadata: Metadata = { title: "AI Writer" };

export default function WriterPage({ searchParams }: PageProps<"/writer">) {
  return (
    <>
      <PageHeader
        title="AI Writer"
        description="Blog posts, outlines, social posts, YouTube and SEO copy in your tone and language."
      />
      <Suspense fallback={<WriterSkeleton />}>
        <Writer searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Writer({ searchParams }: Pick<PageProps<"/writer">, "searchParams">) {
  const [credits, profile, params] = await Promise.all([getCurrentCredits(), getCurrentProfile(), searchParams]);
  // Saved preferences, ignored if they no longer match a known option.
  const defaults = {
    tone: TONES.find((t) => t.value === profile?.default_tone)?.value as Tone | undefined,
    language: LANGUAGES.find((l) => l.value === profile?.default_language)?.value as Language | undefined,
  };
  // Only an id travels in the URL; the preset itself comes from server-side data.
  const found = getTemplate(typeof params.template === "string" ? params.template : null);
  const template: WriterTemplatePreset | undefined = found
    ? {
        id: found.id,
        name: found.name,
        type: found.writerType,
        tone: found.tone,
        instructions: found.instructions,
        topicExample: found.topicExample,
      }
    : undefined;
  // Only a boolean leaves the server; the key itself never does.
  const aiReady = serverEnv.aiProvider !== "anthropic" || Boolean(serverEnv.anthropicApiKey);

  return (
    <div className="space-y-4">
      {!aiReady ? (
        <Alert variant="warning" title="AI generation is not configured">
          Add an AI provider API key on the server to enable generation.
        </Alert>
      ) : null}
      {/* key: a different template remounts the form with its preset. */}
      <WriterWorkspace
        key={template?.id ?? "blank"}
        initialBalance={credits?.balance ?? 0}
        aiReady={aiReady}
        template={template}
        defaults={defaults}
      />
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
