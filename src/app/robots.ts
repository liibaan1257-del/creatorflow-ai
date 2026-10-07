import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private app, auth callbacks, APIs and the internal component gallery.
      disallow: ["/dashboard", "/auth/", "/api/", "/reset-password", "/design-system"],
    },
    sitemap: `${publicEnv.appUrl}/sitemap.xml`,
  };
}
