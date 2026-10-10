import { test, expect } from "@playwright/test";
import { services } from "../content/services";
import { featuredWork } from "../content/work";

test("every service is a filter, and an empty one explains itself", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/work");
  const filters = page.getByRole("navigation", { name: "Filter work by service" });
  await expect(filters.getByRole("link")).toHaveCount(services.length + 1);
  // All work is one grid with no per-service headings.
  await expect(page.locator(".work-grid .work-tile")).toHaveCount(featuredWork.length);
  const empty = services.find((service) => !featuredWork.some((project) => project.service === service.id));
  if (!empty) return;
  await filters.getByRole("link", { name: empty.name }).click();
  await expect(page.getByRole("heading", { level: 2, name: empty.name })).toBeVisible();
  await expect(page.getByRole("button", { name: /^View photograph:/ })).toHaveCount(0);
  await expect(page.getByText(/No photographs here yet/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Ask us", exact: true })).toHaveAttribute("href", `/contact?service=${empty.id}`);
});

test("lightbox arrows and keys move between photographs and the X closes it", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/work");
  await expect(page.getByRole("link", { name: "Explore this service" })).toHaveCount(0);
  const openers = page.getByRole("button", { name: /^View photograph:/ });
  await openers.first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#lightbox-caption")).toHaveCount(0);
  const shown = () => dialog.getByRole("img").getAttribute("alt");
  const firstAlt = await shown();
  await dialog.getByRole("button", { name: "Next photograph" }).click();
  expect(await shown()).not.toBe(firstAlt);
  await page.keyboard.press("ArrowLeft");
  expect(await shown()).toBe(firstAlt);
  // Stepping back from the first photograph wraps to the last.
  await page.keyboard.press("ArrowLeft");
  expect(await shown()).not.toBe(firstAlt);
  await dialog.getByRole("button", { name: "Next photograph" }).click();
  expect(await shown()).toBe(firstAlt);
  const close = dialog.getByRole("button", { name: "Close", exact: true });
  await expect(close.locator("svg")).toHaveCount(1);
  await expect(close).toHaveText("");
  await close.click();
  await expect(dialog).toBeHidden();
  await expect(openers.first()).toBeFocused();
});
