import { expect, test } from "@playwright/test";
import { existingProduct } from "../fixtures/products.mjs";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";

for (const width of [360, 390]) {
  test.describe(`mobile purchase ${width}`, () => {
    test.use({ viewport: { width, height: 844 } });
    test.beforeEach(async ({ request }) => { await resetMockApi(request); });

    test("one Buy retains existing items, opens the selected edition and never duplicates it", async ({ page, request }) => {
      const product = makeProduct({ name: "Звичайна. Перша частина дилогії", slug: "inaksha", externalBookRatings: existingProduct.externalBookRatings, hasExcerpt: false });
      await request.post(`${mockApiUrl}/__control/products`, { data: product });
      await request.post(`${mockApiUrl}/__control/products`, { data: makeProduct({ id: "90000000-0000-4000-8000-000000000001", slug: "inaksha-art", items: [{ ...existingProduct.items[0], id: "91000000-0000-4000-8000-000000000001" }] }) });
      await page.goto("/books/test-book");
      await page.getByRole("button", { name: "Купити — 350 грн", exact: true }).click();
      const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
      await cart.getByRole("button", { name: "Продовжити покупки" }).click();
      await page.goto(`/books/${product.slug}`);
      await expect(page.getByRole("button", { name: "Додати в кошик", exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole("button", { name: "Купити — 420 грн", exact: true }).click();
      await expect(cart.getByRole("heading", { name: "Test Book", exact: true })).toBeVisible();
      const added = cart.getByRole("group", { name: `${product.name}, Паперова`, exact: true });
      await expect(added).toBeInViewport();
      await expect(cart.getByText("770 грн", { exact: true })).toBeVisible();
      for (const name of ["Зменшити кількість", "Збільшити кількість", "Видалити з кошика"]) {
        const box = await added.getByRole("button", { name, exact: true }).boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.width).toBeGreaterThanOrEqual(44);
      }
      await added.getByRole("button", { name: "Збільшити кількість" }).click();
      await expect(cart.getByText("1190 грн", { exact: true })).toBeVisible();
      await added.getByRole("button", { name: "Зменшити кількість" }).click();
      await expect(cart.getByText("770 грн", { exact: true })).toBeVisible();
      const promo = await cart.getByRole("textbox", { name: "Промокод", exact: true }).boundingBox();
      const apply = await cart.getByRole("button", { name: "Застосувати", exact: true }).boundingBox();
      expect(promo!.x + promo!.width).toBeLessThanOrEqual(apply!.x);
      expect(apply!.x + apply!.width).toBeLessThanOrEqual(width);
      await expectNoA11yViolations(page, "mobile cart");
      await cart.getByRole("button", { name: "Продовжити покупки" }).click();
      const view = page.getByRole("button", { name: "Переглянути кошик", exact: true });
      await expect(view).toBeFocused();
      await view.click();
      await expect(cart.getByText("770 грн", { exact: true })).toBeVisible();
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]"));
      expect(stored).toHaveLength(2);
      expect(stored.every((item: { quantity: number }) => item.quantity === 1)).toBe(true);
      await added.getByRole("button", { name: "Видалити з кошика" }).click();
      await expect(added).toHaveCount(0);
      await expect(cart.getByText("350 грн", { exact: true }).last()).toBeVisible();
      await cart.getByRole("button", { name: "Оформити замовлення" }).click();
      await expect(page.getByRole("dialog", { name: "Оформлення замовлення" })).toBeVisible();
      const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
      expect(state.invoiceRequests).toBe(0);
    });

    test("empty cart traps keyboard focus and Continue shopping restores its opener", async ({ page }) => {
      await page.goto("/books/test-book");
      const opener = page.getByRole("button", { name: "Кошик, 0 товарів", exact: true });
      await opener.click();
      const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
      for (let index = 0; index < 5; index++) {
        await page.keyboard.press("Tab");
        expect(await cart.evaluate(node => node.contains(document.activeElement))).toBe(true);
      }
      await cart.getByRole("button", { name: "Продовжити покупки" }).click();
      await expect(cart).toBeHidden();
      await expect(opener).toBeFocused();
    });

    test("a new item in a long cart is visible above the fixed checkout actions", async ({ page }) => {
      const seeded = Array.from({ length: 6 }, (_, index) => {
        const itemId = `long-cart-item-${index}`;
        const product = makeProduct({ id: `long-cart-product-${index}`, name: `Existing book ${index}`, items: [{ ...existingProduct.items[0], id: itemId }] });
        return { product, itemId, format: "paper", quantity: 1 };
      });
      await page.addInitScript(items => localStorage.setItem("cart", JSON.stringify(items)), seeded);
      await page.goto("/books/test-book");
      await page.getByRole("button", { name: "Купити — 350 грн", exact: true }).click();
      const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
      const added = cart.getByRole("group", { name: "Test Book, Паперова", exact: true });
      await expect(added).toBeInViewport();
      const itemBox = await added.boundingBox();
      const promoBox = await cart.getByRole("textbox", { name: "Промокод" }).boundingBox();
      expect(itemBox!.y + itemBox!.height).toBeLessThanOrEqual(promoBox!.y);
      await expect(cart.getByRole("button", { name: "Оформити замовлення" })).toBeInViewport();
      await expect(cart.getByRole("button", { name: "Продовжити покупки" })).toBeInViewport();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Переглянути кошик", exact: true })).toBeFocused();
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]").length)).toBe(7);
    });
  });
}
