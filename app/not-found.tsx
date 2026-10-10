import Link from "next/link";
import { pageCopy } from "@/content/pages";
import { Actions, PageIntro } from "@/components/page-parts";
import { site } from "@/content/site";

export const metadata = {
  title: { absolute: `${pageCopy.notFound.title} | ${site.fullName}` },
  description: pageCopy.notFound.intro,
};

export default function NotFound() {
  return <><PageIntro {...pageCopy.notFound} breadcrumb="Page not found" /><div className="site-container pb-section"><Actions /><div className="mt-6 flex flex-wrap gap-6"><Link className="text-link" href="/">Back to home</Link><Link className="text-link" href="/#services-lineup">Explore services</Link></div></div></>;
}
