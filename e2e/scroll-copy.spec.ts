import { test, expect } from "@playwright/test";
// Scrolling is instant here: with smooth page scrolling, hovering mid-glide would slide the card away from the pointer.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lws-service-expanded', 'false'));
});

for (const layout of ["half-screen", "full-screen"]) {
  test(`scroll copy reveals once in ${layout} and respects motion changes`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/design-options/${layout}`);
    await page.keyboard.press("Escape");
    const heading = page.getByRole("heading", { name: "What our customers say", exact: true });
    await expect(heading).toHaveCSS("opacity", "0");
    await heading.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    const frames = await heading.evaluate(el => new Promise<number[]>(resolve => {
      const values: number[] = [];
      const start = performance.now();
      const sample = () => {
        values.push(Number(getComputedStyle(el).opacity));
        if (performance.now() - start > 400) resolve(values);
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }));
    expect(frames.some(value => value > 0 && value < 1)).toBe(true);
    await expect(heading).toHaveCSS("opacity", "1");
    const photo = page.locator('[data-scroll-copy] .trusted-by h2').first();
    await photo.evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await expect(photo).toHaveCSS('opacity', '1');
    await expect(photo).toHaveCSS('transform', 'none');
    const form = page.locator('[data-scroll-copy] form');
    await expect(form).toHaveCSS('opacity', '0');
    await form.getByRole('button').first().focus();
    await expect(form).toHaveCSS('opacity', '1');
    await expect(heading).toHaveCSS("transform", "none");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(heading).toHaveCSS("opacity", "1");
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const title of await page.locator("[data-scroll-copy] h2").all()) {
      await expect(title).toHaveCSS("opacity", "1");
      await expect(title).toHaveCSS("transform", "none");
    }
  });
}

test('service photo window expands without resizing the image', async ({ page }) => {
  await page.goto('/design-options/full-screen');
  await page.keyboard.press("Escape");
  const link = page.locator('.home-service-media').first();
  const frame = link.locator('figure');
  const image = link.locator('img');
  await link.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(frame).toHaveCSS('clip-path', 'inset(12px 12% 96px round 8px)');
  const before = await image.boundingBox();
  await link.hover();
  await expect(frame).toHaveCSS('clip-path', 'inset(0px 0% round 8px)');
  await expect(link.locator('h3')).toHaveCSS('color', 'rgb(255, 255, 255)');
  const after = await image.boundingBox();
  expect(after!.width).toBeCloseTo(before!.width, 1);
  expect(after!.height).toBeCloseTo(before!.height, 1);
  await page.getByRole('heading', { name: 'Bring your vision to life' }).hover();
  await expect(frame).toHaveCSS('clip-path', 'inset(12px 12% 96px round 8px)');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(frame).toHaveCSS('clip-path', 'inset(12px 12% 96px round 8px)');
  await link.focus();
  await expect(link.locator('h3')).toHaveCSS('color', 'rgb(255, 255, 255)');
});

test('letter reveal toggles cleanly and honors reduced motion', async ({ page }) => {
  // The heading is intentionally hidden in the below-title process layout.
  await page.addInitScript(() => localStorage.setItem('lws-process-placement', 'sidebar'));
  await page.goto('/design-options/full-screen');
  await page.keyboard.press("Escape");
  const toggle = page.getByRole('button', { name: 'Letter-by-letter scroll reveal' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const heading = page.getByRole('heading', { name: 'Our Process', exact: true });
  const chars = heading.locator('.scroll-letter');
  await expect(chars).toHaveCount(10);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(chars).toHaveCount(0);
  await toggle.click();
  await expect(chars).toHaveCount(10);
  await heading.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(chars.last()).toHaveCSS('opacity', '1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(chars).toHaveCount(0);
  await expect(heading).toHaveCSS('opacity', '1');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(chars).toHaveCount(10);
  await toggle.click();
  await expect(chars).toHaveCount(0);
  await expect(heading).toHaveText('Our Process');
});

test('service grid has six cards, balanced frame expansion and no extra buttons', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/design-options/full-screen');
  await page.keyboard.press("Escape");
  const grid = page.locator('.home-services-grid');
  await expect(grid).toHaveAttribute('data-layout', 'grid');
  await expect(grid.locator('article')).toHaveCount(6);
  await expect(grid.getByRole('link', { name: /Learn more|View pricing/ })).toHaveCount(0);
  const boxes = await grid.locator('article').evaluateAll(nodes => nodes.map(n => { const b=n.getBoundingClientRect(); return {x:b.x,y:b.y,width:b.width}; }));
  expect(boxes[0].y).toBe(boxes[2].y);
  expect(boxes[3].y).toBeGreaterThan(boxes[0].y);
  const options = (await page.locator('.design-options-services').boundingBox())!;
  expect(boxes[0].width).toBeGreaterThan(300);
  expect(boxes[2].x + boxes[2].width).toBeLessThan(options.x);
  for (const box of boxes) expect(box.width).toBeCloseTo(boxes[0].width, 1);
  const link = grid.locator('.home-service-media').first();
  await link.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await link.hover();
  const frames = await link.locator('figure').evaluate(el => new Promise<string[]>(resolve => {
    const samples: string[] = []; const start=performance.now();
    const sample=()=>{ samples.push((el as HTMLElement).style.clipPath); if(performance.now()-start>700) resolve(samples); else requestAnimationFrame(sample); }; sample();
  }));
  for (const clip of frames) {
    // Ignore the corner radius; compare the left and right insets when both are serialised.
    const values = clip.replace(/\s*round.*$/, "").match(/[\d.]+/g)!.map(Number);
    if (values.length === 4) expect(values[1]).toBeCloseTo(values[3], 5);
  }
  await page.setViewportSize({width:390,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});

test('card copy stays still while the photo opens over it', async ({ page }) => {
  await page.goto('/design-options/full-screen');
  await page.getByRole('button', {name:'Skip intro',exact:true}).click();
  const link=page.locator('.home-service-media').first();
  await link.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(link).toHaveCSS('opacity','1');
  const before=await link.locator('h3').boundingBox();
  await link.hover();
  await expect(link.locator('figure')).toHaveCSS('clip-path','inset(0px 0% round 8px)');
  expect((await link.locator('h3').boundingBox())!.y).toBeCloseTo(before!.y,1);
  await expect(link.locator('h3')).toHaveCSS('color','rgb(255, 255, 255)');
});


test('service frames can stay expanded without hover', async ({ page }) => {
  await page.goto('/design-options/half-screen');
  await page.keyboard.press("Escape");
  await page.getByRole('button', { name: 'Keep service images expanded', exact: true }).click();
  const card = page.locator('.home-service-media').first();
  await card.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.getByRole('heading', { name: 'Bring your vision to life' }).hover();
  await expect(card.locator('figure')).toHaveCSS('clip-path', 'inset(0px round 8px)');
  await expect(card.locator('.home-service-description')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await card.hover();
  await expect(card.locator('figure')).toHaveCSS('clip-path', 'inset(0px round 8px)');
});

test('learn more buttons are solid blue and invert once the photo covers them', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press("Escape");
  const card = page.locator('.home-service-media').first();
  const action = card.locator('.service-learn-more');
  const label = action.locator('span');
  await expect(page.locator('.home-service-description p')).toHaveCount(0);
  await expect(action).toHaveCSS('color', 'rgb(17, 117, 188)');
  await expect(action).toHaveCSS('background-color', 'rgb(17, 117, 188)');
  await expect(label).toHaveCSS('color', 'rgb(255, 255, 255)');
  await card.hover();
  await expect(action).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(label).toHaveCSS('color', 'rgb(20, 20, 20)');
  await page.getByRole('heading', { name: 'Bring your vision to life' }).hover();
  await expect(action).toHaveCSS('color', 'rgb(17, 117, 188)');
  await expect(label).toHaveCSS('color', 'rgb(255, 255, 255)');
});

test('trusted ticker rolls and respects reduced motion', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press("Escape");
  const track = page.locator('.trusted-track');
  const start = await track.getAttribute('style');
  await expect.poll(() => track.getAttribute('style')).not.toBe(start);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(track).toHaveCSS('transform', 'none');
  await expect(page.locator('.trusted-group').nth(1)).toBeHidden();
});
