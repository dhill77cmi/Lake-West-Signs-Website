import { faqGroups } from "@/content/faq";
import type { Faq } from "@/content/types";
import { FaqIndex } from "@/components/faq-index";

// Question left, answer right, every answer visible.
export function FaqRows({ items }: { items: Faq[] }) {
  return items.map((item) => <div key={item.q} className="faq-row">
    <h3 className="faq-question">{item.q}</h3>
    <div className="faq-answer"><p>{item.a}</p>{item.source && <a className="text-link mt-3" href={item.source.href}>{item.source.label}</a>}</div>
  </div>);
}

// Every answer stays visible: a category index jumps to its group, rows read question left, answer right.
export function FaqGroups() {
  return <div className="faq-layout">
    <FaqIndex groups={faqGroups.map(({ id, title }) => ({ id, title }))} />
    <div>
      {faqGroups.map((group) => <section key={group.id} id={`faq-${group.id}`} className="faq-group" aria-labelledby={`faq-${group.id}-title`}>
        <h2 id={`faq-${group.id}-title`} className="faq-group-title">{group.title}</h2>
        <FaqRows items={group.items} />
      </section>)}
    </div>
  </div>;
}
