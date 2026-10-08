"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { CopyIcon, FileTextIcon, RefreshIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { deleteProject, updateProject } from "@/features/projects/actions";
import { PROJECT_STATUS } from "@/features/projects/labels";
import { getWriterType } from "@/features/writer/config";
import type { WriterInput } from "@/features/writer/validation";
import type { ProjectStatus } from "@/types/database";

const STATUS_OPTIONS = (Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((value) => ({
  value,
  label: PROJECT_STATUS[value].label,
}));

type EditorProject = { id: string; title: string; content: string; status: ProjectStatus };

export function ProjectEditor({
  project,
  isImage,
  brief,
}: {
  project: EditorProject;
  isImage: boolean;
  /** AI Writer brief the project was created from; enables Regenerate. */
  brief: WriterInput | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saved, setSaved] = useState(project);
  const [title, setTitle] = useState(project.title);
  const [content, setContent] = useState(project.content);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSaving] = useTransition();
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const regenerateCost = brief ? (getWriterType(brief.type)?.credits ?? null) : null;
  const [deleting, startDeleting] = useTransition();

  const dirty = title !== saved.title || content !== saved.content || status !== saved.status;

  function save() {
    setError(null);
    startSaving(async () => {
      const result = await updateProject({ id: project.id, title, content, status });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved({ ...saved, title: title.trim(), content, status });
      setTitle(title.trim());
      toast({ variant: "success", title: "Changes saved" });
      router.refresh();
    });
  }

  function remove() {
    startDeleting(async () => {
      const result = await deleteProject(project.id);
      if (!result.ok) {
        setConfirmDelete(false);
        toast({ variant: "error", title: "Not deleted", description: result.error });
        return;
      }
      toast({ variant: "success", title: "Project deleted" });
      router.replace("/projects");
    });
  }

  async function regenerate() {
    if (!brief) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...brief, projectId: project.id }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body) {
        if (res.status === 401) {
          router.push(`/login?next=/projects/${project.id}`);
          return;
        }
        toast({ variant: "error", title: "Couldn't regenerate", description: body?.error?.message ?? "Please try again." });
        return;
      }
      setContent(body.output);
      toast({
        variant: "success",
        title: "Regenerated",
        description: `Used ${body.creditsUsed} credit${body.creditsUsed === 1 ? "" : "s"} · ${body.balance} left. Review, then save.`,
      });
      router.refresh();
    } catch {
      toast({ variant: "error", title: "Network error", description: "Check your connection and try again." });
    } finally {
      setRegenerating(false);
      setConfirmRegenerate(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      toast({ variant: "success", title: "Copied to clipboard" });
    } catch {
      toast({ variant: "error", title: "Couldn't copy", description: "Select the text and copy it manually." });
    }
  }

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{isImage ? "Details" : "Content"}</h2>
          {dirty ? <Badge variant="warning">Unsaved changes</Badge> : null}
        </div>
        {!isImage ? (
          <div className="flex flex-wrap gap-2">
            {brief && regenerateCost !== null ? (
              <Button variant="outline" size="sm" onClick={() => setConfirmRegenerate(true)} disabled={regenerating}>
                <RefreshIcon />
                Regenerate · {regenerateCost} cr
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={copy} disabled={!content}>
              <CopyIcon />
              Copy
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <Input label="Title" name="title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select
            label="Status"
            name="status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="project-content" className="block text-sm font-medium">
            {isImage ? "Prompt" : "Content"}
          </label>
          <textarea
            id="project-content"
            aria-busy={regenerating || undefined}
            readOnly={regenerating}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={isImage ? 4 : 18}
            className="block w-full resize-y rounded-lg border border-input bg-card p-4 font-mono text-sm leading-relaxed shadow-card focus:border-ring focus:ring-3 focus:ring-ring/20 focus:outline-none"
          />
          <p className="text-xs text-muted-foreground">
            {content.trim() ? content.trim().split(/\s+/).length : 0} words · {content.length} characters
          </p>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive-soft"
          >
            Delete project
          </button>
          <Button onClick={save} loading={saving} disabled={!dirty || !title.trim()}>
            <FileTextIcon />
            {dirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      </div>

      {brief ? (
        <Dialog
          open={confirmRegenerate}
          onClose={() => !regenerating && setConfirmRegenerate(false)}
          size="sm"
          title="Regenerate this content?"
          description={`Uses ${regenerateCost} credit${regenerateCost === 1 ? "" : "s"}. The new version replaces the text in the editor; nothing is saved until you press Save changes.`}
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmRegenerate(false)} disabled={regenerating}>
                Cancel
              </Button>
              <Button onClick={regenerate} loading={regenerating}>
                <RefreshIcon />
                {regenerating ? "Regenerating…" : "Regenerate"}
              </Button>
            </>
          }
        >
          <dl className="space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Topic:</dt>
              <dd className="line-clamp-2">{brief.topic}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Tone · Language:</dt>
              <dd className="capitalize">
                {brief.tone} · {brief.language}
              </dd>
            </div>
          </dl>
        </Dialog>
      ) : null}

      <Dialog
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        size="sm"
        title="Delete this project?"
        description={
          isImage
            ? "The project is removed. The image stays in your AI Images history."
            : "This permanently deletes the project and its content."
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} loading={deleting}>
              Delete
            </Button>
          </>
        }
      />
    </Card>
  );
}
