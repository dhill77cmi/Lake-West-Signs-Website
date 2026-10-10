import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    // Unit tests: lib/ and content/. e2e specs live in e2e/ and belong to Playwright.
    include: ["lib/**/*.test.ts", "content/**/*.test.ts"],
    environment: "node",
  },
});
