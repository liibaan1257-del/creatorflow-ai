import { ChevronDownIcon } from "@/components/ui/icons";
import { Section } from "@/features/marketing/components/section";
import { faqs } from "@/features/marketing/content";

/** Native <details> accordion: keyboard and screen-reader friendly, no JS. */
export function Faq() {
  return (
    <Section id="faq" eyebrow="FAQ" title="Frequently asked questions" className="bg-surface">
      <div className="mx-auto max-w-3xl divide-y divide-border rounded-xl border border-border bg-card shadow-card">
        {faqs.map((faq) => (
          <details key={faq.question} name="faq" className="group px-5 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-medium [&::-webkit-details-marker]:hidden">
              <h3 className="text-base">{faq.question}</h3>
              <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-5 leading-relaxed text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
