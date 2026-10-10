import type { ServiceId, Faq } from "./types";
import { faqItems, quoteTerms } from "./faq";

type BuyerSection = { title: string; text: string };
export type StepIcon = "ClipboardList" | "MessageSquareText" | "Ruler" | "Brush" | "Hammer" | "SignBoard" | "LaserEngraver" | "Car" | "KeyRound" | "Package" | "Search" | "Store" | "FileUp" | "Printer";
export type Step = { icon: StepIcon; text: string };
type ServicePageContent = {
  title: string; seoTitle: string; intro: string; optionsHeading: string;
  options: BuyerSection[]; steps: Step[]; enquiryTitle: string;
  faqs: Faq[]; related: { service: ServiceId; text: string }[];
};

export const servicePages: Record<ServiceId, ServicePageContent> = {
  commercial: {
    enquiryTitle: "Ready to create your commercial signage?",
    title: "Commercial Signage",
    seoTitle: "Commercial signs for Lake of the Ozarks businesses",
    intro: "Make your premises easier to find and your message easier to read. Start with where the sign will go, what it needs to say and how people will see it.",
    optionsHeading: "Types of commercial signage we offer",
    options: [
      { title: "Storefront & window", text: "Business names, opening information and graphics for the front of your premises." },
      { title: "Interior & wayfinding", text: "Signs that identify rooms, explain a space or help people find their way." },
      { title: "Large-format & freestanding", text: "Ask about panels, post-mounted and monument sign options for your site." },
    ],
    steps: [
      { icon: "ClipboardList", text: "Have the town, size, site photo and artwork ready" },
      { icon: "MessageSquareText", text: "Talk through mounting, access, permits and power" },
      { icon: "Ruler", text: "We survey the site if it needs measuring" },
      { icon: "Brush", text: "Approve the design proof and install details" },
      { icon: "Hammer", text: "We make the sign in-house" },
      { icon: "SignBoard", text: "Collect at the shop or we install on site" },
    ],
    faqs: [faqItems.estimates, faqItems.materials, faqItems.permits, faqItems.timing],
    related: [{ service: "vehicles", text: "Carry the same identity onto your work vehicles." }, { service: "print", text: "For yard signs and printed material, start here." }],
  },
  residential: {
    enquiryTitle: "Ready to create your family or dock sign?",
    title: "Residential & Dock Signs",
    seoTitle: "Dock signs and boat lettering for the Lake of the Ozarks",
    intro: "Choose an address sign for the dock, a family sign for home or lettering for your watercraft. Review the options, then have your exact wording ready.",
    optionsHeading: "Types of residential and dock signs we offer",
    options: [
      { title: "Dock address signs", text: "Address signs for the dock so your place is easy to find from the water." },
      { title: "Family & home signs", text: "Family name and home signs for the house, the dock or the boathouse." },
      { title: "Boat lettering & numbers", text: "Registration numbers, names and decals for your watercraft." },
    ],
    steps: [
      { icon: "ClipboardList", text: "Choose a product and have the exact wording ready" },
      { icon: "Brush", text: "Check spelling, address and layout on your proof" },
      { icon: "Hammer", text: "We make your sign or lettering" },
      { icon: "SignBoard", text: "Collect, fit it yourself, or we install on the dock" },
    ],
    faqs: [faqItems.dock, faqItems.dockSize, faqItems.install, faqItems.timing],
    related: [{ service: "vehicles", text: "Looking for a boat wrap rather than lettering? Explore wrap options." }, { service: "print", text: "Find yard signs and printed material here." }],
  },
  vehicles: {
    enquiryTitle: "Ready to wrap or letter your vehicle?",
    title: "Vehicle Wraps & Lettering",
    seoTitle: "Vehicle wraps and lettering at the Lake of the Ozarks",
    intro: "From a name on a work van to a full wrap, choose the coverage that suits your vehicle and message. We also work on trailers and boat wraps.",
    optionsHeading: "Types of vehicle wraps and lettering we offer",
    options: [
      { title: "Lettering", text: "Put a business name, contact details or a clear message on selected areas of the vehicle." },
      { title: "Partial wrap", text: "Combine larger graphics with the vehicle’s existing color. Coverage is agreed around your design and vehicle." },
      { title: "Full wrap", text: "Plan a design across the vehicle’s body. The quote depends on the vehicle, coverage and design." },
    ],
    steps: [
      { icon: "Car", text: "Send the make, model, year and photos" },
      { icon: "ClipboardList", text: "Choose lettering, partial or full coverage" },
      { icon: "Brush", text: "Approve the design proof" },
      { icon: "Hammer", text: "We print and fit the graphics" },
      { icon: "KeyRound", text: "Collect your vehicle with care instructions" },
    ],
    faqs: [faqItems.wrap, faqItems.artwork, faqItems.care, faqItems.timing],
    related: [{ service: "residential", text: "Boat lettering and boat numbers have their own options and prices." }, { service: "print", text: "For removable vehicle magnets, see print and promotional." }, { service: "commercial", text: "Match the signs at your premises to your vehicle graphics." }],
  },
  engraving: {
    enquiryTitle: "Ready to engrave something personal?",
    title: "Laser Engraving",
    seoTitle: "Laser engraving in Sunrise Beach",
    intro: "Personal wording for a gift, names for a club or recognition for a team. Start with the item and the message you want engraved.",
    optionsHeading: "Types of laser engraving we offer",
    options: [
      { title: "Name tags & badges", text: "Have your names, titles and any logo ready, with the quantity you need." },
      { title: "Plaques, trophies & awards", text: "Supply the wording exactly as it should appear, including names and dates." },
      { title: "Glasses, mugs & gifts", text: "Describe the item and material so the shop can check suitability and discuss the engraving area." },
    ],
    steps: [
      { icon: "Package", text: "Describe the item, material and quantity" },
      { icon: "Search", text: "We check the item is suitable to engrave" },
      { icon: "Brush", text: "Approve your wording, artwork and layout" },
      { icon: "LaserEngraver", text: "We laser engrave your item in-house" },
      { icon: "Store", text: "Collect at the shop" },
    ],
    faqs: [faqItems.engravingMaterial, faqItems.minimum, faqItems.artwork, faqItems.timing],
    related: [{ service: "print", text: "Pair engraved items with printed material or promotional products." }],
  },
  print: {
    enquiryTitle: "Ready to print your cards, flyers or signs?",
    title: "Print & Promotional",
    seoTitle: "Business cards, flyers and print at the Lake of the Ozarks",
    intro: "Keep the same name and look across your business cards, handouts and promotional items. Start with the product, quantity and date you need it.",
    optionsHeading: "Types of print and promotional items we offer",
    options: [
      { title: "Cards & handouts", text: "Business cards, brochures, flyers, postcards and holiday cards." },
      { title: "Posters, banners & yard signs", text: "For a promotion or message people need to see. Have the finished size and display location ready." },
      { title: "Magnets & promotional products", text: "For removable vehicle branding or an item carrying your business name. Tell us the item and quantity you have in mind." },
    ],
    steps: [
      { icon: "ClipboardList", text: "Choose the product, size and quantity" },
      { icon: "FileUp", text: "Send your artwork and we confirm the file setup" },
      { icon: "Brush", text: "Approve the design proof" },
      { icon: "Printer", text: "We print your order" },
      { icon: "Package", text: "Collect at the shop or arrange fulfillment" },
    ],
    faqs: [faqItems.printFiles, faqItems.minimum, faqItems.proof, faqItems.timing],
    related: [{ service: "commercial", text: "For permanent storefront, window and interior signage." }, { service: "engraving", text: "For personalized gifts, name tags and awards." }],
  },
};
