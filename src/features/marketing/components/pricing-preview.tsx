import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckIcon } from "@/components/ui/icons";
import { Section } from "@/features/marketing/components/section";
import { plans } from "@/features/marketing/content";
import { AUTH_ROUTES } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";

/**
 * Pricing preview. Only the Free plan can be joined today; paid plans are
 * shown without prices or checkout until billing exists.
 */
export function PricingPreview() {
  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      title="Start free. Upgrade when you're ready."
      description="CreatorFlow AI is free during early access. Paid plans are on the way."
    >
      <ul className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const available = plan.status === "available";
          return (
            <li key={plan.name}>
              <Card
                className={cn(
                  "flex h-full flex-col p-6 sm:p-8",
                  plan.featured && "border-primary ring-1 ring-primary",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
                  {available ? <Badge variant="primary">Early access</Badge> : <Badge>Coming soon</Badge>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-6 flex items-baseline gap-1">
                  {plan.price ? (
                    <>
                      <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/ month</span>
                    </>
                  ) : (
                    <span className="text-lg font-medium text-muted-foreground">Pricing announced at launch</span>
                  )}
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <CheckIcon className="mt-0.5 size-4 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {available ? (
                    <Link href={AUTH_ROUTES.signup} className={buttonClasses({ className: "w-full" })}>
                      Start Creating Free
                    </Link>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Coming soon
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
