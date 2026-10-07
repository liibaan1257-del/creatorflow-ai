import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { AUTH_ROUTES } from "@/lib/auth/redirect";

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
          <Badge variant="primary">Early access — in active development</Badge>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Create better content, faster, with{" "}
            <span className="text-primary">{siteConfig.name}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
            {siteConfig.description}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={AUTH_ROUTES.signup}
              className={buttonClasses({ size: "lg", className: "w-full sm:w-auto" })}
            >
              Get started free
            </Link>
            <Link
              href="#features"
              className={buttonClasses({
                variant: "secondary",
                size: "lg",
                className: "w-full sm:w-auto",
              })}
            >
              Explore features
            </Link>
          </div>
        </Container>
      </section>

      <section id="features" className="scroll-mt-16 border-t border-border bg-surface py-20">
        <Container>
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything you need to create
          </h2>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <li key={feature.title}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
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
                className="rounded-full border border-border bg-card px-4 py-2 text-sm shadow-card"
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
