import { afterEach, expect, it, vi } from "vitest";
import { analyticsPageUrl, trackQuoteSuccess } from "./analytics";
import { sendQuote } from "./send-quote";

afterEach(() => vi.unstubAllGlobals());
it("strips query strings and fragments from measured URLs", () => {
  expect(analyticsPageUrl("https://lakewestsigns.com/contact?email=private@example.com#notes")).toBe("https://lakewestsigns.com/contact");
  expect(analyticsPageUrl("invalid")).toBe("");
});
it("only records allowlisted service categories", () => {
  const gtag = vi.fn(); vi.stubGlobal("window", { gtag, lwsAnalyticsId: "G-TEST" });
  trackQuoteSuccess("residential"); trackQuoteSuccess("private@example.com");
  expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "generate_lead", { service_category: "residential", send_to: "G-TEST" });
});
it("does not count a failed quote, and excludes contact details from a successful event", async () => {
  const gtag = vi.fn(); vi.stubGlobal("window", { gtag, lwsAnalyticsId: "G-TEST" });
  const data = new FormData(); data.set("service", "general"); data.set("name", "Private name"); data.set("contactDetail", "private@example.com");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json({ error: "failed" }, { status: 502 })).mockResolvedValueOnce(Response.json({ ok: true })));
  await expect(sendQuote(data, "test")).rejects.toThrow(); expect(gtag).not.toHaveBeenCalled();
  await sendQuote(data, "test");
  expect(gtag).toHaveBeenCalledTimes(1); expect(JSON.stringify(gtag.mock.calls)).not.toContain("Private"); expect(JSON.stringify(gtag.mock.calls)).not.toContain("private@example.com");
});
