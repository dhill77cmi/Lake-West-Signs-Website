import { test, expect } from "@playwright/test";
import { faqGroups } from "../content/faq";

test("FAQ shows every question grouped by category with a working index", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/faq");
  const index = page.getByRole("navigation", { name: "Question categories" });
  await expect(index.getByRole("link")).toHaveCount(faqGroups.length);
  const questions = faqGroups.reduce((count, group) => count + group.items.length, 0);
  await expect(page.locator(".faq-question")).toHaveCount(questions);
  // Answers are always visible: nothing to expand.
  await expect(page.locator('[data-slot="accordion-trigger"]')).toHaveCount(0);
  await expect(page.locator(".faq-answer").first()).toBeVisible();
  await index.getByRole("link", { name: "Dock signs" }).click();
  await expect(page).toHaveURL(/#faq-dock$/);
  const dock = page.locator("#faq-dock");
  // Anchors land below the sticky header: html scroll-padding plus the id scroll-margin, 9rem each.
  await expect.poll(async () => (await dock.boundingBox())!.y).toBeLessThan(300);
  await expect(dock.getByRole("heading", { level: 3 })).toHaveCount(2);
  // The category at the middle of the screen carries the underline and aria-current.
  await expect(index.getByRole("link", { name: "Dock signs" })).toHaveAttribute("aria-current", "location");
  await expect(index.getByRole("link", { name: "Quotes and pricing" })).not.toHaveAttribute("aria-current", "location");
  await expect(index.getByRole("link", { name: "Dock signs" }).locator(".faq-index-underline")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await expect(page.locator('[aria-label="Breadcrumb"]')).toHaveCount(0);
  await expect(page.locator("h1")).toHaveCSS("text-align", "center");
});

test("the FAQ's ask button opens the contact form with General inquiry selected", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/faq");
  await expect(page.getByText("Have a question you don’t see here?")).toBeVisible();
  const ask = page.getByRole("link", { name: "Ask us", exact: true });
  await expect(ask).toHaveCSS("background-color", "rgb(17, 117, 188)");
  await ask.click();
  await expect(page).toHaveURL(/\/contact\?service=general$/);
  await expect(page.locator(".quote-flow")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "What would you like to know?", exact: true })).toBeVisible();
});

test("FAQ index scrolls sideways on phones and lists vertically on desktop", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/faq");
  const links = await page.locator(".faq-index-link").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().top));
  expect(new Set(links.map(Math.round)).size).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  const stacked = await page.locator(".faq-index-link").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().top));
  expect(new Set(stacked.map(Math.round)).size).toBe(stacked.length);
});
