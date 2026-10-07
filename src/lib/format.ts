const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
const longDateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "long" });
const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const numberFormatter = new Intl.NumberFormat("en");

export function formatDate(value: string | Date, style: "medium" | "long" = "medium"): string {
  return (style === "long" ? longDateFormatter : dateFormatter).format(new Date(value));
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 hours ago", "yesterday", "just now". Server-rendered, so no hydration drift. */
export function formatRelativeTime(value: string | Date, now: Date = new Date()): string {
  const seconds = (new Date(value).getTime() - now.getTime()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormatter.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

/** Up to two initials from a name, falling back to the email's first letter. */
export function initials(name: string | null | undefined, email?: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length) return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
  return (email?.trim()[0] ?? "?").toUpperCase();
}
