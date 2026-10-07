import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

const deliveryCopy = "Електронна книга у форматі EPUB. Надсилаємо файл на електронну пошту.";
const books = [
  { slug: "zvychajna", name: "Звичайна", suffix: "1", price: 199, discountPrice: 179 },
  { slug: "inaksha", name: "Інакша", suffix: "2", price: 249, discountPrice: null },
].map(book => makeProduct({
  id: `30000000-0000-4000-8000-00000000000${book.suffix}`,
  slug: book.slug, name: book.name, author: "Лілія Грек",
  imageUrl: `/images/products/${book.slug}/${book.slug === "inaksha" ? "inaksha.webp" : "book.webp"}`,
  imageUrls: [`/images/products/${book.slug}/${book.slug === "inaksha" ? "inaksha.webp" : "book.webp"}`],
  description: "Контрольний опис книги для перевірки вибору електронного видання.",
  items: [
    { id: `31000000-0000-4000-8000-0000000000${book.suffix}1`, name: `Паперова ${book.name}`,
      type: 1, format: 1, isAvailable: true, canPreorder: false, price: 499, discountPrice: null,
      currency: "UAH", note: "Примітка паперового видання" },
    { id: `31000000-0000-4000-8000-0000000000${book.suffix}2`, name: `Електронна ${book.name}`,
      type: 2, format: 2, isAvailable: true, canPreorder: false, price: book.price, discountPrice: book.discountPrice,
      currency: "UAH", note: "Примітка електронного видання" },
  ],
}));

async function capture(page: Page, info: TestInfo, state: string) {
  const phase = process.env.ZVY65_EVIDENCE_PHASE;
  if (!phase) return;
  if (!["before", "after"].includes(phase)) throw new Error("Unknown evidence phase");
  const viewport = page.viewportSize()!;
  const directory = path.join(process.cwd(), "docs/storefront-ebook-delivery", phase);
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.getByRole("main").locator("img").evaluateAll(images =>
    images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const filename = path.join(directory, `${state}-${viewport.width}x${viewport.height}.jpg`);
  await page.screenshot({ path: filename, type: "jpeg", quality: 85, animations: "disabled", caret: "hide" });
  await info.attach(state, { path: filename, contentType: "image/jpeg" });
}

async function fits(element: Locator) {
  await expect(element).toBeVisible();
  expect(await element.evaluate(node => {
    const box = node.getBoundingClientRect();
    return box.left >= 0 && box.right <= document.documentElement.clientWidth
      && node.scrollWidth <= node.clientWidth && node.scrollHeight <= node.clientHeight;
  })).toBe(true);
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
  test.describe(`ebook delivery at ${viewport.width}px`, () => {
    test.use({ viewport, hasTouch: viewport.width < 640 });
    test.beforeEach(async ({ page, request }) => {
      await resetMockApi(request);
      for (const book of books) {
        expect((await request.post(`${mockApiUrl}/__control/products`, { data: book })).ok()).toBe(true);
      }
      await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
        ? route.continue() : route.abort());
    });

    test("capture matching digital book and cart evidence", async ({ page, request }, info) => {
      for (const [index, book] of books.entries()) {
        const ebook = book.items[1];
        const price = ebook.discountPrice ?? ebook.price;
        await page.goto(`/books/${book.slug}`);
        await expect.poll(() => page.getByRole("img", { name: book.name, exact: true }).first().evaluate(image => {
          const url = new URL(image.getAttribute("src")!, window.location.href);
          return url.searchParams.get("url") ?? url.pathname;
        })).toBe(book.imageUrl);
        await page.getByRole("radio", { name: /Електронна/ }).check();
        const buy = page.getByRole("button", { name: new RegExp(`Купити — .*${price} грн`) });
        await expect(buy).toBeEnabled();
        await capture(page, info, index === 0 ? "SCR-03-digital" : "SCR-03-sequel-digital");
        if (index === 0) {
          await buy.click();
          const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
          await expect(cart.locator(`[data-cart-item-id="${ebook.id}"]`)).toBeVisible();
          await expect(cart.getByText(`${price} грн`, { exact: true }).last()).toBeVisible();
          await capture(page, info, "SCR-04-digital");
          await cart.getByRole("button", { name: "Закрити", exact: true }).click();
        }
      }
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    for (const book of books) {
      test(`${book.slug}: explains the selected ebook before checkout and preserves its item and price`, async ({ page, request }) => {
        const ebook = book.items[1];
        const price = ebook.discountPrice ?? ebook.price;
        await page.goto(`/books/${book.slug}`);
        const copy = page.getByText(deliveryCopy, { exact: true });
        await expect(copy).toHaveCount(0);
        const digital = page.getByRole("radio", { name: /Електронна/ });
        await digital.focus();
        await digital.press("Space");
        await expect(digital).toBeChecked();
        await fits(copy);
        await expect(page.getByText("Примітка електронного видання", { exact: true })).toBeVisible();
        await expect(page.getByText("Примітка паперового видання", { exact: true })).toHaveCount(0);
        const buy = page.getByRole("button", { name: new RegExp(`Купити — .*${price} грн`) });
        await expect(buy).toHaveAccessibleDescription(deliveryCopy);
        await expect(page.getByRole("button", { name: "Додати в кошик", exact: true, includeHidden: true })).toHaveAccessibleDescription(deliveryCopy);
        const copyBox = await copy.boundingBox();
        const buyBox = await buy.boundingBox();
        expect(copyBox!.y + copyBox!.height).toBeLessThanOrEqual(buyBox!.y);
        await page.getByRole("radio", { name: /Паперова/ }).check();
        await expect(copy).toHaveCount(0);
        await expect(page.getByRole("button", { name: /Купити — 499 грн/ })).toHaveAccessibleDescription("");
        await digital.check();
        await buy.press("Enter");
        const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
        const line = cart.locator(`[data-cart-item-id="${ebook.id}"]`);
        await expect(line.getByText("Електронна", { exact: true })).toBeVisible();
        await expect(line.getByText(`${price} грн за шт.`, { exact: true })).toBeVisible();
        await expect(cart.getByText(`${price} грн`, { exact: true }).last()).toBeVisible();
        expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]")
          .map((item: { itemId: string; quantity: number; format: string }) => ({ itemId: item.itemId, quantity: item.quantity, format: item.format }))))
          .toEqual([{ itemId: ebook.id, quantity: 1, format: "digital" }]);
        await cart.getByRole("button", { name: "Закрити", exact: true }).press("Escape");
        await expect(cart).toBeHidden();
        await expect(page.getByRole("button", { name: viewport.width < 640 ? "Переглянути кошик" : new RegExp(`Купити — .*${price} грн`) })).toBeFocused();
        await fits(copy);
        expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
      });
    }

    test("live ebook price, preorder, unavailability and refresh failure keep delivery tied to selection", async ({ page, request }) => {
      const book = books[0];
      await page.goto(`/books/${book.slug}`);
      await page.getByRole("radio", { name: /Електронна/ }).check();
      const copy = page.getByText(deliveryCopy, { exact: true });
      for (const status of [
        { isAvailable: true, canPreorder: false },
        { isAvailable: false, canPreorder: true },
        { isAvailable: false, canPreorder: false },
      ]) {
        expect((await request.post(`${mockApiUrl}/__control/products`, { data: {
          ...book, items: [book.items[0], { ...book.items[1], ...status, discountPrice: 159 }],
        } })).ok()).toBe(true);
        const refreshed = page.waitForResponse(response => new URL(response.url()).pathname === `/api/products/${book.slug}`);
        await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
        expect((await refreshed).status()).toBe(200);
        const action = status.isAvailable ? /Купити — .*159 грн/ : status.canPreorder ? /Передзамовити — .*159 грн/ : "Немає в наявності";
        const buy = page.getByRole("button", { name: action });
        if (status.isAvailable || status.canPreorder) await expect(buy).toBeEnabled();
        else await expect(buy).toBeDisabled();
        await expect(page.getByRole("radio", { name: /Електронна/ })).toBeChecked();
        await fits(copy);
        await expect(buy).toHaveAccessibleDescription(deliveryCopy);
      }
      await page.route("**/api/products**", route => route.fulfill({ status: 503, json: { error: "Controlled outage" } }));
      const failed = page.waitForResponse(response => new URL(response.url()).pathname === `/api/products/${book.slug}`);
      await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
      expect((await failed).status()).toBe(503);
      await fits(copy);
      await expect(page.getByRole("button", { name: "Немає в наявності" })).toBeDisabled();
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]"))).toEqual([]);
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });
  });
}
