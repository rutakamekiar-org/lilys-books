import { defineConfig } from "@playwright/test";

// tools/test-e2e-parallel.mjs runs isolated shards side by side, each on its own ports.
const appPort = Number(process.env.E2E_APP_PORT ?? 3100);
const apiPort = Number(process.env.E2E_API_PORT ?? 4100);
const appUrl = `http://127.0.0.1:${appPort}`;
const apiUrl = `http://127.0.0.1:${apiPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: appUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node tests/support/mock-api.mjs",
      url: `${apiUrl}/__health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "node tests/support/test-app.mjs",
      url: appUrl,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_API_URL: apiUrl,
        NEXT_PUBLIC_SITE_BASE: appUrl,
        REVALIDATION_SECRET: "zvy11-test-secret",
        // One year: cached pages change only when a test revalidates them explicitly.
        CATALOG_REVALIDATE_SECONDS: "31536000",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: /mobile-navigation\.spec\.ts/,
      use: { browserName: "chromium" },
    },
    {
      name: "mobile-320",
      testMatch: /(mobile-navigation|performance)\.spec\.ts/,
      use: { browserName: "chromium", viewport: { width: 320, height: 720 } },
    },
    {
      name: "mobile-390",
      testMatch: /(mobile-navigation|performance)\.spec\.ts/,
      use: { browserName: "chromium", viewport: { width: 390, height: 844 } },
    },
  ],
});
