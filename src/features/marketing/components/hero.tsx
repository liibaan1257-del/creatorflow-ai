import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon, CheckIcon, SparklesIcon } from "@/components/ui/icons";
import { AUTH_ROUTES } from "@/lib/auth/redirect";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      {/* Decorative background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[36rem] max-w-5xl rounded-full bg-primary/15 blur-3xl"
      />
      <Container className="pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
        <Badge variant="primary" className="px-3 py-1">
          <SparklesIcon className="size-3.5" />
          Early access — now open
        </Badge>
        <h1
          id="hero-heading"
          className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
        >
          Create Better Content. <span className="text-primary">Faster.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
          AI-powered tools for bloggers, creators, freelancers and small businesses.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={AUTH_ROUTES.signup}
            className={buttonClasses({ size: "lg", className: "w-full sm:w-auto" })}
          >
            Start Creating Free
            <ArrowRightIcon />
          </Link>
          <Link
            href="#how-it-works"
            className={buttonClasses({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
          >
            See How It Works
          </Link>
        </div>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {["Free account", "No credit card required", "Works on any device"].map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <CheckIcon className="size-4 text-success" />
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
