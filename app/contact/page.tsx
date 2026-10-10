import { pageMetadata } from "@/lib/seo";
import { pageCopy } from "@/content/pages";
import { quoteTerms } from "@/content/faq";
import { site } from "@/content/site";
import { formatHours } from "@/lib/format";
import { ContactQuoteEntry } from "@/components/quote-entry";
import { ScrollCopy } from "@/components/scroll-copy";
import { ShopMap } from "@/components/shop-map";

type Search = Promise<Record<string, string | string[] | undefined>>;
const single = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

export default async function Contact({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  return <ScrollCopy revealAll><section id="quote" className="pt-12 pb-section"><div className="site-container enquiry-layout contact-layout titled-grid">
    <div><h1 className="text-headline">{pageCopy.contact.title}</h1></div>
    <div><p className="mb-6 max-w-prose text-muted-foreground">{pageCopy.contact.intro} {quoteTerms.onSiteSurvey}</p><ContactQuoteEntry requested={single(params.service)} requestedProduct={single(params.product)} /></div>
    <aside className="contact-aside">
      <div className="shop-map-frame" data-scroll-reveal><ShopMap /></div>
      <div className="contact-details">
        <a href={site.phoneHref} className="text-link">{site.phone}</a>
        <a href={`mailto:${site.email}`} className="text-link wrap-anywhere">{site.email}</a>
        <a href={site.mapsUrl} className="text-link"><address className="not-italic">{site.address.street}, {site.address.city}, {site.address.region} {site.address.postal}</address></a>
        {site.hours.map((hours) => <p key={hours.days.join()}>{formatHours(hours)}</p>)}
      </div>
    </aside>
  </div></section></ScrollCopy>;
}

export const metadata = pageMetadata("/contact");
