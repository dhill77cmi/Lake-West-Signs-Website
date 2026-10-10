export type ServiceId = "commercial" | "residential" | "vehicles" | "engraving" | "print";
export type ClientType = "commercial" | "residential" | "vehicle" | "municipal";

/** A photo in public/. width/height are the file's real pixel size (next/image needs them). */
export type Img = { src: string; width: number; height: number };

export type Project = {
  slug: string;
  title: string;
  service: ServiceId;
  clientType: ClientType;
  /** What was made: "dock sign", "full wrap", "name tags" … */
  item: string;
  materials: string[];
  caption: string;
  alt: string;
  image: Img;
  /** Shown on /work. At most 30 (contract: up to 30 images ingested). */
  featured: boolean;
  /** false until the shop has confirmed title/item/materials/caption. */
  verified: boolean;
};

export type Price = { label: string; from: number; to?: number; plus?: boolean; fixed?: boolean; unit?: string; note?: string; confirmed?: boolean };

export type Service = {
  id: ServiceId;
  /** URL segment under /services/ — fixed by the blueprint sitemap. */
  slug: string;
  name: string;
  /** One-line summary for cards and the home grid. */
  blurb: string;
  /** Product wording, or a quote explanation for services without a price row. */
  homeLine: string;
  /** Label of the prices row supplying the amount and confirmation state. */
  homePriceLabel?: string;
  body: string[];
  why: string[];
  pricesHeading?: string;
  prices?: Price[];
  /** Slugs from content/work.ts shown inline in this section (2–3). */
  photos: string[];
};

export type Faq = { q: string; a: string; source?: { label: string; href: string } };
export type Testimonial = { quote: string; name: string; source: "google" | "site"; rating?: number; avatar?: string };

export type Hours = { days: string[]; open: string; close: string };

export type SiteInfo = {
  name: string;
  /** Full business name for search results and share metadata; visible copy keeps `name`. */
  fullName: string;
  shortName: string;
  url: string;
  canonicalUrl: string;
  areaServed: string[];
  tagline: string;
  /** Year the shop opened; rendered as "since 2001". */
  founded: number;
  ownership: string;
  phone: string;
  phoneHref: string;
  email: string;
  address: { street: string; city: string; region: string; postal: string };
  geo: { lat: number; lng: number };
  hours: Hours[];
  /** Shown under the hours list; not part of JSON-LD. */
  hoursNote: string;
  mapsUrl: string;
  mapsEmbedUrl: string;
  googleReviewsUrl: string;
  /** Shown as "N five-star Google reviews"; update when the listing grows. */
  googleReviewCount: number;
  googleRating: number;
  chamberMembership: string;
  facebookUrl: string;
};
