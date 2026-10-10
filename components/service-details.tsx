import Link from "next/link";
import { servicePages } from "@/content/service-pages";
import { actions, pageCopy } from "@/content/pages";
import type { Service } from "@/content/types";
import { featuredWork, publishedPhoto } from "@/content/work";
import { PriceValue, ServiceStartingPriceLine } from "@/components/price";
import { Button } from "@/components/ui/button";
import { FaqRows } from "@/components/faq-groups";
import { PhotoRail } from "@/components/photo-rail";
import { ScrollCopy } from "@/components/scroll-copy";
import { ContentSection, EnquirySection, Photo, StepGrid } from "@/components/page-parts";

// A ledger in a rounded panel: product and price joined by a dotted leader, notes and request links underneath.
function Prices({ service, band = false }: { service: Service; band?: boolean }) {
  if (!service.prices?.length) return null;
  return <ContentSection title={service.pricesHeading ?? service.name} band={band}>
    <div id="prices" className="price-ledger">{service.prices.map((price) => <div className="price-row" key={price.label}>
      <div className="price-line"><h3 className="text-title">{price.label}</h3><span className="price-leader" aria-hidden="true" /><p className="text-title price-value"><PriceValue price={price} /></p></div>
      {price.note && <div className="price-under"><p className="text-small text-muted-foreground">{price.note}</p></div>}
    </div>)}</div>
  </ContentSection>;
}

function Options({ service, band = false }: { service: Service; band?: boolean }) {
  const content = servicePages[service.id];
  if (!content.options.length) return null;
  return <ContentSection title={content.optionsHeading} band={band}><div className="option-list">{content.options.map((option) => <div key={option.title}><h3 className="text-title">{option.title}</h3><p className="mt-3 text-muted-foreground">{option.text}</p></div>)}</div></ContentSection>;
}

// Header photographs come from the homepage hero set: the same edited 1600×900 derivatives, one per service that has one.
// `base` is the published gallery record the header borrows its project fields from.
const headerPhotos: Partial<Record<Service["id"], { base: string; src: string; alt: string }>> = {
  commercial: { base: "tavernsign", src: "/work/hero/signage7.webp", alt: "Animal Hospital storefront signage" },
  residential: { base: "res2", src: "/work/lineup/res2-front.webp", alt: "Sixteen Sandals dock address sign" },
  vehicles: { base: "bedrock", src: "/work/hero/czvan.webp", alt: "Comfort Zone van wrap and lettering" },
  print: { base: "signage2", src: "/work/hero/signage2.webp", alt: "Green and yellow property sign on posts" },
  engraving: { base: "lake-map-slice", src: "/work/lineup/engraving-wide.webp", alt: "A lake map engraved into a wood slice" },
};

// Extra "Work from the shop" photographs for services with no gallery records yet, borrowed from the hero set.
const galleryExtras: Partial<Record<Service["id"], { base: string; src: string; alt: string }[]>> = {
};

export function ServicePage({ service }: { service: Service }) {
  const content = servicePages[service.id];
  const header = headerPhotos[service.id];
  const photo = header ? { ...publishedPhoto(header.base), alt: header.alt, image: { src: header.src, width: 1600, height: 900 } } : undefined;
  const work = [...featuredWork.filter((project) => project.service === service.id),
    ...(galleryExtras[service.id] ?? []).map((extra) => ({ ...publishedPhoto(extra.base), slug: `${service.id}-${extra.src}`, service: service.id, alt: extra.alt, caption: extra.alt, image: { src: extra.src, width: 1600, height: 900 } }))];
  // Laid out like Our Work / FAQ / Contact: centered headline, title-sized sections, muted body text.
  return <>
    {/* Header: the muted band runs from under the site header; the title block and the copy band read as one. The lead photo hangs over the band's bottom edge. */}
    <div className="service-header-top"><div className="site-container pt-12 pb-12"><h1 className="text-headline text-center">{content.title}</h1></div></div>
    <ScrollCopy><div>
    <section className="service-header"><div className="site-container service-header-grid">
      <div><p className="text-lead text-muted-foreground">{content.intro}</p><p className="my-6 text-title"><ServiceStartingPriceLine service={service} /></p>
        <Button asChild><Link href={`/contact?service=${service.id}#quote`}>{actions.quote}</Link></Button>
      </div>
      {photo && <div className="service-header-photo"><Photo project={photo} priority caption={false} /></div>}
    </div></section>
    {/* Blueprint §23 order: what you can get, what it costs, what it looks like, what we need, how it goes, questions, ask. */}
    {/* The section right under the header is gray so the lead photograph hangs from white into it. */}
    <Options service={service} band />
    <Prices service={service} band={!content.options.length} />
    <ContentSection title="Work from the shop">{work.length > 0
      ? <PhotoRail projects={work} more={{ href: `/work?service=${service.id}`, label: `More ${service.name.toLowerCase()}` }} />
      : <p className="max-w-prose text-muted-foreground">{pageCopy.work.emptyCategory} <Link className="text-link" href={`/contact?service=${service.id}`}>Ask us</Link></p>}
    </ContentSection>
    <ContentSection title="From your idea to the finished job" band><StepGrid steps={content.steps} /></ContentSection>
    <ContentSection title={`Frequently asked questions about ${service.name.toLowerCase()}`}><FaqRows items={content.faqs} /></ContentSection>
    <EnquirySection service={service.id} title={content.enquiryTitle} />
    </div></ScrollCopy>
  </>;
}
