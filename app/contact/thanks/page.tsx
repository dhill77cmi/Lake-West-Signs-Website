import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { pageCopy } from "@/content/pages";
import { site } from "@/content/site";
import { PageIntro, ShopDetails } from "@/components/page-parts";
import { Button } from "@/components/ui/button";

export default function Thanks() {
  return <><PageIntro {...pageCopy.thanks} breadcrumb="Your inquiry" /><div className="site-container pb-section"><div className="max-w-prose"><p className="mb-6">{pageCopy.thanks.next}</p><Button asChild><a href={site.phoneHref}>Call {site.phone}</a></Button><div className="mt-8"><ShopDetails /></div><Link className="text-link mt-4" href="/#services-lineup">Explore the services</Link></div></div></>;
}

export const metadata = pageMetadata("/contact/thanks");
