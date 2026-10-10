import { site } from "./site";
import { quoteTerms } from "./faq";
import type { StepIcon } from "./service-pages";

export const home = {
  // Provisional lead image. Change this slot to another reviewed project when job mix is confirmed.
  heroPhoto: "bedrock",
  headline: "Signs that get you seen.",
  intro: `Designed with you. Made in ${site.address.city}.`,
  servicesTitle: "Bring your vision to life",
  workIntro: "Find ideas for your sign, vehicle graphics or boat lettering in work from the shop.",
  process: [
    { icon: "MessageSquareText", title: "Tell us what you need", text: "Call, visit or prepare your inquiry with sizes, wording and any artwork you have." },
    { icon: "Brush", title: "We design it with you", text: "Check the wording and layout before giving us the go-ahead." },
    { icon: "Hammer", title: "We make it for you", text: "Your approved design becomes your finished sign, graphics, engraving or print." },
    { icon: "SignBoard", title: "We install it, or you pick it up", text: `Arrange installation on site at ${quoteTerms.installation}, or collect at the shop.` },
  ] satisfies { icon: StepIcon; title: string; text: string }[],
  localTitle: `Your local sign shop, since ${site.founded}.`,
  localText: `Locally owned in ${site.address.city}, on the west side of the Lake of the Ozarks. Talk through your project with the people who make it.`,
};

export const pageCopy = {
  work: {
    title: "See what we’ve made",
    intro: "Explore signs, vehicle graphics and boat lettering by service. Open a photograph for a closer look.",
    enquiryTitle: "Have a project in mind?",
    enquiryText: "Tell us what you liked and what you need. We’ll help you plan your own sign or graphics.",
    allWork: "All work",
    showing: "Showing",
    emptyCategory: "No photographs here yet. Ask us about this service and we’ll show you what we can do.",
  },
  about: {
    title: `Made here in ${site.address.city}.`,
    // Owner-supplied story, with the founding line replaced by the locally-owned-since fact.
    story: [
      `${site.name} & Marketing has been proudly owned and operated locally since ${site.founded}, on the west side of the Lake of the Ozarks. With a vision to provide high-quality signage and a passion for exceptional customer service, the business was built from the ground up, one project at a time.`,
      "Through dedication, innovation, and a deep connection to the local community, the company steadily grew. What started as a humble operation soon expanded its offerings, incorporating the latest in technology and digital marketing tools to meet the evolving needs of its customers. This commitment to staying ahead of industry trends propelled Lake West Signs & Marketing into becoming a nationwide leader.",
    ],
    // A gray square holds the place until the shop supplies a photograph of its building.
    buildingLabel: "Lake West Signs Building",
    accreditationsTitle: "Memberships",
    // Only the confirmed chamber membership is shown.
    accreditations: [
      { name: site.chamberMembership, logo: "/partners/lake-west-chamber.png", logoAlt: "Lake of the Ozarks West Chamber logo" },
    ],
  },
  faq: { title: "Questions before you start", intro: "Prices, proofs, installation and what to have ready when you call." },
  contact: { title: "Let’s talk about your project", intro: "Call the shop, come in with an idea, or prepare the details below for your quote." },
  thanks: {
    title: "Thanks for planning your project",
    intro: "Use the contact form to send your project details, or call the shop to discuss your quote. Opening this page does not submit a request.",
    next: "When you contact us, we’ll discuss what you need, the price and timing. You’ll see a design proof before we make your order.",
  },
  privacy: {
    title: "Privacy",
    sections: [
      { title: "The inquiry form", text: "When you submit an inquiry, your contact details, project answers and attached files are processed by Vercel and Resend and emailed to the shop’s Yahoo inbox so we can respond. An inquiry does not place an order. Please avoid sending sensitive personal information. Contact the shop to ask about access to or deletion of your inquiry." },
      { title: "Calls and email", text: "Calling or emailing uses your phone or email service. Information you share directly with the shop is used to discuss your inquiry and any work you request. Contact the shop if you have questions about that information." },
      { title: "Analytics and external links", text: "We use Google Analytics to measure page visits and successful inquiry submissions. It uses cookies and processes device and visit information. We do not send form contents, names, contact details or attachment names to Analytics. Advertising personalization is disabled. Analytics is not loaded when your browser sends Do Not Track or Global Privacy Control. Google processes information under its own privacy policy. Google Maps, Google reviews and Facebook links open external services with their own privacy practices. The website host may process technical request information to serve the site." },
    ],
  },
  notFound: { title: "That page isn’t here", intro: "Find a service, return to the homepage or call the shop for help with your project." },
};

export const actions = { quote: "Get a quote", options: "See options and prices", request: "Request this sign", work: "See all work" };
