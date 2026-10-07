import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/ui/container";
import { marketingNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { AUTH_ROUTES } from "@/lib/auth/redirect";

const accountLinks = [
  { label: "Log in", href: AUTH_ROUTES.login },
  { label: "Sign up", href: AUTH_ROUTES.signup },
];

function FooterColumn({ title, links }: { title: string; links: readonly { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">{siteConfig.description}</p>
          </div>
          <FooterColumn title="Product" links={marketingNav} />
          <FooterColumn title="Account" links={accountLinks} />
        </div>
        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            © {siteConfig.copyrightYear} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
