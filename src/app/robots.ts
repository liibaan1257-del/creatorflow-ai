import type { MetadataRoute } from "next";
import { APP_ROUTES, AUTH_ROUTES } from "@/lib/auth/redirect";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private app, auth callbacks, APIs and the internal component gallery.
      disallow: [...APP_ROUTES, "/auth/", "/api/", AUTH_ROUTES.resetPassword, "/design-system"],
    },
    sitemap: `${publicEnv.appUrl}/sitemap.xml`,
  };
}
