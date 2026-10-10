import { createHash } from "node:crypto";
import { quoteCopy } from "../content/quote";
import { site } from "../content/site";
import { services } from "../content/services";
import { detailQuestions, flowCopy, type FlowService } from "../content/quote-flow";
import { isChoice, visibleQuestions } from "./quote-flow";
import { validateContact, validateFiles } from "./quote";

const maxBody = quoteCopy.maxFileBytes + 100_000;
// Best-effort per-instance throttle, in addition to origin checks and the honeypot.
// A distributed edge limit can be added if the site attracts sustained abuse.
const attempts = new Map<string, { count: number; until: number }>();
const reply = (status: number, error?: string) => Response.json(error ? { error } : { ok: true }, { status, headers: { "Cache-Control": "no-store" } });

export async function deliverQuote(request: Request, send: typeof fetch = fetch): Promise<Response> {
  const origin = request.headers.get("origin");
  const allowed = [new URL(request.url).origin, "https://lakewestsigns.com", "https://www.lakewestsigns.com"];
  if (!origin || !allowed.includes(origin)) return reply(403, "Please submit this request from our website.");
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) return reply(415, "Please use the quote form.");
  if (Number(request.headers.get("content-length")) > maxBody) return reply(413, quoteCopy.errors.fileSize);
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const ip = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "unknown";
  const key = createHash("sha256").update(ip).digest("hex");
  const bucket = attempts.get(key) || { count: 0, until: now + 600_000 };
  if (bucket.count >= 10 || attempts.size > 10_000) return reply(429, "Too many attempts. Please wait a few minutes or call the shop.");
  bucket.count++; attempts.set(key, bucket);
  let data: FormData;
  try {
    // Enforce the bound even when Content-Length is missing or inaccurate.
    const reader = request.body?.getReader();
    if (!reader) return reply(400, "The request is empty.");
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maxBody) { await reader.cancel(); return reply(413, quoteCopy.errors.fileSize); }
      chunks.push(value);
    }
    data = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
  } catch { return reply(400, "We couldn't read the request. Please try again."); }
  const read = (name: string) => typeof data.get(name) === "string" ? String(data.get(name)).trim() : "";
  if (read("companyWebsite")) return reply(200);
  if ([...data.values()].some(value => typeof value === "string" && value.length > 10_000) || [...data].length > 40) return reply(400, "Please shorten your project details.");
  const errors = validateContact(data);
  if (Object.keys(errors).length) return reply(400, Object.values(errors)[0]);
  if (read("name").length > 150 || read("contactDetail").length > 254) return reply(400, "Please check your contact details.");
  const service = read("service") as FlowService;
  if (!Object.hasOwn(detailQuestions, service)) return reply(400, quoteCopy.errors.service);
  const answers = Object.fromEntries([...data].filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  if (read("formVersion") === "2" && service !== "general") {
    if (visibleQuestions(service, answers).some(q => isChoice(q) && !q.choices.some(c => c.value === read(q.name))) || !flowCopy.timing.choices.some(c => c.value === read("timing"))) return reply(400, "Please complete the project and timing questions.");
  } else if (!read("message")) return reply(400, quoteCopy.errors.message);
  const files = data.getAll("files").filter((file): file is File => typeof file !== "string" && file.size > 0);
  const fileError = validateFiles(files);
  if (fileError) return reply(400, fileError);
  if (files.length > 5) return reply(400, "Please attach no more than 5 files.");
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return reply(503, quoteCopy.deliveryError);
  const label = services.find(s => s.id === service)?.name || (service === "general" ? "General inquiry" : "Custom project");
  const lines = [`New website inquiry: ${label}`, `Name: ${read("name")}`, `Preferred contact: ${read("contactMethod")}`, `Contact: ${read("contactDetail")}`];
  if (read("product")) lines.push(`Product: ${read("product")}`);
  for (const q of visibleQuestions(service, answers)) {
    const value = isChoice(q) ? q.choices.find(c => c.value === read(q.name))?.label : read(q.name);
    if (value) lines.push(`${q.label}: ${value}`);
  }
  if (read("timing")) lines.push(`Timing: ${flowCopy.timing.choices.find(c => c.value === read("timing"))?.label || read("timing")}`);
  if (read("order")) lines.push(`Existing order: ${read("order")}`);
  lines.push(`Message:\n${read("message") || "No additional notes."}`, `Attachments: ${files.length}`, "Sent through the Lake West Signs website. This is an inquiry, not an order.");
  const payload = {
    from: "Lake West Signs Website <website@quotes.lakewestsigns.com>", to: [site.email],
    ...(read("contactMethod") === "email" ? { reply_to: read("contactDetail") } : {}),
    subject: `Website inquiry — ${label}`, text: lines.join("\n\n"),
    attachments: await Promise.all(files.map(async file => ({ filename: file.name.replace(/[\\/\r\n\x00-\x1f]/g, "_").slice(-150), content: Buffer.from(await file.arrayBuffer()).toString("base64") }))),
  };
  const body = JSON.stringify(payload);
  const idempotency = createHash("sha256").update(read("requestId") + body).digest("hex");
  try {
    const response = await send("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `quote-${idempotency}` }, body, signal: AbortSignal.timeout(20_000) });
    const result = await response.json();
    if (!response.ok || !result.id) return reply(502, quoteCopy.deliveryError);
    return reply(200);
  } catch { return reply(502, quoteCopy.deliveryError); }
}
