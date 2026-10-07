"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { MenuIcon } from "@/components/ui/icons";
import { appNav } from "@/config/navigation";
import { AUTH_ROUTES } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavLinksProps = { pathname: string | null; onNavigate?: () => void };

function NavLinks({ pathname, onNavigate }: NavLinksProps) {
  return (
    <nav aria-label="App">
      <ul className="space-y-0.5">
        {appNav.map(({ href, label, icon: Icon, comingSoon }) => {
          const active = pathname !== null && isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="flex-1">{label}</span>
                {comingSoon ? <Badge className="text-[10px]">Soon</Badge> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ActiveNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return <NavLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

/**
 * App navigation with the current section highlighted. On dynamic routes the
 * URL is request data, so the highlight streams in: the static shell renders
 * the same links without it.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavLinks pathname={null} onNavigate={onNavigate} />}>
      <ActiveNavLinks onNavigate={onNavigate} />
    </Suspense>
  );
}

/** Fixed left sidebar on large screens. */
export function DesktopSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo href={AUTH_ROUTES.afterLogin} />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav />
      </div>
    </aside>
  );
}

/** Hamburger + slide-in navigation for small screens. */
export function MobileNavButton({ footer }: { footer?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="-ml-2 lg:hidden"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon className="size-5" />
      </Button>
      <Dialog open={open} onClose={close} title="Navigation" hideTitle placement="left">
        <div className="flex h-full flex-col">
          <div className="mb-6">
            <Logo href={AUTH_ROUTES.afterLogin} />
          </div>
          <div className="flex-1">
            <SidebarNav onNavigate={close} />
          </div>
          {footer ? <div className="mt-6 border-t border-border pt-4">{footer}</div> : null}
        </div>
      </Dialog>
    </>
  );
}
