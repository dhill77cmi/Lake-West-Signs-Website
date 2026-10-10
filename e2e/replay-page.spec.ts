import { expect, test } from "@playwright/test";

for (const letters of [true, false]) {
  test(`Replay intro resets completed ${letters ? "letter" : "fade"} reveals on repeated visits down the page`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("lws-scroll-letters", String(value)), letters);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/?review=1&intro=original");
    await page.keyboard.press("Escape");
    const heading = page.getByRole("heading", { name: "What our customers say", exact: true });
    const reveal = async () => {
      await heading.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
      await expect(heading).toHaveCSS("opacity", "1");
      if (letters) await expect(heading.locator(".scroll-letter").last()).toHaveCSS("opacity", "1");
    };
    await reveal();
    await page.evaluate(() => { document.documentElement.dataset.replayTest = "same-document"; });
    const letterCount = await heading.locator(".scroll-letter").count();
    for (let repeat = 0; repeat < 2; repeat++) {
      await page.getByRole("button", { name: "Replay intro", exact: true }).click();
      await expect(page.locator(".cinema-hero")).toHaveAttribute("data-intro", "playing");
      await expect(heading).toHaveCSS("opacity", "0");
      await expect(heading.locator(".scroll-letter")).toHaveCount(letterCount);
      await page.keyboard.press("Escape");
      await expect(heading).toHaveCSS("opacity", "0");
      await reveal();
    }
    expect(await page.evaluate(() => localStorage.getItem("lws-scroll-letters"))).toBe(String(letters));
    await expect(page.locator("html")).toHaveAttribute("data-replay-test", "same-document");
  });
}

test("switching to reduced motion during replay keeps content readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?review=1&intro=original");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Replay intro", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".cinema-hero")).toHaveAttribute("data-intro", "ready");
  for (const heading of await page.locator("[data-scroll-copy] h2").all()) {
    await expect(heading).toHaveCSS("opacity", "1");
    await expect(heading).toHaveCSS("transform", "none");
  }
});
