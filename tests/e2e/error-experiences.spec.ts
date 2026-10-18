import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./a11y";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test("missing product shows the branded not-found experience with a 404 status", async ({ page }) => {
  const response = await page.goto("/books/does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Цю сторінку не знайдено" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Повернутися до каталогу" })).toHaveAttribute("href", "/books");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expectNoA11yViolations(page, "the missing-product page");
});

test("temporary API failure for a not-yet-cached book is safe and recovers on reload", async ({ page, request }) => {
  // Book pages are cached (ISR). A book first requested while the API fails cannot use the
  // branded error boundary: Next answers with a bare 500 and caches nothing, so a reload recovers.
  const slug = `retry-book-${Date.now()}`;
  const product = makeProduct({
    id: "60000000-0000-4000-8000-000000000001",
    name: "Recovered Book",
    slug,
  });
  await request.post(`${mockApiUrl}/__control/products`, { data: product });
  await request.post(`${mockApiUrl}/__control/failures`, { data: { slugs: [slug] } });

  const response = await page.goto(`/books/${slug}`);
  expect(response?.status()).toBe(500);
  await expect(page.getByText("Simulated product API failure.")).toHaveCount(0);
  await expect(page.getByText("Request failed with 500")).toHaveCount(0);

  await request.post(`${mockApiUrl}/__control/failures`, { data: { slugs: [] } });
  const recovered = await page.reload();

  expect(recovered?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Recovered Book" })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/books/${slug}$`));
});

test("a cached book stays available during a product API failure", async ({ page, request }) => {
  await request.post(`${mockApiUrl}/__control/failures`, { data: { slugs: ["brunette-stories"] } });

  const response = await page.goto("/books/brunette-stories");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Excerpt Book", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Не вдалося завантажити сторінку" })).toHaveCount(0);
});

test("unknown route shows the branded not-found experience with a 404 status", async ({ page }) => {
  const response = await page.goto("/a-route-that-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Цю сторінку не знайдено" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Повернутися до каталогу" })).toHaveAttribute("href", "/books");
  await expectNoA11yViolations(page, "the unknown-route page");
});
