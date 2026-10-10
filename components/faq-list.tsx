"use client";

import type { Faq } from "@/content/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FaqList({ items, headingLevel = 3 }: { items: Faq[]; headingLevel?: 2 | 3 }) {
  return <Accordion type="multiple">{items.map((item) => <AccordionItem key={item.q} value={item.q}>
    <AccordionTrigger headingLevel={headingLevel}>{item.q}</AccordionTrigger><AccordionContent><p>{item.a}</p>{item.source && <a className="text-link mt-3" href={item.source.href}>{item.source.label}</a>}</AccordionContent>
  </AccordionItem>)}</Accordion>;
}
