import { notFound } from "next/navigation";
import { services } from "@/content/services";
import { ServicePage } from "@/components/service-details";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/schema";
import { site } from "@/content/site";
import { servicePages } from "@/content/service-pages";
import { JsonLd } from "@/components/json-ld";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!services.some((service) => service.slug === slug)) notFound();
  return pageMetadata(`/services/${slug}`);
}

export function generateStaticParams() { return services.map(({ slug }) => ({ slug })); }

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  if (!service) notFound();
  // Breadcrumb data feeds the search-result path; the page itself shows no trail.
  const trail = [{ name: "Home", path: "/" }, { name: service.name, path: `/services/${service.slug}` }];
  return <><JsonLd value={serviceJsonLd(site, service, servicePages[service.id].intro)} /><JsonLd value={breadcrumbJsonLd(site.canonicalUrl, trail)} /><ServicePage service={service} /></>;
}
