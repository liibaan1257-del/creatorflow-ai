"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Action buttons, rendered right-aligned at the bottom. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** "center" for modals, "left" for a slide-in panel (e.g. mobile navigation). */
  placement?: "center" | "left";
  /** Visually hide the title (still announced to screen readers). */
  hideTitle?: boolean;
  className?: string;
};

const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" } as const;

/**
 * Accessible modal built on the native <dialog> element: the browser handles
 * focus trapping, Escape to close, the inert background and the top layer.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  placement = "center",
  hideTitle = false,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Fires for Escape and for programmatic close; keeps parent state in sync.
      onClose={onClose}
      // A click on the dialog element itself (not its content) is a backdrop click.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "bg-transparent p-0 text-foreground backdrop:bg-overlay backdrop:backdrop-blur-[2px]",
        placement === "center"
          ? cn("m-auto w-[calc(100%-2rem)]", sizes[size])
          : "m-0 h-dvh max-h-none w-72 max-w-[85vw]",
      )}
    >
      {/* Content mounts only while open: keeps closed dialogs (e.g. the mobile
          menu) out of the server HTML and its heading outline. */}
      {open ? (
        <div
          className={cn(
            "flex max-h-[inherit] flex-col bg-card shadow-overlay",
            placement === "center"
              ? "animate-dialog-in rounded-xl border border-border"
              : "h-full border-r border-border",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
            <div className={cn("space-y-1", hideTitle && "sr-only")}>
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mt-1 -mr-1 ml-auto grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </button>
          </div>
          {children ? <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div> : null}
          {footer ? (
            <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
