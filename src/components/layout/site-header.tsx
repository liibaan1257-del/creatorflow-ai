import Link from "next/link";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground"
          >
            CF
          </span>
          <span>{siteConfig.name}</span>
        </Link>
        <nav aria-label="Main" className="hidden sm:block">
          <ul className="flex items-center gap-6 text-sm text-muted-foreground">
            {siteConfig.nav.marketing.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
