import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { mockApiUrl, resetMockApi } from "./helpers";

const paperId = "11000000-0000-4000-8000-000000000001";
const digitalId = "11000000-0000-4000-8000-000000000002";
const noteLabel = "Коментар до замовлення (необов’язково)";
const note = "  Зателефонуйте перед відправленням  ";
const department = {
  id: "test-department-17", shortName: "Відділення №17", address: "Київ, вул. Тестова, 17",
  addressParts: { city: "Київ", street: "Тестова", building: "17" },
};
const cart = (page: Page) => page.getByRole("dialog", { name: "Кошик", exact: true });
const checkout = (page: Page) => page.getByRole("dialog", { name: "Оформлення замовлення", exact: true });
const submit = (page: Page) => checkout(page).getByRole("button", { name: /Підтвердити замовлення|Обробка замовлення/ });

async function openCart(page: Page) {
  await page.getByRole("navigation").getByRole("button", { name: /Кошик/ }).click();
  await expect(cart(page)).toBeVisible();
}

async function openCheckout(page: Page) {
  await cart(page).getByRole("button", { name: "Оформити замовлення" }).click();
  await expect(checkout(page)).toBeVisible();
}

async function returnToCart(page: Page) {
  await checkout(page).getByRole("button", { name: "Закрити", exact: true }).click();
  await openCart(page);
}

async function fillDetails(page: Page, physical = true) {
  const form = checkout(page);
  await form.getByLabel(/Ім.я \*/).fill("Леся");
  await form.getByLabel(/Прізвище \*/).fill("Українка");
  await form.getByLabel("Email *").fill("lesya@example.com");
  await form.getByLabel(noteLabel).fill(note);
  if (physical) {
    await form.getByLabel("Телефон *").fill("+380501234567");
    await form.getByRole("button", { name: /Відділення Нової Пошти/ }).click();
    await page.frameLocator('iframe[title="Nova Poshta Widget"]').getByRole("button", { name: "Обрати тестове відділення" }).click();
    await expect(form.getByText(department.shortName, { exact: true })).toBeVisible();
  }
}

async function expectDetails(form: Locator, physical = true) {
  await expect(form.getByLabel(/Ім.я \*/)).toHaveValue("Леся");
  await expect(form.getByLabel(/Прізвище \*/)).toHaveValue("Українка");
  await expect(form.getByLabel("Email *")).toHaveValue("lesya@example.com");
  await expect(form.getByLabel(noteLabel)).toHaveValue(note);
  if (physical) {
    await expect(form.getByLabel("Телефон *")).toHaveValue("+380501234567");
    await expect(form.getByText(department.shortName, { exact: true })).toBeVisible();
  }
}

async function capture(page: Page, info: TestInfo, width: number) {
  const phase = process.env.ZVY69_EVIDENCE_PHASE;
  if (!phase) return;
  if (phase !== "before" && phase !== "after") throw new Error("Unknown evidence phase");
  const directory = path.join(process.cwd(), "docs/checkout-draft", phase);
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  for (const state of ["customer", "branch-note"] as const) {
    const target = state === "customer" ? checkout(page).getByLabel(/Ім.я \*/) : checkout(page).getByLabel(noteLabel);
    await target.scrollIntoViewIfNeeded();
    const filename = path.join(directory, `SCR-05-reopened-${state}-${width}x${width === 1440 ? 900 : 844}.jpg`);
    await page.screenshot({ path: filename, type: "jpeg", quality: 85, animations: "disabled", caret: "hide" });
    await info.attach(state, { path: filename, contentType: "image/jpeg" });
  }
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
  test.describe(`checkout draft at ${viewport.width}px`, () => {
    test.use({ viewport, hasTouch: viewport.width < 640 });
    test.beforeEach(async ({ page, request }) => {
      await resetMockApi(request);
      await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
        ? route.continue() : route.abort());
      await page.route("https://widget.novapost.com/**", route => route.fulfill({
        contentType: "text/html; charset=utf-8", body: `<button onclick='parent.postMessage(${JSON.stringify(department)}, "http://127.0.0.1:3100")'>Обрати тестове відділення</button>`,
      }));
      await page.goto("/books/test-book");
      await page.getByRole("button", { name: /Купити/ }).click();
      await openCheckout(page);
    });

    test("restores details after quantity and promo edits and submits the current cart", async ({ page, request }, info) => {
      await fillDetails(page);
      await returnToCart(page);
      await cart(page).getByRole("button", { name: "Збільшити кількість" }).click();
      await cart(page).getByRole("textbox", { name: "Промокод" }).fill("NEAR-TOTAL");
      await cart(page).getByRole("button", { name: "Застосувати", exact: true }).click();
      await expect(cart(page).getByText("NEAR-TOTAL", { exact: true })).toBeVisible();
      await openCheckout(page);
      await expect(checkout(page).getByText("Всього до сплати:").locator("..")).toHaveText("Всього до сплати:201.05 грн");
      await expect(checkout(page).getByText("x2", { exact: true })).toBeVisible();
      await capture(page, info, viewport.width);
      await expectDetails(checkout(page));
      await page.route("https://example.invalid/**", route => route.fulfill({ contentType: "text/html", body: "<p>Mock payment handoff</p>" }));
      await submit(page).click();
      await expect(page).toHaveURL("https://example.invalid/test-payment");
      const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
      expect(state.invoiceRequests).toBe(1);
      expect(state.lastInvoiceRequest).toEqual({
        customer: { firstName: "Леся", lastName: "Українка", email: "lesya@example.com", phone: "+380501234567", department },
        items: [{ productId: paperId, quantity: 2 }], promoCode: "NEAR-TOTAL", orderNote: note.trim(),
      });
    });

    test("revalidates preserved invalid values before sending an invoice", async ({ page, request }) => {
      await fillDetails(page);
      await checkout(page).getByLabel(/Ім.я \*/).fill(" ");
      await checkout(page).getByLabel("Email *").fill("invalid");
      await checkout(page).getByLabel("Телефон *").fill("123");
      await returnToCart(page);
      await cart(page).getByRole("button", { name: "Збільшити кількість" }).click();
      await openCheckout(page);
      await expect(checkout(page).getByLabel("Email *")).toHaveValue("invalid");
      // Native email validation runs first; correct it to exercise the remaining form rules.
      await submit(page).click();
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
      await checkout(page).getByLabel("Email *").fill("lesya@example.com");
      await submit(page).click();
      await expect(checkout(page).getByText("Введіть ім'я", { exact: true })).toBeVisible();
      await expect(checkout(page).getByText(/Введіть дійсний телефон/)).toBeVisible();
      await expect(checkout(page).getByLabel(noteLabel)).toHaveValue(note);
      await expect(checkout(page).getByText(department.shortName, { exact: true })).toBeVisible();
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    test("retains a draft through empty and digital carts, excluding delivery from digital submission", async ({ page }) => {
      await fillDetails(page);
      await returnToCart(page);
      await cart(page).getByRole("button", { name: "Видалити з кошика" }).click();
      await expect(cart(page).getByText("Ваш кошик порожній")).toBeVisible();
      await cart(page).getByRole("button", { name: "Закрити", exact: true }).click();
      await page.getByRole("radio", { name: /Електронна/ }).check();
      await page.getByRole("button", { name: /Купити/ }).click();
      await openCheckout(page);
      await expectDetails(checkout(page), false);
      await expect(checkout(page).getByLabel("Телефон *")).toHaveCount(0);
      await expect(checkout(page).getByText("Всього до сплати:").locator("..")).toHaveText("Всього до сплати:180 грн");
      let payload: Record<string, unknown> | undefined;
      await page.route("**/api/invoice", async route => {
        payload = route.request().postDataJSON();
        await route.fulfill({ status: 503, json: { title: "Controlled failure" } });
      });
      await submit(page).click();
      await expect(submit(page)).toBeEnabled();
      expect(payload).toEqual({
        customer: { firstName: "Леся", lastName: "Українка", email: "lesya@example.com" },
        items: [{ productId: digitalId, quantity: 1 }], orderNote: note.trim(),
      });
      await returnToCart(page);
      await cart(page).getByRole("button", { name: "Закрити", exact: true }).click();
      await page.getByRole("radio", { name: /Паперова/ }).check();
      await page.getByRole("button", { name: /Купити|Додати до кошика/ }).click();
      await openCheckout(page);
      await expectDetails(checkout(page));
      await expect(checkout(page).getByText("Всього до сплати:").locator("..")).toHaveText("Всього до сплати:530 грн");
    });

    test("keeps the in-flight guard across close and reopen, then allows retry after failure", async ({ page }) => {
      await fillDetails(page);
      let release: () => void = () => {};
      const pending = new Promise<void>(resolve => { release = resolve; });
      let calls = 0;
      await page.route("**/api/invoice", async route => {
        calls += 1;
        if (calls === 1) await pending;
        await route.fulfill({ status: 503, json: { title: "Controlled failure" } });
      });
      try {
        // Two submit events in the same task exercise the synchronous guard, before React rerenders.
        await checkout(page).locator("form").evaluate(form => {
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });
        await expect.poll(() => calls).toBe(1);
        await expect(submit(page)).toBeDisabled();
        await returnToCart(page);
        await openCheckout(page);
        await expectDetails(checkout(page));
        await expect(submit(page)).toBeDisabled();
        await checkout(page).getByLabel(/Ім.я \*/).press("Enter");
        expect(calls).toBe(1);
      } finally { release(); }
      await expect(submit(page)).toBeEnabled();
      await expectDetails(checkout(page));
      await submit(page).click();
      await expect.poll(() => calls).toBe(2);
      await expect(submit(page)).toBeEnabled();
    });

    test("does not store personal details and resets the draft on reload", async ({ page }) => {
      await fillDetails(page);
      const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
      for (const value of ["Леся", "Українка", "lesya@example.com", "+380501234567", department.id, note.trim()]) {
        expect(storage).not.toContain(value);
      }
      await page.reload();
      await openCart(page);
      await openCheckout(page);
      for (const field of [/Ім.я \*/, /Прізвище \*/, "Email *", "Телефон *", noteLabel]) {
        await expect(checkout(page).getByLabel(field)).toHaveValue("");
      }
      await expect(checkout(page).getByText(department.shortName, { exact: true })).toHaveCount(0);
    });

    test("preserves details through navigation and repeated Escape/reopen", async ({ page }) => {
      await fillDetails(page);
      await page.keyboard.press("Escape");
      await expect(checkout(page)).toBeHidden();
      const opener = page.getByRole("button", { name: /Купити|Переглянути кошик/ });
      await expect(opener).toBeFocused();
      await page.getByRole("navigation").getByRole("link", { name: "Про мене" }).click();
      await expect(page).toHaveURL(/\/about$/);
      await openCart(page);
      await openCheckout(page);
      await expectDetails(checkout(page));
      for (let index = 0; index < 2; index += 1) {
        await page.keyboard.press("Escape");
        await openCart(page);
        await openCheckout(page);
        await expectDetails(checkout(page));
        expect(await checkout(page).evaluate(element => element.contains(document.activeElement))).toBe(true);
      }
    });
  });
}
