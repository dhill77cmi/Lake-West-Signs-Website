import { actions } from "./pages";

export const primaryNavigation = [
  { label: "Our Work", href: "/work" },
  { label: "About Us", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;

export const quoteLink = { label: actions.quote, href: "/contact" } as const;
