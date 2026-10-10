import { test, expect } from "@playwright/test";
import { services } from "../content/services";
import { flowCopy } from "../content/quote-flow";

for (const width of [320, 390, 1440]) {
  test(`approved designs and service headers fit at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("lws-quote-flow", "classic");
      localStorage.setItem("lws-trusted-style", "fade");
      localStorage.setItem("lws-service-grid", "false");
      localStorage.setItem("lws-service-expanded", "true");
      localStorage.setItem("lws-process-placement", "sidebar");
      localStorage.setItem("lws-footer-standard", "true");
    });
    await page.goto("/?intro=swipe");
    await expect(page.locator(".cinema-hero")).toHaveAttribute("data-layout", "split");
    await expect(page.locator(".cinema-hero")).toHaveAttribute("data-intro-variant", "original");
    await expect(page.locator(".intro-card")).toHaveCount(7);
    await expect(page.locator(".trusted-ticker")).toBeVisible();
    await expect(page.locator('[data-design-options]')).toHaveCount(0);
    await expect(page.locator('.cinema-skip, .cinema-replay, .hero-slideshow-controls')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Previous hero photograph|Next hero photograph/ })).toHaveCount(0);
    await expect(page.locator('.home-services-grid')).toHaveAttribute('data-layout', 'grid');
    await expect(page.locator('#quote')).toHaveAttribute('data-process-placement', 'above');
    await expect(page.getByRole("form", { name: flowCopy.formLabel })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`home-${width}.png`), fullPage: true });

    for (const service of services) {
      await page.goto(`/services/${service.slug}`);
      await expect(page.locator('[data-design-options]')).toHaveCount(0);
      await expect(page.locator('main')).not.toContainText('$$$$');
      await page.evaluate(() => document.fonts.ready);
      const photo = await page.locator(".service-header-photo").boundingBox();
      const copy = await page.locator(".service-header-grid > div:first-child").boundingBox();
      if (width < 1024) expect(photo!.y + photo!.height).toBeLessThanOrEqual(copy!.y);
      else {
        expect(copy!.x + copy!.width).toBeLessThanOrEqual(photo!.x);
        expect(Math.abs(photo!.y - copy!.y)).toBeLessThan(2);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await page.screenshot({ path: test.info().outputPath(`${service.slug}-${width}.png`) });
    }
    for (const route of ["about", "contact"]) {
      await page.goto(`/${route}`);
      if (route === "contact") await expect(page.getByRole("form", { name: flowCopy.formLabel })).toBeVisible();
      else await expect(page.locator(".accreditation-example")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await page.screenshot({ path: test.info().outputPath(`${route}-${width}.png`), fullPage: true });
    }
  });
}
