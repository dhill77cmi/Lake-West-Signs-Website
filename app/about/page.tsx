import { ResponsiveImage } from "@/components/responsive-image";
import { pageMetadata } from "@/lib/seo";
import { pageCopy } from "@/content/pages";
import { ScrollCopy } from "@/components/scroll-copy";

// The shop front, photographed by the shop; shown whole, never cropped.
const SHOP_FRONT = { width: 2000, height: 1286 };

export default function About() {
  const { about } = pageCopy;
  return <><div className="site-container pt-12 pb-12"><h1 className="text-headline text-center">{about.title}</h1></div>
    <ScrollCopy><div className="site-container pb-section">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">{about.story.map((paragraph) => <p key={paragraph.slice(0, 24)} className="max-w-prose text-lead">{paragraph}</p>)}</div>
        <figure className="about-photo-slot" data-scroll-reveal><ResponsiveImage src="/shop-front.jpg" width={SHOP_FRONT.width} height={SHOP_FRONT.height} alt={about.buildingLabel} className="about-photo" /></figure>
      </div>
      <ul className="accreditation-list" aria-label={about.accreditationsTitle}>{about.accreditations.map((item) => <li key={item.name} className="accreditation">
        <ResponsiveImage src={item.logo} alt={item.logoAlt} width={400} height={124} sizes="(min-width: 1000px) 200px, (min-width: 560px) 20vw, 112px" className="chamber-logo" />
      </li>)}</ul>
    </div></ScrollCopy>
  </>;
}

export const metadata = pageMetadata("/about");
