import { expect, test, type APIRequestContext, type Locator, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";

const paperId = "64000000-0000-4000-8000-000000000001";
const digitalId = "64000000-0000-4000-8000-000000000002";
const artId = "64000000-0000-4000-8000-000000000003";
const paper = { id: paperId, name: "Паперова книга", type: 1, format: 1,
  isAvailable: true, canPreorder: false, price: 499, discountPrice: 449, currency: "UAH", note: null };
const books = ["inaksha", "zvychajna-and-inaksha"].map((slug, index) => makeProduct({
  id: `64000000-0000-4000-8000-00000000001${index}`, slug,
  name: index === 0 ? "Інакша" : "Звичайна та Інакша",
  description: "Контрольна книга для перевірки переходу до кошика.",
  items: [{ ...paper, id: index === 0 ? paperId : "64000000-0000-4000-8000-000000000004" },
    { ...paper, id: index === 0 ? digitalId : "64000000-0000-4000-8000-000000000005", type: 2, format: 2, price: 199, discountPrice: 179 }],
}));
const art = makeProduct({
  id: "64000000-0000-4000-8000-000000000020", slug: "inaksha-art", name: "Ілюстрації до Інакшої", type: 2,
  imageUrl: "/images/products/inaksha-art/inaksha-art1.webp",
  imageUrls: ["/images/products/inaksha-art/inaksha-art1.webp"],
  items: [{ ...paper, id: artId, name: "Ілюстрації", price: 150, discountPrice: 125 }],
});
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }, { width: 360, height: 640 }];

async function put(request: APIRequestContext, product: Record<string, unknown>) {
  expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
}

async function selectedItems(page: Page, expected: { itemId: string; quantity: number; format: string }[]) {
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]")
    .map((item: { itemId: string; quantity: number; format: string }) => ({ itemId: item.itemId, quantity: item.quantity, format: item.format })))).toEqual(expected);
}

async function openSuggestion(page: Page, book: typeof books[number], viewport: typeof viewports[number], quantity = 0) {
  // Keep the existing mobile direct-cart flow. Resize an already-open desktop dialog.
  if (quantity) await page.addInitScript(({ product, count, itemId }) => {
    localStorage.setItem("cart", JSON.stringify([{ product, itemId, quantity: count, format: "paper" }]));
  }, { product: book, count: quantity, itemId: book.items[0].id });
  await page.setViewportSize(viewports[0]);
  await page.goto(`/books/${book.slug}`);
  const buy = page.getByRole("button", { name: /Купити — .*449 грн/ });
  await expect(buy).toBeEnabled();
  await expect(page.getByRole("button", { name: `Кошик, ${quantity} товарів`, exact: true })).toBeVisible();
  await buy.click();
  const dialog = page.getByRole("dialog", { name: "Разом цікавіше?" });
  await expect(dialog).toBeVisible();
  await page.setViewportSize(viewport);
  return dialog;
}

async function cartWithFocus(page: Page) {
  const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
  await expect(cart).toBeVisible();
  await expect.poll(() => cart.evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Tab");
  expect(await cart.evaluate(node => node.contains(document.activeElement))).toBe(true);
  return cart;
}

async function rapidClicks(button: Locator) {
  // One event burst also covers clicks queued before React commits the closed dialog.
  await button.evaluate(node => {
    for (let index = 0; index < 5; index++) (node as HTMLButtonElement).click();
  });
}

async function capture(page: Page, info: TestInfo, state: string) {
  const polishPhase = process.env.ZVY64_POLISH_PHASE;
  const phase = polishPhase ?? process.env.ZVY64_EVIDENCE_PHASE;
  if (!phase) return;
  if (polishPhase && !state.startsWith("SCR-03-")) return;
  if (!["before", "after"].includes(phase)) throw new Error("Unknown evidence phase");
  const viewport = page.viewportSize()!;
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator("[role=dialog] img").evaluateAll(images => images.every(image =>
    (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  // Capture the settled cart total after the existing success notification expires.
  await expect(page.locator(".Toastify__toast")).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const directory = path.join(process.cwd(), "docs/storefront-selection/zvy-64", ...(polishPhase ? ["polish"] : []), phase);
  await mkdir(directory, { recursive: true });
  const filename = path.join(directory, `${state}-${viewport.width}x${viewport.height}.jpg`);
  await page.screenshot({ path: filename, type: "jpeg", quality: 85, animations: "disabled", caret: "hide" });
  await info.attach(state, { path: filename, contentType: "image/jpeg" });
}

for (const viewport of viewports) {
  test.describe(`suggestion continuation at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, hasTouch: viewport.width < 640 });
    test.beforeEach(async ({ page, request }) => {
      await resetMockApi(request);
      for (const book of books) await put(request, book);
      await put(request, art);
      await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
        ? route.continue() : route.abort());
    });
    test.afterEach(async ({ request }) => {
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    for (const book of books) {
      test(`capture settled ${book.slug} suggestion`, async ({ page }, info) => {
        await openSuggestion(page, book, viewport);
        await capture(page, info, `SCR-03-${book.slug}-suggestion`);
      });

      test(`${book.slug}: keyboard continuation keeps the selected edition, quantity and price`, async ({ page }, info) => {
        const dialog = await openSuggestion(page, book, viewport, 3);
        const note = dialog.locator("p").filter({ hasText: /^Книгу додано до кошика$/ });
        const proceed = dialog.getByRole("button", { name: "Перейти до кошика", exact: true });
        await expect(note).toBeVisible();
        await expect(proceed).toHaveAttribute("aria-describedby", (await note.getAttribute("id"))!);
        expect(await proceed.evaluate(node => {
          const box = node.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight;
        })).toBe(true);
        await expectNoA11yViolations(page, "suggestion continuation");
        for (let index = 0; index < 12 && !(await proceed.evaluate(node => node === document.activeElement)); index++) {
          await page.keyboard.press("Tab");
          expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
        }
        await expect(proceed).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(dialog).toBeHidden();
        const cart = await cartWithFocus(page);
        await expect(cart.locator(`[data-cart-item-id="${book.items[0].id}"]`).getByText("449 грн за шт.", { exact: true })).toBeVisible();
        await expect(cart.getByText("1347 грн", { exact: true }).last()).toBeVisible();
        await selectedItems(page, [{ itemId: book.items[0].id, quantity: 3, format: "paper" }]);
        await capture(page, info, `SCR-04-${book.slug}-original-only`);
      });
    }

    test("rapid continuation does not add either product again", async ({ page }) => {
      const dialog = await openSuggestion(page, books[0], viewport);
      await rapidClicks(dialog.getByRole("button", { name: "Перейти до кошика", exact: true }));
      const cart = await cartWithFocus(page);
      await expect(cart.getByText("449 грн", { exact: true }).last()).toBeVisible();
      await selectedItems(page, [{ itemId: paperId, quantity: 1, format: "paper" }]);
    });

    test("rapid acceptance opens cart with exactly one add-on and the original quantity", async ({ page }, info) => {
      const dialog = await openSuggestion(page, books[0], viewport, 3);
      await rapidClicks(dialog.getByRole("button", { name: "Додати до кошика", exact: true }));
      await expect(dialog).toBeHidden();
      const cart = await cartWithFocus(page);
      await expect(cart.locator(`[data-cart-item-id="${artId}"]`).getByText("125 грн за шт.", { exact: true })).toBeVisible();
      await expect(cart.getByText("1472 грн", { exact: true }).last()).toBeVisible();
      await selectedItems(page, [{ itemId: paperId, quantity: 3, format: "paper" }, { itemId: artId, quantity: 1, format: "paper" }]);
      await capture(page, info, "SCR-04-accepted-suggestion");
    });

    test("continuation stays available when the suggested edition becomes unavailable", async ({ page, request }) => {
      const dialog = await openSuggestion(page, books[0], viewport);
      await put(request, { ...art, items: [{ ...art.items[0], isAvailable: false }] });
      const response = page.waitForResponse(res => new URL(res.url()).pathname === "/api/products");
      await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
      await response;
      await expect(dialog.getByRole("button", { name: "Додати до кошика", exact: true })).toBeDisabled();
      await expect(dialog.getByText("Це видання більше не доступне для покупки або передзамовлення.")).toBeVisible();
      const proceed = dialog.getByRole("button", { name: "Перейти до кошика", exact: true });
      await expect(proceed).toBeEnabled();
      await proceed.click();
      await cartWithFocus(page);
      await selectedItems(page, [{ itemId: paperId, quantity: 1, format: "paper" }]);
    });

    test("Close and Escape preserve dismissal and a subsequent Buy can continue", async ({ page }) => {
      const dialog = await openSuggestion(page, books[0], viewport);
      await dialog.getByRole("button", { name: "Закрити", exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(page.getByRole("dialog", { name: "Кошик", exact: true })).toHaveCount(0);
      await page.setViewportSize(viewports[0]);
      const buy = page.getByRole("button", { name: /Купити — .*449 грн/ });
      await expect(buy).toBeFocused();
      await buy.click();
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(buy).toBeFocused();
      await expect(page.getByRole("dialog", { name: "Кошик", exact: true })).toHaveCount(0);
      await buy.click();
      await expect(dialog).toBeVisible();
      await page.setViewportSize(viewport);
      await dialog.getByRole("button", { name: "Перейти до кошика", exact: true }).click();
      await cartWithFocus(page);
      await selectedItems(page, [{ itemId: paperId, quantity: 1, format: "paper" }]);
    });

    test("rapid Buy preserves one original item and the existing device flow", async ({ page }) => {
      await page.goto("/books/inaksha");
      const buy = page.getByRole("button", { name: /Купити/ }).first();
      await expect(buy).toBeEnabled();
      await rapidClicks(buy);
      if (viewport.width < 640) {
        await cartWithFocus(page);
        await expect(page.getByRole("dialog", { name: "Разом цікавіше?" })).toHaveCount(0);
      } else {
        await expect(page.getByRole("dialog", { name: "Разом цікавіше?" })).toBeVisible();
      }
      await selectedItems(page, [{ itemId: paperId, quantity: 1, format: "paper" }]);
    });

    test("removing both items permits a later Buy and suggestion acceptance", async ({ page }) => {
      const dialog = await openSuggestion(page, books[0], viewport);
      await dialog.getByRole("button", { name: "Додати до кошика", exact: true }).click();
      const cart = await cartWithFocus(page);
      for (const itemId of [artId, paperId]) {
        await cart.locator(`[data-cart-item-id="${itemId}"]`).getByRole("button", { name: "Видалити з кошика" }).click();
      }
      await selectedItems(page, []);
      await cart.getByRole("button", { name: "Закрити", exact: true }).click();
      await page.setViewportSize(viewports[0]);
      await rapidClicks(page.getByRole("button", { name: /Купити — .*449 грн/ }));
      await expect(dialog).toBeVisible();
      await page.setViewportSize(viewport);
      await rapidClicks(dialog.getByRole("button", { name: "Додати до кошика", exact: true }));
      await cartWithFocus(page);
      await selectedItems(page, [{ itemId: paperId, quantity: 1, format: "paper" }, { itemId: artId, quantity: 1, format: "paper" }]);
    });

    test("digital Buy bypasses the paper add-on", async ({ page }) => {
      await page.goto("/books/inaksha");
      await page.getByRole("radio", { name: /Електронна/ }).check();
      await page.getByRole("button", { name: /Купити/ }).first().click();
      const cart = await cartWithFocus(page);
      await expect(page.getByRole("dialog", { name: "Разом цікавіше?" })).toHaveCount(0);
      await expect(cart.getByText("179 грн", { exact: true }).last()).toBeVisible();
      await selectedItems(page, [{ itemId: digitalId, quantity: 1, format: "digital" }]);
    });

    if (viewport.width === 1440) test("rapid ordinary Add keeps one item and the customer on the book page", async ({ page }) => {
      await page.goto("/books/inaksha");
      await rapidClicks(page.getByRole("button", { name: "Додати в кошик", exact: true }));
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await selectedItems(page, [{ itemId: paperId, quantity: 1, format: "paper" }]);
    });

    if (viewport.width < 640) for (const accept of [true, false]) {
      test(`200% text keeps Close and both CTAs reachable: ${accept ? "accept" : "continue"}`, async ({ page }, info) => {
        const dialog = await openSuggestion(page, books[0], viewport);
        await page.addStyleTag({ content: "html { font-size: 200%; } body { font-size: inherit; } [role=dialog] button:not([aria-label]) { font-size: inherit; }" });
        if (accept) await capture(page, info, "SCR-03-inaksha-suggestion-large-text");
        const close = dialog.getByRole("button", { name: "Закрити", exact: true });
        const add = dialog.getByRole("button", { name: "Додати до кошика", exact: true });
        const proceed = dialog.getByRole("button", { name: "Перейти до кошика", exact: true });
        expect(await dialog.locator("div").first().evaluate(node => {
          const box = node.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight;
        })).toBe(true);
        expect(await dialog.evaluate(node => Array.from(node.querySelectorAll<HTMLElement>("div, p, button, h2, h3"))
          .every(element => element.scrollWidth <= element.clientWidth + 1))).toBe(true);
        const image = dialog.locator("img");
        await expect.poll(() => image.evaluate(node => {
          const box = node.getBoundingClientRect();
          return Math.abs(box.width - 120) < 1 && Math.abs(box.height - 180) < 1;
        })).toBe(true);
        await expectNoA11yViolations(page, "suggestion with enlarged text");
        await close.focus();
        // Forward Tab reaches Add; Shift+Tab wraps from Close to the secondary CTA.
        for (let index = 0; index < 10 && !(await add.evaluate(node => node === document.activeElement)); index++) {
          await page.keyboard.press("Tab");
          expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
        }
        await expect(add).toBeFocused();
        expect(await add.evaluate(node => {
          const box = node.getBoundingClientRect();
          return box.top >= 0 && box.bottom <= innerHeight;
        })).toBe(true);
        await close.focus();
        await page.keyboard.press("Shift+Tab");
        await expect(proceed).toBeFocused();
        expect(await proceed.evaluate(node => {
          const box = node.getBoundingClientRect();
          return box.top >= 0 && box.bottom <= innerHeight;
        })).toBe(true);
        expect(await close.evaluate(node => {
          const box = node.getBoundingClientRect();
          return box.top >= 0 && box.bottom <= innerHeight;
        })).toBe(true);
        // Returning to the top does not move the panel or header horizontally.
        const headerPosition = await close.boundingBox();
        await close.focus();
        expect(await close.boundingBox()).toEqual(headerPosition);
        const action = accept ? add : proceed;
        await action.focus();
        await page.keyboard.press("Enter");
        await expect(dialog).toBeHidden();
        await cartWithFocus(page);
        await selectedItems(page, [{ itemId: paperId, quantity: 1, format: "paper" },
          ...(accept ? [{ itemId: artId, quantity: 1, format: "paper" }] : [])]);
      });
    }
  });
}
