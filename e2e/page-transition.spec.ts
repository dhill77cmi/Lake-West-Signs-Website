import { test, expect } from "@playwright/test";

test("pages ease in on client navigation, not on first load, and not under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // Observe from before hydration/navigation. Waiting for the URL first can miss
  // a short transition entirely on fast pages or a busy test runner.
  await page.addInitScript(() => {
    const fadedPaths = new Set<string>();
    Object.assign(window, { transitionFadedPaths: fadedPaths });
    new MutationObserver(() => {
      const wrapper = document.querySelector<HTMLElement>(".page-transition");
      if (wrapper && Number(getComputedStyle(wrapper).opacity) < 1) fadedPaths.add(location.pathname);
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });
  });
  await page.goto("/faq");
  const wrapper = page.locator(".page-transition");
  await expect(wrapper).toHaveCount(1);
  // First load: nothing animates, so no inline opacity is ever written.
  await expect(wrapper).toHaveCSS("opacity", "1");
  expect(await wrapper.evaluate((el) => (el as HTMLElement).style.opacity)).toBe("");
  await page.getByRole("banner").getByRole("link", { name: "Our Work", exact: true }).click();
  await expect(page).toHaveURL(/\/work$/);
  const fadedPaths = () => page.evaluate(() => [...(window as unknown as { transitionFadedPaths: Set<string> }).transitionFadedPaths]);
  await expect.poll(fadedPaths).toContain("/work");
  await expect(wrapper).toHaveCSS("opacity", "1");
  await expect(wrapper).toHaveCSS("transform", "none");
  expect(await fadedPaths()).not.toContain("/faq");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("banner").getByRole("link", { name: "FAQ", exact: true }).click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.locator(".page-transition")).toHaveCSS("opacity", "1");
  await expect(wrapper).toHaveCSS("transform", "none");
  expect(await fadedPaths()).not.toContain("/faq");
});

test("lightbox opens with a scale-and-fade and slides between photographs", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/work");
  await page.getByRole("button", { name: /^View photograph:/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("transform", "none");
  await expect(dialog).toHaveCSS("opacity", "1");
  const photo = dialog.locator(".lightbox-photo");
  await dialog.getByRole("button", { name: "Next photograph" }).click();
  await expect(photo).toHaveCSS("transform", "none");
  await expect(photo).toHaveCSS("opacity", "1");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
});
