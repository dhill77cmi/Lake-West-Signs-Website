import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { indexingRobots } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // Allow crawlers to read preview pages' noindex meta directives.
    rules: { userAgent: "*", allow: "/" },
    ...(indexingRobots().index ? { sitemap: `${site.canonicalUrl}/sitemap.xml` } : {}),
  };
}
