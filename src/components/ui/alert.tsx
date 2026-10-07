import type { ReactNode } from "react";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "error";

const styles: Record<AlertVariant, { box: string; Icon: typeof InfoIcon }> = {
  info: { box: "border-primary/20 bg-primary-soft text-foreground [&>svg]:text-primary", Icon: InfoIcon },
  success: { box: "border-success/25 bg-success-soft text-foreground [&>svg]:text-success", Icon: CheckCircleIcon },
  warning: { box: "border-warning/25 bg-warning-soft text-foreground [&>svg]:text-warning", Icon: AlertTriangleIcon },
  error: { box: "border-destructive/25 bg-destructive-soft text-foreground [&>svg]:text-destructive", Icon: AlertCircleIcon },
};

type AlertProps = {
  variant: AlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
};

/** Inline, persistent message (form errors, notices). For transient feedback use toasts. */
export function Alert({ variant, title, children, className }: AlertProps) {
  const { box, Icon } = styles[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg border px-3.5 py-3 text-sm", box, className)}
    >
      <Icon className="mt-0.5 size-4" />
      <div className="space-y-0.5">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={title ? "text-muted-foreground" : undefined}>{children}</div> : null}
      </div>
    </div>
  );
}
