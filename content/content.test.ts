import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { faqGroups } from "./faq";

const faqs = faqGroups.flatMap((group) => group.items);
import { services } from "./services";
import { site } from "./site";
import { testimonials } from "./testimonials";
import { featuredWork, photosFor, work } from "./work";
import { home } from "./pages";

describe("work", () => {
  it("has unique slugs", () => {
    const slugs = work.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every project has title, alt, caption and a real image file under public/", () => {
    for (const p of work) {
      expect(p.title, p.slug).not.toBe("");
      expect(p.alt, p.slug).not.toBe("");
      expect(p.caption, p.slug).not.toBe("");
      expect(p.image.width, p.slug).toBeGreaterThan(0);
      expect(p.image.height, p.slug).toBeGreaterThan(0);
      expect(existsSync(path.join(process.cwd(), "public", p.image.src)), p.image.src).toBe(true);
    }
  });

  it("features at least 10 projects (the owner chose to show every approved photograph)", () => {
    expect(featuredWork.length).toBeGreaterThanOrEqual(10);
  });

  it("never features the photos that show the parent company, an AI render or a customer's face", () => {
    const slugs = [...featuredWork.map((p) => p.slug), ...services.flatMap((s) => s.photos)];
    // bg-37t shows the parent company's logo on the truck's rear quarter panel — caught in Run 2.
    for (const banned of ["lakewesttruck", "resdock", "jayjeep", "trailerwrap", "bg-37t"]) expect(slugs, banned).not.toContain(banned);
  });

  it("Home's first six featured projects mix categories (not a single category)", () => {
    const firstSix = featuredWork.slice(0, 6).map((p) => p.service);
    expect(firstSix).toContain("commercial");
    expect(firstSix).toContain("residential");
  });

  it("photosFor returns up to n projects of one service", () => {
    const v = photosFor("vehicles", 2);
    expect(v).toHaveLength(2);
    expect(v.every((p) => p.service === "vehicles")).toBe(true);
    expect(photosFor("engraving")).toHaveLength(2); // the engraved wood slice and pumpkin from the shop’s Facebook page
  });
});

describe("site", () => {
  it("phoneHref is a tel: link with digits only", () => {
    expect(site.phoneHref).toMatch(/^tel:\+1\d{10}$/);
  });
  it("has weekday hours", () => {
    expect(site.hours[0].days).toEqual(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  });

  it("carries the confirmed contact facts (client checklist, 11 Sep 2026)", () => {
    expect(site.name).toBe("Lake West Signs");
    expect(site.email).toBe("lakewestsigns1@yahoo.com");
    expect(site.founded).toBe(2001);
    expect(site.hoursNote).toMatch(/appointment/i);
  });

  it("knows how many Google reviews to cite", () => {
    expect(site.googleReviewCount).toBeGreaterThan(0);
  });
});

describe("services", () => {
  it("covers the five ids exactly once, in page order", () => {
    expect(services.map((s) => s.id)).toEqual(["commercial", "residential", "vehicles", "engraving", "print"]);
  });

  it("inline photo slugs resolve to work records", () => {
    const slugs = new Set(featuredWork.map((p) => p.slug));
    for (const s of services) for (const slug of s.photos) expect(slugs.has(slug), `${s.id}:${slug}`).toBe(true);
  });

  it("prices are positive and ordered", () => {
    for (const s of services) for (const p of s.prices ?? []) {
      expect(p.from, `${s.id}:${p.label}`).toBeGreaterThan(0);
      if (p.to) expect(p.to, `${s.id}:${p.label}`).toBeGreaterThan(p.from);
    }
  });

  it("every service has a one-line home offer", () => {
    for (const s of services) {
      expect(s.homeLine, s.id).toMatch(/\S/);
      expect(s.homeLine, s.id).not.toMatch(/\$/);
      if (s.homePriceLabel) expect(s.prices?.some((price) => price.label === s.homePriceLabel), s.id).toBe(true);
    }
  });

  it("every service has the blueprint URL slug", () => {
    const want = {
      commercial: "commercial-signs",
      residential: "dock-signs",
      vehicles: "vehicle-wraps",
      engraving: "laser-engraving",
      print: "print-and-promo",
    } as const;
    for (const s of services) expect(s.slug, s.id).toBe(want[s.id]);
    expect(new Set(services.map((s) => s.slug)).size).toBe(services.length);
  });
});

it("has at least six FAQs and four testimonials", () => {
  expect(faqs.length).toBeGreaterThanOrEqual(6);
  expect(testimonials.length).toBeGreaterThanOrEqual(4);
});
