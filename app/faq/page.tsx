import { pageMetadata } from "@/lib/seo";
import { pageCopy } from "@/content/pages";
import { FaqGroups } from "@/components/faq-groups";
import { ScrollCopy } from "@/components/scroll-copy";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FAQ() {
  return <><div className="site-container pt-12 pb-12"><h1 className="text-headline text-center">{pageCopy.faq.title}</h1></div><ScrollCopy><div className="site-container pb-section"><FaqGroups /><div className="page-ask"><p className="text-lead">Have a question you don’t see here?</p><Button asChild><Link href="/contact?service=general">Ask us</Link></Button></div></div></ScrollCopy></>;
}

export const metadata = pageMetadata("/faq");
