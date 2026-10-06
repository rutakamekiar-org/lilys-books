import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

const itemId = "31000000-0000-4000-8000-000000000001";
const product = makeProduct({
  name: "Звичайна. Перша частина дилогії",
  slug: "zvychajna",
  items: [{
    id: itemId, name: "Паперова Звичайна", type: 1, format: 1,
    isAvailable: true, canPreorder: false, price: 499, discountPrice: 399,
    currency: "UAH", note: null,
  }],
});

async function expectFits(container: Locator, elements: Locator[]) {
  const bounds = await container.boundingBox();
  expect(bounds).not.toBeNull();
  expect(await container.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  for (const element of elements) {
    await expect(element).toBeInViewport({ ratio: 1 });
    const box = await element.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(bounds!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
    expect(await element.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
}

async function expectPromoFits(cart: Locator, width: number) {
  const input = cart.getByRole("textbox", { name: "Промокод", exact: true });
  const row = input.locator("..");
  const button = row.getByRole("button");
  await expectFits(cart, [row]);
  await expectFits(row, [input, button]);
  const inputBox = (await input.boundingBox())!;
  const buttonBox = (await button.boundingBox())!;
  expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(buttonBox.x);
  // Hover lifts the button by 1px; both controls must still share the row.
  expect(Math.abs(inputBox.y - buttonBox.y)).toBeLessThanOrEqual(1);
  expect(inputBox.width).toBeGreaterThanOrEqual(120);
  if (width < 640) {
    expect(inputBox.height).toBeGreaterThanOrEqual(44);
    expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    if (await button.isEnabled()) expect(buttonBox.width).toBeGreaterThanOrEqual(44);
  }
}

async function expectFocus(element: Locator) {
  await expect(element).toBeFocused();
  const indicator = await element.evaluate(node => {
    const style = getComputedStyle(node);
    return (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0)
      || style.boxShadow !== "none";
  });
  expect(indicator).toBe(true);
}

async function capture(page: Page, testInfo: TestInfo, state: string, width: number) {
  if (process.env.ZVY59_EVIDENCE !== "1") return;
  const directory = path.join(process.cwd(), "docs", "storefront-promo", "after");
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  const filename = path.join(directory, `SCR-04-promo-${state}-${width}x${width === 1440 ? 900 : 844}.jpg`);
  await page.screenshot({ path: filename, type: "jpeg", quality: 85, animations: "disabled", caret: "hide" });
  await testInfo.attach(state, { path: filename, contentType: "image/jpeg" });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
  test.describe(`cart promo row at ${viewport.width}px`, () => {
    test.use({ viewport, hasTouch: viewport.width < 640 });
    test.beforeEach(async ({ page, request }) => {
      await resetMockApi(request);
      expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
      await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
        ? route.continue() : route.abort());
      await page.goto(`/books/${product.slug}`);
      await page.getByRole("button", { name: /Купити/ }).click();
      await page.getByRole("dialog", { name: "Кошик", exact: true })
        .getByRole("button", { name: "Збільшити кількість" }).click();
    });

    test("entry, loading, rejection and success stay inside the cart and preserve amounts", async ({ page, request }, testInfo) => {
      const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
      const input = cart.getByRole("textbox", { name: "Промокод", exact: true });
      const apply = input.locator("..").getByRole("button");
      const selection = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]"));
      let status = 404;
      let release: () => void = () => {};
      const pending = new Promise<void>(resolve => { release = resolve; });
      let calls = 0;
      await page.route("**/api/PromoCode/validate?**", async route => {
        const url = new URL(route.request().url());
        expect(url.searchParams.getAll("productItemIds")).toEqual([itemId]);
        calls += 1;
        if (calls === 1) await pending;
        await route.fulfill({ status, json: status === 200
          ? { code: "AUDIT10", type: 1, value: 10, applicableProductItemIds: null, remainingUsages: null }
          : { error: "Controlled promo failure" } });
      });
      await input.fill("AUDIT10");
      await expect(cart.getByText("798 грн", { exact: true }).last()).toBeVisible();
      await expectPromoFits(cart, viewport.width);
      await capture(page, testInfo, "entry", viewport.width);
      await apply.click();
      try {
        await expect(apply).toBeDisabled();
        await expect(apply.locator("svg")).toBeVisible();
        await expectPromoFits(cart, viewport.width);
        await capture(page, testInfo, "loading", viewport.width);
      } finally {
        release();
      }
      const feedback = page.getByRole("alert").filter({ hasText: "Невірний або недійсний промокод" });
      await expect(feedback).toBeVisible();
      await expectFits(page.locator("body"), [feedback]);
      await expect(input).toHaveValue("AUDIT10");
      await expect(apply).toBeEnabled();
      await expectPromoFits(cart, viewport.width);
      await capture(page, testInfo, "invalid", viewport.width);
      await expect(feedback).toBeHidden({ timeout: 8_000 });

      status = 503;
      await apply.click();
      await expect(feedback).toBeVisible();
      await expectFits(page.locator("body"), [feedback]);
      await expectPromoFits(cart, viewport.width);
      await capture(page, testInfo, "outage", viewport.width);
      await expect(feedback).toBeHidden({ timeout: 8_000 });

      status = 200;
      await input.press("Enter");
      await expect(cart.getByText("AUDIT10", { exact: true })).toBeVisible();
      // Existing percentage promos round the discounted unit to whole hryvnias: 399 -> 359.
      await expect(cart.getByText("-80 грн", { exact: true })).toBeVisible();
      await expect(cart.getByText("718 грн", { exact: true }).last()).toBeVisible();
      await expectFits(cart, [cart.getByRole("button", { name: "Видалити промокод" }).locator("..")]);
      await capture(page, testInfo, "applied", viewport.width);
      expect(calls).toBe(3);
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]"))).toEqual(selection);
      await cart.getByRole("button", { name: "Видалити промокод" }).click();
      await expect(input).toHaveValue("");
      await expect(apply).toBeDisabled();
      await expect(cart.getByText("798 грн", { exact: true }).last()).toBeVisible();
      await expectPromoFits(cart, viewport.width);
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    test("blank and long input preserve the row and keyboard focus", async ({ page }) => {
      const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
      const input = cart.getByRole("textbox", { name: "Промокод", exact: true });
      const apply = input.locator("..").getByRole("button");
      let calls = 0;
      await page.route("**/api/PromoCode/validate?**", route => { calls += 1; return route.fulfill({ status: 404, json: {} }); });
      await input.fill("   ");
      await input.press("Enter");
      await expect(apply).toBeDisabled();
      expect(calls).toBe(0);
      await input.fill("LONG-CODE-".repeat(40));
      // Inputs scroll their text internally; their outer rectangle must still fit.
      const row = input.locator("..");
      await expectFits(cart, [row]);
      await expectFits(row, [apply]);
      await input.press("Tab");
      await expectFocus(apply);
      await apply.press("Shift+Tab");
      await expectFocus(input);
      expect(calls).toBe(0);
    });
  });
}
