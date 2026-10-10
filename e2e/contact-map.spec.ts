import { test, expect } from "@playwright/test";
import { site } from "../content/site";

test("contact page opens on the inquiry section with a Google map and plain-text contact links", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/contact");
  await expect(page.locator("h1")).toHaveText("Let’s talk about your project");
  await expect(page.locator('[aria-label="Breadcrumb"]')).toHaveCount(0);
  const map = page.frameLocator(`iframe[title="Map of ${site.name}"]`);
  await expect(page.locator(`iframe[title="Map of ${site.name}"]`)).toHaveAttribute("src", site.mapsEmbedUrl);
  await expect(map.locator("body")).toBeAttached({ timeout: 15000 });
  const aside = page.locator(".contact-aside");
  await expect(aside.getByRole("link", { name: site.phone, exact: true })).toHaveAttribute("href", site.phoneHref);
  await expect(aside.getByRole("button", { name: /^Call / })).toHaveCount(0);
  await expect(aside.getByRole("link", { name: /Valley Rd/ })).toHaveAttribute("href", site.mapsUrl);
  await expect(aside.getByRole("link", { name: "Directions to the shop" })).toHaveCount(0);
  await expect(aside.getByText(site.hoursNote)).toHaveCount(0);
  await expect(page.locator("main").getByText(/Quotes are free/)).toHaveCount(0);
  await expect(page.locator("#quote")).not.toHaveCSS("background-color", "rgb(241, 245, 248)");
  const phone = aside.getByRole("link", { name: site.phone, exact: true });
  await expect(phone).toHaveCSS("text-decoration-line", "none");
  await phone.hover();
  await expect(phone).toHaveCSS("text-decoration-line", "underline");
});

test("contact page copy reveals on load without scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/contact");
  await expect(page.locator("[data-scroll-copy]")).toHaveCount(1);
  const heading = page.locator("h1");
  await expect(heading).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-scroll-copy] form")).toHaveCSS("opacity", "1");
  await expect(page.locator(".shop-map-frame")).toHaveCSS("opacity", "1");
});

test("Home is the first link in the desktop bar and the footer", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/contact");
  await expect(page.locator(".desktop-navigation > a").first()).toHaveText("Home");
  await expect(page.getByRole("navigation", { name: "Footer navigation" }).getByRole("link").first()).toHaveText("Home");
});
