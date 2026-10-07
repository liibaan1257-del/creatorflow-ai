import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { AUTH_ROUTES } from "@/lib/auth/redirect";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="py-20 sm:py-28">
      <Container>
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground shadow-overlay sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl"
          />
          <h2 id="final-cta-heading" className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Ready to create better content, faster?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">
            Join early access today. It&apos;s free, and your workspace is ready in under a minute.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {/* Variants are used as-is: mixing color utilities with a
                variant's own colors would conflict without a class merger. */}
            <Link
              href={AUTH_ROUTES.signup}
              className={buttonClasses({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
            >
              Start Creating Free
              <ArrowRightIcon />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-lg px-6 font-medium underline-offset-4 hover:underline"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
