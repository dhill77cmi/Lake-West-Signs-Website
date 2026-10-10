import type { ServiceId } from "./types";

export type Choice = { value: string; label: string };
export type ChoiceQuestion = { name: string; label: string; choices: Choice[] };
export type TextQuestion = { name: string; label: string; text: true; placeholder?: string; when?: { name: string; value: string } };
export type Question = ChoiceQuestion | TextQuestion;
export type FlowService = ServiceId | "unsure" | "general";

const notSure: Choice = { value: "unsure", label: "Not sure" };
const artwork: ChoiceQuestion = { name: "artwork", label: "Do you have artwork?", choices: [{ value: "have", label: "I have artwork" }, { value: "design", label: "I need design help" }] };
const delivery = (install: string): ChoiceQuestion => ({ name: "delivery", label: "Install or pick up?", choices: [{ value: "install", label: install }, { value: "pickup", label: "I'll pick it up" }, notSure] });

export const flowCopy = {
  formLabel: "Guided quote request",
  progress: (step: number, total: number) => `Step ${step} of ${total}`,
  back: "Back", next: "Next", skip: "Skip", change: "Change", edit: "Edit",
  submit: "Submit",
  sent: "Your request has been submitted.",
  sentDetail: "We will be in touch soon to talk through your project.",
  stamp: "Sent",
  again: "Start another request",
  service: { label: "What can we help you with?", custom: "Custom", question: "Ask a question" },
  details: { label: "A few details", optional: "(optional)" },
  question: {
    label: "What would you like to know?", placeholder: "Hours, materials, an existing order, anything else.",
    order: { label: "Is this about an existing order?", choices: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] as Choice[] },
  },
  timing: {
    label: "When do you need it?",
    choices: [
      { value: "asap", label: "As soon as possible" }, { value: "month", label: "Within a month" },
      { value: "quarter", label: "1 to 3 months" }, { value: "researching", label: "Just pricing it out" },
    ] as Choice[],
  },
  extra: { label: "Anything else we should know?", message: "Notes", placeholder: "Sizes, colors, where it's going, anything that helps." },
  contact: { label: "Where should we send your quote?", answerLabel: "Where should we send the answer?", method: "How should we reach you?" },
  summary: { service: "Project", timing: "Timing", question: "Question", reach: "Reach you by" },
  errors: { details: "Answer each question to continue.", question: "Type your question to continue." },
};

export const detailQuestions: Record<FlowService, Question[]> = {
  commercial: [
    { name: "kind", label: "What kind of sign?", choices: [{ value: "storefront", label: "Storefront" }, { value: "window", label: "Window" }, { value: "interior", label: "Interior" }, { value: "large-format", label: "Large-format sign" }, notSure] },
    { name: "size", label: "Roughly how big?", choices: [{ value: "small", label: "Under 2 ft" }, { value: "medium", label: "2 to 4 ft" }, { value: "large", label: "4 × 8 ft or bigger" }, notSure] },
    delivery("Install it for me"),
    { name: "town", label: "Which town is it going in?", text: true, when: { name: "delivery", value: "install" } },
    artwork,
  ],
  residential: [
    { name: "kind", label: "Which product?", choices: [{ value: "dock", label: "Dock sign" }, { value: "family", label: "Family name sign" }, { value: "boat", label: "Boat lettering or numbers" }, notSure] },
    { name: "wording", label: "What should it say?", text: true, placeholder: "Address, family name or boat name" },
    delivery("Install at the dock"),
    { name: "quantity", label: "How many?", choices: [{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3+", label: "More than 2" }] },
  ],
  vehicles: [
    { name: "kind", label: "What's getting wrapped?", choices: [{ value: "truck", label: "Truck or van" }, { value: "car", label: "Car or SUV" }, { value: "boat", label: "Boat or jet ski" }, { value: "trailer", label: "Trailer" }, { value: "fleet", label: "Several vehicles" }, { value: "other", label: "Something else" }] },
    { name: "coverage", label: "How much coverage?", choices: [{ value: "lettering", label: "Lettering only" }, { value: "partial", label: "Partial wrap" }, { value: "full", label: "Full wrap" }, notSure] },
    artwork,
    { name: "vehicle", label: "Year, make and model", text: true, placeholder: "e.g. 2021 Ford Transit" },
  ],
  engraving: [
    { name: "kind", label: "What are we engraving?", choices: [{ value: "tags", label: "Name tags or badges" }, { value: "plaque", label: "Plaque or award" }, { value: "gift", label: "Gift or personal item" }, { value: "other", label: "Something else" }] },
    { name: "quantity", label: "How many?", choices: [{ value: "1", label: "1" }, { value: "2-10", label: "2 to 10" }, { value: "10+", label: "More than 10" }] },
    artwork,
    { name: "wording", label: "What should it say?", text: true },
  ],
  print: [
    { name: "kind", label: "What do you need printed?", choices: [{ value: "cards", label: "Business cards" }, { value: "yard-sign", label: "Yard sign" }, { value: "flyers", label: "Flyers or brochures" }, { value: "banner", label: "Banners" }, { value: "magnet", label: "Magnets" }, { value: "promo", label: "Promotional items" }, { value: "other", label: "Something else" }] },
    { name: "quantity", label: "How many?", choices: [{ value: "<100", label: "Under 100" }, { value: "100-500", label: "100 to 500" }, { value: "500+", label: "More than 500" }, notSure] },
    artwork,
  ],
  unsure: [
    { name: "kind", label: "What kind of project is it?", choices: [{ value: "sign", label: "A sign" }, { value: "graphics", label: "Graphics or decals" }, { value: "item", label: "An engraved or printed item" }, notSure] },
    artwork,
  ],
  general: [],
};

// Price-table labels on the dock-signs page map onto the product group, so "Ask about this product" lands preselected.
export const productKind: Record<string, string> = {
  "Standard dock signs": "dock", "Family dock signs": "dock", "Custom dock signs": "dock", "Removal & replacement": "dock",
  "Residential family signs": "family",
  "Boat decals & numbers": "boat", "Watercraft lettering": "boat",
};
