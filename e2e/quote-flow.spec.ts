import { enableClassicPreview } from "./classic-preview";
import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page } from "@playwright/test";
import { flowCopy } from "../content/quote-flow";
import { quoteCopy } from "../content/quote";
import { site } from "../content/site";

const flow = (page: Page) => page.getByRole("form", { name: flowCopy.formLabel });
const pressed = (page: Page, name: string) => flow(page).getByRole("button", { name, exact: true, pressed: true });

// UI tests mock only the network boundary; server behavior is covered in quote-delivery.test.ts.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/quote", route => route.fulfill({ status: 200, json: { ok: true } }));
});

test("a dock sign request walks five screens from Home and ends sent", async ({ page }) => {
  await page.goto("/#quote");
  const form = flow(page);
  await expect(form.getByText("Step 1 of 5", { exact: true })).toBeVisible();
  await form.getByRole("button", { name: "Residential & Dock Signs", exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.details.label })).toBeFocused();
  await expect(form.getByText("Step 2 of 5", { exact: true })).toBeVisible();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await expect(form.getByText(flowCopy.errors.details, { exact: true })).toBeVisible();
  await form.getByRole("button", { name: "Dock sign", exact: true }).click();
  await form.getByLabel("What should it say?").fill("Lot 12 Valley Rd");
  await form.getByRole("button", { name: "Install at the dock", exact: true }).click();
  await form.getByRole("button", { name: "1", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.timing.label })).toBeFocused();
  await expect(form.locator("[data-progress]")).toHaveAttribute("style", /width: 60%/);
  await form.getByRole("button", { name: "Within a month", exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.extra.label })).toBeFocused();
  await form.getByRole("button", { name: flowCopy.skip, exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.contact.label })).toBeFocused();
  await expect(form.locator("[data-progress]")).toHaveAttribute("style", /width: 100%/);
  await expect(form.getByText("Residential & Dock Signs · Dock sign", { exact: true })).toBeVisible();
  await expect(form.getByText("Within a month", { exact: true })).toBeVisible();
  await form.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(form.getByLabel("Name", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await form.getByLabel("Name", { exact: true }).fill("A Visitor");
  await form.getByRole("button", { name: "Email", exact: true }).click();
  await form.getByLabel("Email address", { exact: true }).fill("visitor@example.com");
  await form.getByRole("button", { name: "Submit", exact: true }).click();
  // The button stays blue while it grows into the panel; aria-disabled and the sending guard block a second send.
  await expect(form.getByRole("button", { name: "Submit", exact: true })).toHaveAttribute("aria-disabled", "true");
  await expect(form.getByRole("button", { name: "Submit", exact: true })).toHaveAttribute("data-variant", "default");
  await expect(form.getByRole("status").filter({ hasText: flowCopy.sent })).toBeVisible();
  // The summary card stays and becomes the receipt: name and reach-you rows, a Sent stamp, no Edit links.
  await expect(form.getByText("A Visitor", { exact: true })).toBeVisible();
  await expect(form.getByText("Email · visitor@example.com", { exact: true })).toBeVisible();
  await expect(form.getByText(flowCopy.stamp, { exact: true })).toBeVisible();
  await expect(form.getByRole("button", { name: "Edit project", exact: true })).toHaveCount(0);
  await expect(form.getByRole("button", { name: "Edit timing", exact: true })).toHaveCount(0);
});

test("the page shortens smoothly when the request is sent", async ({ page }) => {
  await printToNotes(page);
  const form = flow(page);
  await form.getByRole("button", { name: flowCopy.skip, exact: true }).click();
  await fillContact(page);
  const initial = await page.evaluate(() => document.documentElement.scrollHeight);
  await form.getByRole("button", { name: flowCopy.submit, exact: true }).click();
  const samples = await page.evaluate(async () => {
    const heights: number[] = [];
    for (let elapsed = 0; elapsed <= 1200; elapsed += 50) {
      heights.push(document.documentElement.scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return heights;
  });
  const heights = [initial, ...samples];
  // A snap drops several hundred pixels between two samples; a tween spreads the same change across the whole finish.
  const largestDrop = Math.max(...heights.slice(1).map((height, index) => heights[index] - height));
  expect(largestDrop, heights.join(", ")).toBeLessThan(120);
  expect(heights.at(-1)!, heights.join(", ")).toBeLessThan(initial);
});

test("files chosen on step 4 are still attached at submit", async ({ page }) => {
  await page.goto("/contact?service=print");
  const form = flow(page);
  await expect(form.getByText("Step 1 of 4", { exact: true })).toBeVisible();
  await form.getByRole("button", { name: "Business cards", exact: true }).click();
  await form.getByRole("button", { name: "Under 100", exact: true }).click();
  await form.getByRole("button", { name: "I have artwork", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await form.getByRole("button", { name: "As soon as possible", exact: true }).click();
  await form.getByLabel(/Photos or artwork/).setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: Buffer.from("png") });
  await expect(form.getByText("logo.png")).toBeVisible();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await form.getByRole("button", { name: flowCopy.back, exact: true }).click();
  await expect(form.getByText("logo.png")).toBeVisible();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  const attached = await form.locator('input[name="files"]').evaluate((input: HTMLInputElement) => input.files?.length ?? 0);
  expect(attached).toBe(1);
});

const bigFile = { name: "big.heic", mimeType: "image/heic", buffer: Buffer.alloc(26 * 1024 * 1024) };
const smallFile = { name: "logo.png", mimeType: "image/png", buffer: Buffer.from("png") };

async function printToNotes(page: Page) {
  const form = flow(page);
  await page.goto("/contact?service=print");
  await form.getByRole("button", { name: "Business cards", exact: true }).click();
  await form.getByRole("button", { name: "Under 100", exact: true }).click();
  await form.getByRole("button", { name: "I have artwork", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await form.getByRole("button", { name: "As soon as possible", exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.extra.label })).toBeVisible();
}

async function fillContact(page: Page) {
  const form = flow(page);
  await form.getByLabel("Name", { exact: true }).fill("A Visitor");
  await form.getByRole("button", { name: "Email", exact: true }).click();
  await form.getByLabel("Email address", { exact: true }).fill("visitor@example.com");
}

test("an oversized file on step 4 blocks Next until it is replaced, then the request sends", async ({ page }) => {
  await printToNotes(page);
  const form = flow(page);
  const files = form.getByLabel(/Photos or artwork/);
  await files.setInputFiles(bigFile);
  await expect(form.getByText(quoteCopy.errors.fileSize, { exact: true })).toBeVisible();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.extra.label })).toBeVisible();
  await expect(files).toBeFocused();
  await files.setInputFiles(smallFile);
  await expect(form.getByText(quoteCopy.errors.fileSize, { exact: true })).toHaveCount(0);
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await fillContact(page);
  await form.getByRole("button", { name: flowCopy.submit, exact: true }).click();
  await expect(form.getByRole("status").filter({ hasText: flowCopy.sent })).toBeVisible();
});

test("a file error found at submit returns to step 4 with the error shown", async ({ page }) => {
  await printToNotes(page);
  const form = flow(page);
  const files = form.getByLabel(/Photos or artwork/);
  await form.getByRole("button", { name: flowCopy.skip, exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.contact.label })).toBeVisible();
  await form.getByRole("button", { name: flowCopy.back, exact: true }).click();
  await files.setInputFiles(bigFile);
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.extra.label })).toBeVisible();
  await expect(form.getByText(quoteCopy.errors.fileSize, { exact: true })).toBeVisible();
  // Back clears the on-screen error, so the bad file only resurfaces when the request is sent.
  await form.getByRole("button", { name: flowCopy.back, exact: true }).click();
  await form.getByRole("button", { name: "As soon as possible", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await fillContact(page);
  await form.getByRole("button", { name: flowCopy.submit, exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.extra.label })).toBeVisible();
  await expect(form.getByText(quoteCopy.errors.fileSize, { exact: true })).toBeVisible();
  await expect(files).toBeFocused();
});

test("a filled honeypot ends sent without reporting errors", async ({ page }) => {
  await page.goto("/contact?service=engraving");
  const form = flow(page);
  await form.locator('input[name="companyWebsite"]').evaluate((input: HTMLInputElement) => { input.value = "spam"; });
  await form.getByRole("button", { name: "Plaque or award", exact: true }).click();
  await form.getByRole("button", { name: "1", exact: true }).click();
  await form.getByRole("button", { name: "I need design help", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await form.getByRole("button", { name: "Just pricing it out", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.skip, exact: true }).click();
  await form.getByRole("button", { name: flowCopy.submit, exact: true }).click();
  await expect(form.getByRole("status").filter({ hasText: flowCopy.sent })).toBeVisible();
  await expect(form.getByLabel("Name", { exact: true })).toHaveCount(0);
  await form.getByRole("button", { name: flowCopy.again, exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.service.label })).toBeFocused();
  await expect(form.getByText("Step 1 of 5", { exact: true })).toBeVisible();
});

test("a missing contact method moves focus to the method choices and says why", async ({ page }) => {
  await page.goto("/contact?service=print");
  const form = flow(page);
  await form.getByRole("button", { name: "Business cards", exact: true }).click();
  await form.getByRole("button", { name: "Under 100", exact: true }).click();
  await form.getByRole("button", { name: "I have artwork", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await form.getByRole("button", { name: "As soon as possible", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.skip, exact: true }).click();
  await form.getByLabel("Name", { exact: true }).fill("A Visitor");
  await form.getByRole("button", { name: flowCopy.submit, exact: true }).click();
  await expect(form.getByRole("button", { name: "Phone", exact: true })).toBeFocused();
  await expect(form.getByText(quoteCopy.errors.contactMethod, { exact: true })).toBeVisible();
});

test("changing the service drops a product carried in from the URL", async ({ page }) => {
  await page.goto("/contact?service=residential&product=Family%20dock%20signs");
  const form = flow(page);
  await expect(form.locator('input[name="product"]')).toHaveCount(1);
  await form.getByRole("button", { name: flowCopy.change, exact: true }).click();
  await form.getByRole("button", { name: "Print & Promotional", exact: true }).click();
  await expect(form.locator('input[name="product"]')).toHaveCount(0);
});

test("changing the service keeps the timing and notes", async ({ page }) => {
  await page.goto("/#quote");
  const form = flow(page);
  await form.getByRole("button", { name: flowCopy.service.custom, exact: true }).click();
  await form.getByRole("button", { name: "A sign", exact: true }).click();
  await form.getByRole("button", { name: "I have artwork", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await form.getByRole("button", { name: "Within a month", exact: true }).click();
  await form.getByLabel(/Notes/).fill("Two signs for the marina.");
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await form.getByRole("button", { name: "Edit project", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.back, exact: true }).click();
  await form.getByRole("button", { name: "Commercial Signage", exact: true }).click();
  await form.getByRole("button", { name: "Storefront", exact: true }).click();
  await form.getByRole("button", { name: "2 to 4 ft", exact: true }).click();
  await form.getByRole("button", { name: "I'll pick it up", exact: true }).click();
  await form.getByRole("button", { name: "I have artwork", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await expect(pressed(page, "Within a month")).toBeVisible();
  await form.getByRole("button", { name: "Within a month", exact: true }).click();
  await expect(form.getByLabel(/Notes/)).toHaveValue("Two signs for the marina.");
});

test("classic form is still selectable through storage", async ({ page }) => {
  await enableClassicPreview(page);
  await page.goto("/contact");
  await expect(page.getByRole("form", { name: "Project inquiry" })).toBeVisible();
  await expect(page.getByRole("form", { name: flowCopy.formLabel })).toHaveCount(0);
});

test("the local design panel swaps the guided flow for the classic form without a reload", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?review=1#quote");
  await expect(flow(page)).toBeVisible();
  const toggle = page.getByRole("button", { name: "Classic quote form instead of the guided flow", exact: true });
  await expect(toggle).toHaveText("Quote form: Guided");
  await toggle.click();
  await expect(toggle).toHaveText("Quote form: Classic");
  await expect(page.getByRole("form", { name: "Project inquiry" })).toBeVisible();
  await expect(flow(page)).toHaveCount(0);
  await toggle.click();
  await expect(flow(page)).toBeVisible();
});

test("a product link lands on the details screen with that product pressed, and unknown products are ignored", async ({ page }) => {
  await page.goto("/contact?service=residential&product=Family%20dock%20signs");
  await expect(pressed(page, "Dock sign")).toBeVisible();
  await expect(flow(page).getByText("Step 1 of 4", { exact: true })).toBeVisible();
  await page.goto("/contact?service=residential&product=%3Cscript%3E");
  await expect(flow(page).getByRole("button", { name: "Dock sign", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("body")).not.toContainText("<script>");
});

test("Custom asks its two questions", async ({ page }) => {
  await page.goto("/#quote");
  const form = flow(page);
  await form.getByRole("button", { name: flowCopy.service.custom, exact: true }).click();
  await expect(form.getByText("Step 2 of 5", { exact: true })).toBeVisible();
  await expect(form.getByRole("heading", { name: flowCopy.details.label })).toBeFocused();
  await form.getByRole("button", { name: "A sign", exact: true }).click();
  await form.getByRole("button", { name: "I need design help", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.timing.label })).toBeFocused();
});

test("a question walks three screens from the FAQ link and ends sent", async ({ page }) => {
  await page.goto("/contact?service=general");
  const form = flow(page);
  await expect(form.getByText("Step 1 of 2", { exact: true })).toBeVisible();
  await expect(form.getByRole("button", { name: flowCopy.change, exact: true })).toBeVisible();
  const question = form.getByRole("textbox", { name: flowCopy.question.label, exact: true });
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await expect(form.getByText(flowCopy.errors.question, { exact: true })).toBeVisible();
  await expect(question).toBeFocused();
  await expect(question).toHaveAttribute("aria-invalid", "true");
  await question.fill("Do you engrave stainless tumblers?");
  await form.getByRole("button", { name: "Yes", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.contact.answerLabel })).toBeFocused();
  await expect(form.getByText(flowCopy.summary.question, { exact: true })).toBeVisible();
  await expect(form.getByText("Do you engrave stainless tumblers?", { exact: true })).toBeVisible();
  await expect(form.locator('input[type="hidden"][name="message"]')).toHaveValue("Do you engrave stainless tumblers?");
  await expect(form.locator('input[type="hidden"][name="order"]')).toHaveValue("yes");
  await expect(form.locator('input[type="hidden"][name="service"]')).toHaveValue("general");
  await fillContact(page);
  await form.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(form.getByRole("status").filter({ hasText: flowCopy.sent })).toBeVisible();
  await expect(form.locator(`a[href="${site.phoneHref}"]`)).toHaveCount(0);
  const again = form.getByRole("button", { name: flowCopy.again, exact: true });
  await expect(again).toHaveAttribute("data-variant", "inverse-outline");
  await again.click();
  await expect(form.getByRole("heading", { name: flowCopy.service.label })).toBeFocused();
  await expect(form.getByRole("button", { name: flowCopy.service.question, exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("Home offers Custom and Ask a question, and Ask a question runs three screens", async ({ page }) => {
  await page.goto("/#quote");
  const form = flow(page);
  for (const name of ["Commercial Signage", "Residential & Dock Signs", "Vehicle Wraps & Lettering", "Laser Engraving", "Print & Promotional", "Custom", "Ask a question"]) {
    await expect(form.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await expect(form.getByRole("group", { name: flowCopy.service.label }).getByRole("button")).toHaveCount(7);
  await form.getByRole("button", { name: "Ask a question", exact: true }).click();
  await expect(form.getByText("Step 2 of 3", { exact: true })).toBeVisible();
});

test("Custom from the Home card lands on its details screen with a Change link", async ({ page }) => {
  await page.goto("/contact?service=unsure#quote");
  const form = flow(page);
  await expect(form.getByText("Step 1 of 4", { exact: true })).toBeVisible();
  await expect(form.getByRole("heading", { name: flowCopy.details.label })).toBeVisible();
  await expect(form.getByRole("button", { name: flowCopy.change, exact: true })).toBeVisible();
  await expect(form.locator('input[type="hidden"][name="service"]')).toHaveValue("unsure");
});

test("Change on a service page reopens the service screen and the flow becomes five screens", async ({ page }) => {
  await page.goto("/services/laser-engraving#quote");
  const form = flow(page);
  await expect(form.getByText("Step 1 of 4", { exact: true })).toBeVisible();
  await form.getByRole("button", { name: flowCopy.change, exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.service.label })).toBeFocused();
  await expect(form.getByText("Step 1 of 5", { exact: true })).toBeVisible();
  await form.getByRole("button", { name: "Commercial Signage", exact: true }).click();
  await expect(form.getByText("Step 2 of 5", { exact: true })).toBeVisible();
  await expect(form.getByRole("button", { name: flowCopy.back, exact: true })).toBeVisible();
});

test("Back and Edit keep every answer", async ({ page }) => {
  await page.goto("/services/vehicle-wraps#quote");
  const form = flow(page);
  await form.getByRole("button", { name: "Truck or van", exact: true }).click();
  await form.getByRole("button", { name: "Full wrap", exact: true }).click();
  await form.getByRole("button", { name: "I have artwork", exact: true }).click();
  await form.getByLabel(/Year, make and model/).fill("2021 Ford Transit");
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await form.getByRole("button", { name: "1 to 3 months", exact: true }).click();
  await form.getByLabel(/Notes/).fill("Two doors and the tailgate.");
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await form.getByLabel("Name", { exact: true }).fill("A Visitor");
  await form.getByRole("button", { name: "Edit project", exact: true }).click();
  await expect(pressed(page, "Truck or van")).toBeVisible();
  await expect(pressed(page, "Full wrap")).toBeVisible();
  await expect(form.getByLabel(/Year, make and model/)).toHaveValue("2021 Ford Transit");
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await expect(pressed(page, "1 to 3 months")).toBeVisible();
  await form.getByRole("button", { name: "1 to 3 months", exact: true }).click();
  await expect(form.getByLabel(/Notes/)).toHaveValue("Two doors and the tailgate.");
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await expect(form.getByLabel("Name", { exact: true })).toHaveValue("A Visitor");
});

test("every screen fits 320px, passes axe, and reduced motion leaves no transform", async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/contact?service=commercial");
  const form = flow(page);
  const check = async (name: string, focused = true) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), name).toBe(false);
    expect(await form.locator("[data-step]").evaluate((panel) => getComputedStyle(panel).transform), name).toBe("none");
    const { violations } = await new AxeBuilder({ page }).include(`form[aria-label="${flowCopy.formLabel}"]`).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    expect(violations, name).toEqual([]);
    if (!focused) return;
    const box = await page.evaluate(() => {
      const { top, bottom } = document.activeElement!.getBoundingClientRect();
      return { tag: document.activeElement!.tagName, top, bottom, height: window.innerHeight };
    });
    expect(box.tag, name).toBe("H2");
    expect(box.top, name).toBeGreaterThanOrEqual(0);
    expect(box.bottom, name).toBeLessThanOrEqual(box.height);
  };
  // First paint does not move focus, so only the screens reached by a tap check the focused heading.
  await check("details", false);
  await form.getByRole("button", { name: "Storefront", exact: true }).click();
  await form.getByRole("button", { name: "4 × 8 ft or bigger", exact: true }).click();
  await form.getByRole("button", { name: "Install it for me", exact: true }).click();
  await expect(form.getByLabel(/Which town/)).toBeVisible();
  await form.getByRole("button", { name: "I need design help", exact: true }).click();
  await form.getByRole("button", { name: flowCopy.next, exact: true }).click();
  await expect(form.getByRole("heading", { name: flowCopy.timing.label })).toBeFocused();
  await check("timing");
  await form.getByRole("button", { name: "As soon as possible", exact: true }).click();
  // Reduced motion skips the feedback beat, so the screen has already moved when the tap returns.
  expect(await form.locator("[data-progress-text]").textContent()).toBe("Step 3 of 4");
  await check("extra");
  await form.getByRole("button", { name: flowCopy.skip, exact: true }).click();
  await check("contact");
  // Reduced motion lands on the sent panel at once, with no timeline to wait for.
  await form.getByLabel("Name", { exact: true }).fill("A Visitor");
  await form.getByRole("button", { name: "Phone", exact: true }).click();
  await form.getByLabel("Phone number", { exact: true }).fill("573-555-0100");
  await form.getByRole("button", { name: flowCopy.submit, exact: true }).click();
  await expect(form.getByRole("status").filter({ hasText: flowCopy.sent })).toBeVisible({ timeout: 100 });
  await expect(form).toHaveAttribute("data-sent", "true", { timeout: 100 });
  await check("sent", false);
});


test("a failed delivery preserves the request and allows a successful retry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/contact?service=general");
  const form = flow(page);
  await form.getByRole("textbox").first().fill("A delivery retry test question");
  await form.getByRole("button", { name: "Next", exact: true }).click();
  await form.getByRole("textbox", { name: "Name", exact: true }).fill("Retry Visitor");
  await form.getByRole("button", { name: "Email", exact: true }).click();
  await form.getByRole("textbox", { name: "Email address", exact: true }).fill("visitor@example.com");
  await page.route("**/api/quote", route => route.fulfill({ status: 502, json: { error: quoteCopy.deliveryError } }));
  await form.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText(quoteCopy.deliveryError);
  await expect(form).toHaveAttribute("data-sent", "false");
  await expect(form.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("Retry Visitor");
  await page.unroute("**/api/quote");
  await page.route("**/api/quote", route => route.fulfill({ status: 200, json: { ok: true } }));
  await form.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(form).toHaveAttribute("data-sent", "true");
});
