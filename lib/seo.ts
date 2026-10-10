import type { Metadata } from "next";
import { site } from "@/content/site";
import { openGraphCopy, seoPages } from "@/content/seo";
import { isProductionUrl } from "./site-url";

export function indexingRobots(resolvedUrl = site.url) {
  const index = isProductionUrl(resolvedUrl, site.canonicalUrl);
  return { index, follow: index };
}

export function pageMetadata(path: string): Metadata {
  const { title, description } = seoPages[path];
  const url = `${site.canonicalUrl}${path === "/" ? "" : path}`;
  // The homepage leads with the business name so search results show it first.
  const fullTitle = path === "/" ? `${site.fullName} | ${title}` : `${title} | ${site.fullName}`;
  const images = [{ url: `${site.canonicalUrl}/opengraph-image`, width: 1200, height: 630, alt: openGraphCopy.alt }];
  return {
    title: { absolute: fullTitle }, description,
    alternates: { canonical: url },
    openGraph: { title: fullTitle, description, url, siteName: site.fullName, locale: "en_US", type: "website", images },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
  };
}
