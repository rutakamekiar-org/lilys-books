import { expect, test } from "@playwright/test";
import { mockApiUrl, resetMockApi } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test("catalog to product to cart reaches checkout validation without payment", async ({ page, request }) => {
  await page.goto("/books");
  await page.getByRole("link", { name: /Test Book/ }).first().click();
  await expect(page).toHaveURL(/\/books\/test-book$/);

  await page.getByRole("button", { name: /Купити/ }).click();
  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toBeVisible();
  await expect(cart.getByText("Test Book", { exact: true })).toBeVisible();
  await cart.getByRole("button", { name: "Оформити замовлення" }).click();

  const checkout = page.getByRole("dialog", { name: "Оформлення замовлення" });
  await expect(checkout).toBeVisible();
  await checkout.getByRole("button", { name: "Підтвердити замовлення" }).click();
  await expect(checkout.getByText("Введіть ім'я")).toBeVisible();
  await expect(checkout.getByText("Введіть прізвище")).toBeVisible();
  await expect(checkout.getByText("Введіть дійсний email")).toBeVisible();
  await expect(checkout.getByText(/Введіть дійсний телефон/)).toBeVisible();
  await expect(checkout.getByText("Оберіть відділення Нової Пошти")).toBeVisible();

  const mockState = await (await request.get(`${mockApiUrl}/__control/state`)).json();
  expect(mockState.invoiceRequests).toBe(0);
});
