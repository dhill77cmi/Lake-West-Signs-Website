import { describe, expect, it } from "vitest";
import { formatHours, formatPrice } from "./format";
import { services } from "@/content/services";

describe("formatPrice", () => {
  it("renders every unconfirmed price as a placeholder without an amount", () => {
    const prices = services.flatMap((service) => service.prices ?? []).filter((price) => price.confirmed === false);
    expect(prices).toHaveLength(0);
    for (const price of [...prices, { label: "Pending range", from: 45, to: 85, unit: "/hr", confirmed: false }]) {
      expect(formatPrice(price), price.label).toBe("$$$$");
      expect(formatPrice(price), price.label).not.toMatch(/\d/);
    }
  });
  it("renders a range with plus", () => {
    expect(formatPrice({ label: "Small", from: 99, to: 1000, plus: true })).toBe("$99 – $1,000+");
  });
  it("renders a range without plus", () => {
    expect(formatPrice({ label: "x", from: 150, to: 1500 })).toBe("$150 – $1,500");
  });
  it("renders a single starting price with a plus, or with 'from' for running copy", () => {
    expect(formatPrice({ label: "Boat decals", from: 25 })).toBe("$25+");
    expect(formatPrice({ label: "Boat decals", from: 25 }, "from")).toBe("from $25");
    expect(formatPrice({ label: "Install", from: 85, fixed: true, unit: "/hr" }, "from")).toBe("$85/hr");
    expect(formatPrice({ label: "Dock signs", from: 45, confirmed: false }, "from")).toBe("from $$$$");
  });
  it("attaches a slash unit to a fixed rate and spaces any other unit", () => {
    expect(formatPrice({ label: "Install", from: 65, fixed: true, unit: "/hr" })).toBe("$65/hr");
    expect(formatPrice({ label: "Letters", from: 4, unit: "per letter" })).toBe("$4+ per letter");
  });
  it("does not render note", () => {
    expect(formatPrice({ label: "x", from: 150, to: 1500, note: "storefront signs" })).toBe("$150 – $1,500");
  });
  it("renders the owner-confirmed starting prices and hourly rates", () => {
    const prices = services.flatMap((service) => service.prices ?? []).filter((price) => price.confirmed !== false);
    expect(prices.map((price) => [price.label, formatPrice(price)])).toEqual([
      ["4 × 8 ft sign", "$300+"],
      ["On-site installation", "$85/hr"],
      ["Standard dock signs", "$55+"],
      ["Boat decals & numbers", "$25+"],
      ["Residential family signs", "$40+"],
      ["Watercraft lettering", "$55+"],
      ["Family dock signs", "$55+"],
      ["Custom dock signs", "$65+"],
      ["Removal & replacement", "$85/hr"],
      ["On-site decal service", "$85/hr"],
      ["Vehicle lettering", "$85+"],
      ["Partial wrap", "$600+"],
      ["Full wrap — trucks & vans", "$3,500+"],
      ["Name tags", "$8+"],
      ["Trophies", "$30+"],
      ["Mugs & glasses", "$15+"],
      ["Business cards", "$75+"],
    ]);
  });
});

describe("formatHours", () => {
  it("renders a weekday range", () => {
    expect(
      formatHours({ days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], open: "08:00", close: "17:00" })
    ).toBe("Monday–Friday, 8 AM – 5 PM");
  });
  it("renders a single day with non-zero minutes", () => {
    expect(formatHours({ days: ["Saturday"], open: "09:00", close: "12:30" })).toBe("Saturday, 9 AM – 12:30 PM");
  });
});
