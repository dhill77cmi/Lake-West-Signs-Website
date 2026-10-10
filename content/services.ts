import type { Service } from "./types";

export const priceCopy = {
  pending: "$$$$",
};

export const services: Service[] = [
  {
    id: "commercial",
    slug: "commercial-signs",
    name: "Commercial Signage",
    blurb: "Help people find your business with storefront, window, interior and large-format signs.",
    homeLine: "4 × 8 ft signs",
    homePriceLabel: "4 × 8 ft sign",
    body: [
      "We craft custom commercial signage that elevates your brand and turns any space into a marketing environment. Whether you want to enhance your storefront, create impactful outdoor displays, or add a professional touch to interior signage, our durable, high-quality solutions are tailored to your business.",
      "Every impression counts. Custom commercial signage gives your business constant visibility, lifts its curb appeal, and leaves a lasting impression on potential customers — from vibrant storefront signs to sleek interior displays.",
    ],
    why: [
      "24/7 brand visibility",
      "Cost-effective advertising",
      "Enhanced professional image",
      "Durable, weather-resistant materials",
      "Custom solutions for any budget",
    ],
    pricesHeading: "Pricing",
    prices: [
      { label: "4 × 8 ft sign", from: 300, note: "the standard commercial panel; larger and custom sizes quoted" },
      { label: "On-site installation", from: 85, fixed: true, unit: "/hr" },
    ],
    photos: ["tavernsign", "signage5"],
  },
  {
    id: "residential",
    slug: "dock-signs",
    name: "Residential & Dock Signs",
    blurb: "Dock signs, watercraft lettering, community signs and family name signs built for lake life.",
    homeLine: "Residential and dock signs",
    homePriceLabel: "Standard dock signs",
    body: [
      "Your home and community deserve unique, high-quality signage. From custom dock signs and watercraft lettering to community signs and personalized family name property signs, our residential work is designed to enhance your space and reflect your style.",
      "Choose a dock address sign, family name sign or lettering for your watercraft. Have your exact wording and available space ready when you inquire.",
    ],
    why: [
      "Enhances home and community visibility",
      "Personalized designs for every taste",
      "Custom solutions to fit your budget",
    ],
    pricesHeading: "Pricing",
    prices: [
      { label: "Standard dock signs", from: 55, note: "your address in a standard size" },
      { label: "Boat decals & numbers", from: 25, note: "registration numbers and decals cut to size" },
      { label: "Residential family signs", from: 40, note: "family name signs for the house or boathouse" },
      { label: "Watercraft lettering", from: 55, note: "names and lettering for the stern or hull" },
      { label: "Family dock signs", from: 55, note: "your address with the family name" },
      { label: "Custom dock signs", from: 65, note: "your wording, size and layout" },
      { label: "Removal & replacement", from: 85, fixed: true, unit: "/hr", note: "the old sign taken down and the new one fitted" },
      { label: "On-site decal service", from: 85, fixed: true, unit: "/hr", note: "decal service on site, by the hour" },
    ],
    photos: ["res2", "res1", "res3", "boat"],
  },
  {
    id: "vehicles",
    slug: "vehicle-wraps",
    name: "Vehicle Wraps & Lettering",
    blurb: "Put your business on the road with full wraps, partial wraps and vehicle lettering.",
    homeLine: "Truck & van full wraps",
    homePriceLabel: "Full wrap — trucks & vans",
    body: [
      "We specialize in custom vinyl vehicle wraps and lettering that turn almost any vehicle into a mobile billboard or a creative expression. Whether you want to build brand visibility, make a bold statement, or add a personal touch, our vinyl work is designed to fit.",
      "Every mile you drive is a missed opportunity if your vehicle isn't promoting your business. Whether you're a small local company or run a large fleet, a custom wrap or professional lettering transforms your car, truck, boat or trailer into a high-impact marketing tool. Pricing is custom to your vehicle type, design complexity and material selection.",
    ],
    why: [
      "24/7 brand visibility",
      "Cost-effective marketing",
      "Professional image and credibility",
      "Protection for your vehicle's paint",
      "Customizable for any budget",
    ],
    pricesHeading: "Pricing",
    prices: [
      { label: "Vehicle lettering", from: 85, note: "names, contact details and lettering for your vehicle" },
      { label: "Partial wrap", from: 600, note: "coverage agreed around your design and vehicle" },
      { label: "Full wrap — trucks & vans", from: 3500, note: "final pricing depends on your vehicle, coverage and design" },
    ],
    photos: ["bedrock", "sbpolice", "jetski", "letteredvan"],
  },
  {
    id: "engraving",
    slug: "laser-engraving",
    name: "Laser Engraving",
    blurb: "Laser engraving done to your specifications. Gifts, wine glasses, etching and name tags are our specialty.",
    homeLine: "Engraved name tags",
    homePriceLabel: "Name tags",
    pricesHeading: "Pricing",
    prices: [
      { label: "Name tags", from: 8, note: "laser-engraved names and titles, with your logo if you have one" },
      { label: "Trophies", from: 30, note: "laser-engraved wording, names and dates as you supply them" },
      { label: "Mugs & glasses", from: 15, note: "laser engraving; items checked for suitability first" },
    ],
    body: [
      "From a single garden-club name tag to a full set of awards, we engrave in-house so small orders are as welcome as large ones. Bring your artwork or let us lay it out.",
    ],
    why: ["Name tags and badges", "Plaques, trophies and awards", "Wine glasses, etching and gifts", "Custom coffee mugs"],
    photos: [],
  },
  {
    id: "print",
    slug: "print-and-promo",
    name: "Print & Promotional",
    blurb: "Business cards, brochures, flyers, banners, yard signs, magnets and promotional products.",
    homeLine: "Business cards",
    homePriceLabel: "Business cards",
    pricesHeading: "Pricing",
    prices: [
      { label: "Business cards", from: 75, note: "ask the shop to confirm quantity and specification" },
      { label: "Banners", from: 100 },
      { label: "Magnets", from: 45 },
    ],
    body: [
      "Print that matches your signs: business cards and brochures, flyers and postcards, holiday cards and posters, plus promotional products that keep your name in hand. We also offer creative consultations and branding help when a project needs it.",
    ],
    why: ["Business cards (cardstock) & brochures", "Flyers & postcards", "Holiday cards", "Posters", "Banners", "Yard signs", "Magnets", "Promotional products", "Creative consultations & branding"],
    photos: [],
  },
];

export const serviceCardCopy = {
  commercial: "Storefront, window and interior signs that get you noticed.",
  residential: "Personalized dock, address and family signs for lake life.",
  vehicles: "Take your brand on the road with custom wraps and lettering.",
  engraving: "Make it personal with engraved gifts, name tags and awards.",
  print: "Business cards, flyers and giveaways with your name on them.",
  custom: "Something different in mind? Let’s create it together.",
};
