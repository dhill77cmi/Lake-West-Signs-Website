import { enableClassicPreview } from "./classic-preview";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { services } from "../content/services";
import { servicePages } from "../content/service-pages";
import { site } from "../content/site";
import { dockGuidance } from "../content/dock-guidance";
import { quoteCopy } from "../content/quote";
import { featuredWork } from "../content/work";

const routes = ["/", ...services.map((service) => `/services/${service.slug}`), "/work", "/about", "/faq", "/contact", "/contact/thanks", "/privacy"];
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

for (const route of routes) {
  test(`${route} returns 200, one h1 and fits at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
    expect(await overflow(page)).toBe(false);
    for (const image of await page.locator("main img").all()) {
      // Decorative slideshow frames replaced CSS backgrounds and remain hidden
      // from assistive technology; content photographs still need useful alt text.
      const decorative = await image.evaluate((node) => Boolean(node.closest('[aria-hidden="true"]')));
      await expect(image).toHaveAttribute("alt", decorative ? /.*/ : /\S/);
      // Site photos live in /work; reviewer avatars on the homepage come from Google.
      expect(await image.getAttribute("data-original-src") ?? await image.getAttribute("src")).toMatch(/^(\/work\/|\/shop-front\.jpg$|\/partners\/lake-west-chamber\.png$|https:\/\/lh3\.googleusercontent\.com\/)/);
    }
  });
}

// UI tests mock only the network boundary; server behavior is covered in quote-delivery.test.ts.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/quote", route => route.fulfill({ status: 200, json: { ok: true } }));
});

test("missing routes show a 404 with the phone and one h1", async ({ page }) => {
  const response = await page.goto("/missing-page");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main").getByRole("link", { name: `Call ${site.phone}` })).toHaveAttribute("href", site.phoneHref);
});

test("gallery filters by service and the native lightbox restores focus", async ({ page }) => {
  await page.goto("/work");
  const opener = page.getByRole("button", { name: /^View photograph:/ }).first();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(opener).toBeFocused();
  await page.getByRole("navigation", { name: "Filter work by service" }).getByRole("link", { name: "Vehicle Wraps & Lettering" }).click();
  await expect(page.getByRole("button", { name: /^View photograph:/ })).toHaveCount(featuredWork.filter((project) => project.service === "vehicles").length);
  await expect(page.getByRole("heading", { name: "Commercial Signage", exact: true })).toHaveCount(0);
  await page.goBack();
  await expect(page.getByRole("button", { name: /^View photograph:/ })).toHaveCount(featuredWork.length);
});

async function choose(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test("the contact form stays short for every service, without overflow", async ({ page }) => {
  await enableClassicPreview(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/contact");
  const form = page.getByRole("form", { name: "Project inquiry" });
  await expect(form.locator('[name="companyWebsite"]')).toBeHidden();
  await expect(form.locator('[name="companyWebsite"]')).toHaveAttribute("tabindex", "-1");
  await expect(form.locator("fieldset")).toHaveCount(0);
  for (const service of services) {
    await choose(page, quoteCopy.labels.service, service.name);
    await expect(form.locator("fieldset")).toHaveCount(0);
    expect(await overflow(page)).toBe(false);
  }
  await choose(page, quoteCopy.labels.service, quoteCopy.notSure);
  await expect(form.locator("fieldset")).toHaveCount(0);
  await choose(page, quoteCopy.labels.contactMethod, "Email");
  await expect(form.getByLabel("Email address", { exact: true })).toBeVisible();
  await expect(form.getByLabel("Phone number", { exact: true })).toHaveCount(0);
  await choose(page, quoteCopy.labels.contactMethod, "Text");
  await expect(form.getByLabel("Phone number", { exact: true })).toBeVisible();
});

test("validation is inline and valid classic submissions post without navigation", async ({ page }) => {
  await enableClassicPreview(page);
  await page.goto("/contact");
  const form = page.getByRole("form", { name: "Project inquiry" });
  const posts: string[] = [];
  // Only this site's own requests count; the embedded Google map posts to its own service.
  page.on("request", (request) => { if (request.method() === "POST" && new URL(request.url()).origin === new URL(page.url()).origin) posts.push(request.url()); });
  await form.getByRole("button", { name: quoteCopy.submit, exact: true }).click();
  const name = form.getByLabel("Name", { exact: true });
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  const errorId = await name.getAttribute("aria-describedby");
  await expect(page.locator(`[id="${errorId}"]`)).toHaveText(quoteCopy.errors.name);
  expect(posts).toEqual([]);
  await name.fill("A Visitor");
  await choose(page, quoteCopy.labels.service, "Custom");
  await choose(page, quoteCopy.labels.contactMethod, "Email");
  await form.getByLabel("Email address", { exact: true }).fill("visitor@example.com");
  await form.getByLabel("Message", { exact: true }).fill("Please discuss a sign for our dock.");
  const file = form.getByLabel(quoteCopy.labels.files, { exact: true });
  await file.setInputFiles({ name: "logo.ai", mimeType: "application/postscript", buffer: Buffer.from("sample design file") });
  await expect(file).toHaveAttribute("aria-invalid", "false");
  await form.getByRole("button", { name: quoteCopy.submit, exact: true }).click();
  await expect(form.getByRole("status").filter({ hasText: "Your message has been sent." })).toBeVisible();
  await expect(page).toHaveURL(/\/contact\?review=1$/);
  expect(posts).toHaveLength(1);
  expect(posts[0]).toContain("/api/quote");
});

test("dock guidance is exact", async ({ page }) => {
  await page.goto("/services/dock-signs");
  await expect(page.getByText(dockGuidance.text, { exact: true })).toBeVisible();
});

test("short forms stay short and service forms start with their service selected", async ({ page }) => {
  await enableClassicPreview(page);
  for (const route of ["/", ...services.map((service) => `/services/${service.slug}`)]) {
    await page.goto(route);
    const form = page.getByRole("form", { name: "Project inquiry" });
    await expect(form.locator("fieldset")).toHaveCount(0);
    await expect(form.getByLabel("Message", { exact: true })).toBeVisible();
    const service = services.find((item) => route.endsWith(item.slug));
    if (service) await expect(form.getByRole("combobox", { name: quoteCopy.labels.service })).toHaveText(service.name);
  }
});

test("service page FAQs show every answer without expanding anything", async ({ page }) => {
  await page.goto("/services/dock-signs");
  const rows = page.locator(".faq-row");
  await expect(rows).toHaveCount(servicePages.residential.faqs.length);
  for (const answer of await rows.locator(".faq-answer p").all()) await expect(answer).toBeVisible();
});

test("all six legacy URLs redirect to the intended pages", async ({ page, request }) => {
  const redirects = { "/index.php": "/", "/about.php": "/about", "/vehicles.php": "/services/vehicle-wraps", "/commercial.php": "/services/commercial-signs", "/residential.php": "/services/dock-signs", "/join.html": "/contact" };
  for (const [from, to] of Object.entries(redirects)) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect([301, 308]).toContain(response.status());
    expect(response.headers().location).toBe(to);
    expect((await page.goto(from))?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(to);
  }
});

test("page accessibility and whole-photo rendering", async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  // /work is audited too, but its square thumbnails are framed on purpose, so the whole-photo check skips it,
  // as it skips the same square tiles in a service page's photo row.
  for (const route of ["/services/dock-signs", "/services/laser-engraving", "/contact", "/work", "/faq"]) {
    await page.goto(route);
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(audit.violations, route).toEqual([]);
    if (route === "/work") continue;
    const photos = await page.locator("main img:not(.photo-rail img)").evaluateAll((images) => images.map((image) => ({ src: image.getAttribute("data-original-src") ?? image.getAttribute("src"), fit: getComputedStyle(image).objectFit, transform: getComputedStyle(image).transform, width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height, expected: Number(image.getAttribute("width")) / Number(image.getAttribute("height")) })));
    for (const photo of photos) {
      expect(photo.fit).not.toBe("cover"); expect(photo.transform).toBe("none");
      expect(photo.width / photo.height).toBeCloseTo(photo.expected, 1);
      expect(photo.src).toMatch(/^\/work\//); // gallery originals or the hero-set derivatives
    }
  }
});
