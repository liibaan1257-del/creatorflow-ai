import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type SectionProps = {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/** Landing page section with a consistent, accessible heading block. */
export function Section({ id, eyebrow, title, description, children, className }: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("scroll-mt-20 py-20 sm:py-28", className)}>
      <Container>
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          {eyebrow ? (
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
          ) : null}
          <h2 id={headingId} className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-lg text-pretty text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </Container>
    </section>
  );
}
