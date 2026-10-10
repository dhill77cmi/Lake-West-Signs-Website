import { pageMetadata } from "@/lib/seo";
import { pageCopy } from "@/content/pages";
import { site } from "@/content/site";
import { ScrollCopy } from "@/components/scroll-copy";

// Laid out like About and FAQ: centered headline, then the copy in a centered column with title-sized section headings.
export default function Privacy() {
  const { privacy } = pageCopy;
  return <><div className="site-container pt-12 pb-12"><h1 className="text-headline text-center">{privacy.title}</h1></div>
    <ScrollCopy><div className="site-container pb-section"><div className="mx-auto flex max-w-prose flex-col gap-10">
      {privacy.sections.map((section) => <section key={section.title}><h2 className="text-title">{section.title}</h2><p className="mt-3 text-muted-foreground">{section.text}</p></section>)}
      <section><h2 className="text-title">Privacy questions</h2><div className="mt-3 flex flex-col items-start"><a className="text-link" href={site.phoneHref}>{site.phone}</a><a className="text-link wrap-anywhere" href={`mailto:${site.email}`}>{site.email}</a></div></section>
    </div></div></ScrollCopy>
  </>;
}

export const metadata = pageMetadata("/privacy");
