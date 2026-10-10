import { test, expect } from "@playwright/test";

const route = "/design-options/full-screen";

test("twenty photographs align, swipe left, settle, and become the hero", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route);
  const hero = page.locator(".photo-cinema-hero");
  const cards = page.locator(".intro-card:not(.intro-loop-copy)");
  await expect(cards).toHaveCount(20);
  await expect(page.locator('.intro-card[data-photo="signage3"]')).toHaveCount(0);
  await expect(page.locator('.intro-card[data-photo="signage1"]')).toHaveCount(0);
  await expect(page.locator('.hero-slide')).toHaveCount(20);
  await expect(page.locator('.hero-slide[data-photo="signage3"]')).toHaveCount(0);
  const slidePhotos = await page.locator('.hero-slide').evaluateAll(elements => elements.map(el => el.getAttribute('data-photo')));
  const introPhotos = await cards.evaluateAll(elements => elements.map(el => el.getAttribute('data-photo')));
  expect(slidePhotos[0]).toBe('bedrock');
  expect([...slidePhotos].sort()).toEqual(introPhotos.filter(slug => slug !== 'signage3' && slug !== 'signage1').sort());
  await page.waitForFunction(() => document.querySelector(".photo-cinema-hero")?.getAttribute("data-phase") === "fade");
  const start = await cards.evaluateAll((elements) => elements.map((element) => ({
    slug: element.getAttribute("data-photo"),
    y: element.getBoundingClientRect().y,
    opacity: Number(getComputedStyle(element).opacity),
    loaded: element.querySelector("img")!.naturalWidth > 0,
  })));
  expect(start.every((card) => card.loaded)).toBe(true);
  expect(start.some((card) => card.opacity < 1)).toBe(true);
  for (let i = 1; i < start.length; i++) {
    expect(Math.sign(start[i].y - start[i - 1].y)).toBe(i % 2 ? 1 : -1);
  }
  await page.waitForFunction(() => document.querySelector(".photo-cinema-hero")?.getAttribute("data-phase") === "row");
  const row = await cards.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, opacity: getComputedStyle(element).opacity };
  }));
  expect(Math.max(...row.map((card) => card.y)) - Math.min(...row.map((card) => card.y))).toBeLessThan(1);
  expect(row.every((card) => card.opacity === "1")).toBe(true);
  for (let i = 1; i < row.length; i++) expect(row[i].x).toBeGreaterThan(row[i - 1].x + row[i - 1].width);
  const edgeViolations = await page.evaluate(() => new Promise<string[]>((resolve) => {
    const violations: string[] = [];
    const sample = () => {
      for (const card of document.querySelectorAll<HTMLElement>(".intro-card")) {
        const style = getComputedStyle(card);
        const rect = card.getBoundingClientRect();
        if (style.visibility !== "hidden" && Number(style.opacity) > 0 && (rect.left < 0 || rect.right > innerWidth)) violations.push(card.dataset.photo!);
      }
      if (document.querySelector(".photo-cinema-hero")?.getAttribute("data-phase") === "settled") resolve(violations);
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  expect(edgeViolations).toEqual([]);
  const visibleFinal = await cards.evaluateAll(elements => elements.filter(element => getComputedStyle(element).visibility !== "hidden").map(element => element.getAttribute("data-photo")));
  expect(visibleFinal).toEqual(["airplane", "signage7", "czvan", "bedrock", "signage5", "jetski", "signage2"]);
  const leadBounds = await page.locator('.intro-card[data-photo="bedrock"]').boundingBox();
  expect(Math.abs(leadBounds!.x + leadBounds!.width / 2 - page.viewportSize()!.width / 2)).toBeLessThan(1);
  const settled = await cards.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().x));
  for (let i = 0; i < settled.length; i++) expect(settled[i]).toBeLessThan(row[i].x - row[i].width * 13);
  const collapse = await page.evaluate(() => new Promise<{ seen: string[]; left: number; right: number; clipped: string[]; directions: Record<string, number> }>((resolve) => {
    const seen = new Set<string>();
    const directions: Record<string, number> = {};
    const clipped: string[] = [];
    let left = 0, right = 0;
    const sample = () => {
      const phase = document.querySelector(".photo-cinema-hero")?.getAttribute("data-phase");
      if (phase === "expand") { resolve({ seen: [...seen], left, right, clipped, directions }); return; }
      if (phase === "gather") {
        let frameLeft = 0, frameRight = 0;
        for (const card of document.querySelectorAll<HTMLElement>(".intro-card")) {
          const rect = card.getBoundingClientRect();
          const center = rect.x + rect.width / 2 - innerWidth / 2;
          if (Math.abs(center) > 1 && !(card.dataset.photo! in directions)) directions[card.dataset.photo!] = Math.sign(center);
          if (center < -1) frameLeft++;
          if (center > 1) frameRight++;
          if (getComputedStyle(card).visibility !== "hidden") {
            seen.add(card.dataset.photo!);
            if (rect.left < 0 || rect.right > innerWidth) clipped.push(card.dataset.photo!);
          }
        }
        left = Math.max(left, frameLeft); right = Math.max(right, frameRight);
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  expect(collapse.left).toBe(9);
  expect(collapse.right).toBe(10);
  for (const card of start.slice(0, 7)) expect(collapse.directions[card.slug!]).toBe(1);
  for (const card of start.slice(7, 13)) expect(collapse.directions[card.slug!]).toBe(-1);
  expect(collapse.seen.sort()).toEqual(start.map(card => card.slug!).sort());
  expect(collapse.clipped).toEqual([]);
  for (const image of await page.locator('.intro-card-original img').all()) await expect(image).toHaveCSS('object-fit', 'cover');
  await expect(page.locator(".cinema-content")).toHaveCSS("opacity", "0");
  await expect(page.locator(".site-header")).toHaveCSS("opacity", "0");
  await expect(hero).toHaveAttribute("data-intro", "ready", { timeout: 10000 });
  await expect(page.locator(".photo-intro")).toBeHidden();
  await expect(page.locator(".hero-slide[data-photo='bedrock']")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-slide[data-photo='bedrock'] img")).toHaveAttribute("data-original-src", "/work/hero/bedrock.webp");
  await expect(page.locator(".hero-slide[data-photo='bedrock'] img")).toHaveCSS("object-fit", "cover");
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator('[data-hero-moment] a[href="/contact"]')).toBeVisible();
  await expect(page.getByRole("slider", { name: "Choose hero photograph" })).toHaveAttribute("max", "20");
  await expect(page.locator(".hero-slideshow")).toHaveAttribute("data-active-slide", "1", { timeout: 8000 });
  await page.getByRole("slider", { name: "Choose hero photograph" }).fill("7");
  await expect(page.locator(".hero-slideshow")).toHaveAttribute("data-active-slide", "6");
  await page.getByRole("button", { name: "Replay intro" }).click();
  await expect(hero).toHaveAttribute("data-intro", "playing");
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(hero).toHaveAttribute("data-intro", "ready");
  await expect(page.locator(".hero-slideshow")).toHaveAttribute("data-active-slide", "0");
  expect(errors).toEqual([]);
});

test("photo intro can finish on a phone and safely settles on resize or motion preference changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const hero = page.locator(".photo-cinema-hero");
  await expect(hero).toHaveAttribute("data-phase", "complete", { timeout: 12000 });
  await expect(page.locator(".photo-intro")).toBeHidden();
  const heroBounds = await hero.boundingBox();
  const mediaBounds = await page.locator(".cinema-media").boundingBox();
  expect(mediaBounds).toEqual(heroBounds);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const choices = page.locator(".hero-slideshow-controls button, .hero-slide-scrubber");
  for (const button of await choices.all()) {
    const rect = await button.boundingBox();
    expect(rect!.width).toBeGreaterThanOrEqual(44);
    expect(rect!.height).toBeGreaterThanOrEqual(44);
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(390);
  }
  await page.getByRole("button", { name: "Replay intro" }).click();
  await expect(hero).toHaveAttribute("data-intro", "playing");
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(hero).toHaveAttribute("data-intro", "ready");
  await page.getByRole("button", { name: "Replay intro" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(hero).toHaveAttribute("data-intro", "ready");
  await expect(page.locator(".photo-intro")).toBeHidden();
  await expect(page.locator(".site-header")).toHaveCSS("opacity", "1");
  await expect(page.locator(".cinema-content")).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(hero).toHaveAttribute("data-intro", "ready");
});

test("full-screen hero has its approved photo and actions without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}${route}`);
  await expect(page.locator(".photo-intro")).toBeHidden();
  await expect(page.locator(".hero-slide[data-photo='bedrock']")).toHaveCSS("opacity", "1");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator('[data-hero-moment] a[href="/contact"]')).toBeVisible();
  await context.close();
});
