import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { seoPages } from "@/content/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return Object.keys(seoPages).map((path) => ({ url: `${site.canonicalUrl}${path === "/" ? "" : path}` }));
}
