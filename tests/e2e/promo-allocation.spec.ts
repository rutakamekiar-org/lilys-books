import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { CartItem } from "../../src/components/molecules/CartProvider";
import { calculateCartDiscount, calculateItemDiscount, getDiscountedUnitsPerItem } from "../../src/lib/promocode.helper";
import { toMinorUnits } from "../../src/lib/money";
import { parseProduct } from "../../src/models/Product";
import { PromoCodeType, type PromoCodeResponse } from "../../src/models/PromoCode";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

const paperId = "31000000-0000-4000-8000-000000000001";
const digitalId = "31000000-0000-4000-8000-000000000002";
const product = makeProduct({
  name: "Звичайна. Перша частина дилогії", slug: "zvychajna",
  items: [
    { id: paperId, name: "Паперова Звичайна", type: 1, format: 1, isAvailable: true,
      canPreorder: false, price: 499, discountPrice: null, currency: "UAH", note: null },
    { id: digitalId, name: "Електронна Звичайна", type: 2, format: 2, isAvailable: true,
      canPreorder: false, price: 199, discountPrice: null, currency: "UAH", note: null },
  ],
});
const items: CartItem[] = [
  { product: parseProduct(product), itemId: paperId, quantity: 2, format: "paper" },
  { product: parseProduct(product), itemId: digitalId, quantity: 1, format: "digital" },
];
const one10: PromoCodeResponse = {
  code: "ONE10", type: PromoCodeType.Percentage, value: 10,
  applicableProductItemIds: [paperId, digitalId], remainingUsages: 1,
};
const scenarios = [
  { promo: one10, paper: 948, digital: 199, discount: 50, total: 1147 },
  { promo: { ...one10, code: "UNLIMITED10", remainingUsages: null }, paper: 898, digital: 179, discount: 120, total: 1077 },
  { promo: { ...one10, code: "ZERO10", remainingUsages: 0 }, paper: 998, digital: 199, discount: 0, total: 1197 },
  { promo: { ...one10, code: "PAPER10", applicableProductItemIds: [paperId], remainingUsages: null }, paper: 898, digital: 199, discount: 100, total: 1097 },
  { promo: { ...one10, code: "DIGITAL10", applicableProductItemIds: [digitalId], remainingUsages: 1 }, paper: 998, digital: 179, discount: 20, total: 1177 },
  { promo: { ...one10, code: "FIXED50", type: PromoCodeType.Fixed, value: 50, applicableProductItemIds: null, remainingUsages: null }, paper: 998, digital: 199, discount: 50, total: 1147, orderDiscount: 50 },
  { promo: { ...one10, code: "PAPER50", type: PromoCodeType.Fixed, value: 50, applicableProductItemIds: [paperId] }, paper: 948, digital: 199, discount: 50, total: 1147 },
  { promo: { ...one10, code: "CAPPED500", type: PromoCodeType.Fixed, value: 500 }, paper: 499, digital: 199, discount: 499, total: 698 },
];

function cartDialog(page: Page) {
  return page.getByRole("dialog", { name: "Кошик", exact: true });
}

async function openMixedCart(page: Page) {
  await page.goto(`/books/${product.slug}`);
  await page.getByRole("button", { name: /Купити/ }).click();
  await cartDialog(page).getByRole("button", { name: "Збільшити кількість" }).click();
  await cartDialog(page).getByRole("button", { name: "Закрити", exact: true }).click();
  await page.getByRole("radio", { name: "Електронна • 199 грн", exact: true }).check();
  await page.getByRole("button", { name: /Купити/ }).click();
  await expectSelection(page, 2, true);
}

async function expectSelection(page: Page, paperQuantity: number, digital: boolean) {
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]")
    .map((item: { itemId: string; quantity: number; format: string }) => ({ itemId: item.itemId, quantity: item.quantity, format: item.format })))).toEqual([
    { itemId: paperId, quantity: paperQuantity, format: "paper" },
    ...(digital ? [{ itemId: digitalId, quantity: 1, format: "digital" }] : []),
  ]);
}

async function applyPromo(page: Page, promo: PromoCodeResponse) {
  await page.route("**/api/PromoCode/validate?**", route => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get("code")).toBe(promo.code);
    expect(url.searchParams.getAll("productItemIds")).toEqual([paperId, digitalId]);
    return route.fulfill({ json: promo });
  });
  await cartDialog(page).getByRole("textbox", { name: "Промокод", exact: true }).fill(promo.code!);
  await cartDialog(page).getByRole("button", { name: "Застосувати" }).click();
  await expect(cartDialog(page).getByRole("button", { name: "Видалити промокод" })).toBeVisible();
}

async function expectCartAmounts(page: Page, expected: { paper: number; digital?: number; discount: number; total: number }) {
  const cart = cartDialog(page);
  await expect(cart.locator(`[data-cart-item-id="${paperId}"]`).locator("p").last()).toHaveText(`${expected.paper} грн`);
  if (expected.digital !== undefined) {
    const digitalLine = cart.locator(`[data-cart-item-id="${digitalId}"]`);
    await expect(digitalLine.locator("p").last()).toHaveText(`${expected.digital} грн`);
    if (expected.digital === 199) await expect(digitalLine.getByText(/Акція/)).toHaveCount(0);
  }
  await expect(cart.getByText("Всього:", { exact: true }).locator("..")).toHaveText(`Всього:${expected.total} грн`);
  if (expected.discount > 0) await expect(cart.getByText("Знижка:", { exact: true }).locator("..")).toHaveText(`Знижка:-${expected.discount} грн`);
  else await expect(cart.getByText("Знижка:", { exact: true })).toHaveCount(0);
}

async function expectLinesReconcile(cart: Locator, orderDiscount = 0) {
  const lines = await cart.locator("[data-cart-item-id]").evaluateAll(nodes => nodes.map(node => {
    const paragraphs = node.querySelectorAll("p");
    return Number.parseFloat(paragraphs[paragraphs.length - 1].textContent!);
  }));
  const total = Number.parseFloat(await cart.getByText("Всього:", { exact: true }).locator("..").locator("span").last().innerText());
  expect(lines.reduce((sum, line) => sum + toMinorUnits(line), 0) - toMinorUnits(orderDiscount)).toBe(toMinorUnits(total));
  expect(await cart.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
}

async function expectCheckoutAmounts(checkout: Locator, expected: { paper: number; digital: number; discount: number; total: number }) {
  // The checkout lines already share the provider's item-discount API with cart.
  for (const [name, amount, quantity] of [["Паперова Звичайна", expected.paper, 2], ["Електронна Звичайна", expected.digital, 1]] as const) {
    const line = checkout.getByText(name, { exact: true }).locator("..");
    await expect(line.locator("span").last()).toHaveText(`${amount} грн`);
    await expect(line.getByText(`x${quantity}`, { exact: true })).toBeVisible();
  }
  await expect(checkout.getByText("Всього до сплати:", { exact: true }).locator("..")).toContainText(`${expected.total} грн`);
  if (expected.discount > 0) await expect(checkout.getByText(/^Знижка /).locator("..")).toContainText(`-${expected.discount} грн`);
  else await expect(checkout.getByText(/^Знижка /)).toHaveCount(0);
}

async function capture(page: Page, info: TestInfo, state: string, width: number) {
  const phase = process.env.ZVY62_EVIDENCE_PHASE;
  if (!phase) return;
  if (!["before", "after"].includes(phase)) throw new Error("Unknown evidence phase");
  const directory = path.join(process.cwd(), "docs/storefront-promo-allocation", phase);
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  const filename = path.join(directory, `${state}-${width}x${width === 1440 ? 900 : 844}.jpg`);
  await page.screenshot({ path: filename, type: "jpeg", quality: 85, animations: "disabled", caret: "hide" });
  await info.attach(state, { path: filename, contentType: "image/jpeg" });
}

test("limited and exhausted allocations explicitly include zero for eligible units", () => {
  const allocation = getDiscountedUnitsPerItem(items, one10);
  expect(allocation.get(paperId)).toBe(1);
  expect(allocation.get(digitalId)).toBe(0);
  expect(calculateItemDiscount(items[1], one10, allocation.get(digitalId))).toBe(0);
  const exhausted = getDiscountedUnitsPerItem(items, { ...one10, remainingUsages: 0 });
  expect([...exhausted.values()]).toEqual([0, 0]);
  expect(calculateCartDiscount(items, one10)).toBe(50);
  const reversed = getDiscountedUnitsPerItem([...items].reverse(), one10);
  expect(reversed.get(paperId)).toBe(1);
  expect(reversed.get(digitalId)).toBe(0);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
  test.describe(`promo allocation at ${viewport.width}px`, () => {
    test.use({ viewport, hasTouch: viewport.width < 640 });
    test.beforeEach(async ({ page, request }) => {
      await resetMockApi(request);
      expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
      await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
        ? route.continue() : route.abort());
      await openMixedCart(page);
    });
    test.afterEach(async ({ request }) => {
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    for (const scenario of scenarios) {
      test(`${scenario.promo.code} reconciles cart and checkout amounts`, async ({ page }) => {
        await applyPromo(page, scenario.promo);
        await expectCartAmounts(page, scenario);
        await expectLinesReconcile(cartDialog(page), "orderDiscount" in scenario ? scenario.orderDiscount : 0);
        await expectSelection(page, 2, true);
        await cartDialog(page).getByRole("button", { name: "Оформити замовлення" }).click();
        await expectCheckoutAmounts(page.getByRole("dialog", { name: "Оформлення замовлення", exact: true }), scenario);
        await expectSelection(page, 2, true);
      });
    }

    test("ONE10 reallocates after quantity changes and removals", async ({ page }) => {
      await applyPromo(page, one10);
      await cartDialog(page).getByRole("button", { name: "Зменшити кількість" }).click();
      await expectCartAmounts(page, { paper: 449, digital: 199, discount: 50, total: 648 });
      await expectSelection(page, 1, true);
      await cartDialog(page).getByRole("button", { name: "Збільшити кількість" }).click();
      await expectCartAmounts(page, scenarios[0]);
      await cartDialog(page).getByRole("button", { name: "Видалити промокод" }).click();
      await expectCartAmounts(page, { paper: 998, digital: 199, discount: 0, total: 1197 });
      await applyPromo(page, one10);
      await cartDialog(page).locator(`[data-cart-item-id="${paperId}"]`).getByRole("button", { name: "Видалити з кошика" }).click();
      await expect(cartDialog(page).locator(`[data-cart-item-id="${digitalId}"]`).locator("p").last()).toHaveText("179 грн");
      await expect(cartDialog(page).getByText("Всього:", { exact: true }).locator("..")).toContainText("179 грн");
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]").map((item: { itemId: string }) => item.itemId))).toEqual([digitalId]);
    });

    test("exhausted promo rejection preserves the undiscounted selection and amounts", async ({ page }) => {
      await page.route("**/api/PromoCode/validate?**", route => route.fulfill({ status: 404, json: { error: "Controlled exhausted promo" } }));
      await cartDialog(page).getByRole("textbox", { name: "Промокод", exact: true }).fill("EXHAUSTED10");
      await cartDialog(page).getByRole("button", { name: "Застосувати" }).click();
      await expect(page.getByRole("alert").filter({ hasText: "Невірний або недійсний промокод" })).toBeVisible();
      await expect(cartDialog(page).getByRole("button", { name: "Видалити промокод" })).toHaveCount(0);
      await expectCartAmounts(page, { paper: 998, digital: 199, discount: 0, total: 1197 });
      await expectSelection(page, 2, true);
      await cartDialog(page).getByRole("button", { name: "Оформити замовлення" }).click();
      await expectCheckoutAmounts(page.getByRole("dialog", { name: "Оформлення замовлення", exact: true }), { paper: 998, digital: 199, discount: 0, total: 1197 });
    });

    test("ONE10 records matching controlled evidence", async ({ page }, info) => {
      test.skip(!process.env.ZVY62_EVIDENCE_PHASE, "Explicit evidence run only");
      await applyPromo(page, one10);
      await page.locator(".Toastify__close-button").click();
      await expect(page.getByRole("alert").filter({ hasText: "Промокод застосовано!" })).toBeHidden();
      const expected = { ...scenarios[0], digital: process.env.ZVY62_EVIDENCE_PHASE === "before" ? 179 : 199 };
      await expectCartAmounts(page, expected);
      await capture(page, info, "SCR-04-promo-one10", viewport.width);
      await cartDialog(page).getByRole("button", { name: "Оформити замовлення" }).click();
      const checkout = page.getByRole("dialog", { name: "Оформлення замовлення", exact: true });
      await expectCheckoutAmounts(checkout, expected);
      await checkout.getByText("Всього до сплати:", { exact: true }).scrollIntoViewIfNeeded();
      await capture(page, info, "SCR-05-promo-one10", viewport.width);
    });
  });
}
