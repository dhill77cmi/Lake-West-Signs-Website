import type { Hours, Price } from "@/content/types";
import { priceCopy } from "@/content/services";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// A starting price reads "$300+" in a price list and "from $300" in running copy; a fixed rate reads "$85/hr"
// (a unit starting with "/" attaches, any other follows a space).
export function formatPrice(p: Price, style: "plus" | "from" = "plus"): string {
  if (p.confirmed === false) return style === "from" ? `from ${priceCopy.pending}` : priceCopy.pending;
  const starting = style === "from" ? `from ${usd.format(p.from)}` : `${usd.format(p.from)}+`;
  const base = p.to
    ? `${usd.format(p.from)} – ${usd.format(p.to)}${p.plus ? "+" : ""}`
    : p.fixed ? usd.format(p.from) : starting;
  return p.unit ? `${base}${p.unit.startsWith("/") ? "" : " "}${p.unit}` : base;
}

function formatTime(t: string): string {
  const [h, m] = t.split(":");
  const hour24 = Number(h);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minutes = m === "00" ? "" : `:${m}`;
  return `${hour12}${minutes} ${period}`;
}

export function formatHours(h: Hours): string {
  const days = h.days.length > 1 ? `${h.days[0]}–${h.days[h.days.length - 1]}` : h.days[0];
  return `${days}, ${formatTime(h.open)} – ${formatTime(h.close)}`;
}
