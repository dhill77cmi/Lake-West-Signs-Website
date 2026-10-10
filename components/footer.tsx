import { DesignOptionSwitch } from "@/components/design-option-switch";
import Link from "next/link";
import { site } from "@/content/site";
import { primaryNavigation } from "@/content/navigation";
import { formatHours } from "@/lib/format";
import { ResponsiveImage } from "@/components/responsive-image";

export function Footer() {
  return (
    <footer className="site-footer inverse-surface bg-inverse pb-12 text-on-inverse">
      <div className="site-container">
        <DesignOptionSwitch section="footer" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.1fr_1.3fr_1.4fr_0.7fr]">
          <div>
            <h2 className="mb-3 text-title">{site.name}</h2>
            {site.hours.map((hours) => <p key={hours.days.join(",")}>{formatHours(hours)}</p>)}
            <div className="mt-3 -ml-3 flex gap-1">
              <a href={site.facebookUrl} className="footer-social" aria-label="Facebook">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M13.5 21v-7.5h2.6l.4-3.2h-3V8.3c0-.9.3-1.6 1.6-1.6h1.6V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.4H7.6v3.2h2.7V21z" /></svg>
              </a>
            </div>
            <a href="https://www.lakewestchamber.com/" className="mt-3 inline-flex min-h-touch items-center rounded-md bg-background p-2" target="_blank" rel="noopener noreferrer" aria-label="Lake of the Ozarks West Chamber (opens in a new tab)">
              <ResponsiveImage src="/partners/lake-west-chamber.png" alt="Lake of the Ozarks West Chamber logo" width={400} height={124} sizes="112px" className="h-auto w-28" />
            </a>
          </div>
          <div>
            <h2 className="mb-3 text-title">Visit the shop</h2>
            <a href={site.mapsUrl} className="footer-link">
              <address className="not-italic">
                {site.address.street}<br />
                {site.address.city}, {site.address.region} {site.address.postal}
              </address>
            </a>
          </div>
          <div>
            <h2 className="mb-3 text-title">Get in touch</h2>
            <a href={site.phoneHref} className="footer-link">{site.phone}</a>
            <a href={`mailto:${site.email}`} className="footer-link">{site.email}</a>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-col">
            <Link href="/" prefetch={false} className="footer-link">Home</Link>
            {primaryNavigation.map(({ label, href }) => (
              <Link key={href} href={href} prefetch={false} className="footer-link">{label}</Link>
            ))}
            <Link href="/privacy" prefetch={false} className="footer-link">Privacy</Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-on-inverse/25 pt-4">
          <p className="text-small text-on-inverse-muted">© {new Date().getFullYear()} {site.name}</p>
        </div>
      </div>
    </footer>
  );
}
