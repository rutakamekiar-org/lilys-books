import { expect, test, type APIRequestContext, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";

const paperId = "31000000-0000-4000-8000-000000000011";
const digitalId = "31000000-0000-4000-8000-000000000012";
const sequelPaperId = "31000000-0000-4000-8000-000000000031";
const artId = "31000000-0000-4000-8000-000000000021";
const otherArtId = "31000000-0000-4000-8000-000000000022";
const book = makeProduct({
  name: "Звичайна", slug: "zvychajna", author: "Лілія Грек",
  description: "Контрольна книга для перевірки вибору доступного видання.",
  items: [
    { id: paperId, name: "Паперова Звичайна", type: 1, format: 1,
      isAvailable: false, canPreorder: false, price: 499, discountPrice: null, currency: "UAH", note: null },
    { id: digitalId, name: "Електронна Звичайна", type: 2, format: 2,
      isAvailable: true, canPreorder: false, price: 199, discountPrice: 179, currency: "UAH", note: null },
  ],
});
const sequel = { ...book, id: "30000000-0000-4000-8000-000000000003", name: "Інакша", slug: "inaksha",
  items: [{ ...book.items[0], id: sequelPaperId, isAvailable: true, discountPrice: 449 }] };
const art = makeProduct({
  id: "30000000-0000-4000-8000-000000000002", name: "Ілюстрації до Інакшої", slug: "inaksha-art", type: 2,
  imageUrl: "/images/products/inaksha-art/inaksha-art1.webp", imageUrls: ["/images/products/inaksha-art/inaksha-art1.webp"],
  items: [{ ...book.items[0], id: artId, name: "Ілюстрації", price: 150, discountPrice: 125, isAvailable: true }],
});

async function put(request: APIRequestContext, product: Record<string, unknown>) {
  expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
}

async function refresh(page: Page) {
  const response = page.waitForResponse(res => new URL(res.url()).pathname === "/api/products");
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  expect((await response).status()).toBe(200);
}

async function selection(page: Page, expected: { itemId: string; quantity: number; format: string }[]) {
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]")
    .map((item: { itemId: string; quantity: number; format: string }) => ({ itemId: item.itemId, quantity: item.quantity, format: item.format })))).toEqual(expected);
}

async function capture(page: Page, info: TestInfo, state: string) {
  const phase = process.env.ZVY63_EVIDENCE_PHASE;
  if (!phase) return;
  if (!["before", "after"].includes(phase)) throw new Error("Unknown evidence phase");
  const viewport = page.viewportSize()!;
  const directory = path.join(process.cwd(), "docs/storefront-selection/zvy-63", phase);
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator("main img, [role=dialog] img").evaluateAll(images =>
    images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const dialog = page.getByRole("dialog", { name: "Разом цікавіше?" });
  if (await dialog.isVisible()) {
    await expect.poll(() => dialog.locator("div").first().evaluate(node =>
      node.getAnimations().every(animation => animation.playState === "finished"))).toBe(true);
  }
  const filename = path.join(directory, `${state}-${viewport.width}x${viewport.height}.jpg`);
  await page.screenshot({ path: filename, type: "jpeg", quality: 85, animations: "disabled", caret: "hide" });
  await info.attach(state, { path: filename, contentType: "image/jpeg" });
}

// Mobile Buy already bypasses suggestions. Open at desktop, then resize to exercise
// a dialog that remains open across the breakpoint without changing that journey.
async function openSuggestion(page: Page, viewport: { width: number; height: number }) {
  await page.addInitScript(() => localStorage.removeItem("cart"));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/books/inaksha");
  await expect(page.getByRole("button", { name: /Купити — .*449 грн/ })).toBeEnabled();
  await expect.poll(() => page.getByRole("button", { name: /Кошик, 0 товарів/ }).count()).toBe(1);
  await page.getByRole("button", { name: /Купити — .*449 грн/ }).click();
  const dialog = page.getByRole("dialog", { name: "Разом цікавіше?" });
  await expect(dialog).toBeVisible();
  await page.setViewportSize(viewport);
  return dialog;
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
  test.describe(`edition selection at ${viewport.width}px`, () => {
    test.use({ viewport, hasTouch: viewport.width < 640 });
    test.beforeEach(async ({ page, request }) => {
      await resetMockApi(request);
      await put(request, book);
      await put(request, art);
      await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
        ? route.continue() : route.abort());
    });
    test.afterEach(async ({ request }) => {
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    test("capture matching fallback, unavailable suggestion and settled dialog evidence", async ({ page, request }, info) => {
      await page.goto("/books/zvychajna");
      await expect(page.getByRole("radio", { name: /Паперова/ })).toBeDisabled();
      await capture(page, info, "SCR-03-paper-unavailable");
      if (process.env.ZVY63_EVIDENCE_PHASE !== "before") {
        await page.getByRole("button", { name: /Купити — .*179 грн/ }).click();
        await capture(page, info, "SCR-04-fallback-ebook");
      }
      await page.evaluate(() => localStorage.clear());
      await page.goto("/books/inaksha-art");
      // Record the exact unavailable merch product page as well as Buy continuation.
      await put(request, { ...art, items: [{ ...art.items[0], isAvailable: false }] });
      await refresh(page);
      await expect(page.getByRole("button", { name: "Немає в наявності" })).toBeDisabled();
      await capture(page, info, "SCR-03-merch-unavailable");
      await put(request, sequel);
      await page.goto("/books/inaksha");
      await page.getByRole("button", { name: /Купити — .*449 грн/ }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await capture(page, info, "SCR-03-suggestion-unavailable");
      // Reset the cart, then capture a fully settled eligible dialog and changed eligibility.
      await page.evaluate(() => localStorage.clear());
      await put(request, art);
      await page.reload();
      const dialog = await openSuggestion(page, viewport);
      await capture(page, info, "SCR-03-suggestion");
      await put(request, { ...art, items: [{ ...art.items[0], isAvailable: false }] });
      await refresh(page);
      await expect(dialog).toBeVisible();
      await capture(page, info, "SCR-03-suggestion-changed");
    });

    test("initial available ebook fallback buys the exact discounted ebook once", async ({ page }) => {
      await page.goto("/books/zvychajna");
      await expect(page.getByRole("radio", { name: /Електронна/ })).toBeChecked();
      const buy = page.getByRole("button", { name: /Купити — .*179 грн/ });
      await expect(buy).toBeEnabled();
      await buy.focus();
      await buy.press("Enter");
      const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
      await expect(cart.locator(`[data-cart-item-id="${digitalId}"]`).getByText("179 грн за шт.", { exact: true })).toBeVisible();
      await expect(cart.getByText("179 грн", { exact: true }).last()).toBeVisible();
      await selection(page, [{ itemId: digitalId, quantity: 1, format: "digital" }]);
      await page.keyboard.press("Escape");
      const reopen = page.getByRole("button", { name: viewport.width < 640 ? "Переглянути кошик" : /Купити — .*179 грн/ });
      await expect(reopen).toBeFocused();
      await reopen.press("Enter");
      await selection(page, [{ itemId: digitalId, quantity: 1, format: "digital" }]);
    });

    test("available and preorder paper defaults and all-unavailable protection stay intact", async ({ page, request }) => {
      for (const status of [{ isAvailable: true, canPreorder: true }, { isAvailable: false, canPreorder: true }]) {
        await put(request, { ...book, slug: `default-${status.isAvailable}`, items: [{ ...book.items[0], ...status }, book.items[1]] });
        await page.goto(`/books/default-${status.isAvailable}`);
        await expect(page.getByRole("radio", { name: /Паперова/ })).toBeChecked();
        await expect(page.getByRole("button", { name: status.isAvailable ? /Купити — .*499 грн/ : /Передзамовити — .*499 грн/ })).toBeEnabled();
      }
      for (const ebookPreorder of [false, true]) {
        await put(request, { ...book, slug: `unavailable-${ebookPreorder}`, items: [book.items[0], { ...book.items[1], isAvailable: false, canPreorder: ebookPreorder }] });
        await page.goto(`/books/unavailable-${ebookPreorder}`);
        await expect(page.getByRole("radio", { name: /Паперова/ })).toBeChecked();
        await expect(page.getByRole("button", { name: "Немає в наявності" })).toBeDisabled();
        await selection(page, []);
      }
    });

    test("live changes never replace a deliberate choice or the initial fallback", async ({ page, request }) => {
      await put(request, { ...book, items: [{ ...book.items[0], isAvailable: true }, book.items[1]] });
      await page.goto("/books/zvychajna");
      const paper = page.getByRole("radio", { name: /Паперова/ });
      const digital = page.getByRole("radio", { name: /Електронна/ });
      await digital.check();
      await paper.check();
      await put(request, book);
      await refresh(page);
      await expect(paper).toBeChecked();
      await expect(page.getByRole("button", { name: "Немає в наявності" })).toBeDisabled();
      await selection(page, []);
      await digital.check();
      await put(request, { ...book, items: [{ ...book.items[0], isAvailable: true }, { ...book.items[1], isAvailable: false }] });
      await refresh(page);
      await expect(digital).toBeChecked();
      await expect(page.getByRole("button", { name: "Немає в наявності" })).toBeDisabled();
      // A new entry takes the fallback once; later availability changes do not flip it.
      await put(request, { ...book, slug: "fallback-once" });
      await page.goto("/books/fallback-once");
      await expect(digital).toBeChecked();
      await put(request, { ...book, slug: "fallback-once", items: [{ ...book.items[0], isAvailable: true }, book.items[1]] });
      await refresh(page);
      await expect(digital).toBeChecked();
    });

    test("initial live fallback respects a customer choice made while the refresh is pending", async ({ page, request }) => {
      for (const deliberateChoice of [false, true]) {
        const slug = `live-entry-${deliberateChoice}`;
        await put(request, { ...book, slug, items: [{ ...book.items[0], isAvailable: true }, book.items[1]] });
        let release!: () => void;
        const pending = new Promise<void>(resolve => { release = resolve; });
        await page.route(`**/api/products/${slug}`, async route => {
          await pending;
          await route.fulfill({ json: { ...book, slug } });
        });
        try {
          await page.goto(`/books/${slug}`, { waitUntil: "domcontentloaded" });
          await expect(page.getByRole("radio", { name: /Паперова/ })).toBeChecked();
          if (deliberateChoice) {
            await page.getByRole("radio", { name: /Електронна/ }).check();
            await page.getByRole("radio", { name: /Паперова/ }).check();
          }
          const response = page.waitForResponse(res => new URL(res.url()).pathname === `/api/products/${slug}`);
          release();
          await response;
          await expect(page.getByRole("radio", { name: /Паперова/ })).toBeDisabled();
          await expect(page.getByRole("radio", { name: deliberateChoice ? /Паперова/ : /Електронна/ })).toBeChecked();
          const buy = page.getByRole("button", { name: deliberateChoice ? "Немає в наявності" : /Купити — .*179 грн/ });
          if (deliberateChoice) await expect(buy).toBeDisabled();
          else await expect(buy).toBeEnabled();
          await selection(page, []);
        } finally {
          release();
        }
      }
    });

    test("unavailable exact suggestion is suppressed even when another edition is eligible", async ({ page, request }) => {
      await put(request, sequel);
      await put(request, { ...art, items: [
        { ...art.items[0], id: otherArtId, type: 2, format: 2, price: 25, discountPrice: null },
        { ...art.items[0], isAvailable: false },
      ] });
      await page.goto("/books/inaksha");
      const buy = page.getByRole("button", { name: /Купити — .*449 грн/ });
      await buy.click();
      const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
      await expect(cart).toBeVisible();
      await expect(page.getByRole("dialog", { name: "Разом цікавіше?" })).toHaveCount(0);
      await expect(cart.getByText("449 грн", { exact: true }).last()).toBeVisible();
      await selection(page, [{ itemId: sequelPaperId, quantity: 1, format: "paper" }]);
      expect(await cart.evaluate(node => node.contains(document.activeElement))).toBe(true);
    });

    test("eligible and preorder suggestions display and add the exact paper edition and price", async ({ page, request }) => {
      await put(request, sequel);
      for (const isAvailable of [true, false]) {
        await put(request, { ...art, items: [
          { ...art.items[0], id: otherArtId, type: 2, format: 2, price: 25, discountPrice: null },
          { ...art.items[0], isAvailable, canPreorder: true, discountPrice: isAvailable ? 125 : 0 },
        ] });
        const dialog = await openSuggestion(page, viewport);
        const price = isAvailable ? 125 : 0;
        await expect(dialog.getByText(`${price} грн`, { exact: true })).toBeVisible();
        await expect(dialog.getByText("Передзамовлення", { exact: true })).toHaveCount(isAvailable ? 0 : 1);
        await expectNoA11yViolations(page, "exact-edition suggestion");
        await dialog.getByRole("button", { name: "Додати до кошика" }).click();
        const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
        await expect(cart.locator(`[data-cart-item-id="${artId}"]`).getByText(`${price} грн за шт.`, { exact: true })).toBeVisible();
        await expect(cart.getByText(`${449 + price} грн`, { exact: true }).last()).toBeVisible();
        await selection(page, [{ itemId: sequelPaperId, quantity: 1, format: "paper" }, { itemId: artId, quantity: 1, format: "paper" }]);
        expect(await cart.evaluate(node => node.contains(document.activeElement))).toBe(true);
      }
    });

    test("an open suggestion disables and explains lost eligibility without substituting another item", async ({ page, request }) => {
      await put(request, sequel);
      const dialog = await openSuggestion(page, viewport);
      const add = dialog.getByRole("button", { name: "Додати до кошика" });
      for (const items of [
        [{ ...art.items[0], isAvailable: false }],
        [{ ...art.items[0], id: otherArtId }],
      ]) {
        await put(request, { ...art, items });
        await refresh(page);
        await expect(add).toBeDisabled();
        const reason = dialog.getByText("Це видання більше не доступне для покупки або передзамовлення.", { exact: true });
        await expect(reason).toBeVisible();
        await expect(add).toHaveAttribute("aria-describedby", (await reason.getAttribute("id"))!);
        expect(await reason.evaluate(node => {
          const box = node.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && node.scrollWidth <= node.clientWidth;
        })).toBe(true);
        await selection(page, [{ itemId: sequelPaperId, quantity: 1, format: "paper" }]);
      }
      await put(request, { ...art, items: [{ ...art.items[0], isAvailable: false, canPreorder: true, discountPrice: 99 }] });
      await refresh(page);
      await expect(add).toBeEnabled();
      await expect(dialog.getByText("99 грн", { exact: true })).toBeVisible();
      await expect(dialog.getByText("Передзамовлення", { exact: true })).toBeVisible();
      await add.click();
      await expect(page.getByRole("dialog", { name: "Кошик", exact: true }).getByText("548 грн", { exact: true }).last()).toBeVisible();
      await selection(page, [{ itemId: sequelPaperId, quantity: 1, format: "paper" }, { itemId: artId, quantity: 1, format: "paper" }]);
    });

    test("Close and Escape preserve the original item and restore Buy focus", async ({ page, request }) => {
      await put(request, sequel);
      for (const closeWithEscape of [false, true]) {
        const dialog = await openSuggestion(page, viewport);
        for (let index = 0; index < 8; index++) {
          await page.keyboard.press("Tab");
          expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
        }
        if (closeWithEscape) await page.keyboard.press("Escape");
        else await dialog.getByRole("button", { name: "Закрити", exact: true }).click();
        await expect(dialog).toBeHidden();
        await expect(page.getByRole("dialog", { name: "Кошик", exact: true })).toHaveCount(0);
        await expect(page.getByRole("button", { name: viewport.width < 640 ? "Переглянути кошик" : /Купити — .*449 грн/ })).toBeFocused();
        await selection(page, [{ itemId: sequelPaperId, quantity: 1, format: "paper" }]);
      }
    });
  });
}
