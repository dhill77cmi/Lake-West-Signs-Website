import { readdir } from "node:fs/promises";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { services } from "../content/services";
import { site } from "../content/site";

// Discover public pages independently of the metadata/sitemap registry.
async function pageRoutes(directory = "app", segments: string[] = []): Promise<string[]> {
  const routes: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      // Saved design previews are intentionally noindex; tested separately.
      if (segments.length === 0 && entry.name === "design-options") continue;
      if (entry.name === "[slug]") routes.push(...services.map((service) => `/${[...segments, service.slug].join("/")}`));
      else routes.push(...await pageRoutes(path.join(directory, entry.name), [...segments, entry.name]));
    } else if (entry.name === "page.tsx") routes.push(`/${segments.join("/")}`);
  }
  return routes;
}

test("every route has unique buyer metadata, one canonical, matching breadcrumbs and allowed schema", async ({ page }) => {
  test.setTimeout(120_000);
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const route of await pageRoutes()) {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    const canonical = `${site.canonicalUrl}${route === "/" ? "" : route}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /^https:\/\/lakewestsigns\.com\/opengraph-image/);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    const title = await page.title();
    const description = (await page.locator('meta[name="description"]').getAttribute("content"))!;
    expect(title.length).toBeGreaterThan(site.name.length);
    expect(description.length).toBeGreaterThan(50);
    expect(titles.has(title), route).toBe(false);
    expect(descriptions.has(description), route).toBe(false);
    titles.add(title); descriptions.add(description);

    const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent!)));
    const json = JSON.stringify(schemas);
    expect(json).not.toMatch(/FAQPage|AggregateRating|"Review"|parentOrganization|ratingValue|reviewCount/);
    expect(json).not.toMatch(/Camdenton|Osage Beach|Laurie|Gravois Mills|Greenview|Hurricane Deck|Versailles|Climax Springs|Eldon|Lake Ozark(?!s)/i);
    expect(schemas.filter((schema) => schema["@type"] === "WebSite")).toMatchObject([{ name: site.fullName, url: `${site.canonicalUrl}/` }]);
    const businesses = schemas.filter((schema) => schema["@type"] === "LocalBusiness");
    expect(businesses).toHaveLength(1);
    expect(businesses[0]).toMatchObject({
      name: site.fullName, alternateName: site.name, url: site.canonicalUrl, telephone: site.phone,
      areaServed: ["Sunrise Beach", "the west side of the Lake of the Ozarks"],
      address: { addressLocality: site.address.city, streetAddress: site.address.street, postalCode: site.address.postal },
      geo: { latitude: site.geo.lat, longitude: site.geo.lng },
      sameAs: [site.googleReviewsUrl, site.facebookUrl],
      openingHoursSpecification: [{ dayOfWeek: site.hours[0].days, opens: site.hours[0].open, closes: site.hours[0].close }],
    });
    const service = services.find((service) => route === `/services/${service.slug}`);
    const serviceSchemas = schemas.filter((schema) => schema["@type"] === "Service");
    expect(serviceSchemas).toHaveLength(service ? 1 : 0);
    if (service) expect(serviceSchemas[0]).toMatchObject({ name: service.name, url: canonical, provider: { "@id": businesses[0]["@id"] }, areaServed: businesses[0].areaServed });
    const breadcrumb = schemas.filter((schema) => schema["@type"] === "BreadcrumbList");
    // Service pages and the inquiry thanks page carry breadcrumb data; only the thanks page shows a visible trail.
    expect(breadcrumb).toHaveLength(route === "/contact/thanks" || service ? 1 : 0);
    if (breadcrumb.length) {
      const items = breadcrumb[0].itemListElement;
      expect(items.at(-1).item).toBe(canonical);
      const names = items.map((item: { name: string }) => item.name);
      const trail = page.locator('[aria-label="Breadcrumb"]');
      if (await trail.count()) expect(names).toEqual(await trail.locator("li:not([aria-hidden])").allTextContents());
      else expect(names).toEqual(["Home", service!.name]);
    }
    for (const img of await page.locator("img").all()) {
      const decorative = await img.evaluate((node) => Boolean(node.closest('[aria-hidden="true"]')));
      await expect(img).toHaveAttribute("alt", decorative ? /.*/ : /\S/);
    }
    for (const src of await page.locator("img").evaluateAll((images) => images.map((img) => img.getAttribute("data-original-src") ?? img.getAttribute("src")))) {
      expect(src).not.toMatch(/lakewesttruck\.jpg|resdock\.jpg|jayjeep\.jpg|trailerwrap\.png|bg-37t\.jpg/i);
    }
  }
});

test("sitemap contains every page exactly once on the canonical domain", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect(xml).not.toContain("/design-options/");
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const expected = (await pageRoutes()).map((route) => `${site.canonicalUrl}${route === "/" ? "" : route}`);
  expect(urls.sort()).toEqual(expected.sort());
  expect(new Set(urls).size).toBe(urls.length);
});

test("production is indexable and preview has noindex on every page", async ({ page, request }) => {
  test.setTimeout(120_000);
  for (const route of await pageRoutes()) {
    for (const [origin, directive] of [["http://localhost:8110", "index, follow"], ["http://localhost:8111", "noindex, nofollow"]]) {
      await page.goto(`${origin}${route}`);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", directive);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${site.canonicalUrl}${route === "/" ? "" : route}`);
    }
  }
  const production = await request.get("/robots.txt");
  const preview = await request.get("http://localhost:8111/robots.txt");
  expect(production.status()).toBe(200); expect(preview.status()).toBe(200);
  expect(await production.text()).toContain(`Sitemap: ${site.canonicalUrl}/sitemap.xml`);
  expect(await preview.text()).not.toContain("Sitemap:");
  // A disallow rule would stop crawlers from seeing the preview noindex directive.
  expect(await production.text()).toContain("Allow: /");
  expect(await preview.text()).toContain("Allow: /");
});

test("query parameters retain the page canonical after client navigation", async ({ page }) => {
  await page.goto("/work");
  await page.getByRole("navigation", { name: "Filter work by service" }).getByRole("link", { name: services[2].name }).click();
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${site.canonicalUrl}/work`);
  await page.goto("/contact?service=residential&product=dock#quote");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${site.canonicalUrl}/contact`);
});

test("Open Graph image renders a PNG at the expected sharing size", async ({ request }) => {
  const response = await request.get("/opengraph-image");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  const png = await response.body();
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});
