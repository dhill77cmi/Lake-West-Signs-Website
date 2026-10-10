import type { Service, SiteInfo } from "@/content/types";

export function localBusinessJsonLd(site: SiteInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${site.canonicalUrl}/#business`,
    name: site.fullName,
    alternateName: site.name,
    url: site.canonicalUrl,
    telephone: site.phone,
    email: site.email,
    image: `${site.canonicalUrl}/opengraph-image`,
    areaServed: site.areaServed,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postal,
      addressCountry: "US",
    },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    openingHoursSpecification: site.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.open,
      closes: h.close,
    })),
    sameAs: [site.googleReviewsUrl, site.facebookUrl],
  };
}

export function websiteJsonLd(site: SiteInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.canonicalUrl}/#website`,
    name: site.fullName,
    alternateName: site.name,
    url: `${site.canonicalUrl}/`,
  };
}

export function serviceJsonLd(site: SiteInfo, service: Service, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    serviceType: service.name,
    description,
    url: `${site.canonicalUrl}/services/${service.slug}`,
    provider: { "@id": `${site.canonicalUrl}/#business` },
    areaServed: site.areaServed,
  };
}

export function breadcrumbJsonLd(origin: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem", position: index + 1,
      name: item.name, item: new URL(item.path, origin).href,
    })),
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
