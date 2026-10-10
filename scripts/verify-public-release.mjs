import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, firefox, webkit, expect } from "@playwright/test";

const base = process.env.RELEASE_BASE_URL ?? "http://localhost:8120";
const output = process.env.RELEASE_OUTPUT_DIR ?? "output/approved-handoff-fixes";
await mkdir(output, { recursive: true });
const engine = process.env.RELEASE_BROWSER ?? "chromium";
const browser = await ({ chromium, firefox, webkit })[engine].launch();
const checks = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem("lws-quote-flow", "classic");
      localStorage.setItem("lws-trusted-style", "fade");
      localStorage.setItem("lws-service-grid", "false");
      localStorage.setItem("lws-service-expanded", "true");
    });
    await page.goto(`${base}/?review=1&intro=swipe`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".cinema-hero")).toHaveAttribute("data-layout", "split");
    await expect(page.locator(".cinema-hero")).toHaveAttribute("data-intro-variant", "original");
    await expect(page.locator(".intro-card")).toHaveCount(7);
    await expect(page.locator("[data-design-options], .cinema-skip, .cinema-replay, .hero-slideshow-controls")).toHaveCount(0);
    await expect(page.locator(".trusted-ticker")).toBeVisible();
    await expect(page.locator(".home-services-grid")).toHaveAttribute("data-layout", "grid");
    await expect(page.locator(".brand-image")).toHaveAttribute("src", /^\/optimized\//);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.screenshot({ path: `${output}/home-${width}.png` });
    for (const route of ["/services/commercial-signs", "/services/dock-signs", "/services/vehicle-wraps", "/services/laser-engraving", "/services/print-and-promo", "/about", "/contact", "/work"]) {
      const response = await page.goto(`${base}${route}?review=1`);
      assert.equal(response.status(), 200, route);
      // Let map modules and route prefetches finish before a new hard navigation.
      // Otherwise WebKit can report aborted requests as access-control errors.
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("[data-design-options]")).toHaveCount(0);
      await expect(page.locator("main")).not.toContainText("$$$$");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, route);
      if (route.startsWith("/services/")) {
        const photo = await page.locator(".service-header-photo").boundingBox();
        const copy = await page.locator(".service-header-grid > div:first-child").boundingBox();
        if (width < 1024) assert.ok(photo.y + photo.height <= copy.y + 1, `${route}: mobile image before copy`);
        else assert.ok(copy.x + copy.width <= photo.x, `${route}: desktop columns`);
      }
      if (route === "/services/print-and-promo") await expect(page.locator("main")).not.toContainText(/event signs|event signage/i);
      if (route === "/about") await expect(page.locator(".accreditation-example")).toHaveCount(0);
      if (route === "/contact") await expect(page.locator(".quote-flow")).toBeVisible();
      if (route === "/work") {
        const tile = page.getByRole("button", { name: /^View photograph:/ }).first();
        await expect(tile.locator("img")).toHaveAttribute("src", /^\/optimized\//);
        const original = await tile.locator("img").getAttribute("data-original-src");
        await tile.click();
        await expect(page.locator(".lightbox-photo")).toHaveAttribute("src", original);
        await page.keyboard.press("Escape");
        await expect(tile).toBeFocused();
      }
      await page.screenshot({ path: `${output}/${route.replaceAll("/", "_")}-${width}.png` });
      const broken = await page.locator("img").evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc));
      assert.deepEqual(broken, [], route);
    }
    for (const route of ["/design-options", "/design-options/full-screen", "/design-options/half-screen", "/design-options/old-preview"]) {
      const response = await page.request.get(`${base}${route}`, { maxRedirects: 0 });
      assert.equal(response.status(), 308, route);
      assert.equal(new URL(response.headers().location, base).pathname, "/", route);
    }
    assert.deepEqual(errors, []);
    checks.push({ width, status: "passed", routes: 9, reviewRedirects: 4 });
    console.log(`Public defaults, responsive layout, gallery originals, and review redirects passed at ${width}px.`);
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const page = await context.newPage();
  await page.goto(base);
  // Server markup also says "ready" before hydration. Only the completed
  // animation sets this phase, so a fast initial response cannot race the check.
  await expect(page.locator(".cinema-hero")).toHaveAttribute("data-phase", "complete", { timeout: 20_000 });
  await expect(page.locator(".hero-slideshow")).not.toHaveAttribute("data-active-slide", "0", { timeout: 8_000 });
  const active = await page.locator(".hero-slideshow").getAttribute("data-active-slide");
  await expect(page.locator(`.hero-slide[data-slide="${active}"]`)).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-slideshow-controls")).toHaveCount(0);
  await page.screenshot({ path: `${output}/home-motion-desktop.png` });
  checks.push({ normalMotion: "intro completes and slideshow advances without public controls" });
  await context.close();
  await writeFile(`${output}/release-checks.json`, JSON.stringify({ base, engine, checkedAt: new Date().toISOString(), checks }, null, 2));
} finally { await browser.close(); }
