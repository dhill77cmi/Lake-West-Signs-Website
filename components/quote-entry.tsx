"use client";

import { useEffect, useState } from "react";
import { DesignOptionSwitch } from "@/components/design-option-switch";
import { quoteFlowEvent, quoteFlowKey } from "@/lib/quote-preference";
import { services } from "@/content/services";
import { QuoteForm } from "@/components/quote-form";
import { QuoteFlow } from "@/components/quote-flow";
import { isDesignPreview } from "@/lib/design-preview";
import type { FlowService } from "@/content/quote-flow";

export { quoteFlowEvent, quoteFlowKey } from "@/lib/quote-preference";

type Requested = FlowService;

// The approved site always uses the quiz; the classic form remains available in explicit previews.
export function QuoteEntry({ initialService, product, headingLevel = 3 }: { initialService?: Requested; product?: string; headingLevel?: 2 | 3 }) {
  const [classic, setClassic] = useState(false);
  useEffect(() => {
    const read = () => { try { setClassic(isDesignPreview() && localStorage.getItem(quoteFlowKey) === "classic"); } catch { /* Storage is optional. */ } };
    read();
    window.addEventListener(quoteFlowEvent, read);
    return () => window.removeEventListener(quoteFlowEvent, read);
  }, []);

  // "Custom" lands on its details screen and "Ask us" on the question screen, each with a "Change" link like a known service.
  return <div className="quote-preview"><DesignOptionSwitch section="quote" />{classic ? <QuoteForm initialService={initialService} product={product} /> : <QuoteFlow initialService={initialService} product={product} headingLevel={headingLevel} />}</div>;
}

// Search params arrive from the page on the server, so the form hydrates with the rest of the page (no Suspense).
export function ContactQuoteEntry({ requested, requestedProduct }: { requested?: string; requestedProduct?: string }) {
  const service = services.find((item) => item.id === requested);
  // Only recognized products can prefill a request; arbitrary URL text is never shown.
  const product = service?.prices?.find((item) => item.label === requestedProduct)?.label;
  const initial = service?.id ?? (requested === "general" || requested === "unsure" ? requested : undefined);
  return <QuoteEntry key={`${initial}-${product}`} initialService={initial} product={product} headingLevel={2} />;
}
