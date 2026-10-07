import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

const features = [
  {
    title: "Blog posts & articles",
    description:
      "Turn an idea or outline into a structured, SEO-friendly draft you can refine.",
  },
  {
    title: "Video scripts",
    description:
      "Plan YouTube and short-form videos with hooks, outlines, and full scripts.",
  },
  {
    title: "Social media captions",
    description:
      "Generate platform-specific posts and captions that match your voice.",
  },
  {
    title: "Content library",
    description:
      "Save, organise, and revisit everything you create in one secure workspace.",
  },
] as const;

const audiences = [
  "Bloggers",
  "YouTubers",
  "Social media creators",
  "Freelancers",
  "Small businesses",
] as const;

export default function HomePage() {
  return (
    <>
      <section className="py-20 sm:py-28">
        <Container className="text-center">
          <p className="mx-auto w-fit rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            Early access — in active development
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Create better content, faster, with{" "}
            <span className="text-primary">{siteConfig.name}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
            {siteConfig.description}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#features"
              className={buttonClasses({ size: "lg", className: "w-full sm:w-auto" })}
            >
              Explore features
            </Link>
            <Link
              href="#audience"
              className={buttonClasses({
                variant: "secondary",
                size: "lg",
                className: "w-full sm:w-auto",
              })}
            >
              Who it&apos;s for
            </Link>
          </div>
        </Container>
      </section>

      <section id="features" className="scroll-mt-16 border-t border-border bg-muted py-20">
        <Container>
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything you need to create
          </h2>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <li
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="audience" className="scroll-mt-16 py-20">
        <Container className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Built for modern creators
          </h2>
          <ul className="mt-10 flex flex-wrap justify-center gap-3">
            {audiences.map((audience) => (
              <li
                key={audience}
                className="rounded-full border border-border px-4 py-2 text-sm"
              >
                {audience}
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
