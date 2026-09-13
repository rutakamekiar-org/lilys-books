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

test("temporary product API failure is safe and recovers through retry", async ({ page, request }) => {
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
  await expect(page.getByRole("heading", { name: "Не вдалося завантажити сторінку" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Повернутися до каталогу" })).toHaveAttribute("href", "/books");
  await expect(page.getByText("Simulated product API failure.")).toHaveCount(0);
  await expect(page.getByText("Request failed with 500")).toHaveCount(0);
  await expectNoA11yViolations(page, "the temporary API error page");

  await request.post(`${mockApiUrl}/__control/failures`, { data: { slugs: [] } });
  await page.getByRole("button", { name: "Спробувати ще раз" }).click();

  await expect(page.getByRole("heading", { name: "Recovered Book" })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/books/${slug}$`));
});

test("unknown route shows the branded not-found experience with a 404 status", async ({ page }) => {
  const response = await page.goto("/a-route-that-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Цю сторінку не знайдено" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Повернутися до каталогу" })).toHaveAttribute("href", "/books");
  await expectNoA11yViolations(page, "the unknown-route page");
});
