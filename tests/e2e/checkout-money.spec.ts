import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { formatMoney, subtractMoney, toMinorUnits } from "../../src/lib/money";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

async function openCartWith499HryvniaProduct(
  page: Page,
  request: APIRequestContext,
): Promise<Locator> {
  const product = makeProduct({
    name: "Money Precision Book",
    slug: "money-precision-book",
    items: [{
      id: "61000000-0000-4000-8000-000000000001",
      name: "Паперова Money Precision Book",
      type: 1,
      format: 1,
      isAvailable: true,
      canPreorder: false,
      price: 499,
      discountPrice: null,
      currency: "UAH",
      note: null,
    }],
  });
  await request.post(`${mockApiUrl}/__control/products`, { data: product });

  await page.goto(`/books/${product.slug}`);
  await page.getByRole("button", { name: /Купити/ }).click();
  return page.getByRole("dialog", { name: "Кошик" });
}

async function applyPromo(cart: Locator, code: string) {
  await cart.getByRole("textbox", { name: "Промокод" }).fill(code);
  await cart.getByRole("button", { name: "Застосувати" }).click();
}

test("rounds a nearly equal fixed discount in cart and checkout", async ({ page, request }) => {
  const cart = await openCartWith499HryvniaProduct(page, request);
  await applyPromo(cart, "NEAR-TOTAL");

  await expect(cart.getByText("-498.95 грн", { exact: true })).toBeVisible();
  await expect(cart.getByText("0.05 грн", { exact: true })).toBeVisible();
  await expect(cart).not.toContainText("0.05000000000001137");

  await cart.getByRole("button", { name: "Оформити замовлення" }).click();
  const checkout = page.getByRole("dialog", { name: "Оформлення замовлення" });
  await expect(checkout.getByText("-498.95 грн", { exact: true })).toBeVisible();
  await expect(checkout.getByText("0.05 грн", { exact: true })).toBeVisible();
});

test("renders an exact full discount as zero", async ({ page, request }) => {
  const cart = await openCartWith499HryvniaProduct(page, request);
  await applyPromo(cart, "EXACT-TOTAL");

  await expect(cart.getByText("-499 грн", { exact: true })).toBeVisible();
  await expect(cart.getByText("0 грн", { exact: true })).toBeVisible();
  await expect(cart).not.toContainText("-0 грн");
});

test("normalizes the displayed remainder to integer minor units", () => {
  const total = subtractMoney(499, 498.95);

  expect(total).toBe(0.05);
  expect(formatMoney(total)).toBe("0.05");
  expect(toMinorUnits(total)).toBe(5);
  expect(subtractMoney(499, 499)).toBe(0);
});
