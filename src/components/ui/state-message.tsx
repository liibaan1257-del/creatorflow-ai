import type { ReactNode } from "react";
import { AlertCircleIcon, InboxIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type StateMessageProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  /** Buttons or links, e.g. "Create your first post" or "Try again". */
  action?: ReactNode;
  tone?: "neutral" | "error";
  className?: string;
};

/** Shared layout for empty and error states. */
function StateMessage({ title, description, icon, action, tone = "neutral", className }: StateMessageProps) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 grid size-12 place-items-center rounded-full [&_svg]:size-6",
          tone === "error" ? "bg-destructive-soft text-destructive" : "bg-primary-soft text-primary",
        )}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-pretty text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

type PublicStateProps = Omit<StateMessageProps, "tone">;

export function EmptyState({ icon = <InboxIcon />, ...props }: PublicStateProps) {
  return <StateMessage icon={icon} {...props} />;
}

export function ErrorState({
  icon = <AlertCircleIcon />,
  title = "Something went wrong",
  ...props
}: Partial<PublicStateProps>) {
  return <StateMessage tone="error" icon={icon} title={title} {...props} />;
}
