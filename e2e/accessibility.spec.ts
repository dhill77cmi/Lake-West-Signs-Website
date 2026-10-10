import { enableClassicPreview } from "./classic-preview";
import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page } from "@playwright/test";
import { services } from "../content/services";
import { quoteCopy } from "../content/quote";

const routes = ["/", ...services.map(({ slug }) => `/services/${slug}`), "/work", "/about", "/faq", "/contact", "/contact/thanks", "/privacy", "/missing-page"];

async function audit(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  const results = await new AxeBuilder({ page }).analyze();
  await test.info().attach(name, { body: JSON.stringify({
    url: page.url(), date: new Date().toISOString(), engine: results.testEngine,
    violations: results.violations, incomplete: results.incomplete,
    passes: results.passes.length,
  }, null, 2), contentType: "application/json" });
  expect(results.violations.filter(({ impact }) => impact === "serious" || impact === "critical"), name).toEqual([]);
}

for (const width of [390, 1440]) {
  for (const route of routes) {
    test(`axe ${route} at ${width}px: no serious or critical violations`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      // Audits read final colors, not the mid-fade of the scroll reveal.
      await page.emulateMedia({ reducedMotion: "reduce" });
      const response = await page.goto(route);
      expect(response?.status()).toBe(route === "/missing-page" ? 404 : 200);
      await audit(page, `axe-${width}-${route.replaceAll("/", "-") || "home"}`);
    });
  }
}

test("axe covers the lightbox, expanded FAQ, form errors and selected service", async ({ page }) => {
  await enableClassicPreview(page);
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/work");
  await page.getByRole("button", { name: /^View photograph:/ }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await audit(page, "axe-lightbox");
  await page.keyboard.press("Escape");
  await page.goto("/services/dock-signs");
  await audit(page, "axe-service-faq");
  await page.goto("/contact");
  const form = page.getByRole("form", { name: "Project inquiry" });
  await form.getByRole("button", { name: quoteCopy.submit, exact: true }).click();
  await expect(form.getByLabel("Name", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await audit(page, "axe-form-errors");
  await form.getByRole("combobox", { name: "What do you need?", exact: true }).click();
  await audit(page, "axe-service-options");
  await page.getByRole("option", { name: "Vehicle Wraps & Lettering", exact: true }).click();
  await audit(page, "axe-vehicle-fields");
});
