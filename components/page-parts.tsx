import { ResponsiveImage } from "@/components/responsive-image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Brush, Car, ClipboardList, FileUp, Hammer, KeyRound, MessageSquareText, Package, Printer, Ruler, Search, Store } from "lucide-react";
import type { Project, ServiceId } from "@/content/types";
import type { Step, StepIcon } from "@/content/service-pages";
import { site } from "@/content/site";
import { actions } from "@/content/pages";
import { quoteCopy } from "@/content/quote";
import { formatHours } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { QuoteEntry } from "@/components/quote-entry";
import { EnquiryLayoutOptions } from "@/components/enquiry-layout-options";
import { seoPages } from "@/content/seo";
import { breadcrumbJsonLd } from "@/lib/schema";
import { JsonLd } from "@/components/json-ld";

export function Actions({ href = "/contact#quote", label = actions.quote, secondary }: { href?: string; label?: string; secondary?: { href: string; label: string } }) {
  return <div className="flex flex-wrap gap-3"><Button asChild><Link href={href}>{label}</Link></Button><Button asChild variant="outline">{secondary ? <Link href={secondary.href}>{secondary.label}</Link> : <a href={site.phoneHref}>Call {site.phone}</a>}</Button></div>;
}

export function ReviewLink() {
  return <a className="text-link" href={site.googleReviewsUrl}>Google {site.googleRating.toFixed(1)} · {site.googleReviewCount} reviews</a>;
}

export function ShopDetails() {
  return <div className="flex flex-col items-start gap-3">
    <a href={site.mapsUrl} className="text-link"><address className="not-italic">{site.address.street}<br />{site.address.city}, {site.address.region} {site.address.postal}</address></a>
    <div>{site.hours.map((hours) => <p key={hours.days.join()}>{formatHours(hours)}</p>)}</div>
    <a href={`mailto:${site.email}`} className="text-link wrap-anywhere">{site.email}</a>
  </div>;
}

export function Breadcrumbs({ current }: { current: string }) {
  const path = Object.keys(seoPages).find((path) => seoPages[path].breadcrumb === current);
  const parent = path === "/contact/thanks" ? { name: "Contact", path: "/contact" } : undefined;
  const trail = [{ name: "Home", path: "/" }, ...(parent ? [parent] : []), ...(path ? [{ name: current, path }] : [])];
  return <>{path && <JsonLd value={breadcrumbJsonLd(site.canonicalUrl, trail)} />}<nav aria-label="Breadcrumb" className="mb-8"><ol className="flex flex-wrap items-center gap-x-3 text-small text-muted-foreground">
    <li><Link className="text-link" href="/">Home</Link></li><li aria-hidden="true">/</li>
    {parent && <><li><Link className="text-link" href={parent.path}>{parent.name}</Link></li><li aria-hidden="true">/</li></>}
    <li aria-current="page">{current}</li>
  </ol></nav></>;
}

export function PageIntro({ title, intro, breadcrumb }: { title: string; intro: string; breadcrumb: string }) {
  return <div className="site-container pt-8 pb-12"><Breadcrumbs current={breadcrumb} /><div className="max-w-prose"><h1 className="text-display">{title}</h1><p className="mt-6 text-lead text-muted-foreground">{intro}</p></div></div>;
}

export function Photo({ project, priority = false, caption = true, sizes }: { project: Project; priority?: boolean; caption?: boolean; sizes?: string }) {
  return <figure className="min-w-0">
    <ResponsiveImage src={project.image.src} width={project.image.width} height={project.image.height} alt={project.alt} priority={priority} sizes={sizes} className="whole-photo" />
    {caption && <figcaption className="mt-3 text-small text-muted-foreground">{project.caption}</figcaption>}
  </figure>;
}

export function PhotoGrid({ projects }: { projects: Project[] }) {
  return <div className="photo-grid">{projects.map((project) => <Photo key={project.slug} project={project} />)}</div>;
}

// A sign board on a post, drawn to match the lucide icons beside it.
const SignBoard = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="6" width="20" height="10" rx="1" />
    <path d="M10 6V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3M10 16v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5" />
  </svg>
);
// A laser head and beam over the workpiece, using the same stroke as the other process icons.
const LaserEngraver = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 16V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11M12 3v3" />
    <rect x="9" y="6" width="6" height="4" rx="1" />
    <path d="m10 10 2 3 2-3M12 15v2m-3 1 1-1m5 1-1-1M6 21v-4M18 21v-4M2 21h20" />
  </svg>
);
const stepIcons: Record<StepIcon, React.ComponentType<React.SVGProps<SVGSVGElement>>> = { ClipboardList, MessageSquareText, Ruler, Brush, Hammer, SignBoard, LaserEngraver, Car, KeyRound, Package, Search, Store, FileUp, Printer };

// A service's steps in a row: an icon above a short phrase, wrapping on narrow screens.
export function StepGrid({ steps }: { steps: Step[] }) {
  return <ol className="step-grid">{steps.map(({ icon, text }) => { const Icon = stepIcons[icon]; return <li key={text}><Icon className="step-icon" aria-hidden="true" /><span className="text-label">{text}</span></li>; })}</ol>;
}

// Steps stacked, a small icon beside each phrase: Home's "Our Process" beside the quote form.
export function ProcessList({ steps }: { steps: Step[] }) {
  return <ol className="process-list">{steps.map(({ icon, text }) => { const Icon = stepIcons[icon]; return <li key={text}><Icon className="process-icon" aria-hidden="true" /><span className="text-label">{text}</span></li>; })}</ol>;
}

// Home supplies its process for guided-layout comparisons; classic mode keeps the sidebar.
// Service pages keep their centered quote form without process-layout controls.
export function EnquirySection({ service, title = quoteCopy.title, children }: { service?: ServiceId; title?: string; children?: ReactNode }) {
  if (children) return <EnquiryLayoutOptions title={title} service={service}>{children}</EnquiryLayoutOptions>;
  return <section id="quote" className="bg-muted py-section"><div className="site-container">
    <h2 className="text-headline text-center">{title}</h2>
    <div className="enquiry-form"><QuoteEntry initialService={service} /></div>
  </div></section>;
}

// A band is the same section on the muted full-width background the inquiry section uses.
export function ContentSection({ title, children, className = "", band = false }: { title: string; children: ReactNode; className?: string; band?: boolean }) {
  if (band) return <section className={`service-band mb-section bg-muted py-12 ${className}`}><div className="site-container"><h2 className="mb-6 text-center text-title">{title}</h2>{children}</div></section>;
  return <section className={`site-container pb-section ${className}`}><h2 className="mb-6 text-center text-title">{title}</h2>{children}</section>;
}
