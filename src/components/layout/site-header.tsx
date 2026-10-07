import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { AUTH_ROUTES } from "@/lib/auth/redirect";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo compact />
        <div className="flex items-center gap-6">
          <nav aria-label="Main" className="hidden md:block">
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
          <div className="flex items-center gap-2">
            <Link
              href={AUTH_ROUTES.login}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Log in
            </Link>
            <Link href={AUTH_ROUTES.signup} className={buttonClasses({ size: "sm" })}>
              Get started
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}
