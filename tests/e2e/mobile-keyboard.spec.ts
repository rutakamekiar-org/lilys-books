import { expect, test, type Locator, type Page } from "@playwright/test";
import { resetMockApi } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

async function openCart(page: Page): Promise<Locator> {
  await page.goto("/books/test-book");
  await page.getByRole("radio", { name: /Електронна/ }).check();
  await page.getByRole("button", { name: /Купити/ }).click();
  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toBeVisible();
  return cart;
}

async function openCheckout(page: Page): Promise<Locator> {
  const cart = await openCart(page);
  await cart.getByRole("button", { name: "Оформити замовлення" }).click();
  const checkout = page.getByRole("dialog", { name: "Оформлення замовлення" });
  await expect(checkout).toBeVisible();
  return checkout;
}

async function expectNoIosFocusZoom(dialog: Locator) {
  const fields = dialog.locator("input:not([type=radio]):not([type=checkbox]), textarea, select");
  await expect(fields.first()).toBeVisible();
  const sizes = await fields.evaluateAll(nodes => nodes.map(node => parseFloat(getComputedStyle(node).fontSize)));
  expect(sizes.length).toBeGreaterThan(0);
  // iOS Safari zooms the page into focused fields smaller than 16px.
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16);
}

/** Simulates iOS opening the keyboard: the visual viewport shrinks and scrolls down. */
async function simulateKeyboard(page: Page, top: number, height: number) {
  await page.evaluate(([offsetTop, viewportHeight]) => {
    const viewport = window.visualViewport!;
    Object.defineProperty(viewport, "offsetTop", { configurable: true, get: () => offsetTop });
    Object.defineProperty(viewport, "height", { configurable: true, get: () => viewportHeight });
    viewport.dispatchEvent(new Event("resize"));
  }, [top, height]);
}

async function expectPinnedToVisualViewport(dialog: Locator, top: number, height: number) {
  await expect.poll(async () => {
    const box = await dialog.boundingBox();
    return box && { top: Math.round(box.y), bottom: Math.round(box.y + box.height) };
  }).toEqual({ top, bottom: top + height });
}

test("cart text fields are at least 16px so iOS does not zoom on focus", async ({ page }) => {
  await expectNoIosFocusZoom(await openCart(page));
});

test("checkout text fields are at least 16px so iOS does not zoom on focus", async ({ page }) => {
  await expectNoIosFocusZoom(await openCheckout(page));
});

test("cart sheet stays pinned to the visible viewport when the keyboard opens", async ({ page }) => {
  const cart = await openCart(page);
  await simulateKeyboard(page, 300, 450);
  await expectPinnedToVisualViewport(cart, 300, 450);
  await expect(cart.getByRole("heading", { name: "Кошик" })).toBeInViewport();
  await expect(cart.getByRole("textbox", { name: "Промокод", exact: true })).toBeInViewport();
});

test("checkout sheet stays pinned to the visible viewport when the keyboard opens", async ({ page }) => {
  const checkout = await openCheckout(page);
  await simulateKeyboard(page, 300, 450);
  await expectPinnedToVisualViewport(checkout, 300, 450);
  await expect(checkout.getByRole("heading", { name: "Оформлення замовлення" })).toBeInViewport();
});
