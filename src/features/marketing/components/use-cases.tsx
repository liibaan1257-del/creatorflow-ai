import { Card } from "@/components/ui/card";
import { CheckIcon } from "@/components/ui/icons";
import { Section } from "@/features/marketing/components/section";
import { useCases } from "@/features/marketing/content";

export function UseCases() {
  return (
    <Section
      id="use-cases"
      eyebrow="Use cases"
      title="Built for the way you create"
      description="Whether you write, film or sell, CreatorFlow AI fits into your workflow."
      className="bg-surface"
    >
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {useCases.map(({ title, description, icon: Icon, examples }) => (
          <li key={title}>
            <Card className="h-full p-6">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold tracking-tight">{title}</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <ul className="mt-4 space-y-2">
                {examples.map((example) => (
                  <li key={example} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="size-4 text-success" />
                    {example}
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
