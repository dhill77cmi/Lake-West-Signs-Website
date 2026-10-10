import { TrustedBy } from "@/components/trusted-by";
import { ScrollCopy } from "@/components/scroll-copy";
import { HeroMoment } from "@/components/hero-moment";
import { Barlow_Condensed, Caveat } from "next/font/google";
import { DesignOptionSwitch } from "@/components/design-option-switch";
import Link from "next/link";
import { ServiceLineup } from "@/components/service-lineup";
import { services } from "@/content/services";
import { home } from "@/content/pages";
import { publishedPhoto } from "@/content/work";
import { ReviewRail } from "@/components/review-rail";
import { Actions, EnquirySection, Photo, ProcessList } from "@/components/page-parts";
const heroDisplay = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const heroAccent = Caveat({ subsets: ["latin"], weight: "700", variable: "--font-caveat", display: "swap" });

export function HomePage({ heroLayout = "split" }: { heroLayout?: "split" | "full" }) {
  return <>
    <section className={`${heroDisplay.variable} ${heroAccent.variable} mb-section`} aria-label="Lake West Signs introduction">
      <HeroMoment key={heroLayout} layout={heroLayout}>
        {/* Arriving from another page, the hero copy reveals like every other page's headline; during the intro it plays unseen and the intro's own fade takes over. */}
        <ScrollCopy revealAll>
        <div><h1 className="hero-title">{home.headline.split(/(you)/i).map((part, index) => part.toLowerCase() === "you" ? <span key={index} className="hero-title-you">{part}</span> : part)}</h1><p className="mt-6 max-w-prose text-lead">{home.intro}</p></div>
        <Actions href="/contact" secondary={{ href: "/work", label: "View our work" }} />
        </ScrollCopy>
      </HeroMoment>

    </section>
    <div className="site-container"><DesignOptionSwitch section="text" /></div>
    <ScrollCopy>
    <section id="services-lineup" className={`${heroDisplay.variable} ${heroAccent.variable} home-services-section pb-section`}>
      <h2 className="mb-8 text-headline">{home.servicesTitle}</h2>
      <DesignOptionSwitch section="services" />
      <ServiceLineup>
      {services.map((service) => <article key={service.id} className="home-service-card" aria-labelledby={`home-service-${service.id}`}>
        <Link href={`/services/${service.slug}`} className="home-service-media" aria-label={`Explore ${service.name}`}>
          {service.id === "print" ? <Photo project={{ ...publishedPhoto("signage2"), alt: "Green and yellow property sign on posts", image: { src: "/work/hero/signage2.webp", width: 1600, height: 900 } }} caption={false} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" /> : service.id === "engraving" ? <Photo project={publishedPhoto("lake-map-slice")} caption={false} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" /> : service.photos[0] ? <Photo project={{ ...publishedPhoto(service.photos[0]), alt: service.id === "commercial" ? "Animal Hospital storefront signage" : service.id === "vehicles" ? "Comfort Zone van wrap and lettering" : "Sixteen Sandals dock address sign", image: { src: service.id === "commercial" ? "/work/hero/signage7.webp" : service.id === "vehicles" ? "/work/hero/czvan.webp" : "/work/lineup/res2-front.webp", width: 1600, height: 900 } }} caption={false} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" /> : <figure className="home-service-placeholder" aria-hidden="true"><span /></figure>}
        <div className="home-service-description"><h3 id={`home-service-${service.id}`} className="text-title">{service.name}</h3><span className="service-learn-more"><span>Learn more</span></span></div>
        </Link>
      </article>)}
      <article className="home-service-card" aria-labelledby="home-service-custom">
        <Link href="/contact?service=unsure#quote" className="home-service-media" aria-label="Explore Custom Projects">
          <Photo project={{ ...publishedPhoto("bedrock"), alt: "Red, white and blue graphics on a jet ski", image: { src: "/work/hero/jetski.webp", width: 1600, height: 900 } }} caption={false} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" />
          <div className="home-service-description"><h3 id="home-service-custom" className="text-title">Custom Projects</h3><span className="service-learn-more"><span>Learn more</span></span></div>
        </Link>
      </article>
      </ServiceLineup>
    </section>
    <TrustedBy className={`${heroDisplay.variable} ${heroAccent.variable}`} />
    <section className="reviews-section py-section" aria-label="Customer reviews">
      <h2 className="mb-4 text-headline">What our customers say</h2>
      <ReviewRail />
    </section>
    <EnquirySection>
      <h3 className="text-title">Our Process</h3>
      <ProcessList steps={home.process.map((step) => ({ icon: step.icon, text: step.title }))} />
    </EnquirySection>
    </ScrollCopy>
  </>;
}

