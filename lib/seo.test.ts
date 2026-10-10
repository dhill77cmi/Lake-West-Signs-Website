import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site-url";
import { indexingRobots } from "./seo";
import { productionUrl } from "@/content/site";

describe("deployment indexing", () => {
  it.each([
    [productionUrl, true],
    ["https://lakewestsigns.com/", true],
    ["https://lws-preview.vercel.app", false],
    ["http://localhost:8100", false],
    ["https://lakewestsigns.com.example.org", false],
    ["https://www.lakewestsigns.com", false],
    ["not a URL", false],
  ])("%s has index=%s", (url, index) => {
    expect(indexingRobots(url)).toEqual({ index, follow: index });
  });
  it("resolves Vercel production to the canonical domain and keeps previews unindexed", () => {
    expect(resolveSiteUrl({ productionUrl, vercelEnvironment: "production", vercelUrl: "lws.vercel.app" })).toBe(productionUrl);
    const preview = resolveSiteUrl({ productionUrl, explicitUrl: productionUrl, vercelEnvironment: "preview", vercelUrl: "lws-preview.vercel.app" });
    expect(preview).toBe("https://lws-preview.vercel.app");
    expect(indexingRobots(preview).index).toBe(false);
    expect(indexingRobots(resolveSiteUrl({ productionUrl, explicitUrl: productionUrl, vercelEnvironment: "preview" })).index).toBe(false);
  });
});
