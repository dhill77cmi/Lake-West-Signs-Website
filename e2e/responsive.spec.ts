import { enableClassicPreview } from "./classic-preview";
import { test, expect } from "@playwright/test";
import { quoteCopy } from "../content/quote";
import { services } from "../content/services";

for (const width of [320, 390, 768, 1440]) {
  for (const route of ["/", "/services/vehicle-wraps", "/work", "/contact"]) {
    test(`adapt ${route} at ${width}px: fits, readable targets, no collisions`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => {
        const targets = Array.from(document.querySelectorAll<HTMLElement>('a,button,input,textarea,select,summary,[role="option"]'))
          .filter((element) => element.checkVisibility() && !element.closest('[aria-hidden="true"],.sr-only,.skip-link'))
          .map((element) => ({ element, label: element.getAttribute("aria-label") || element.textContent || element.id, box: element.getBoundingClientRect() }));
        const small = targets.filter(({ box }) => box.width < 44 || box.height < 44).map(({ label, box }) => ({ label, width: box.width, height: box.height }));
        const clipped = targets.filter(({ element, box }) => (!element.closest('.home-services-grid, .reviews-list, .review-dots, .photo-rail, .work-filter') && (box.x < -1 || box.right > innerWidth + 1)) || element.scrollWidth > element.clientWidth + 1).map(({ label }) => label);
        const overlaps: string[] = [];
        for (let i = 0; i < targets.length; i++) for (let j = i + 1; j < targets.length; j++) {
          const a = targets[i], b = targets[j];
          if (a.element.contains(b.element) || b.element.contains(a.element)) continue;
          // The page sheet scrolls over the sticky footer by design; that overlap is not a collision.
          if (!!a.element.closest("footer") !== !!b.element.closest("footer")) continue;
          if (Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left) > 1 && Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top) > 1) overlaps.push(`${a.label} / ${b.label}`);
        }
        return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, targets: targets.length, small, clipped, overlaps };
      });
      await test.info().attach("geometry", { body: JSON.stringify(geometry), contentType: "application/json" });
      expect(geometry.scrollWidth).toBe(width);
      expect(geometry.small).toEqual([]);
      expect(geometry.clipped).toEqual([]);
      expect(geometry.overlaps).toEqual([]);
      if (width < 1024) {
        const logo = await page.locator(".brand-link").boundingBox();
        const actions = await page.locator(".header-actions").boundingBox();
        if (width < 640) {
          expect(actions!.y).toBeGreaterThanOrEqual(logo!.y + logo!.height);
          const call = await page.locator('.header-phone').boundingBox();
          const quote = await page.locator('.header-quote').boundingBox();
          expect(Math.abs(call!.width - quote!.width)).toBeLessThan(1);
        } else {
          expect(Math.abs((actions!.y + actions!.height / 2) - (logo!.y + logo!.height / 2))).toBeLessThan(2);
        }
      }
    });
  }
}

test("form preserves contact methods", async ({ page }) => {
  await enableClassicPreview(page);
  await page.goto("/contact");
  const form = page.getByRole("form", { name: "Project inquiry" });
  const method = form.getByRole("combobox", { name: quoteCopy.labels.contactMethod, exact: true });
  // Both selects start blank.
  await expect(method).toHaveText(quoteCopy.placeholder);
  await expect(form.getByRole("combobox", { name: quoteCopy.labels.service, exact: true })).toHaveText(quoteCopy.placeholder);
  await expect(form.getByLabel(quoteCopy.labels.detail, { exact: true })).toBeVisible();
  await method.click();
  await page.getByRole("option", { name: "Phone", exact: true }).click();
  await form.getByLabel("Phone number", { exact: true }).fill("573 555 0100");
  await method.click();
  await page.getByRole("option", { name: "Email", exact: true }).click();
  await form.getByLabel("Email address", { exact: true }).fill("visitor@example.com");
  await method.click();
  await page.getByRole("option", { name: "Phone", exact: true }).click();
  await expect(form.getByLabel("Phone number", { exact: true })).toHaveValue("573 555 0100");
  await method.click();
  await page.getByRole("option", { name: "Email", exact: true }).click();
  await expect(form.getByLabel("Email address", { exact: true })).toHaveValue("visitor@example.com");
  await expect(page.locator("#site-content")).not.toHaveAttribute("inert");
  await expect(method).toBeFocused();
});

test("confirmed and pending prices render under their service categories", async ({ page }) => {
  await enableClassicPreview(page);
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const dockRow = page.locator(".home-service-card").filter({ has: page.getByRole("heading", { name: "Residential & Dock Signs", exact: true }) });
  await expect(dockRow).not.toContainText("$$$$");
  await expect(dockRow).not.toContainText("$");
  await expect(dockRow.getByRole("link", { name: "Explore Residential & Dock Signs" })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 900 });
  for (const service of services.filter((service) => service.prices?.length)) {
    await page.goto(`/services/${service.slug}`);
    const pending = service.prices!.filter((price) => price.confirmed === false);
    for (const price of pending) {
      const row = page.locator(".price-row").filter({ has: page.getByRole("heading", { name: price.label, exact: true }) });
      await expect(row.locator(".price-pending")).toHaveText("$$$$");
      await expect(row).not.toContainText(/\d/);
      await expect(row.getByRole("link")).toHaveCount(0);
    }
    for (const [label, amount] of [["4 × 8 ft sign", "$300+"], ["On-site installation", "$85/hr"], ["Standard dock signs", "$55+"], ["Boat decals & numbers", "$25+"], ["Residential family signs", "$40+"], ["Watercraft lettering", "$55+"], ["Family dock signs", "$55+"], ["Custom dock signs", "$65+"], ["Removal & replacement", "$85/hr"], ["On-site decal service", "$85/hr"], ["Vehicle lettering", "$85+"], ["Partial wrap", "$600+"], ["Full wrap — trucks & vans", "$3,500+"], ["Name tags", "$8+"], ["Trophies", "$30+"], ["Mugs & glasses", "$15+"], ["Business cards", "$75+"]]) {
      if (service.prices!.some((price) => price.label === label)) {
        const row = page.locator(".price-row").filter({ has: page.getByRole("heading", { name: label, exact: true }) });
        await expect(row.locator("p.text-title")).toHaveText(amount);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    await page.locator("#prices").screenshot({ path: test.info().outputPath(`${service.slug}-prices-320.png`) });
  }
});
