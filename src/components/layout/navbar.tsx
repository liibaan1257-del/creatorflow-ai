import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { marketingNav } from "@/config/navigation";
import { AUTH_ROUTES } from "@/lib/auth/redirect";

/** Public site navbar: sticky, translucent, with a slide-in menu on mobile. */
export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo compact />
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {marketingNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={buttonClasses({ variant: "ghost", size: "sm" })}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={AUTH_ROUTES.login}
            className={buttonClasses({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}
          >
            Log in
          </Link>
          <Link href={AUTH_ROUTES.signup} className={buttonClasses({ size: "sm" })}>
            Get started
          </Link>
          <MobileNav items={marketingNav} />
        </div>
      </Container>
    </header>
  );
}
