import { expect, test } from "@playwright/test";

for (const width of [320, 1440]) {
  test(`process alternatives preserve the quiz and fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?review=1#quote");
    const section = page.locator("#quote");
    const picker = section.getByLabel("Process placement", { exact: true });
    const form = section.getByRole("form", { name: "Guided quote request" });
    await form.getByRole("button", { name: "Ask a question", exact: true }).click();
    const question = form.getByRole("textbox", { name: "What would you like to know?" });
    await question.fill("Can you help me choose a sign?");
    for (const placement of ["above", "sidebar"]) {
      await picker.selectOption(placement);
      await expect(section).toHaveAttribute("data-process-placement", placement);
      await expect(question).toHaveValue("Can you help me choose a sign?");
      await expect(section.getByRole("heading", { name: "Our Process", exact: true })).toHaveCount(placement === "above" ? 0 : 1);
      const process = (await section.locator(".enquiry-process").boundingBox())!;
      const quiz = (await section.locator(".enquiry-comparison-quiz").boundingBox())!;
      const title = (await section.locator(".enquiry-comparison-title").boundingBox())!;
      if (placement === "above") { expect(process.y).toBeGreaterThan(title.y); expect(process.y + process.height).toBeLessThanOrEqual(quiz.y); }
      if (placement === "sidebar" && width === 1440) expect(process.x + process.width).toBeLessThanOrEqual(quiz.x);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
    await picker.selectOption("above");
    await section.getByRole("button", { name: "Classic quote form instead of the guided flow", exact: true }).click();
    await expect(picker).toHaveCount(0);
    await expect(section).toHaveAttribute("data-process-placement", "sidebar");
    await expect(section.getByRole("form", { name: "Project inquiry" })).toBeVisible();
    await section.getByRole("button", { name: "Classic quote form instead of the guided flow", exact: true }).click();
    await expect(picker).toHaveValue("above");
    await page.reload();
    await expect(picker).toHaveValue("above");
  });
}
