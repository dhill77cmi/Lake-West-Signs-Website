import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Do not send synthetic browser-test traffic to Google.
  await page.route("https://www.googletagmanager.com/**", route => route.fulfill({ status: 200, contentType: "text/javascript", body: "/* Analytics transport mocked */" }));
});

test("one sanitized page view per route and one lead only after confirmed delivery", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/contact?service=general&email=private@example.com#private");
  const events = () => page.evaluate(() => ((window as unknown as { dataLayer: IArguments[] }).dataLayer || []).map(item => Array.from(item)));
  await expect.poll(async () => (await events()).filter(e => e[1] === "page_view").length).toBe(1);
  expect(JSON.stringify(await events())).not.toContain("private@example.com");
  const form = page.getByRole("form", { name: "Guided quote request" });
  await form.getByRole("textbox").first().fill("Private question contents");
  await form.getByRole("button", { name: "Next", exact: true }).click();
  await form.getByRole("textbox", { name: "Name", exact: true }).fill("Private Visitor");
  await form.getByRole("button", { name: "Email", exact: true }).click();
  await form.getByRole("textbox", { name: "Email address", exact: true }).fill("private@example.com");
  await page.route("**/api/quote", route => route.fulfill({ status: 502, json: { error: "Please retry." } }));
  await form.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(form.getByRole("alert")).toBeVisible();
  expect((await events()).filter(e => e[1] === "generate_lead")).toHaveLength(0);
  await page.unroute("**/api/quote");
  await page.route("**/api/quote", route => route.fulfill({ status: 200, json: { ok: true } }));
  await form.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(form).toHaveAttribute("data-sent", "true");
  expect((await events()).filter(e => e[1] === "generate_lead")).toHaveLength(1);
  expect(JSON.stringify(await events())).not.toMatch(/Private|private@example|private#/);
  await page.getByRole("banner").getByRole("link", { name: "About Us", exact: true }).click();
  await expect.poll(async () => (await events()).filter(e => e[1] === "page_view").length).toBe(2);
  await expect(page.locator('script#google-analytics')).toHaveCount(1);
});

test("honors browser privacy signals", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { value: true }));
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('script#google-analytics')).toHaveCount(0);
});

test("excludes preview deployments without a browser privacy signal", async ({ page }) => {
  await page.goto("http://localhost:8111/contact");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('script#google-analytics')).toHaveCount(0);
});
