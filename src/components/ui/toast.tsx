"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircleIcon, CheckCircleIcon, InfoIcon, XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type ToastVariant = "info" | "success" | "error";

export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss; 0 keeps it until closed. Default 5000. */
  duration?: number;
};

type Toast = Required<Omit<ToastOptions, "description">> & {
  id: number;
  description?: string;
};

type ToastContextValue = {
  toast: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const MAX_VISIBLE = 3;

/** Provides `useToast()` and renders the live region that announces toasts. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "info", duration = 5000 }: ToastOptions) => {
      const id = ++nextId.current;
      setToasts((current) =>
        [...current, { id, title, description, variant, duration }].slice(-MAX_VISIBLE),
      );
      return id;
    },
    [],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within <ToastProvider>");
  return context;
}

const icons = { info: InfoIcon, success: CheckCircleIcon, error: AlertCircleIcon } as const;
const iconColors = {
  info: "text-primary",
  success: "text-success",
  error: "text-destructive",
} as const;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const { id, title, description, variant, duration } = toast;
  const Icon = icons[variant];

  useEffect(() => {
    if (duration <= 0) return;
    const timer = window.setTimeout(() => onDismiss(id), duration);
    return () => window.clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-overlay"
    >
      <Icon className={cn("mt-0.5 size-5", iconColors[variant])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="-mt-1 -mr-1 grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <XIcon className="size-3.5" />
        <span className="sr-only">Dismiss notification</span>
      </button>
    </div>
  );
}
