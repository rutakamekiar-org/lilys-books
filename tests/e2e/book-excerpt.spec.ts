import { expect, test, type APIRequestContext, type Locator } from "@playwright/test";
import { existingProduct } from "../fixtures/products.mjs";
import { expectNoA11yViolations } from "./a11y";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

const paper = { ...existingProduct.items[0], id: "81000000-0000-4000-8000-000000000001", price: 499 };
const digital = { ...existingProduct.items[1], id: "81000000-0000-4000-8000-000000000002", price: 199, discountPrice: 149 };
const longDescription = Array.from({ length: 18 }, (_, index) =>
  `Розділ ${index + 1}. Довгий опис книги для перевірки розташування уривку перед описом.`,
).join("\n\n");

async function publishBook(request: APIRequestContext, overrides: Record<string, unknown> = {}) {
  const product = makeProduct({
    slug: "zvychajna",
    name: "Excerpt Test Book",
    hasExcerpt: true,
    externalBookRatings: existingProduct.externalBookRatings,
    description: longDescription,
    items: [paper, digital],
    externalLinks: [{ label: "Послухати", url: "https://example.invalid/audio", icon: null }],
    ...overrides,
  });
  expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
  return product;
}

async function documentBounds(locator: Locator) {
  return locator.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
  test.describe(`excerpt at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });
    test.beforeEach(async ({ request, page }) => {
      await resetMockApi(request);
      // Keep analytics and any external links away from real services.
      await page.route("**/*", route => {
        const url = new URL(route.request().url());
        return ["127.0.0.1", "localhost"].includes(url.hostname) ? route.continue() : route.abort();
      });
    });

    for (const slug of ["zvychajna", "brunette-stories"]) {
      test(`${slug}: sample precedes mobile purchase controls and stays under the desktop cover`, async ({ page, request }) => {
        const product = await publishBook(request, { slug, items: slug === "zvychajna" ? [paper, digital] : [paper] });
        await page.goto(`/books/${product.slug}`);
        const opener = page.getByRole("button", { name: "Читати уривок", exact: true });
        const description = page.getByRole("region", { name: "Опис", exact: true });
        const buy = page.getByRole("button", { name: "Купити — 499 грн", exact: true });
        const listen = page.getByRole("link", { name: "Послухати", exact: true });
        await expect(buy).toBeVisible();
        await expect(opener).toHaveCount(1);
        await expect(listen).toHaveCount(1);
        for (const expanded of [false, true]) {
          if (expanded) await page.getByRole("button", { name: "Читати далі ↓", exact: true }).click();
          const sample = await documentBounds(opener);
          const details = await documentBounds(description);
          const purchase = await documentBounds(buy);
          if (viewport.width < 960) {
            expect(sample.y + sample.height).toBeLessThan(purchase.y);
            expect(sample.y + sample.height).toBeLessThan(details.y);
            if (viewport.width <= 640) {
              const title = await documentBounds(page.getByRole("heading", { level: 1 }));
              expect(sample.x).toBeCloseTo(title.x, 0);
              const rating = await documentBounds(page.getByRole("link", { name: /Середня оцінка/ }));
              expect(sample.y - rating.y - rating.height).toBeGreaterThanOrEqual(12);
            }
            expect(sample.width).toBeLessThan(purchase.width);
            if (slug === "zvychajna") {
              const selector = await documentBounds(page.getByRole("radiogroup", { name: "Формат", exact: true }));
              expect(sample.y + sample.height).toBeLessThan(selector.y);
            }
            expect(await opener.evaluate((node, descriptionId) => Boolean(
              node.compareDocumentPosition(document.getElementById(descriptionId)!) & Node.DOCUMENT_POSITION_FOLLOWING,
            ), `book-description-${slug}`)).toBe(true);
            expect((await documentBounds(listen)).y).toBeGreaterThan(details.y + details.height);
          } else {
            const cover = await documentBounds(page.getByRole("img", { name: product.name }).first());
            expect(sample.y).toBeGreaterThan(cover.y + cover.height);
            expect(sample.x + sample.width).toBeLessThan(purchase.x);
            expect(sample.width).toBeCloseTo(cover.width, 0);
          }
          expect(sample.height).toBeGreaterThanOrEqual(44);
          expect(sample.x).toBeGreaterThanOrEqual(0);
          expect(sample.x + sample.width).toBeLessThanOrEqual(viewport.width);
        }
      });
    }

    test("keyboard sampling preserves the discounted edition, cart item, amount and focus", async ({ page, request }) => {
      await publishBook(request);
      await page.goto("/books/zvychajna");
      const edition = page.getByRole("radio", { name: /Електронна/ });
      await edition.check();
      const buy = page.getByRole("button", { name: /^Купити — 199 149 грн$/ });
      await expect(buy).toBeVisible();
      const opener = page.getByRole("button", { name: "Читати уривок", exact: true });
      await opener.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", { name: /Читати уривок/ });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("Завантаження...", { exact: true })).toBeHidden();
      await expect(dialog.locator("p").first()).toBeVisible();
      const close = dialog.getByRole("button", { name: "Закрити", exact: true });
      await expect(close).toBeFocused();
      const text = dialog.getByRole("region", { name: "Текст уривку", exact: true });
      await page.keyboard.press("Tab");
      await expect(text).toBeFocused();
      expect(await text.evaluate(node => node.scrollHeight)).toBeGreaterThan(await text.evaluate(node => node.clientHeight));
      await page.keyboard.press("ArrowDown");
      await expect.poll(() => text.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
      await page.keyboard.press("Tab");
      await expect(close).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(text).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(close).toBeFocused();
      await expectNoA11yViolations(page, `${viewport.width}px excerpt`);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
      await expect(edition).toBeChecked();
      await expect(buy).toBeVisible();
      // The visible Close control must restore the same opener too.
      await page.keyboard.press("Enter");
      await expect(dialog).toBeVisible();
      await close.click();
      await expect(opener).toBeFocused();
      await expect(edition).toBeChecked();
      await buy.click();
      const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
      await expect(cart.getByText("Електронна", { exact: true })).toBeVisible();
      await expect(cart.getByText("149 грн за шт.", { exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]")
        .map((item: { itemId: string; format: string; quantity: number }) => ({ itemId: item.itemId, format: item.format, quantity: item.quantity }))))
        .toEqual([{ itemId: digital.id, format: "digital", quantity: 1 }]);
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    test("a book without an excerpt exposes no dead sample action", async ({ page, request }) => {
      await publishBook(request, { slug: `without-excerpt-${viewport.width}`, hasExcerpt: false });
      await page.goto(`/books/without-excerpt-${viewport.width}`);
      await expect(page.getByRole("button", { name: "Купити — 499 грн", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Читати уривок", exact: true })).toHaveCount(0);
      await expect(page.getByRole("dialog", { name: /Читати уривок/ })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Послухати", exact: true })).toHaveCount(1);
    });

    for (const failure of ["http", "network"] as const) {
      test(`${failure} excerpt failure can be closed without changing the edition`, async ({ page, request }) => {
        await publishBook(request);
        await page.route("**/content/excerpts/zvychajna.html", route => failure === "http"
          ? route.fulfill({ status: 503, body: "Controlled unavailable excerpt" }) : route.abort("failed"));
        await page.goto("/books/zvychajna");
        const edition = page.getByRole("radio", { name: /Електронна/ });
        await edition.check();
        const opener = page.getByRole("button", { name: "Читати уривок", exact: true });
        await opener.click();
        const dialog = page.getByRole("dialog", { name: /Читати уривок/ });
        await expect(dialog.getByText(failure === "http" ? "Уривок тимчасово недоступний." : "Помилка завантаження уривку.", { exact: true })).toBeVisible();
        await dialog.getByRole("button", { name: "Закрити", exact: true }).click();
        await expect(dialog).toBeHidden();
        await expect(opener).toBeFocused();
        await expect(edition).toBeChecked();
        await expect(page.getByRole("button", { name: /^Купити — 199 149 грн$/ })).toBeVisible();
      });
    }
  });
}
