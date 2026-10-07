import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  /** Show only the mark on very narrow screens (e.g. crowded headers). */
  compact?: boolean;
};

export function Logo({ href = "/", compact = false }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={siteConfig.name}
      className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight"
    >
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground"
      >
        CF
      </span>
      <span className={cn("whitespace-nowrap", compact && "hidden min-[400px]:inline")}>
        {siteConfig.name}
      </span>
    </Link>
  );
}
