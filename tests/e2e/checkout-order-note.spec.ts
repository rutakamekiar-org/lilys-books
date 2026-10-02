import { expect, test, type Locator, type Page } from "@playwright/test";
import { mockApiUrl, resetMockApi } from "./helpers";

const orderNoteLabel = "Коментар до замовлення (необов’язково)";

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

async function openDigitalCheckout(page: Page): Promise<Locator> {
  await page.goto("/books/test-book");
  await page.getByRole("radio", { name: /Електронна/ }).check();
  await page.getByRole("button", { name: /Купити/ }).click();

  const cart = page.getByRole("dialog", { name: "Кошик" });
  await cart.getByRole("button", { name: "Оформити замовлення" }).click();

  const checkout = page.getByRole("dialog", { name: "Оформлення замовлення" });
  await expect(checkout).toBeVisible();
  return checkout;
}

async function fillRequiredCustomerFields(checkout: Locator) {
  await checkout.getByLabel(/Ім.я \*/).fill("Леся");
  await checkout.getByLabel(/Прізвище \*/).fill("Українка");
  await checkout.getByLabel("Email *").fill("lesya@example.com");
}

async function keepPaymentNavigationLocal(page: Page) {
  await page.route("https://example.invalid/**", route =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<p>payment</p>" }),
  );
}

test("shows, limits, trims, and submits the optional order note", async ({ page, request }) => {
  await keepPaymentNavigationLocal(page);
  const checkout = await openDigitalCheckout(page);
  const orderNote = checkout.getByLabel(orderNoteLabel);

  await expect(orderNote).toHaveAccessibleDescription(
    /Наприклад, побажання щодо доставки\..*0\/500/,
  );

  await orderNote.fill("x".repeat(501));
  await expect(orderNote).toHaveValue("x".repeat(500));
  await expect(checkout.getByText("500/500", { exact: true })).toBeVisible();

  const paddedNote = "  Зателефонуйте перед відправленням  ";
  await orderNote.fill(paddedNote);
  await expect(checkout.getByText(`${paddedNote.length}/500`, { exact: true })).toBeVisible();
  await fillRequiredCustomerFields(checkout);
  await checkout.getByRole("button", { name: "Підтвердити замовлення" }).click();
  await expect(checkout).toBeHidden();

  const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
  expect(state.lastInvoiceRequest.orderNote).toBe("Зателефонуйте перед відправленням");
  expect(state.lastInvoiceRequest.customer.orderNote).toBeUndefined();
});

test("submits checkout without an order note", async ({ page, request }) => {
  await keepPaymentNavigationLocal(page);
  const checkout = await openDigitalCheckout(page);
  await fillRequiredCustomerFields(checkout);

  await checkout.getByRole("button", { name: "Підтвердити замовлення" }).click();
  await expect(checkout).toBeHidden();

  const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
  expect(state.invoiceRequests).toBe(1);
  expect(state.lastInvoiceRequest.orderNote).toBeUndefined();
});
