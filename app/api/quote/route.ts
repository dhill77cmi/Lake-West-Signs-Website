import { deliverQuote } from "@/lib/quote-delivery";

export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) { return deliverQuote(request); }
