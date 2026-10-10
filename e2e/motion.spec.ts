import { test, expect, type Locator } from "@playwright/test";

async function expectSettled(element: Locator) {
  await expect(element).toBeVisible();
  await expect(element).toHaveCSS("opacity", "1");
  await expect(element).toHaveCSS("transform", "none");
}

test("hero is readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://localhost:8110/");
  await expectSettled(page.locator("[data-hero-moment]"));
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator('[data-hero-moment] a[href="/contact"]')).toBeVisible();
  await context.close();
});

test("reduced motion leaves hero, press, menu and lightbox in usable end states", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const child of await page.locator("[data-hero-moment] > .cinema-media, [data-hero-moment] > .cinema-content").all()) await expectSettled(child);
  const action = page.locator('[data-hero-moment] a[href="/contact"]');
  await action.hover(); await page.mouse.down();
  await expectSettled(action);
  await page.mouse.move(0, 0); await page.mouse.up();
  const summary = page.locator(".mobile-navigation summary");
  await summary.click();
  await expectSettled(page.locator(".mobile-panel"));
  await page.keyboard.press("Escape");
  await expect(summary).toBeFocused();
  await summary.click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Our Work" }).click();
  await expect(page.locator(".mobile-navigation")).not.toHaveAttribute("open");
  const opener = page.getByRole("button", { name: /^View photograph:/ }).first();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expectSettled(dialog);
  await expectSettled(dialog.getByRole("img"));
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await opener.click(); await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
});

test("motion preference changes finish an active press and disclosure without replaying the hero", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const action = page.locator('[data-hero-moment] a[href="/contact"]');
  await action.hover(); await page.mouse.down();
  await expect(action).not.toHaveCSS("transform", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expectSettled(action);
  await page.mouse.move(0, 0); await page.mouse.up();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const child of await page.locator("[data-hero-moment] > .cinema-media, [data-hero-moment] > .cinema-content").all()) await expectSettled(child);
  await page.goto("/work");
  // Lengthen the test transition to switch preference deterministically mid-flight.
  await page.locator("dialog").evaluate((dialog) => (dialog as HTMLElement).style.setProperty("--duration-disclosure", "2000ms"));
  const opener = page.getByRole("button", { name: /^View photograph:/ }).first();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expectSettled(dialog);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("photographs stay whole on hover and after closing and reopening the lightbox", async ({ page }) => {
  await page.goto("/work");
  const opener = page.getByRole("button", { name: /^View photograph:/ }).first();
  const photo = opener.getByRole("img");
  await opener.scrollIntoViewIfNeeded();
  await expectSettled(opener); // the tile itself carries the scroll reveal; measure once it has landed
  const before = await photo.boundingBox();
  await opener.hover();
  await expectSettled(opener);
  await expectSettled(photo);
  expect(await photo.boundingBox()).toEqual(before);
  for (let index = 0; index < 2; index++) {
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expectSettled(dialog);
    await expectSettled(dialog.getByRole("img"));
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(opener).toBeFocused();
  }
});

test("rapid menu toggles and route changes leave no stuck disclosure", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const summary = page.locator(".mobile-navigation summary");
  await summary.click(); await summary.click(); await summary.click();
  await expectSettled(page.locator(".mobile-panel"));
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Our Work" }).click();
  await expect(page).toHaveURL(/\/work$/);
  await page.goBack();
  await expect(page.locator(".mobile-navigation")).not.toHaveAttribute("open");
  await summary.click();
  await expectSettled(page.locator(".mobile-panel"));
  await page.keyboard.press("Escape");
  await expect(summary).toBeFocused();
});

test("twenty-photo intro can be skipped and replayed into the half-screen hero", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/design-options/half-screen");
  const hero = page.locator(".cinema-hero");
  await expect(hero).toHaveAttribute("data-intro", "playing");
  await expect(page.locator(".intro-card:not(.intro-loop-copy)")).toHaveCount(20);
  await expect(page.locator(".cinema-hero video")).toHaveCount(0);
  const bounds = await hero.boundingBox();
  expect(bounds!.y).toBe(0);
  expect(bounds!.height).toBeGreaterThanOrEqual(page.viewportSize()!.height);
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(hero).toHaveAttribute("data-intro", "ready");
  await expect(page.locator('[data-hero-moment] a[href="/contact"]')).toBeVisible();
  await expect(page.locator(".site-header")).toBeVisible();
  await page.getByRole("button", { name: "Replay intro" }).click();
  await expect(hero).toHaveAttribute("data-intro", "playing");
  await expect(hero).toHaveAttribute("data-intro", "ready", { timeout: 12000 });
  await expect(page.locator(".photo-intro")).toBeHidden();
  await expect(page.getByRole("slider", { name: "Choose hero photograph" })).toHaveAttribute("max", "20");
  await expect.poll(() => page.locator(".cinema-media").evaluate((element) => (element as HTMLElement).style.width)).toBe("");
  const visual = await page.locator(".cinema-media").boundingBox();
  expect(Math.round(visual!.width)).toBe(Math.round(bounds!.width / 2));
  const copy = await page.locator(".cinema-content").boundingBox();
  expect(copy!.x + copy!.width).toBeLessThanOrEqual(visual!.x + 1);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileVisual = await page.locator(".cinema-media").boundingBox();
  const heading = await page.locator("h1").boundingBox();
  expect(heading!.y).toBeGreaterThanOrEqual(mobileVisual!.y + mobileVisual!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("first visit holds the intro's blank frame until scripts take over, then fails open", async ({ page }) => {
  // Blocked scripts leave the page exactly as served, before the intro could hide anything.
  await page.route(/\/_next\/static\/.*\.js(\?|$)/, (route) => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".photo-intro")).toBeVisible();
  for (const element of [page.locator(".cinema-content"), page.locator(".site-header")]) await expect(element).toHaveCSS("visibility", "hidden");
  // If scripts never run, the hero still appears.
  await expect(page.locator(".cinema-content")).toHaveCSS("visibility", "visible", { timeout: 8000 });
  await expect(page.locator(".site-header")).toHaveCSS("visibility", "visible");
});

test("returning visitors see the hero at once", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("lws-hero-intro-seen", "1"));
  await page.route(/\/_next\/static\/.*\.js(\?|$)/, (route) => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".cinema-content")).toHaveCSS("visibility", "visible");
  await expect(page.locator(".photo-intro")).toBeHidden();
});

test("public hero cycles without intro or slideshow controls", async ({ page }) => {
  await page.goto("/");
  const slideshow = page.locator(".hero-slideshow");
  await expect(page.locator(".cinema-hero")).toHaveAttribute("data-phase", "complete", { timeout: 12000 });
  await expect(slideshow).toBeVisible({ timeout: 12000 });
  await expect(slideshow).toHaveAttribute("data-active-slide", "1", { timeout: 8000 });
  await expect(page.locator('.cinema-hero button, .hero-slideshow-controls')).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Choose hero photograph" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Previous hero photograph|Next hero photograph|Skip intro/ })).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: /Pause slideshow|Play slideshow/ })).toHaveCount(0);
});

for (const option of ["full-screen", "half-screen"]) {
  test(`saved ${option} design renders its intended layout`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/design-options/${option}`);
    const hero = page.locator(".cinema-hero");
    await expect(hero.getByRole("heading", { level: 1 })).toHaveText("Signs that get you seen.");
    await expect(hero.getByRole("link", { name: "Get a quote", exact: true })).toHaveAttribute("href", "/contact");
    await expect(hero.getByRole("link", { name: /Google/ })).toHaveCount(0);
    await expect(page.getByRole("slider", { name: "Choose hero photograph" })).toHaveAttribute("max", "20");
    await expect(hero).toHaveAttribute("data-layout", option === "full-screen" ? "full" : "split");
    const root = await hero.boundingBox();
    const media = await page.locator(".cinema-media").boundingBox();
    expect(Math.round(media!.width)).toBe(Math.round(root!.width * (option === "full-screen" ? 1 : 0.5)));
    await page.getByRole("slider", { name: "Choose hero photograph" }).fill("4");
    await expect(page.locator(".hero-slideshow")).toHaveAttribute("data-active-slide", "3");
    await expect(page.locator('[data-hero-moment] a[href="/contact"]')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
}

test("full-screen navbar fades with scroll and resets on route change", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-options/full-screen");
  const header = page.locator(".site-header");
  await expect(header).toHaveCSS("background-color", "rgba(255, 255, 255, 0)");
  const height = await page.locator(".cinema-hero").evaluate(el => (el as HTMLElement).offsetHeight);
  const headerBottom = await header.evaluate(el => el.getBoundingClientRect().bottom);
  const fadeDistance = height - headerBottom;
  await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), fadeDistance / 2);
  await expect(header).toHaveCSS("background-color", "rgba(255, 255, 255, 0)");
  await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), fadeDistance * 0.85);
  await expect.poll(() => header.evaluate(el => parseFloat(getComputedStyle(el).getPropertyValue("--hero-nav-opacity")))).toBeGreaterThan(0.4);
  expect(await header.evaluate(el => parseFloat(getComputedStyle(el).getPropertyValue("--hero-nav-opacity")))).toBeLessThan(0.6);
  await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), fadeDistance - 20);
  expect(await header.evaluate(el => parseFloat(getComputedStyle(el).getPropertyValue("--hero-nav-opacity")))).toBeLessThan(1);
  await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), Math.ceil(fadeDistance));
  await expect(header).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(header).toHaveCSS("background-color", "rgba(255, 255, 255, 0)");
  await header.getByRole("link", { name: "Our Work", exact: true }).click();
  await expect(header).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect.poll(() => header.evaluate(el => (el as HTMLElement).style.getPropertyValue("--hero-nav-opacity"))).toBe("");
});

test("intro plays once per session and explicit replay stays available", async ({ page }) => {
  await page.goto("/design-options/full-screen");
  const hero = page.locator('.cinema-hero');
  await expect(hero).toHaveAttribute('data-intro', 'playing');
  await page.getByRole('button', { name: 'Skip intro', exact: true }).click();
  await page.goto('/faq');
  await page.goto('/design-options/half-screen');
  await expect(hero).toHaveAttribute('data-intro', 'ready');
  await page.reload();
  await expect(hero).toHaveAttribute('data-intro', 'ready');
  await page.getByRole('button', { name: /Replay intro/ }).click();
  await expect(hero).toHaveAttribute('data-intro', 'playing');
});

test("local design switch opens both saved hero options", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-options/full-screen");
  await expect(page.locator(".cinema-hero")).toHaveAttribute("data-layout", "full");
  await page.getByRole("link", { name: "Switch to half-screen hero" }).click();
  await expect(page).toHaveURL(/\/design-options\/half-screen$/);
  await expect(page.locator(".cinema-hero")).toHaveAttribute("data-layout", "split");
  await page.getByRole("link", { name: "Switch to full-screen hero" }).click();
  await expect(page).toHaveURL(/\/design-options\/full-screen$/);
  await expect(page.locator(".cinema-hero")).toHaveAttribute("data-layout", "full");
});

test("intro switch replays original and swipe versions and preserves selection across layouts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/design-options/half-screen");
  await page.getByRole("button", { name: "Skip intro", exact: true }).click();
  await page.getByRole("button", { name: "Switch to original intro", exact: true }).click();
  await expect(page.locator(".cinema-hero")).toHaveAttribute("data-intro-variant", "original");
  await expect(page.locator(".intro-card:not(.intro-loop-copy)")).toHaveCount(7);
  await expect(page.locator(".cinema-hero")).toHaveAttribute("data-intro", "playing");
  await page.getByRole("button", { name: "Skip intro", exact: true }).click();
  await page.getByRole("link", { name: "Switch to full-screen hero" }).click();
  await expect(page.locator(".cinema-hero")).toHaveAttribute("data-intro-variant", "original");
  await page.getByRole("button", { name: "Skip intro", exact: true }).click();
  await page.getByRole("button", { name: "Switch to swipe intro", exact: true }).click();
  await expect(page.locator(".cinema-hero")).toHaveAttribute("data-intro-variant", "swipe");
  await expect(page.locator(".intro-card:not(.intro-loop-copy)")).toHaveCount(20);
});


test("header phone rings on hover and settles on exit and reduced motion", async ({ page }) => {
  await page.goto("/faq");
  const phone = page.locator('.header-phone');
  const icon = phone.locator('svg');
  await phone.hover();
  const rotations = await icon.evaluate(el => new Promise<number[]>(resolve => {
    const values: number[] = [];
    const start = performance.now();
    const sample = () => {
      const matrix = new DOMMatrix(getComputedStyle(el).transform);
      values.push(Math.atan2(matrix.b, matrix.a) * 180 / Math.PI);
      if (performance.now() - start > 450) resolve(values);
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  expect(Math.max(...rotations)).toBeGreaterThan(5);
  expect(Math.min(...rotations)).toBeLessThan(-5);
  await page.mouse.move(720, 640); // blank page, clear of the open menu
  await expect(icon).toHaveCSS('transform', 'none');
  await phone.hover();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(icon).toHaveCSS('transform', 'none');
  await page.mouse.move(720, 640); // blank page, clear of the open menu
  await phone.hover();
  await expect(icon).toHaveCSS('transform', 'none');
});

test("Services arrow rotates with open, close, outside dismissal and reduced motion", async ({ page }) => {
  await page.goto("/faq");
  const summary = page.locator('.desktop-navigation summary');
  const arrow = page.locator('.services-arrow');
  const angle = () => arrow.evaluate(el => { const m = new DOMMatrix(getComputedStyle(el).transform); return Math.round(Math.abs(Math.atan2(m.b, m.a) * 180 / Math.PI)); });
  await summary.hover();
  const frames = await arrow.evaluate(el => new Promise<number[]>(resolve => {
    const samples: number[] = [];
    const start = performance.now();
    const sample = () => {
      const matrix = new DOMMatrix(getComputedStyle(el).transform);
      samples.push(Math.abs(Math.atan2(matrix.b, matrix.a) * 180 / Math.PI));
      if (performance.now() - start > 250) resolve(samples);
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  expect(frames.some(value => value > 15 && value < 165), JSON.stringify(frames)).toBe(true);
  expect(Math.max(...frames) - Math.min(...frames)).toBeGreaterThan(15);
  await expect.poll(angle).toBe(0);
  await summary.click(); // clicking a hover-opened menu keeps it open
  await expect.poll(angle).toBe(0);
  await page.mouse.move(720, 640); // blank page below the menu
  await expect.poll(angle).toBe(180);
  await summary.hover();
  await expect.poll(angle).toBe(0);
  await page.mouse.click(720, 640);
  await expect.poll(angle).toBe(180);
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect.poll(angle).toBe(0);
  await page.keyboard.press('Escape');
  await expect.poll(angle).toBe(180);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await summary.hover();
  await expect.poll(angle).toBe(0);
  await page.mouse.move(720, 640); // blank page, clear of the open menu
  await expect.poll(angle).toBe(180);
});
