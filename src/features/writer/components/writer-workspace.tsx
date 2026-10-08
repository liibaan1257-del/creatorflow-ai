"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoinsIcon, CopyIcon, FileTextIcon, RefreshIcon, SparklesIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/state-message";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { saveProject } from "@/features/projects/actions";
import {
  LANGUAGES,
  TONES,
  WRITER_LIMITS,
  WRITER_TYPES,
  getWriterType,
  type WriterType,
} from "@/features/writer/config";
import type { WriterField, WriterInput } from "@/features/writer/validation";
import { cn } from "@/lib/utils";

type ApiError = {
  code: string;
  message: string;
  fieldErrors?: Partial<Record<WriterField, string>>;
  balance?: number;
};

type Status = "idle" | "done";

const TITLE_MAX = 200;

function defaultTitle(input: WriterInput) {
  const label = getWriterType(input.type)?.label ?? "Draft";
  const topic = input.topic.replace(/\s+/g, " ").slice(0, 80);
  return `${label}: ${topic}`.slice(0, TITLE_MAX);
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** Template preset passed from the server (resolved from ?template=…). */
export type WriterTemplatePreset = {
  id: string;
  name: string;
  type: WriterType;
  tone: WriterInput["tone"];
  instructions: string;
  topicExample: string;
};

export function WriterWorkspace({
  initialBalance,
  aiReady,
  template,
}: {
  initialBalance: number;
  aiReady: boolean;
  template?: WriterTemplatePreset;
}) {
  const router = useRouter();
  const { toast } = useToast();

  // Form
  const [activeTemplate, setActiveTemplate] = useState(template);
  const [type, setType] = useState<WriterType>(template?.type ?? "blog_post");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<WriterInput["tone"]>(template?.tone ?? "professional");
  const [language, setLanguage] = useState<WriterInput["language"]>("English");
  const [keywords, setKeywords] = useState("");
  const [instructions, setInstructions] = useState(template?.instructions ?? "");

  function clearTemplate() {
    setActiveTemplate(undefined);
    setType("blog_post");
    setTone("professional");
    setInstructions("");
    router.replace("/writer");
  }

  // Result
  const [status, setStatus] = useState<Status>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiError["fieldErrors"]>({});
  const [output, setOutput] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [lastInput, setLastInput] = useState<WriterInput | null>(null);
  const [balance, setBalance] = useState(initialBalance);

  // Project
  const [projectId, setProjectId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [savedContent, setSavedContent] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const selected = getWriterType(type)!;
  const canAfford = balance >= selected.credits;
  const outputType = lastInput ? getWriterType(lastInput.type)! : selected;
  const unsaved = output !== "" && output !== savedContent;

  async function generate(input: WriterInput, { isRegenerate }: { isRegenerate: boolean }) {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => null);

      if (!res.ok || !body) {
        const apiError: ApiError | undefined = body?.error;
        if (res.status === 401) {
          router.push("/login?next=/writer");
          return;
        }
        if (typeof apiError?.balance === "number") setBalance(apiError.balance);
        setFieldErrors(apiError?.fieldErrors ?? {});
        setError(apiError?.message ?? "Something went wrong. Please try again.");
        return;
      }

      setOutput(body.output);
      setTruncated(Boolean(body.truncated));
      setBalance(body.balance);
      setLastInput(input);
      setStatus("done");
      if (!isRegenerate) {
        // A fresh brief starts a new project; regenerating keeps the current one.
        setProjectId(null);
        setSavedContent(null);
        setTitle(defaultTitle(input));
      }
      toast({
        variant: "success",
        title: isRegenerate ? "Regenerated" : "Content generated",
        description: `Used ${body.creditsUsed} credit${body.creditsUsed === 1 ? "" : "s"} · ${body.balance} left`,
      });
      // Refresh server components (top bar credits, dashboard).
      router.refresh();
      // On small screens the result sits below the form: bring it into view.
      const result = document.getElementById("writer-result");
      if (result && result.getBoundingClientRect().top > window.innerHeight) {
        result.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void generate({ type, topic, tone, language, keywords, instructions }, { isRegenerate: false });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      toast({ variant: "success", title: "Copied to clipboard" });
    } catch {
      toast({ variant: "error", title: "Couldn't copy", description: "Select the text and copy it manually." });
    }
  }

  function save() {
    if (!lastInput) return;
    startSaving(async () => {
      const result = await saveProject({
        projectId: projectId ?? undefined,
        title,
        type: lastInput.type,
        content: output,
        brief: lastInput,
      });
      if (!result.ok) {
        toast({ variant: "error", title: "Not saved", description: result.error });
        return;
      }
      setProjectId(result.projectId);
      setSavedContent(output);
      toast({
        variant: "success",
        title: projectId ? "Changes saved" : "Saved to My Projects",
      });
    });
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      {/* ------------------------------------------------------------ Brief */}
      <Card className="p-5 sm:p-6">
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {activeTemplate ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary-soft px-3 py-2.5 text-sm">
              <p className="min-w-0">
                <span className="text-muted-foreground">Template: </span>
                <span className="font-medium">{activeTemplate.name}</span>
              </p>
              <button
                type="button"
                onClick={clearTemplate}
                className="shrink-0 cursor-pointer text-sm font-medium text-primary hover:underline"
              >
                Clear
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Need a starting point?{" "}
              <Link href="/templates" className="font-medium text-primary hover:underline">
                Browse templates
              </Link>
            </p>
          )}
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Content type</legend>
            <div className="grid grid-cols-2 gap-2">
              {WRITER_TYPES.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    "relative flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                    type === option.id ? "border-primary bg-primary-soft" : "border-border hover:bg-muted",
                    option.id === "blog_post" && "col-span-2",
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    value={option.id}
                    checked={type === option.id}
                    onChange={() => setType(option.id)}
                    className="sr-only"
                  />
                  <span className="flex items-center justify-between gap-2 text-sm font-medium">
                    {option.label}
                    <span className="shrink-0 text-xs font-normal whitespace-nowrap text-muted-foreground tabular-nums">
                      {option.credits} cr
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </label>
              ))}
            </div>
            {fieldErrors?.type ? <p className="mt-1.5 text-sm text-destructive">{fieldErrors.type}</p> : null}
          </fieldset>

          <Textarea
            label="Topic"
            name="topic"
            required
            rows={3}
            maxLength={WRITER_LIMITS.topicMax}
            placeholder={`e.g. ${activeTemplate?.topicExample ?? "7 morning habits that help freelancers stay productive"}`}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            error={fieldErrors?.topic}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Tone"
              name="tone"
              options={TONES}
              value={tone}
              onChange={(e) => setTone(e.target.value as WriterInput["tone"])}
              error={fieldErrors?.tone}
            />
            <Select
              label="Language"
              name="language"
              options={LANGUAGES}
              value={language}
              onChange={(e) => setLanguage(e.target.value as WriterInput["language"])}
              error={fieldErrors?.language}
            />
          </div>

          <Input
            label="Keywords"
            name="keywords"
            hint="Optional. Separate with commas."
            maxLength={WRITER_LIMITS.keywordsMax}
            placeholder="productivity, remote work"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            error={fieldErrors?.keywords}
          />

          <Textarea
            label="Additional instructions"
            name="instructions"
            hint="Optional. Audience, length, points to include or avoid."
            rows={2}
            maxLength={WRITER_LIMITS.instructionsMax}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            error={fieldErrors?.instructions}
          />

          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="space-y-2">
            <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!aiReady || !canAfford}>
              {loading ? "Generating…" : (
                <>
                  <SparklesIcon />
                  Generate · {selected.credits} credit{selected.credits === 1 ? "" : "s"}
                </>
              )}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <CoinsIcon className="size-3.5" />
              <span className="tabular-nums">{balance}</span> credits available
              {!canAfford ? <span className="text-destructive">· not enough for this type</span> : null}
            </p>
          </div>
        </form>
      </Card>

      {/* ----------------------------------------------------------- Output */}
      <Card id="writer-result" className="flex min-h-[28rem] scroll-mt-20 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Result</h2>
            {status === "done" ? <Badge variant="primary">{outputType.label}</Badge> : null}
            {unsaved && projectId ? <Badge variant="warning">Unsaved changes</Badge> : null}
          </div>
          {status === "done" ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copy}>
                <CopyIcon />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || !lastInput || balance < outputType.credits}
                onClick={() => lastInput && generate(lastInput, { isRegenerate: true })}
              >
                <RefreshIcon />
                Regenerate · {outputType.credits} cr
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {loading && status !== "done" ? (
            <GeneratingState />
          ) : status === "done" ? (
            <div className={cn("flex flex-1 flex-col gap-4", loading && "pointer-events-none opacity-60")}>
              {truncated ? (
                <Alert variant="warning">The response reached its length limit and may end abruptly.</Alert>
              ) : null}
              <label htmlFor="writer-output" className="sr-only">
                Generated content (editable)
              </label>
              <textarea
                id="writer-output"
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className="min-h-80 w-full flex-1 resize-y rounded-lg border border-input bg-card p-4 font-mono text-sm leading-relaxed shadow-card focus:border-ring focus:ring-3 focus:ring-ring/20 focus:outline-none"
              />
              <p className="text-xs text-muted-foreground">
                {countWords(output)} words · {output.length} characters · Edit freely before saving.
              </p>

              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Input
                    label="Project title"
                    name="project-title"
                    maxLength={TITLE_MAX}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <Button onClick={save} loading={saving} disabled={!title.trim() || (!unsaved && projectId !== null)}>
                  <FileTextIcon />
                  {projectId ? (unsaved ? "Save changes" : "Saved") : "Save project"}
                </Button>
              </div>
              {projectId ? (
                <p className="text-xs text-muted-foreground">
                  Saved in{" "}
                  <Link href="/projects" className="font-medium text-primary hover:underline">
                    My Projects
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          ) : (
            <EmptyState
              className="flex-1"
              icon={<SparklesIcon />}
              title="Your content will appear here"
              description={
                aiReady
                  ? "Choose a content type, describe your topic and press Generate."
                  : "AI generation isn't configured on this server yet."
              }
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="flex flex-1 flex-col gap-3" role="status" aria-live="polite">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <SparklesIcon className="size-4 animate-pulse text-primary" />
        Writing your content… long posts can take up to a minute.
      </p>
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="mt-4 h-5 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-10/12" />
    </div>
  );
}
