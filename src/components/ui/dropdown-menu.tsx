"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type DropdownMenuProps = {
  /** Accessible name for the trigger button, e.g. "Account menu". */
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
};

/**
 * Disclosure-style dropdown (button + panel of links/buttons). Closes on
 * outside click, Escape (returning focus to the trigger) and item selection.
 */
export function DropdownMenu({ label, trigger, children, align = "end", className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex cursor-pointer items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-muted"
      >
        {trigger}
      </button>
      <div
        id={panelId}
        hidden={!open}
        // Selecting any link or button inside closes the menu.
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a, button")) setOpen(false);
        }}
        className={cn(
          "absolute top-full z-50 mt-2 w-64 animate-dialog-in rounded-xl border border-border bg-card p-1.5 shadow-overlay",
          align === "end" ? "right-0" : "left-0",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export const dropdownItemClasses =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground";

export function DropdownSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-border" />;
}
