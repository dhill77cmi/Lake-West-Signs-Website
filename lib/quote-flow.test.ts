import { describe, expect, it } from "vitest";
import { firstUnanswered, questionComplete, stepsFor, summaryLines, visibleQuestions } from "./quote-flow";
import { detailQuestions, productKind } from "../content/quote-flow";
import { services } from "../content/services";

describe("guided quote steps", () => {
  it("is five screens from Home and for Custom, four when the service is known, three for a question, two when it is known", () => {
    expect(stepsFor(undefined, false)).toEqual(["service", "details", "timing", "extra", "contact"]);
    expect(stepsFor("unsure", false)).toEqual(["service", "details", "timing", "extra", "contact"]);
    expect(stepsFor("commercial", true)).toEqual(["details", "timing", "extra", "contact"]);
    expect(stepsFor("general", false)).toEqual(["service", "question", "contact"]);
    expect(stepsFor("general", true)).toEqual(["question", "contact"]);
  });
  it("shows the town field only when installation is chosen", () => {
    expect(visibleQuestions("commercial", {}).map((q) => q.name)).toEqual(["kind", "size", "delivery", "artwork"]);
    expect(visibleQuestions("commercial", { delivery: "install" }).map((q) => q.name)).toEqual(["kind", "size", "delivery", "town", "artwork"]);
  });
  it("names the first unanswered button group and ignores text fields", () => {
    expect(firstUnanswered("residential", {})).toBe("kind");
    expect(firstUnanswered("residential", { kind: "dock", delivery: "pickup" })).toBe("quantity");
    expect(firstUnanswered("residential", { kind: "dock", delivery: "pickup", quantity: "1" })).toBeUndefined();
    expect(firstUnanswered("unsure", {})).toBe("kind");
    expect(firstUnanswered("general", {})).toBeUndefined();
  });
  it("summarizes the project and timing with the screen each line edits", () => {
    expect(summaryLines("residential", { kind: "dock", timing: "month" })).toEqual([
      { step: "details", label: "Project", text: "Residential & Dock Signs · Dock sign" },
      { step: "timing", label: "Timing", text: "Within a month" },
    ]);
    expect(summaryLines("unsure", { kind: "sign", timing: "asap" })).toEqual([
      { step: "details", label: "Project", text: "Custom · A sign" },
      { step: "timing", label: "Timing", text: "As soon as possible" },
    ]);
  });
  it("summarizes a question as one line, cut to 80 characters", () => {
    expect(summaryLines("general", { message: "  Do you engrave stainless tumblers?  ", timing: "asap" })).toEqual([{ step: "question", label: "Question", text: "Do you engrave stainless tumblers?" }]);
    const long = "a".repeat(100);
    expect(summaryLines("general", { message: long })[0].text).toBe(`${"a".repeat(80)}…`);
    expect(summaryLines("general", { message: "a".repeat(80) })[0].text).toBe("a".repeat(80));
  });
  it("needs a typed question before the question screen continues", () => {
    expect(questionComplete({})).toBe(false);
    expect(questionComplete({ message: "   " })).toBe(false);
    expect(questionComplete({ message: "Hours?" })).toBe(true);
  });
  it("gives every service a kind group and maps only real price labels", () => {
    for (const service of services) expect(detailQuestions[service.id][0].name).toBe("kind");
    expect(detailQuestions.unsure.map((question) => question.name)).toEqual(["kind", "artwork"]);
    for (const service of [...services.map((s) => s.id), "unsure" as const]) {
      const kind = detailQuestions[service][0] as { choices: { value: string }[] };
      expect(["unsure", "other"]).toContain(kind.choices.at(-1)!.value);
    }
    const labels = services.find((s) => s.id === "residential")!.prices!.map((p) => p.label);
    for (const label of Object.keys(productKind)) expect(labels).toContain(label);
    const residentialKinds = (detailQuestions.residential[0] as { choices: { value: string }[] }).choices.map((c) => c.value);
    for (const kind of Object.values(productKind)) expect(residentialKinds).toContain(kind);
  });
});
