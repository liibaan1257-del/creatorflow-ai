import { Section } from "@/features/marketing/components/section";
import { steps } from "@/features/marketing/content";

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="From idea to published in three steps"
    >
      <ol className="grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="relative text-center md:text-left">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground shadow-card md:mx-0">
              {index + 1}
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-2 text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
