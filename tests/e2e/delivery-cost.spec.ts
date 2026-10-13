import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

const disclosure = "Доставка оплачується окремо за тарифами Нової пошти. Її вартість визначається перевізником.";
const emailDelivery = "Електронна версія буде надіслана на вказаний email";
const before = process.env.ZVY70_EVIDENCE_PHASE === "before";
const totalLabel = before ? "Всього до сплати:" : "До сплати за товари:";
const paperId = "31000000-0000-4000-8000-000000000001";
const digitalId = "31000000-0000-4000-8000-000000000002";
const product = makeProduct({
  name: "Звичайна", slug: "zvychajna", author: "Лілія Грек",
  items: [
    { id: paperId, name: "Паперова Звичайна", type: 1, format: 1, isAvailable: true,
      canPreorder: false, price: 499, discountPrice: null, currency: "UAH", note: null },
    { id: digitalId, name: "Електронна Звичайна", type: 2, format: 2, isAvailable: true,
      canPreorder: false, price: 199, discountPrice: null, currency: "UAH", note: null },
  ],
});
const scenarios = [
  { name: "paper", paper: true, digital: false, promo: null, total: 499 },
  { name: "mixed", paper: true, digital: true, promo: null, total: 698 },
  { name: "mixed-promo", paper: true, digital: true, promo: "NEAR-TOTAL", total: 199.05 },
  { name: "paper-zero", paper: true, digital: false, promo: "EXACT-TOTAL", total: 0 },
  { name: "digital", paper: false, digital: true, promo: null, total: 199 },
] as const;
const cart = (page: Page) => page.getByRole("dialog", { name: "Кошик", exact: true });
const checkout = (page: Page) => page.getByRole("dialog", { name: "Оформлення замовлення", exact: true });

async function capture(page: Page, info: TestInfo, state: string) {
  const phase = process.env.ZVY70_EVIDENCE_PHASE;
  if (!phase) return;
  if (!["before", "after"].includes(phase)) throw new Error("Unknown evidence phase");
  const viewport = page.viewportSize()!;
  const directory = path.join(process.cwd(), "docs/delivery-cost", phase);
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  const filename = path.join(directory, `SCR-05-${state}-${viewport.width}x${viewport.height}.jpg`);
  await page.screenshot({ path: filename, type: "jpeg", quality: 85, animations: "disabled", caret: "hide" });
  await info.attach(state, { path: filename, contentType: "image/jpeg" });
}

async function expectFits(element: Locator, page: Page) {
  // IntersectionObserver can round a fractional line-height by less than one pixel.
  await expect(element).toBeInViewport({ ratio: 0.99 });
  expect(await element.evaluate(node => {
    const box = node.getBoundingClientRect();
    return box.left >= 0 && box.right <= document.documentElement.clientWidth
      && node.scrollWidth <= node.clientWidth && node.scrollHeight <= node.clientHeight;
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
  test.describe(`delivery cost at ${viewport.width}px`, () => {
    test.use({ viewport, hasTouch: viewport.width < 640 });
    test.beforeEach(async ({ page, request }) => {
      await resetMockApi(request);
      expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
      await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
        ? route.continue() : route.abort());
    });

    for (const scenario of scenarios) {
      test(`${scenario.name}: discloses only physical delivery and preserves items and totals`, async ({ page, request }, info) => {
        await page.goto(`/books/${product.slug}`);
        if (!scenario.paper) await page.getByRole("radio", { name: /Електронна/ }).check();
        await page.getByRole("button", { name: /Купити/ }).click();
        if (scenario.paper && scenario.digital) {
          await cart(page).getByRole("button", { name: "Закрити", exact: true }).click();
          await page.getByRole("radio", { name: /Електронна/ }).check();
          await page.getByRole("button", { name: /Купити/ }).click();
        }
        if (scenario.promo) {
          await cart(page).getByRole("textbox", { name: "Промокод" }).fill(scenario.promo);
          await cart(page).getByRole("button", { name: "Застосувати" }).click();
          await expect(cart(page).getByRole("button", { name: "Видалити промокод" })).toBeVisible();
        }
        await cart(page).getByRole("button", { name: "Оформити замовлення" }).click();
        const form = checkout(page);
        const total = form.getByText(totalLabel, { exact: true }).locator("..");
        await expect(total).toHaveText(`${totalLabel}${scenario.total} грн`);
        await total.scrollIntoViewIfNeeded();
        if (!before) {
          await expect(form.getByText("Всього до сплати:", { exact: true })).toHaveCount(0);
          await expect(form.getByText("Доставка здійснюється Новою Поштою.", { exact: true })).toHaveCount(0);
          const note = form.getByText(disclosure, { exact: true });
          if (scenario.paper) {
            await expect(note).toHaveCount(1);
            await note.scrollIntoViewIfNeeded();
            await expectFits(note, page);
            await expectFits(total, page);
            const totalBox = (await total.boundingBox())!;
            const noteBox = (await note.locator("..").boundingBox())!;
            expect(noteBox.y - totalBox.y - totalBox.height).toBeGreaterThanOrEqual(0);
            expect(noteBox.y - totalBox.y - totalBox.height).toBeLessThanOrEqual(12);
            await expect(note.locator("..").locator("svg")).toHaveAttribute("aria-hidden", "true");
            expect(await note.evaluate(node => getComputedStyle(node).color)).not.toBe(await total.evaluate(node => getComputedStyle(node).color));
            expect(await note.evaluate(node => parseFloat(getComputedStyle(node).fontSize)))
              .toBeLessThan(await total.evaluate(node => parseFloat(getComputedStyle(node).fontSize)));
          } else {
            await expect(note).toHaveCount(0);
            await expect(form.getByText(emailDelivery, { exact: true })).toHaveCount(1);
          }
        }
        await expect(form.getByLabel("Телефон *")).toHaveCount(scenario.paper ? 1 : 0);
        await expect(form.getByRole("button", { name: /Відділення Нової Пошти/ })).toHaveCount(scenario.paper ? 1 : 0);
        const submit = form.getByRole("button", { name: "Підтвердити замовлення" });
        await expectFits(submit, page);
        await expect(submit).toBeEnabled();
        // Confirm the existing transient promo toast has cleared the action before capture.
        await submit.click({ trial: true });
        await capture(page, info, scenario.name);
        expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]")
          .map((item: { itemId: string; quantity: number; format: string }) => ({ itemId: item.itemId, quantity: item.quantity, format: item.format })))).toEqual([
          ...(scenario.paper ? [{ itemId: paperId, quantity: 1, format: "paper" }] : []),
          ...(scenario.digital ? [{ itemId: digitalId, quantity: 1, format: "digital" }] : []),
        ]);
        await submit.press("Enter");
        await expect(form.getByText("Введіть ім'я", { exact: true })).toBeVisible();
        if (!before && scenario.paper) {
          await form.getByText(disclosure, { exact: true }).scrollIntoViewIfNeeded();
          await expectFits(form.getByText(disclosure, { exact: true }), page);
          await expectFits(submit, page);
        }
        expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
        await page.keyboard.press("Escape");
        await expect(form).toBeHidden();
        await expect(page.getByRole("button", { name: /Купити|Переглянути кошик/ })).toBeFocused();
      });
    }
  });
}
