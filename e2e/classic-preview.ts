import type { Page } from "@playwright/test";

export async function enableClassicPreview(page: Page) {
  await page.addInitScript(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("review", "1");
    window.history.replaceState(null, "", url);
    localStorage.setItem("lws-quote-flow", "classic");
  });
}
