import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

const paperId = "31000000-0000-4000-8000-000000000001";
const digitalId = "31000000-0000-4000-8000-000000000002";
const product = makeProduct({
  name: "Під шепіт снігу: збірка різдвяної прози", slug: "pid_shepit_snihu",
  items: [
    { id: paperId, name: "Паперова Під шепіт снігу", type: 1, format: 1,
      isAvailable: false, canPreorder: true, price: 399, discountPrice: 349, currency: "UAH", note: null },
    { id: digitalId, name: "Електронна Під шепіт снігу", type: 2, format: 2,
      isAvailable: true, canPreorder: true, price: 199, discountPrice: null, currency: "UAH", note: null },
  ],
});
const label = "Передзамовлення";
const guidance = "Передзамовити або додати до кошика";

async function fits(element: Locator) {
  await expect(element).toBeVisible();
  expect(await element.evaluate(node => {
    const box = node.getBoundingClientRect();
    return box.left >= 0 && box.right <= document.documentElement.clientWidth
      && node.scrollWidth <= node.clientWidth && node.scrollHeight <= node.clientHeight;
  })).toBe(true);
}

async function capture(page: Page, info: TestInfo, state: string, width: number) {
  const phase = process.env.ZVY66_EVIDENCE_PHASE;
  if (!phase) return;
  if (!["before", "after"].includes(phase)) throw new Error("Unknown evidence phase");
  const directory = path.join(process.cwd(), "docs/storefront-preorder", phase);
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  if (state !== "SCR-04-preorder") {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }
  const filename = path.join(directory, `${state}-${width}x${width === 1440 ? 900 : 844}.jpg`);
  await page.screenshot({ path: filename, type: "jpeg", quality: 85, fullPage: state !== "SCR-04-preorder", animations: "disabled", caret: "hide" });
  await info.attach(state, { path: filename, contentType: "image/jpeg" });
}

async function expectSelection(page: Page, expected: { itemId: string; quantity: number; format: string }[]) {
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]")
    .map((item: { itemId: string; quantity: number; format: string }) => ({ itemId: item.itemId, quantity: item.quantity, format: item.format })))).toEqual(expected);
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
  test.describe(`preorder disclosure at ${viewport.width}px`, () => {
    test.use({ viewport, hasTouch: viewport.width < 640 });
    test.beforeEach(async ({ page, request }) => {
      await resetMockApi(request);
      expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
      await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
        ? route.continue() : route.abort());
    });

    test("capture matching catalog, product and cart preorder evidence", async ({ page, request }, info) => {
      await page.goto("/books");
      const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: product.name }) });
      await expect(card.getByText("349 грн", { exact: true })).toBeVisible();
      await capture(page, info, "SCR-02-preorder", viewport.width);
      await card.getByRole("link").click();
      await expect(page.getByRole("button", { name: /Передзамовити — .*349 грн/ })).toBeEnabled();
      await capture(page, info, "SCR-03-preorder", viewport.width);
      await page.getByRole("button", { name: /Передзамовити — .*349 грн/ }).click();
      const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
      await expect(cart.getByText("349 грн", { exact: true }).last()).toBeVisible();
      await expectSelection(page, [{ itemId: paperId, quantity: 1, format: "paper" }]);
      await capture(page, info, "SCR-04-preorder", viewport.width);
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    test("exact-edition labels, guidance and mixed cart preserve selection and amounts", async ({ page, request }) => {
      await page.goto("/books");
      const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: product.name }) });
      const paper = card.getByRole("button", { name: `Додати в кошик: Паперова, ${product.name}` });
      const digital = card.getByRole("button", { name: `Додати в кошик: Електронна, ${product.name}` });
      await fits(paper.locator("..").getByText(label, { exact: true }));
      await expect(digital.locator("..").getByText(label, { exact: true })).toHaveCount(0);
      await paper.click();
      await digital.click();
      await page.getByRole("button", { name: /Кошик, 2 товарів/ }).click();
      const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
      const paperLine = cart.locator(`[data-cart-item-id="${paperId}"]`);
      const digitalLine = cart.locator(`[data-cart-item-id="${digitalId}"]`);
      await fits(paperLine.getByText(label, { exact: true }));
      await expect(digitalLine.getByText(label, { exact: true })).toHaveCount(0);
      await expect(paperLine.getByText("349 грн за шт.", { exact: true })).toBeVisible();
      await expect(digitalLine.getByText("199 грн за шт.", { exact: true })).toBeVisible();
      await cart.getByRole("button", { name: "Збільшити кількість" }).click();
      await expect(cart.getByText("897 грн", { exact: true }).last()).toBeVisible();
      await expectSelection(page, [{ itemId: paperId, quantity: 2, format: "paper" }, { itemId: digitalId, quantity: 1, format: "digital" }]);
      await cart.getByRole("button", { name: "Закрити", exact: true }).press("Escape");
      await expect(cart).toBeHidden();
      await expect(page.getByRole("button", { name: /Кошик, 3 товарів/ })).toBeFocused();
      await card.getByRole("link").click();
      await fits(page.getByText(guidance, { exact: true }));
      await expect(page.getByRole("main")).not.toContainText("Купити зараз");
      await page.getByRole("radio", { name: /Електронна/ }).check();
      await expect(page.getByText(guidance, { exact: true })).toHaveCount(0);
      const action = viewport.width < 640 ? "Переглянути кошик" : /Купити — 199 грн/;
      await expect(page.getByRole("button", { name: action })).toBeEnabled();
      await page.getByRole("radio", { name: /Паперова/ }).check();
      await expect(page.getByText(guidance, { exact: true })).toBeVisible();
      await page.reload();
      await page.getByRole("button", { name: /Кошик, 3 товарів/ }).click();
      await fits(paperLine.getByText(label, { exact: true }));
      await expect(cart.getByText("897 грн", { exact: true }).last()).toBeVisible();
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    test("live status changes follow the edition without replacing the cart item or price", async ({ page, request }) => {
      await page.goto(`/books/${product.slug}`);
      await page.getByRole("button", { name: /Передзамовити — .*349 грн/ }).click();
      const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
      const line = cart.locator(`[data-cart-item-id="${paperId}"]`);
      await expect(line.getByText(label, { exact: true })).toBeVisible();
      for (const status of [{ isAvailable: true, canPreorder: true }, { isAvailable: false, canPreorder: false }, { isAvailable: false, canPreorder: true }]) {
        expect((await request.post(`${mockApiUrl}/__control/products`, { data: { ...product, items: [{ ...product.items[0], ...status }, product.items[1]] } })).ok()).toBe(true);
        const refreshed = page.waitForResponse(response => new URL(response.url()).pathname === `/api/products/${product.slug}`);
        await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
        expect((await refreshed).status()).toBe(200);
        const action = status.isAvailable ? /Купити — .*349 грн/ : status.canPreorder ? /Передзамовити — .*349 грн/ : "Немає в наявності";
        const button = page.getByRole("button", { name: viewport.width < 640 ? "Переглянути кошик" : action });
        if (status.isAvailable || status.canPreorder) await expect(button).toBeEnabled();
        else await expect(button).toBeDisabled();
        if (!status.isAvailable && status.canPreorder) await expect(line.getByText(label, { exact: true })).toBeVisible();
        else await expect(line.getByText(label, { exact: true })).toHaveCount(0);
        await expect(line.getByText("349 грн за шт.", { exact: true })).toBeVisible();
        await expectSelection(page, [{ itemId: paperId, quantity: 1, format: "paper" }]);
      }
      // A failed refresh retains the last API-confirmed edition status.
      await page.route("**/api/products**", route => route.fulfill({ status: 503, json: { error: "Controlled outage" } }));
      const failedRefresh = page.waitForResponse(response => new URL(response.url()).pathname === `/api/products/${product.slug}`);
      await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
      expect((await failedRefresh).status()).toBe(503);
      await fits(line.getByText(label, { exact: true }));
      await cart.getByRole("button", { name: "Закрити", exact: true }).click();
      await expect(page.getByText(guidance, { exact: true })).toBeVisible();
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    test("unavailable editions have no preorder label and remain disabled", async ({ page }) => {
      await page.goto("/books");
      const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Unavailable Book", exact: true }) });
      await expect(card.getByText(label, { exact: true })).toHaveCount(0);
      await expect(card.getByRole("button", { name: /Додати в кошик/ })).toBeDisabled();
      await card.getByRole("link").click();
      await expect(page.getByRole("button", { name: "Немає в наявності" })).toBeDisabled();
      await expect(page.getByText(guidance, { exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Додати в кошик", exact: true, includeHidden: true })).toBeDisabled();
      await expectSelection(page, []);
    });
  });
}
