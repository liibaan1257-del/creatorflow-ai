type ClassValue = string | false | null | undefined;

/** Joins conditional class names. Kept dependency-free on purpose. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
