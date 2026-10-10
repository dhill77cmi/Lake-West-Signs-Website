import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { pageCopy } from "@/content/pages";
import { services } from "@/content/services";
import { WorkFilter, WorkGallery } from "@/components/work-gallery";
import { ScrollCopy } from "@/components/scroll-copy";
import { Button } from "@/components/ui/button";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function Work({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const active = services.some((service) => service.id === params.service) ? (params.service as string) : "all";
  return <><div className="site-container pt-12 pb-12"><h1 className="text-headline text-center">{pageCopy.work.title}</h1></div>
    <div className="site-container"><WorkFilter active={active} /></div>
    {/* Keyed by filter: switching remounts the reveal, so the new photographs scroll in exactly as on first load. */}
    <ScrollCopy key={active}><div className="site-container pb-section">
      <WorkGallery active={active} />
      <div className="page-ask"><p className="text-lead">See something you like? Let’s make yours.</p><Button asChild><Link href="/contact">Contact us</Link></Button></div>
    </div></ScrollCopy>
  </>;
}

export const metadata = pageMetadata("/work");
