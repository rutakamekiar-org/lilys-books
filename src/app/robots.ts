import type { MetadataRoute } from "next";
import { resolveSiteBaseUrl } from "@/lib/site.server";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = resolveSiteBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/*?v=", "/*?v%3D"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
