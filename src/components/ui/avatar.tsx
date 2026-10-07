import { cn } from "@/lib/utils";

type AvatarProps = {
  /** Shown when there is no image, e.g. "LA". */
  fallback: string;
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = { sm: "size-8 text-xs", md: "size-9 text-sm", lg: "size-12 text-base" } as const;

export function Avatar({ fallback, src, alt = "", size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary",
        sizes[size],
        className,
      )}
    >
      {src ? (
        // User-provided URL from any host; next/image would need every host allow-listed.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span aria-hidden={alt ? undefined : true}>{fallback}</span>
      )}
    </span>
  );
}
