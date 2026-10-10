import { test, expect } from "@playwright/test";

test("animated copy stays readable in the accessibility tree", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/contact");
  const intro = page.locator("main p").first();
  await expect(intro.locator(".scroll-letter").first()).toBeAttached();
  await expect(intro.locator(".sr-only")).toHaveCount(1);
  expect(await intro.ariaSnapshot()).toContain("Call the shop, come in with an idea");
  const address = page.locator("main address");
  expect(await address.ariaSnapshot()).toContain("35 Valley Rd");
  await expect(page.locator("main form h2")).toHaveCount(1);
  await expect(page.locator("main form h3")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".header-phone")).toHaveAccessibleName(/Call us at/);
  await page.goto("/services/laser-engraving");
  const price = page.locator(".price-value").first();
  expect(await price.ariaSnapshot()).toContain("$8");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".scroll-letter")).toHaveCount(0);
  expect(await price.ariaSnapshot()).toContain("$8");
});

test("device reduced motion still pauses automatic content without footer controls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".trusted-track")).toHaveCSS("transform", "none");
  await expect(page.locator(".trusted-group").nth(1)).toBeHidden();
  await expect(page.locator("[data-hero-moment]")).toHaveAttribute("data-intro", "ready");
  const slide = page.locator(".hero-slideshow");
  const active = await slide.getAttribute("data-active-slide");
  await page.waitForTimeout(3500);
  await expect(slide).toHaveAttribute("data-active-slide", active!);
  await expect(page.locator("footer")).not.toContainText(/Pause automatic motion|Automatic motion paused by your device/);
  await page.goto("/contact");
  await expect(page.locator("footer")).not.toContainText(/Pause automatic motion|Automatic motion paused by your device/);
});
