import type { ServiceId } from "./types";

export const quoteCopy = {
  title: "Let's create something to be seen",
  intro: "Prepare your sizes, wording and project details before you contact the shop.",
  preview: "Enable JavaScript to use the form, or call the shop.",
  submitted: "Your inquiry has been submitted to the shop.",
  fieldsNote: "All fields below are required unless marked optional.",
  optional: "Project details (optional)",
  fileHint: "Up to 5 images, PDF, AI or EPS files, 3 MB total. Email larger artwork to lakewestsigns1@yahoo.com.",
  fileAccept: "image/*,.pdf,.ai,.eps",
  maxFileBytes: 3 * 1024 * 1024,
  submit: "Send",
  deliveryError: "We couldn’t confirm your request was sent. Your details are still here. Please retry or call (573) 374-0148.",
  labels: { name: "Name", contactMethod: "Preferred contact method", email: "Email address", phone: "Phone number", text: "Phone number", detail: "Phone number or email", service: "What do you need?", message: "Message", files: "Photos or artwork (optional)" },
  // Both selects start blank; the placeholder reads until a choice is made.
  placeholder: "Choose one",
  contactMethods: [{ value: "phone", label: "Phone" }, { value: "email", label: "Email" }, { value: "text", label: "Text" }],
  notSure: "Custom",
  generalInquiry: "General Inquiry",
  errors: {
    name: "Enter your name.", contactMethod: "Choose phone, email or text.",
    email: "Enter a valid email address, such as name@example.com.",
    phone: "Enter a phone number with a dialing code.",
    service: "Choose a service, or select Custom.", message: "Tell us a little about what you need.",
    fileType: "Choose image, PDF, AI or EPS files.", fileSize: "Choose files totaling no more than 3 MB.",
  },
};

export type ProjectField = { name: string; label: string; type?: "text" | "number" | "date"; options?: string[] };
const artwork: ProjectField = { name: "artwork", label: "Artwork status", options: ["I have artwork", "I need design help", "Not sure yet"] };
export const projectFields: Record<ServiceId, ProjectField[]> = {
  residential: [
    { name: "wording", label: "Wording or address" }, { name: "size", label: "Size" },
    { name: "quantity", label: "Quantity", type: "number" },
    { name: "fulfilment", label: "Collect or install", options: ["Collect at the shop", "On-site installation", "Not sure yet"] },
  ],
  vehicles: [
    { name: "vehicleMake", label: "Vehicle make" }, { name: "vehicleModel", label: "Vehicle model" },
    { name: "vehicleYear", label: "Vehicle year" },
    { name: "coverage", label: "Coverage", options: ["Lettering", "Partial wrap", "Full wrap", "Not sure yet"] },
    artwork, { name: "timing", label: "Timing" },
  ],
  commercial: [
    { name: "town", label: "Installation town" }, { name: "size", label: "Approximate size" }, artwork,
    { name: "deadline", label: "Deadline", type: "date" }, { name: "budget", label: "Budget range" },
  ],
  engraving: [
    { name: "item", label: "Item and material" }, { name: "quantity", label: "Quantity", type: "number" }, artwork,
    { name: "dateNeeded", label: "Date needed", type: "date" },
  ],
  print: [
    { name: "item", label: "Item" }, { name: "quantity", label: "Quantity", type: "number" }, artwork,
    { name: "dateNeeded", label: "Date needed", type: "date" },
  ],
};
