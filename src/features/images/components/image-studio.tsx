"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoinsIcon, DownloadIcon, FolderIcon, ImageIcon, RefreshIcon, SparklesIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/state-message";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { creditLabel } from "@/config/credits";
import { saveImageToProjects } from "@/features/images/actions";
import {
  ASPECT_RATIOS,
  IMAGE_CREDITS,
  IMAGE_PROMPT_LIMITS,
  IMAGE_REGENERATION_CREDITS,
  IMAGE_STYLES,
} from "@/features/images/config";
import type { GeneratedImageView } from "@/features/images/service";
import type { ImageField, ImageInput } from "@/features/images/validation";
import { cn } from "@/lib/utils";

const RATIO_ICON: Record<string, string> = { "1:1": "size-6", "16:9": "h-5 w-8", "9:16": "h-8 w-5" };

const RATIO_CLASS: Record<string, string> = {
  "1:1": "aspect-square",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
};

export function ImageStudio({
  initialBalance,
  ready,
  recent,
}: {
  initialBalance: number;
  ready: boolean;
  recent: GeneratedImageView[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<ImageInput["style"]>("realistic");
  const [aspectRatio, setAspectRatio] = useState<ImageInput["aspectRatio"]>("1:1");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ImageField, string>>>({});
  const [balance, setBalance] = useState(initialBalance);
  const [current, setCurrent] = useState<GeneratedImageView | null>(null);
  const [lastInput, setLastInput] = useState<ImageInput | null>(null);
  const [gallery, setGallery] = useState(recent);
  const [saving, startSaving] = useTransition();

  const canAfford = balance >= IMAGE_CREDITS;
  // While loading a new image, the frame takes the requested shape.
  const frameRatio = loading ? (lastInput?.aspectRatio ?? aspectRatio) : (current?.aspectRatio ?? aspectRatio);

  /** A new image, or (with sourceImageId) a new take on an existing one at the regeneration price. */
  async function generate(input: ImageInput, sourceImageId?: string) {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setLastInput(input);
    try {
      const res = await fetch("/api/ai/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sourceImageId ? { sourceImageId } : input),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body) {
        if (res.status === 401) {
          router.push("/login?next=/images");
          return;
        }
        if (typeof body?.error?.balance === "number") setBalance(body.error.balance);
        setFieldErrors(body?.error?.fieldErrors ?? {});
        setError(body?.error?.message ?? "Something went wrong. Please try again.");
        return;
      }
      const image: GeneratedImageView = body.image;
      setCurrent(image);
      setBalance(body.balance);
      setGallery((items) => [image, ...items.filter((i) => i.id !== image.id)].slice(0, 8));
      toast({
        variant: "success",
        title: sourceImageId ? "Image regenerated" : "Image created",
        description: `Used ${creditLabel(body.creditsUsed)} · ${body.balance} left`,
      });
      router.refresh();
      const preview = document.getElementById("image-result");
      if (preview && preview.getBoundingClientRect().top > window.innerHeight) {
        preview.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // The server reuses the stored prompt and settings of the user's own image;
  // these values only shape the loading frame.
  function regenerate(image: GeneratedImageView) {
    void generate(
      {
        prompt: image.prompt,
        style: (image.style ?? style) as ImageInput["style"],
        aspectRatio: (image.aspectRatio ?? aspectRatio) as ImageInput["aspectRatio"],
      },
      image.id,
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void generate({ prompt, style, aspectRatio });
  }

  function save() {
    if (!current) return;
    const image = current;
    startSaving(async () => {
      const title = image.prompt.replace(/\s+/g, " ").slice(0, 80);
      const result = await saveImageToProjects({ imageId: image.id, title });
      if (!result.ok) {
        toast({ variant: "error", title: "Not saved", description: result.error });
        return;
      }
      const saved = { ...image, projectId: result.projectId };
      setCurrent(saved);
      setGallery((items) => items.map((i) => (i.id === saved.id ? saved : i)));
      toast({ variant: "success", title: "Saved to My Projects" });
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        {/* -------------------------------------------------------- Brief */}
        <Card className="p-5 sm:p-6">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <Textarea
              label="Describe your image"
              name="prompt"
              required
              rows={4}
              maxLength={IMAGE_PROMPT_LIMITS.max}
              placeholder="e.g. A cosy home office at sunrise with a laptop, plants and a cup of coffee"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              error={fieldErrors.prompt}
            />

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Style</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {IMAGE_STYLES.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer flex-col rounded-lg border px-3 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                      style === option.value ? "border-primary bg-primary-soft" : "border-border hover:bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="style"
                      value={option.value}
                      checked={style === option.value}
                      onChange={() => setStyle(option.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.hint}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.style ? <p className="mt-1.5 text-sm text-destructive">{fieldErrors.style}</p> : null}
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Aspect ratio</legend>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                      aspectRatio === option.value ? "border-primary bg-primary-soft" : "border-border hover:bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="aspectRatio"
                      value={option.value}
                      checked={aspectRatio === option.value}
                      onChange={() => setAspectRatio(option.value)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={cn("rounded-sm border-2 border-current text-muted-foreground", RATIO_ICON[option.value])}
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-[11px] text-muted-foreground">{option.hint}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.aspectRatio ? (
                <p className="mt-1.5 text-sm text-destructive">{fieldErrors.aspectRatio}</p>
              ) : null}
            </fieldset>

            {error ? <Alert variant="error">{error}</Alert> : null}

            <div className="space-y-2">
              <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!ready || !canAfford}>
                {loading ? "Creating image…" : (
                  <>
                    <SparklesIcon />
                    Generate · {IMAGE_CREDITS} credits
                  </>
                )}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <CoinsIcon className="size-3.5" />
                <span className="tabular-nums">{balance}</span> credits available
                {!canAfford ? <span className="text-destructive">· not enough for an image</span> : null}
              </p>
            </div>
          </form>
        </Card>

        {/* ------------------------------------------------------ Preview */}
        <Card id="image-result" className="scroll-mt-20 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Preview</h2>
              {current && !loading ? (
                <Badge variant="primary">
                  {IMAGE_STYLES.find((s) => s.value === current.style)?.label ?? "Image"} · {current.aspectRatio}
                </Badge>
              ) : null}
            </div>
            {current && !loading ? (
              <div className="flex flex-wrap gap-2">
                <a href={current.downloadUrl} className={buttonClasses({ variant: "outline", size: "sm" })}>
                  <DownloadIcon />
                  Download
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={balance < IMAGE_REGENERATION_CREDITS}
                  onClick={() => regenerate(current)}
                >
                  <RefreshIcon />
                  Regenerate · {IMAGE_REGENERATION_CREDITS} cr
                </Button>
                <Button size="sm" onClick={save} loading={saving} disabled={Boolean(current.projectId)}>
                  <FolderIcon />
                  {current.projectId ? "Saved" : "Save"}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex justify-center bg-muted/40 p-5 sm:p-6">
            {loading ? (
              <div
                role="status"
                aria-live="polite"
                className={cn(
                  "flex w-full max-w-xl flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card text-center",
                  RATIO_CLASS[frameRatio],
                  frameRatio === "9:16" && "max-w-xs",
                )}
              >
                <SparklesIcon className="size-8 animate-pulse text-primary" />
                <p className="px-6 text-sm text-muted-foreground">Creating your image… this usually takes 10–60 seconds.</p>
              </div>
            ) : current ? (
              <figure className={cn("w-full max-w-xl", current.aspectRatio === "9:16" && "max-w-xs")}>
                {/* Signed URLs are short-lived and per-user, so next/image caching isn't wanted. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.url}
                  alt={current.prompt}
                  width={current.width ?? undefined}
                  height={current.height ?? undefined}
                  className={cn("w-full rounded-lg bg-card object-cover shadow-card", RATIO_CLASS[current.aspectRatio ?? "1:1"])}
                />
                <figcaption className="mt-3 line-clamp-2 text-sm text-muted-foreground">{current.prompt}</figcaption>
                {current.projectId ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saved in{" "}
                    <Link href="/projects" className="font-medium text-primary hover:underline">
                      My Projects
                    </Link>
                    .
                  </p>
                ) : null}
              </figure>
            ) : (
              <EmptyState
                className="w-full max-w-xl bg-card"
                icon={<ImageIcon />}
                title="Your image will appear here"
                description={
                  ready
                    ? "Describe what you want to see, pick a style and a shape, then press Generate."
                    : "Image generation isn't configured on this server yet."
                }
              />
            )}
          </div>
        </Card>
      </div>

      {/* --------------------------------------------------------- Recent */}
      <section aria-labelledby="recent-images-heading">
        <h2 id="recent-images-heading" className="mb-4 text-lg font-semibold tracking-tight">
          Recent images
        </h2>
        {gallery.length === 0 ? (
          <p className="text-sm text-muted-foreground">Images you create are stored privately in your account and listed here.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((image) => (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setCurrent(image)}
                  className={cn(
                    "group block w-full cursor-pointer overflow-hidden rounded-lg border bg-card text-left shadow-card transition-colors",
                    current?.id === image.id ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.prompt} loading="lazy" className="aspect-square w-full object-cover" />
                  <span className="block truncate px-3 py-2 text-xs text-muted-foreground">{image.prompt}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
