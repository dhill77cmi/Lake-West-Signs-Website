import { mkdir } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { site } from "../content/site";
import { services } from "../content/services";
import { formatHours } from "../lib/format";
import { seoPages } from "../content/seo";

test("the shell exposes the confirmed contact details and keyboard skip link", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(`${site.fullName} | ${seoPages["/"].title}`);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-scroll-behavior", "smooth");
  const footer = page.getByRole("contentinfo");
  for (const fact of [site.address.street, site.address.postal, site.email, formatHours(site.hours[0])]) {
    await expect(footer).toContainText(fact);
  }
  await expect(footer.getByRole("link", { name: site.address.street })).toHaveAttribute("href", site.mapsUrl);
  await expect(footer.getByRole("link", { name: site.email, exact: true })).toHaveAttribute("href", `mailto:${site.email}`);
  await expect(footer.getByRole("link", { name: site.phone, exact: true })).toHaveAttribute("href", site.phoneHref);
  await expect(footer.getByRole("link", { name: "Facebook", exact: true })).toHaveAttribute("href", site.facebookUrl);
  await expect(footer.getByRole("link", { name: "Privacy", exact: true })).toHaveAttribute("href", "/privacy");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
});

test("desktop services support keyboard opening, Escape, outside click and all five destinations", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation", exact: true });
  await expect(page.locator(".cinema-hero")).toHaveAttribute("data-phase", "complete", { timeout: 12000 });
  await expect(nav).toBeVisible();
  const summary = nav.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(nav.locator("details")).toHaveAttribute("open", "");
  for (const service of services) {
    await expect(nav.getByRole("link", { name: service.name, exact: true })).toHaveAttribute("href", `/services/${service.slug}`);
  }
  await page.keyboard.press("Tab");
  await expect(nav.getByRole("link", { name: services[0].name, exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(summary).toBeFocused();
  await expect(nav.locator("details")).not.toHaveAttribute("open");
  await summary.click();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(nav.locator("details")).not.toHaveAttribute("open");
});

test("mobile menu closes for same-page links and remounts after client navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.locator(".mobile-navigation");
  const trigger = menu.locator("summary");
  const nav = page.getByRole("navigation", { name: "Mobile navigation", exact: true });
  await trigger.click();
  await nav.getByRole("link", { name: "Home", exact: true }).click();
  await expect(menu).not.toHaveAttribute("open");
  await trigger.click();
  await nav.getByRole("link", { name: "Our Work", exact: true }).click();
  await expect(menu).not.toHaveAttribute("open");
  await expect(page).toHaveURL(/\/work$/);
  await page.goBack();
  await expect(menu).not.toHaveAttribute("open");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(menu).not.toHaveAttribute("open");
});

for (const width of [320, 390, 400, 768, 1024, 1440]) {
  test(`shell fits ${width}px with visible contact actions and accessible menus`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".cinema-hero")).toHaveAttribute("data-phase", "complete", { timeout: 12000 });
    const header = page.getByRole("banner");
    for (const link of [header.getByRole("link", { name: `Call us at ${site.phone}` }), header.getByRole("link", { name: "Get a quote", exact: true })]) {
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    const quote = header.getByRole("link", { name: "Get a quote", exact: true });
    await expect(quote).toHaveAttribute("href", "/contact");
    await expect(quote).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    // The approved split hero uses a black outline on its white header.
    await expect(quote).toHaveCSS("border-top-color", "rgb(0, 0, 0)");
    if (width >= 1024) {
      const logo = await header.locator(".brand-link").boundingBox();
      const action = await quote.boundingBox();
      expect(logo!.x).toBeLessThanOrEqual(32);
      expect(width - action!.x - action!.width).toBeLessThanOrEqual(33);
      const navigation = await header.locator(".desktop-navigation > *").evaluateAll((elements) => elements.map((element) => {
        const box = element.getBoundingClientRect();
        return { left: box.left, right: box.right };
      }));
      for (let index = 1; index < navigation.length; index++) expect(navigation[index].left - navigation[index - 1].right).toBeGreaterThanOrEqual(12);
    }
    const hasOverflow = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(await hasOverflow()).toBe(false);
    await mkdir("output/playwright", { recursive: true });
    if ([320, 390, 1440].includes(width)) await page.screenshot({ path: `output/playwright/shell-${width}.png`, fullPage: true });
    const trigger = width < 1024 ? page.locator(".mobile-navigation summary") : page.locator(".desktop-navigation summary");
    await trigger.click();
    expect(await hasOverflow()).toBe(false);
    const panel = page.locator("details[open] .menu-panel");
    const panelBox = await panel.boundingBox();
    expect(panelBox!.x).toBeGreaterThanOrEqual(0);
    expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(width);
    await expect(page.locator(".cinema-content")).toHaveCSS("opacity", "1");
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(audit.violations).toEqual([]);
    const smallTargets = await page.locator("header a, header summary, footer a").evaluateAll((elements) => elements
      .filter((element) => element.checkVisibility())
      .map((element) => ({ label: element.textContent, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))
      .filter(({ width: targetWidth, height }) => targetWidth < 44 || height < 44));
    expect(smallTargets).toEqual([]);
  });
}

test("the homepage bar is solid white from the top, so phone browsers tint their top bar white", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => sessionStorage.setItem("lws-hero-intro-seen", "1"));
  await page.goto("/");
  await expect(page.locator(".cinema-hero")).toHaveAttribute("data-intro", "ready");
  await expect(page.locator(".site-header")).toHaveCSS("background-color", "rgb(255, 255, 255)");
});

test("service headers are centered, and so is the hero copy on phones", async ({ page }) => {
  await page.goto("/services/vehicle-wraps");
  await expect(page.locator(".service-header-grid > div").first()).toHaveCSS("text-align", "center");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => sessionStorage.setItem("lws-hero-intro-seen", "1"));
  await page.goto("/");
  const title = (await page.locator(".hero-title").boundingBox())!;
  expect(Math.abs(title.x + title.width / 2 - 195)).toBeLessThan(2);
  await expect(page.locator(".hero-title")).toHaveCSS("text-align", "center");
  await expect(page.locator(".cinema-content .text-lead")).toHaveCSS("text-align", "center");
  await expect(page.locator(".cinema-content .flex").first()).toHaveCSS("justify-content", "center");
});

test("large text and reduced motion preserve usable navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/");
  // Wait for the client listener to attach before changing React-owned markup.
  const trigger = page.locator(".mobile-navigation summary");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".mobile-navigation")).not.toHaveAttribute("open");
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole("banner").getByRole("link", { name: "Get a quote", exact: true })).toBeVisible();
  await trigger.click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation", exact: true })).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(255, 255, 255)");
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});
