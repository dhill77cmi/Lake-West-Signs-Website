import { afterEach, describe, expect, it, vi } from "vitest";
import { deliverQuote } from "./quote-delivery";
import { site } from "../content/site";

let sequence = 0;
function request(fields: Record<string, string> = {}, file?: File, headers: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({ name: "Test Visitor", contactMethod: "email", contactDetail: "visitor@example.com", service: "general", message: "A test question", formVersion: "2", requestId: "test-request", ...fields }).forEach(([key, value]) => data.set(key, value));
  if (file) data.append("files", file);
  return new Request("https://lakewestsigns.com/api/quote", { method: "POST", headers: { origin: "https://lakewestsigns.com", "x-vercel-forwarded-for": `test-${sequence++}`, ...headers }, body: data });
}
afterEach(() => vi.unstubAllEnvs());
describe("quote delivery", () => {
  it("sends full details and real attachment bytes only to the configured shop, with reply-to", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-secret");
    const send = vi.fn().mockResolvedValue(Response.json({ id: "email-id" }));
    const response = await deliverQuote(request({ to: "attacker@example.com" }, new File(["%PDF-test"], "proof.pdf", { type: "application/pdf" })), send);
    expect(response.status).toBe(200);
    const payload = JSON.parse(send.mock.calls[0][1].body);
    expect(payload.to).toEqual([site.email]);
    expect(payload.reply_to).toBe("visitor@example.com");
    expect(payload.text).toContain("A test question");
    expect(Buffer.from(payload.attachments[0].content, "base64").toString()).toBe("%PDF-test");
  });
  it("rejects missing quiz choices and invalid contact details before sending", async () => {
    const send = vi.fn();
    expect((await deliverQuote(request({ service: "commercial" }), send)).status).toBe(400);
    expect((await deliverQuote(request({ contactDetail: "bad" }), send)).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
  it("delivers labeled quiz answers, product and phone contact without a forged reply-to", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-secret");
    const send = vi.fn().mockResolvedValue(Response.json({ id: "email-id" }));
    expect((await deliverQuote(request({ service: "residential", kind: "dock", delivery: "pickup", quantity: "2", timing: "month", wording: "TEST DOCK", product: "Standard dock signs", contactMethod: "phone", contactDetail: "573-555-0100" }), send)).status).toBe(200);
    const payload = JSON.parse(send.mock.calls[0][1].body);
    expect(payload.reply_to).toBeUndefined();
    for (const value of ["Dock sign", "Standard dock signs", "Within a month", "TEST DOCK", "573-555-0100"]) expect(payload.text).toContain(value);
  });
  it("rejects oversized request bodies even without Content-Length", async () => {
    const send = vi.fn();
    const response = await deliverQuote(request({}, new File([new Uint8Array(3 * 1024 * 1024 + 110_000)], "big.pdf")), send);
    expect(response.status).toBe(413);
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects cross-origin requests and spoofed executable image uploads", async () => {
    const send = vi.fn();
    expect((await deliverQuote(request({}, undefined, { origin: "https://other.example" }), send)).status).toBe(403);
    expect((await deliverQuote(request({}, new File(["bad"], "bad.exe", { type: "image/png" })), send)).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
  it("silently discards honeypot submissions", async () => {
    const send = vi.fn();
    expect((await deliverQuote(request({ companyWebsite: "spam" }), send)).status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });
  it("fails honestly when configuration or the email provider fails", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect((await deliverQuote(request())).status).toBe(503);
    vi.stubEnv("RESEND_API_KEY", "test-secret");
    expect((await deliverQuote(request(), vi.fn().mockResolvedValue(Response.json({ error: "failed" }, { status: 429 })))) .status).toBe(502);
    expect((await deliverQuote(request(), vi.fn().mockRejectedValue(new Error("timeout")))).status).toBe(502);
  });
  it("uses the same provider idempotency key for a retry and changes it for changed details", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-secret");
    const send = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ id: "email-id" })));
    await deliverQuote(request(), send); await deliverQuote(request(), send);
    await deliverQuote(request({ message: "Changed" }), send);
    const keys = send.mock.calls.map(call => call[1].headers["Idempotency-Key"]);
    expect(keys[0]).toBe(keys[1]); expect(keys[2]).not.toBe(keys[0]);
  });
  it("caps attempts from the same address", async () => {
    const send = vi.fn();
    for (let i = 0; i < 10; i++) await deliverQuote(request({ companyWebsite: "spam" }, undefined, { "x-vercel-forwarded-for": "rate-test" }), send);
    expect((await deliverQuote(request({}, undefined, { "x-vercel-forwarded-for": "rate-test" }), send)).status).toBe(429);
  });
});
