import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SparklesIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState, ErrorState } from "@/components/ui/state-message";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogDemo,
  LoadingButtonDemo,
  ToastDemo,
} from "./_components/interactive-demos";

/**
 * Internal component gallery. Not linked from the site and excluded from
 * search engines; useful when building and reviewing new UI.
 */
export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const toneOptions = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "witty", label: "Witty" },
] as const;

const colors = [
  ["Primary", "bg-primary"],
  ["Primary soft", "bg-primary-soft"],
  ["Foreground", "bg-foreground"],
  ["Muted", "bg-muted"],
  ["Border", "bg-border"],
  ["Success", "bg-success"],
  ["Warning", "bg-warning"],
  ["Destructive", "bg-destructive"],
] as const;

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="border-t border-border py-10 first:border-t-0 first:pt-0">
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <Container className="py-12 sm:py-16">
      <header className="mb-12 max-w-2xl">
        <Badge variant="primary">Internal</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Design system</h1>
        <p className="mt-3 text-muted-foreground">
          The building blocks of CreatorFlow AI. Components live in{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">src/components/ui</code>.
        </p>
      </header>

      <Section title="Colors" description="Semantic tokens from globals.css; all adapt to dark mode.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {colors.map(([name, className]) => (
            <div key={name} className="space-y-2">
              <div className={`h-14 rounded-lg border border-border ${className}`} />
              <p className="text-sm font-medium">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-3">
          <p className="text-4xl font-semibold tracking-tight">Display heading</p>
          <p className="text-2xl font-semibold tracking-tight">Page heading</p>
          <p className="text-lg font-semibold tracking-tight">Section heading</p>
          <p className="max-w-prose">
            Body text is set in Geist at 16px with comfortable line height, tuned for long-form reading.
          </p>
          <p className="text-sm text-muted-foreground">Secondary text for descriptions and hints.</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="outline" aria-label="Generate">
              <SparklesIcon />
            </Button>
            <Button disabled>Disabled</Button>
            <LoadingButtonDemo />
          </div>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Draft</Badge>
          <Badge variant="primary">New</Badge>
          <Badge variant="success">Published</Badge>
          <Badge variant="warning">Scheduled</Badge>
          <Badge variant="destructive">Failed</Badge>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Blog post</CardTitle>
              <CardDescription>10 tips for growing a YouTube channel</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Cards group related content. Header, content and footer are optional slots.
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
              <Button size="sm">Open</Button>
            </CardFooter>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Simple card with custom padding.</p>
          </Card>
        </div>
      </Section>

      <Section title="Form controls" description="Every control shares the same label, hint and error wrapper.">
        <div className="grid max-w-2xl gap-5 md:grid-cols-2">
          <Input label="Topic" name="demo-topic" placeholder="e.g. Morning routines" hint="What should the post be about?" />
          <Input label="Email" name="demo-email" type="email" defaultValue="not-an-email" error="Enter a valid email address." />
          <Select label="Tone" name="demo-tone" options={toneOptions} placeholder="Choose a tone…" defaultValue="" />
          <Input label="Disabled" name="demo-disabled" disabled defaultValue="Read only value" />
          <div className="md:col-span-2">
            <Textarea
              label="Outline"
              name="demo-outline"
              placeholder="Key points you want to cover…"
              hint="Optional. One point per line works best."
            />
          </div>
        </div>
      </Section>

      <Section title="Dialogs" description="Native <dialog>: focus trap, Escape and backdrop click to close.">
        <DialogDemo />
      </Section>

      <Section title="Toasts" description="Transient feedback; announced to screen readers.">
        <ToastDemo />
      </Section>

      <Section title="Alerts" description="Inline, persistent messages.">
        <div className="grid max-w-2xl gap-3">
          <Alert variant="info">Your workspace is in early access.</Alert>
          <Alert variant="success" title="Account created">Check your inbox to confirm your email.</Alert>
          <Alert variant="warning">You are close to your monthly limit.</Alert>
          <Alert variant="error">Invalid email or password.</Alert>
        </div>
      </Section>

      <Section title="Loading states">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Spinner label="Loading" /> Loading…
          </div>
          <div className="space-y-3" aria-busy="true" aria-label="Loading example">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </Section>

      <Section title="Empty & error states">
        <div className="grid gap-6 md:grid-cols-2">
          <EmptyState
            title="No posts yet"
            description="Generate your first blog post to see it here."
            action={<Button size="sm">Create post</Button>}
          />
          <ErrorState
            description="We couldn't load your content."
            action={
              <Button size="sm" variant="outline">
                Try again
              </Button>
            }
          />
        </div>
      </Section>
    </Container>
  );
}
