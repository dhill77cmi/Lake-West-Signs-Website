import { site } from "./site";
import { services } from "./services";
import { servicePages } from "./service-pages";

export type PageSeo = { title: string; description: string; breadcrumb: string };

export const seoPages: Record<string, PageSeo> = {
  "/": { title: `Signs & vehicle wraps in ${site.address.city}`, description: `Custom signs, vehicle wraps, dock signs, laser engraving and print from ${site.fullName}. Locally owned since ${site.founded}. Call for a free quote.`, breadcrumb: "Home" },
  "/work": { title: "Sign & vehicle graphics gallery at Lake of the Ozarks", description: `See signs, dock lettering and vehicle graphics from ${site.fullName}. Browse the work by service and open each photograph to see the whole frame.`, breadcrumb: "Our Work" },
  "/about": { title: `About our ${site.address.city} sign shop`, description: `Locally owned since ${site.founded}, ${site.fullName} designs and makes signs, graphics, engraving and print in-house. Visit the shop to discuss your project.`, breadcrumb: "About" },
  "/faq": { title: "Sign quotes, installation & artwork questions", description: `Plan your project with answers about free quotes, surveys, installation, artwork and visiting ${site.fullName} in ${site.address.city}.`, breadcrumb: "FAQ" },
  "/contact": { title: `Contact our ${site.address.city} sign shop for a free quote`, description: `Request a free quote online, call ${site.phone} or visit ${site.fullName} at ${site.address.street} to discuss signs, wraps, engraving or print. Find hours and directions.`, breadcrumb: "Contact" },
  "/contact/thanks": { title: "Your sign inquiry — next steps", description: "Ready to discuss your project? Send your details through the quote form or call the shop. Find the phone number, hours and next steps.", breadcrumb: "Your inquiry" },
  "/privacy": { title: "Website privacy & inquiry information", description: `How the ${site.fullName} website handles inquiry details, attachments and links to external services.`, breadcrumb: "Privacy" },
  ...Object.fromEntries(services.map((service) => [`/services/${service.slug}`, {
    title: servicePages[service.id].seoTitle,
    description: servicePages[service.id].intro,
    breadcrumb: service.name,
  }])),
};

export const openGraphCopy = {
  title: "Signs. Wraps. Engraving. Print.",
  location: `Made in ${site.address.city}. For the Lake of the Ozarks.`,
  alt: `${site.fullName} — signs, wraps, engraving and print`,
};
