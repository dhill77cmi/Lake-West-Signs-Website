import type { SiteInfo } from "./types";
import { resolveSiteUrl } from "@/lib/site-url";

export const productionUrl = "https://lakewestsigns.com";

export const site: SiteInfo = {
  name: "Lake West Signs",
  fullName: "Lake West Signs and Marketing",
  shortName: "Lake West Signs",
  url: resolveSiteUrl({
    explicitUrl: process.env.NEXT_PUBLIC_SITE_URL,
    vercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL,
    vercelEnvironment: process.env.NEXT_PUBLIC_VERCEL_ENV,
    productionUrl,
  }),
  canonicalUrl: productionUrl,
  areaServed: ["Sunrise Beach", "the west side of the Lake of the Ozarks"],
  tagline: "Imagine. Innovate. Create. Deliver.",
  founded: 2001,
  ownership: "Locally owned",
  phone: "(573) 374-0148",
  phoneHref: "tel:+15733740148",
  email: "lakewestsigns1@yahoo.com",
  address: { street: "35 Valley Rd", city: "Sunrise Beach", region: "MO", postal: "65079" },
  geo: { lat: 38.1755785, lng: -92.7854365 },
  hours: [{ days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], open: "08:00", close: "17:00" }],
  hoursNote: "Or by appointment — call to arrange.",
  mapsUrl: "https://maps.app.goo.gl/1BuvBJq5sbNcwrgCA",
  mapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3136.477615927301!2d-92.79030740495271!3d38.17557839940044!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87c4ebef6aa88bb9%3A0xe4fee6364b5b52a0!2sLake%20West%20Signs!5e0!3m2!1sen!2sus!4v1791278118914!5m2!1sen!2sus",
  googleReviewsUrl:
    "https://www.google.com/maps/place/Lake+West+Signs/@38.1755785,-92.7854365,15z/data=!4m7!3m6!1s0x87c4ebef6aa88bb9:0xe4fee6364b5b52a0!4b1!8m2!3d38.1755785!4d-92.7854365!16s%2Fg%2F1vg_7trg",
  googleReviewCount: 21,
  googleRating: 5.0,
  chamberMembership: "Member, Lake of the Ozarks West Chamber",
  facebookUrl: "https://www.facebook.com/lakewestsignsandmarketing",
};
