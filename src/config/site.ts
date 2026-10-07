/**
 * Static, non-secret site configuration.
 * Anything user- or tenant-specific belongs in the database, not here.
 */
export const siteConfig = {
  name: "CreatorFlow AI",
  shortName: "CreatorFlow",
  description:
    "AI-powered content creation for bloggers, YouTubers, social media creators, freelancers, and small businesses.",
  nav: {
    marketing: [
      { label: "Features", href: "/#features" },
      { label: "Who it's for", href: "/#audience" },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;
