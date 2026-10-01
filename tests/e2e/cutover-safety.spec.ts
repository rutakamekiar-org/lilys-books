import { expect, test } from "@playwright/test";
import { blockInvoiceWrites } from "../support/cutover-safety";
import { mockApiUrl, resetMockApi } from "./helpers";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test("cutover guard blocks invoice writes including the unversioned endpoint", async ({ page, context, request }) => {
  const blockedRequests = await blockInvoiceWrites(context);
  await page.goto("/");

  const attempts = [
    { method: "POST", url: `${mockApiUrl}/api/invoice` },
    { method: "POST", url: `${mockApiUrl}/api/invoice?source=cutover` },
    { method: "PUT", url: `${mockApiUrl}/api/invoice/v2` },
    { method: "PATCH", url: `${mockApiUrl}/API/Invoice/` },
    { method: "DELETE", url: `${mockApiUrl}/api/invoice/test-id` },
  ];

  const outcomes = await page.evaluate(async requests => {
    return Promise.all(requests.map(async ({ method, url }) => {
      try {
        await fetch(url, { method });
        return "sent";
      } catch {
        return "blocked";
      }
    }));
  }, attempts);

  expect(outcomes).toEqual(attempts.map(() => "blocked"));
  expect(blockedRequests.sort()).toEqual(attempts.map(({ method, url }) => `${method} ${url}`).sort());
  const mockState = await (await request.get(`${mockApiUrl}/__control/state`)).json();
  expect(mockState.invoiceRequests).toBe(0);
});

test("cutover guard allows catalog reads and does not match other endpoint names", async ({ page, context }) => {
  const blockedRequests = await blockInvoiceWrites(context);
  await page.goto("/");

  const statuses = await page.evaluate(async apiUrl => {
    const products = await fetch(`${apiUrl}/api/products`);
    const unrelated = await fetch(`${apiUrl}/api/invoice-status`, { method: "POST" });
    return [products.status, unrelated.status];
  }, mockApiUrl);

  expect(statuses).toEqual([200, 404]);
  expect(blockedRequests).toEqual([]);
});
