"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { CopyIcon, FileTextIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { deleteProject, updateProject } from "@/features/projects/actions";
import { PROJECT_STATUS } from "@/features/projects/labels";
import type { ProjectStatus } from "@/types/database";

const STATUS_OPTIONS = (Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((value) => ({
  value,
  label: PROJECT_STATUS[value].label,
}));

type EditorProject = { id: string; title: string; content: string; status: ProjectStatus };

export function ProjectEditor({ project, isImage }: { project: EditorProject; isImage: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saved, setSaved] = useState(project);
  const [title, setTitle] = useState(project.title);
  const [content, setContent] = useState(project.content);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSaving] = useTransition();
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
          <Button variant="outline" size="sm" onClick={copy} disabled={!content}>
            <CopyIcon />
            Copy
          </Button>
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
