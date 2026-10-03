import { expect, test } from "@playwright/test";
import { mockApiUrl, resetMockApi } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

for (const format of ["Паперова", "Електронна"]) {
  test(`${format} format reaches mobile checkout validation without an invoice`, async ({ page, request }) => {
    await page.goto("/books/test-book");
    await page.getByRole("radio", { name: new RegExp(format) }).check();
    await page.getByRole("button", { name: /Купити/ }).click();
    const cart = page.getByRole("dialog", { name: "Кошик" });
    await expect(cart.getByText("Test Book", { exact: true })).toBeVisible();
    await cart.getByRole("button", { name: "Оформити замовлення" }).click();
    const checkout = page.getByRole("dialog", { name: "Оформлення замовлення" });
    await checkout.getByRole("button", { name: "Підтвердити замовлення" }).click();
    await expect(checkout.getByText("Введіть ім'я")).toBeVisible();
    await expect(checkout.getByText("Введіть прізвище")).toBeVisible();
    await expect(checkout.getByText("Введіть дійсний email")).toBeVisible();
    if (format === "Паперова") {
      await expect(checkout.getByText("Оберіть відділення Нової Пошти")).toBeVisible();
    } else {
      await expect(checkout.getByText("Оберіть відділення Нової Пошти")).toHaveCount(0);
    }
    const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
    expect(state.invoiceRequests).toBe(0);
  });
}

test("primary navigation and cart remain usable", async ({ page }) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Основна навігація" });
  await expect(navigation).toBeVisible();

  for (const name of ["Головна", "Магазин", "Події", "Про мене"]) {
    const link = navigation.getByRole("link", { name });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
  }

  await navigation.getByRole("link", { name: "Магазин" }).click();
  await expect(page).toHaveURL(/\/books$/);
  await page.getByRole("link", { name: /Test Book/ }).first().click();
  await expect(page).toHaveURL(/\/books\/test-book$/);

  const cartButton = navigation.getByRole("button", { name: /Кошик/ });
  await cartButton.scrollIntoViewIfNeeded();
  await cartButton.click();
  await expect(page.getByRole("dialog", { name: "Кошик" })).toBeVisible();
});
