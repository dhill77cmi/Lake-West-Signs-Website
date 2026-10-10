import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { site } from "@/content/site";
import { indexingRobots } from "@/lib/seo";
import { localBusinessJsonLd, websiteJsonLd } from "@/lib/schema";
import { JsonLd } from "@/components/json-ld";
import { PressFeedback } from "@/components/press-feedback";
import { GoogleAnalytics } from "@/components/google-analytics";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.canonicalUrl),
  title: { default: site.fullName, template: `%s | ${site.fullName}` },
  description: `Signs, vehicle wraps, engraving and print from ${site.fullName} in ${site.address.city}.`,
  robots: indexingRobots(),
};

// Until PhotoHero hydrates, a first homepage visit would paint the finished hero and then hide it for the
// intro. Mirror PhotoHero's start conditions and hold the intro's blank first frame (globals.css); PhotoHero
// releases the hold, and the timeout shows the hero anyway if scripts never run.
const heroIntroHold = `try{var d=document.documentElement;if(location.pathname==="/"&&!location.hash&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&localStorage.getItem("lws-pause-automatic-motion")!=="true"&&sessionStorage.getItem("lws-hero-intro-seen")!=="1"){d.dataset.heroIntro="hold";setTimeout(function(){delete d.dataset.heroIntro},5000)}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const analyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
  const analyticsEnabled = (process.env.VERCEL_ENV === "production" || (process.env.E2E === "1" && process.env.NEXT_PUBLIC_VERCEL_ENV === "production")) && /^G-[A-Z0-9]+$/.test(analyticsId);
  return (
    // The hold script sets an attribute on <html> before hydration.
    <html lang="en" data-scroll-behavior="smooth" className={manrope.variable} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <script dangerouslySetInnerHTML={{ __html: heroIntroHold }} />
        <PressFeedback>
        <JsonLd value={localBusinessJsonLd(site)} />
        <JsonLd value={websiteJsonLd(site)} />
        <a href="#main" className="skip-link">Skip to content</a>
        <Header />
        <main id="main" tabIndex={-1} className="site-main flex-1 outline-none">{children}</main>
        <Footer />
        </PressFeedback>
        {analyticsEnabled && <GoogleAnalytics measurementId={analyticsId} />}
      </body>
    </html>
  );
}
