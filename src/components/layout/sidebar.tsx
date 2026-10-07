"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { MenuIcon } from "@/components/ui/icons";
import { appNav } from "@/config/navigation";
import { AUTH_ROUTES } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="App">
      <ul className="space-y-0.5">
        {appNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
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
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type SidebarProps = {
  /** Rendered at the bottom, e.g. the account menu / log out button. */
  footer?: ReactNode;
};

/** Desktop: fixed left sidebar. Mobile: top bar with a slide-in panel. */
export function Sidebar({ footer }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo href={AUTH_ROUTES.afterLogin} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav />
        </div>
        {footer ? <div className="border-t border-border p-3">{footer}</div> : null}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md lg:hidden">
        <Logo href={AUTH_ROUTES.afterLogin} />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <MenuIcon className="size-5" />
        </Button>
      </header>

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
