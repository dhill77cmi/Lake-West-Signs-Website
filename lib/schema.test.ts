import { describe, expect, it } from "vitest";
import { site } from "@/content/site";
import { breadcrumbJsonLd, localBusinessJsonLd, serializeJsonLd, serviceJsonLd, websiteJsonLd } from "./schema";
import { services } from "@/content/services";

describe("localBusinessJsonLd", () => {
  const ld = localBusinessJsonLd(site) as Record<string, unknown>;
  const json = JSON.stringify(ld);

  it("is a LocalBusiness named Lake West Signs and Marketing", () => {
    expect(ld["@type"]).toBe("LocalBusiness");
    expect(ld.name).toBe("Lake West Signs and Marketing");
    expect(ld.alternateName).toBe("Lake West Signs");
  });

  it("never declares a parentOrganization", () => {
    expect(json).not.toContain("parentOrganization");
  });

  it("carries phone, postal address, geo and weekday hours", () => {
    expect(ld.telephone).toBe("(573) 374-0148");
    expect(ld.address).toMatchObject({ "@type": "PostalAddress", postalCode: "65079", addressRegion: "MO" });
    expect(ld.geo).toMatchObject({ "@type": "GeoCoordinates", latitude: 38.1755785 });
    const hours = ld.openingHoursSpecification as Array<{ dayOfWeek: string[]; opens: string; closes: string }>;
    expect(hours[0].dayOfWeek).toContain("Monday");
    expect(hours[0].opens).toBe("08:00");
  });

  it("links the Google listing and Facebook via sameAs", () => {
    expect(ld.sameAs).toEqual([site.googleReviewsUrl, site.facebookUrl]);
  });
});

describe("websiteJsonLd", () => {
  it("names the site for Google's site-name display at the homepage URL", () => {
    expect(websiteJsonLd({ ...site, url: "https://preview.vercel.app" })).toMatchObject({
      "@type": "WebSite", name: "Lake West Signs and Marketing", alternateName: "Lake West Signs", url: "https://lakewestsigns.com/",
    });
  });
});

describe("allowed schema only", () => {
  it("publishes no FAQ or review markup", () => {
    for (const value of [localBusinessJsonLd(site), ...services.map((service) => serviceJsonLd(site, service, service.blurb))]) {
      expect(JSON.stringify(value)).not.toMatch(/FAQPage|AggregateRating|Review|ratingValue|reviewCount/);
    }
  });
  it("uses only the confirmed area and the production domain even on previews", () => {
    const ld = localBusinessJsonLd({ ...site, url: "https://preview.vercel.app" });
    expect(ld.url).toBe("https://lakewestsigns.com");
    expect(ld.areaServed).toEqual(["Sunrise Beach", "the west side of the Lake of the Ozarks"]);
    for (const service of services) {
      const item = serviceJsonLd(site, service, service.blurb);
      expect(item.areaServed).toEqual(ld.areaServed);
      expect(item.provider["@id"]).toBe(ld["@id"]);
    }
  });
  it("preserves breadcrumb order and escapes script-breaking characters", () => {
    const ld = breadcrumbJsonLd(site.canonicalUrl, [{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]);
    expect(ld.itemListElement.map((item) => item.position)).toEqual([1, 2]);
    expect(ld.itemListElement[1].item).toBe(`${site.canonicalUrl}/services`);
    const text = { name: "</script><script>alert(1)</script>" };
    expect(serializeJsonLd(text)).not.toContain("<");
    expect(JSON.parse(serializeJsonLd(text))).toEqual(text);
  });
});
