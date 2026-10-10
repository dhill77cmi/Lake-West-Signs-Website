import { describe, expect, it } from "vitest";
import { validateContact, validateFiles, validateQuote } from "./quote";
import { quoteCopy } from "../content/quote";

function enquiry(method = "email", detail = "visitor@example.com") {
  const data = new FormData();
  Object.entries({ name: "A Visitor", contactMethod: method, contactDetail: detail, service: "unsure", message: "A sign for our dock" }).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("inquiry validation", () => {
  it("accepts only one matching contact detail and no optional fields", () => {
    for (const [method, detail] of [["email", "visitor@example.com"], ["phone", "(573) 555-0100"], ["text", "+1 573 555 0100"]]) expect(validateQuote(enquiry(method, detail))).toEqual({});
  });
  it("rejects whitespace and invalid contact details with field-specific errors", () => {
    const data = enquiry("email", "not-an-email");
    data.set("name", "  "); data.set("message", "\n"); data.set("service", "unknown");
    expect(Object.keys(validateQuote(data))).toEqual(["name", "contactDetail", "service", "message"]);
    expect(validateQuote(enquiry("phone", "abc123"))).toHaveProperty("contactDetail");
  });
  it("accepts design files without MIME metadata and checks the combined file limit", () => {
    expect(validateFiles([{ name: "logo.AI", type: "", size: 100 }, { name: "art.eps", type: "application/postscript", size: 100 }])).toBeUndefined();
    expect(validateFiles([{ name: "a.pdf", type: "application/pdf", size: quoteCopy.maxFileBytes }])).toBeUndefined();
    expect(validateFiles([{ name: "a.pdf", type: "application/pdf", size: quoteCopy.maxFileBytes }, { name: "b.png", type: "image/png", size: 1 }])).toBe(quoteCopy.errors.fileSize);
    expect(validateFiles([{ name: "program.exe", type: "application/octet-stream", size: 1 }])).toBe(quoteCopy.errors.fileType);
  });
  it("validates the contact fields alone for the guided flow", () => {
    const data = new FormData();
    data.set("name", " "); data.set("contactMethod", "email"); data.set("contactDetail", "nope");
    expect(Object.keys(validateContact(data))).toEqual(["name", "contactDetail"]);
    data.set("name", "A Visitor"); data.set("contactDetail", "visitor@example.com");
    expect(validateContact(data)).toEqual({});
    data.set("contactMethod", ""); data.set("contactDetail", "");
    expect(Object.keys(validateContact(data))).toEqual(["contactMethod"]);
  });
});
