/**
 * Static, non-secret site configuration.
 * Anything user- or tenant-specific belongs in the database, not here.
 */
export const siteConfig = {
  name: "CreatorFlow AI",
  shortName: "CreatorFlow",
  tagline: "Create Better Content. Faster.",
  description:
    "AI-powered tools for bloggers, creators, freelancers, and small businesses. Write, design and organise your content in one secure workspace.",
  keywords: [
    "AI content creation",
    "AI writer",
    "AI image generator",
    "blog writing tool",
    "YouTube script generator",
    "social media captions",
    "content workspace",
  ],
  // Static so pages stay prerenderable; update yearly.
  copyrightYear: 2026,
} as const;

export type SiteConfig = typeof siteConfig;
