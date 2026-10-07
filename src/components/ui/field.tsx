import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared label / hint / error wrapper for every form control, so Input,
 * Textarea and Select stay consistent and accessible (label association,
 * aria-describedby, aria-invalid).
 */

export type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
};

export function fieldIds(id: string, { hint, error }: Pick<FieldProps, "hint" | "error">) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return {
    hintId,
    errorId,
    describedBy: [hintId, errorId].filter(Boolean).join(" ") || undefined,
  };
}

/** Base styles shared by input, textarea and select. */
export function controlClasses(hasError: boolean, className?: string) {
  return cn(
    "block w-full rounded-lg border bg-card text-sm text-foreground shadow-card transition-colors placeholder:text-muted-foreground/70",
    "focus:border-ring focus:outline-none focus:ring-3 focus:ring-ring/20",
    "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
    hasError ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-input",
    className,
  );
}

type FieldWrapperProps = FieldProps & {
  id: string;
  required?: boolean;
  children: ReactNode;
};

export function Field({ id, label, hint, error, required, children }: FieldWrapperProps) {
  const { hintId, errorId } = fieldIds(id, { hint, error });
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
