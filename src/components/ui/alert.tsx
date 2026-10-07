import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertProps = {
  variant: "error" | "success";
  children: ReactNode;
};

export function Alert({ variant, children }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        variant === "error"
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
      )}
    >
      {children}
    </div>
  );
}
