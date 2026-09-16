import { defineConfig } from "@playwright/test";

const configuredBaseUrl = process.env.CUTOVER_BASE_URL?.trim();

if (!configuredBaseUrl) {
  throw new Error(
    "CUTOVER_BASE_URL is required. Point it at the Netlify candidate or the custom production domain.",
  );
}

const baseURL = configuredBaseUrl.replace(/\/$/, "");

export default defineConfig({
  testDir: "./tests/deployment",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { browserName: "chromium" },
    },
    {
      name: "mobile-320",
      use: { browserName: "chromium", viewport: { width: 320, height: 720 } },
    },
    {
      name: "mobile-390",
      use: { browserName: "chromium", viewport: { width: 390, height: 844 } },
    },
  ],
});
