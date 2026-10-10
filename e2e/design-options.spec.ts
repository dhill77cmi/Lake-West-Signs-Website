import { expect, test } from "@playwright/test";

test("client options live with their sections and preferences survive navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-options/full-screen");
  await expect(page.locator(".design-controls-trigger")).toHaveCount(0);
  await expect(page.locator(".cinema-hero [data-design-options='hero']")).toBeVisible();
  const services = page.locator("#services-lineup [data-design-options='services']");
  await expect(services.getByRole("button")).toHaveCount(3);
  await services.getByRole("button", { name: "Two-row service grid", exact: true }).click();
  await expect(page.locator(".home-services-grid")).toHaveAttribute("data-layout", "row");
  await services.getByRole("button", { name: "Keep service images expanded", exact: true }).click();
  await expect(page.locator(".home-services-grid")).toHaveAttribute("data-expanded", "true");
  await services.getByRole("button", { name: "Rounded service photos", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-service-corners", "square");
  await page.locator("#trusted-by [data-design-options='trusted']").getByRole("button").click();
  await expect(page.locator(".trusted-fade")).toBeVisible();
  // The reveal footer sits behind the page until the visitor reaches its end.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.locator("footer [data-design-options='footer']").getByRole("button").click();
  await expect(page.locator("html")).toHaveAttribute("data-footer", "standard");
  await page.goto("/contact?review=1");
  await expect(page.locator(".quote-preview [data-design-options='quote']")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-footer", "standard");
  await page.goto("/design-options/full-screen");
  await expect(page.locator(".home-services-grid")).toHaveAttribute("data-layout", "row");
  await expect(page.locator(".home-services-grid")).toHaveAttribute("data-expanded", "true");
  await expect(page.locator("html")).toHaveAttribute("data-service-corners", "square");
  await expect(page.locator("#trusted-by [data-design-options='trusted'] button")).toHaveAttribute("aria-pressed", "true");
});

test("hero review controls stay above the headline on a narrow phone", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/design-options/full-screen");
  await page.evaluate(() => document.fonts.ready);
  const controls = page.locator("[data-design-options='hero']");
  await expect(controls).toBeVisible();
  const panel = await controls.boundingBox();
  const heading = await page.locator("h1").boundingBox();
  expect(panel!.y + panel!.height).toBeLessThanOrEqual(heading!.y);
  await expect(controls.getByRole("link", { name: "Switch to half-screen hero" })).toBeVisible();
  await expect(controls.getByRole("button", { name: "Switch to original intro" })).toBeVisible();
});
