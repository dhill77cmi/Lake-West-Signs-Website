"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { QuoteEntry } from "@/components/quote-entry";
import { quoteFlowEvent, quoteFlowKey } from "@/lib/quote-preference";
import type { ServiceId } from "@/content/types";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isDesignPreview } from "@/lib/design-preview";

const placements = {
  above: "Below the title",
  sidebar: "Original sidebar",
} as const;
type Placement = keyof typeof placements;
const preferenceKey = "lws-process-placement";

export function EnquiryLayoutOptions({ title, service, children }: { title: string; service?: ServiceId; children: ReactNode }) {
  const selectId = useId();
  const [classic, setClassic] = useState(false);
  const [preview, setPreview] = useState(false);
  const [placement, setPlacement] = useState<Placement>("above");
  useEffect(() => { ScrollTrigger.refresh(); }, [placement, classic]);
  useEffect(() => {
    setPreview(isDesignPreview());
    const readForm = () => {
      try { setClassic(isDesignPreview() && localStorage.getItem(quoteFlowKey) === "classic"); } catch { /* Browser preferences are optional. */ }
    };
    readForm();
    try {
      const saved = isDesignPreview() ? localStorage.getItem(preferenceKey) : null;
      if (saved && Object.hasOwn(placements, saved)) setPlacement(saved as Placement);
    } catch { /* Keep the default when storage is unavailable. */ }
    window.addEventListener(quoteFlowEvent, readForm);
    return () => window.removeEventListener(quoteFlowEvent, readForm);
  }, []);

  return <section id="quote" className="bg-muted py-section enquiry-comparison" data-process-placement={classic ? "sidebar" : placement} data-quote-style={classic ? "classic" : "guided"}>
    <div className="site-container enquiry-comparison-layout">
      <h2 className="text-headline enquiry-comparison-title">{title}</h2>
      {preview && !classic && <aside className="design-options process-design-options" data-design-options="process" aria-label="Our Process placement options">
        <div className="design-options-copy"><p className="design-options-title">Try a different place for Our Process</p><p>Compare these layouts with the guided quiz. Your answers stay in place.</p></div>
        <div className="process-placement-label"><label htmlFor={selectId}>Process placement</label>
          <select id={selectId} className="ui-control" value={placement} onChange={(event) => {
            const next = event.target.value as Placement;
            setPlacement(next);
            try { localStorage.setItem(preferenceKey, next); } catch { /* The preview still works without storage. */ }
          }}>
            {Object.entries(placements).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </aside>}
      <div className="enquiry-process">{children}</div>
      <div className="enquiry-comparison-quiz"><QuoteEntry initialService={service} /></div>
    </div>
  </section>;
}
