import { quoteCopy } from "../content/quote";
import { trackQuoteSuccess } from "./analytics";

export async function sendQuote(data: FormData, requestId: string): Promise<void> {
  data.set("requestId", requestId);
  const response = await fetch("/api/quote", { method: "POST", body: data, signal: AbortSignal.timeout(30_000) }).catch(() => { throw new Error(quoteCopy.deliveryError); });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.ok !== true) throw new Error(result?.error || quoteCopy.deliveryError);
  if (!data.get("companyWebsite")) trackQuoteSuccess(String(data.get("service") || ""));
}
