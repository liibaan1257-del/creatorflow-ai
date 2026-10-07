"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/layout/logo";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { MenuIcon } from "@/components/ui/icons";
import { AUTH_ROUTES } from "@/lib/auth/redirect";
import type { NavItem } from "@/types";

/** Hamburger menu for small screens; reuses Dialog as a slide-in panel. */
export function MobileNav({ items }: { items: readonly NavItem[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon className="size-5" />
      </Button>
      <Dialog open={open} onClose={close} title="Menu" hideTitle placement="left">
        <div className="mb-6">
          <Logo />
        </div>
        <nav aria-label="Mobile">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 grid gap-2 border-t border-border pt-6">
          <Link href={AUTH_ROUTES.login} onClick={close} className={buttonClasses({ variant: "outline" })}>
            Log in
          </Link>
          <Link href={AUTH_ROUTES.signup} onClick={close} className={buttonClasses()}>
            Get started
          </Link>
        </div>
      </Dialog>
    </>
  );
}
