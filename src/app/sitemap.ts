import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

/** Public, indexable pages only. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicEnv.appUrl;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/signup`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
