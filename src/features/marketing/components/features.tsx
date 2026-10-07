import { Card } from "@/components/ui/card";
import { AvailabilityBadge } from "@/features/marketing/components/availability-badge";
import { Section } from "@/features/marketing/components/section";
import { features } from "@/features/marketing/content";

export function Features() {
  return (
    <Section
      id="features"
      eyebrow="Features"
      title="Everything you need to create"
      description="One workspace for writing, visuals and organisation, built for people who publish."
      className="bg-surface"
    >
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ title, description, icon: Icon, status }) => (
          <li key={title}>
            <Card className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="grid size-11 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </div>
                <AvailabilityBadge status={status} />
              </div>
              <h3 className="mt-5 text-base font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
