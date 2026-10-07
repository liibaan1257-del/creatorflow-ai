import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Placeholder block shown while content loads. Decorative; announce loading on the container. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
  );
}
