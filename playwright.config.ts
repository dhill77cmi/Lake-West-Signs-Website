import { defineConfig, devices } from "@playwright/test";

const BASE = "http://localhost:8110";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: { baseURL: BASE, ...devices["Desktop Chrome"] },
  webServer: [
    {
      command: "npx next dev -p 8110",
      url: BASE,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { E2E: "1", E2E_DIST_DIR: ".next-e2e-production", NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-TEST123", NEXT_PUBLIC_SITE_URL: "https://lakewestsigns.com", NEXT_PUBLIC_VERCEL_ENV: "production" },
    },
    {
      command: "npx next dev -p 8111",
      url: "http://localhost:8111",
      reuseExistingServer: false,
      timeout: 120_000,
      // Deliberately share the production setting to test preview precedence.
      env: { E2E: "1", E2E_DIST_DIR: ".next-e2e-preview", NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-TEST123", NEXT_PUBLIC_SITE_URL: "https://lakewestsigns.com", NEXT_PUBLIC_VERCEL_ENV: "preview", NEXT_PUBLIC_VERCEL_URL: "lws-preview.vercel.app" },
    },
  ],
});
