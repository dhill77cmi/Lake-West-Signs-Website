import type { Faq } from "./types";
import { site } from "./site";
import { dockGuidance } from "./dock-guidance";
import { formatHours } from "../lib/format";

const onSiteSurvey = "An on-site survey is $85/hr, credited to your order.";

export const quoteTerms = {
  free: "Quotes are free.",
  installation: "$85/hr",
  survey: `Quotes are free. ${onSiteSurvey}`,
  onSiteSurvey,
  production: "We make your signs in-house.",
};

export const faqItems = {
  estimates: { q: "Do you charge for estimates?", a: "Quotes from your artwork, sizes and photos are free and no-obligation. If a job needs an on-site survey for measuring, mounting or power, the survey is $85/hr, credited to your order." },
  install: { q: "Can I collect my sign or have it installed?", a: `Collect at the shop or arrange on-site installation at ${quoteTerms.installation}. Tell us where the sign will go when you ask for a quote.` },
  dock: { q: "Do I have to post an address on my dock?", a: dockGuidance.text, source: dockGuidance.source },
  wrap: { q: "How much does a vehicle wrap cost?", a: "Full wraps on trucks and vans start from $3,500. The vehicle, coverage and design affect the quote. Lettering and partial wraps are quoted for your vehicle." },
  artwork: { q: "What artwork should I have ready?", a: "Have your logo, wording and any artwork ready. AI, EPS or PDF files are useful, as are high-resolution images. If you need design help, tell us what you want the finished piece to say." },
  hours: { q: "Where are you and when are you open?", a: `Find us at ${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postal}, on the west side of the Lake of the Ozarks. ${formatHours(site.hours[0])}. ${site.hoursNote}` },
  timing: { q: "How long will my order take?", a: "Tell us your deadline when you inquire. The shop will confirm timing for your project before you approve the work." },
  proof: { q: "Will I see a design before it is made?", a: "We design and send a proof for you to check before we make your order. Check the wording, spelling and layout, including any address or phone number." },
  dockSize: { q: "What size should my dock sign be?", a: "Have the exact wording or address and the available space ready. Ask the shop about size, layout and material options for your sign." },
  care: { q: "How should I care for a vehicle wrap?", a: "Ask the shop for care instructions for the material used on your vehicle. Confirm cleaning guidance and any after-installation precautions when you collect it." },
  permits: { q: "Who handles permits, mounting and power?", a: "Discuss landlord approval, any permit needs, the mounting surface and any existing power supply before the job is agreed. Confirm who is responsible for each part with the shop." },
  materials: { q: "Which sign material should I choose?", a: "Tell us whether the sign is for indoors or outdoors, where it will be mounted and the size you have in mind. The shop can discuss material options with you." },
  engravingMaterial: { q: "Can you engrave an item I already own?", a: "Describe the item and its material, and have a photo ready. Ask the shop to confirm suitability before bringing it in; not every item or surface is suitable." },
  minimum: { q: "Is there a minimum order?", a: "Tell us the item and quantity you need. Ask the shop to confirm any minimum, setup cost and price for that particular order." },
  printFiles: { q: "What about bleed, resolution and print-ready files?", a: "Have your original artwork ready and tell us the finished size. Ask the shop to confirm bleed, resolution and file setup for the chosen product before you prepare final files." },
} satisfies Record<string, Faq>;

// The FAQ page groups every question by topic; service pages pick their own subsets from faqItems.
export const faqGroups: { id: string; title: string; items: Faq[] }[] = [
  { id: "quotes", title: "Quotes and pricing", items: [faqItems.estimates, faqItems.minimum] },
  { id: "design", title: "Design and artwork", items: [faqItems.artwork, faqItems.proof, faqItems.printFiles] },
  { id: "installation", title: "Installation and timing", items: [faqItems.install, faqItems.timing, faqItems.permits] },
  { id: "dock", title: "Dock signs", items: [faqItems.dock, faqItems.dockSize] },
  { id: "wraps", title: "Vehicle wraps", items: [faqItems.wrap, faqItems.care] },
  { id: "materials", title: "Materials and engraving", items: [faqItems.materials, faqItems.engravingMaterial] },
  { id: "shop", title: "Visiting the shop", items: [faqItems.hours] },
];
