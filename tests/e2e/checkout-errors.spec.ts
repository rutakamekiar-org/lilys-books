import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { mockApiUrl, resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";
import { getCheckoutFailure } from "../../src/lib/checkout-errors";

const department = { id: 17, shortName: "Відділення №17", address: "Київ, вул. Тестова, 17", addressParts: { city: "Київ", street: "Тестова", building: "17" } };
const replacementDepartment = { ...department, id: 18, shortName: "Відділення №18" };
const paperId = "11000000-0000-4000-8000-000000000001";
const digitalId = "11000000-0000-4000-8000-000000000002";
const noteLabel = "Коментар до замовлення (необов’язково)";
const note = "Зателефонуйте перед відправленням";
const cart = (page: Page) => page.getByRole("dialog", { name: "Кошик", exact: true });
const checkout = (page: Page) => page.getByRole("dialog", { name: "Оформлення замовлення", exact: true });
const submit = (page: Page) => checkout(page).getByRole("button", { name: /Підтвердити замовлення|Обробка замовлення/ });
const summary = (page: Page) => checkout(page).getByRole("alert").filter({ has: page.getByRole("heading", { name: /Замовлення не прийнято|Не вдалося оформити замовлення/ }) });
const before = process.env.ZVY67_EVIDENCE_PHASE === "before";

test("maps normalized field and indexed-item paths to safe messages using the submitted order", () => {
  const result = getCheckoutFailure({ status: 400, details: { errors: {
    "$.Customer.Email": ["SECRET"], "Request.Items[1].Quantity": ["SECRET"], promoCode: ["SECRET"], items: ["SECRET"],
  } } }, [{ itemId: paperId, format: "paper" }, { itemId: digitalId, format: "digital" }]);
  expect(result.kind).toBe("rejected");
  expect(result.fields.email).toMatch(/Перевірте адресу email/);
  expect(result.items).toEqual({ [digitalId]: "Перевірте кількість цього товару в кошику." });
  expect(result.cart).toBeTruthy();
  expect(result.promo).toBeTruthy();
  expect(result.unknown).toBe(false);
  expect(JSON.stringify(result)).not.toContain("SECRET");
});

test("keeps safe recovery for unknown, unavailable, malformed and mixed validation paths", () => {
  for (const errors of [{ unknown: ["SECRET"] }, { "items[99].productId": ["SECRET"] }, { "customer.phone": ["SECRET"] }, { "customer.email": "SECRET" }, { "customer.email": [] }, { "customer.email": ["SECRET"], unknown: ["SECRET"] }, { constructor: ["SECRET"] }]) {
    const result = getCheckoutFailure({ status: 400, details: { errors } }, [{ itemId: digitalId, format: "digital" }]);
    expect(result.unknown).toBe(true);
    expect(JSON.stringify(result)).not.toContain("SECRET");
  }
  for (const error of [new TypeError("SECRET"), { status: 500, details: { errors: { "customer.email": ["SECRET"] } } }, { status: 200 }]) {
    expect(getCheckoutFailure(error, [])).toEqual({ kind: "temporary", fields: {}, items: {}, unknown: false });
  }
});

async function capture(page: Page, info: TestInfo, state: string) {
  const phase = process.env.ZVY67_EVIDENCE_PHASE;
  if (!phase) return;
  if (phase !== "before" && phase !== "after") throw new Error("Unknown evidence phase");
  const directory = path.join(process.cwd(), "docs/checkout-errors", phase);
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  const viewport = page.viewportSize()!;
  const filename = path.join(directory, `SCR-05-${state}-${viewport.width}x${viewport.height}.jpg`);
  await page.screenshot({ path: filename, type: "jpeg", quality: 85, animations: "disabled", caret: "hide" });
  await info.attach(state, { path: filename, contentType: "image/jpeg" });
}

async function selectDepartment(page: Page, replacement = false) {
  await checkout(page).getByRole("button", { name: /Відділення Нової Пошти/ }).click();
  await page.frameLocator('iframe[title="Nova Poshta Widget"]').getByRole("button", { name: replacement ? "Обрати інше відділення" : "Обрати тестове відділення", exact: true }).click();
}

async function fillDetails(page: Page, physical = true) {
  const form = checkout(page);
  await form.getByLabel(/Ім.я \*/).fill("Леся");
  await form.getByLabel(/Прізвище \*/).fill("Українка");
  await form.getByLabel("Email *").fill("lesya@example.com");
  await form.getByLabel(noteLabel).fill(note);
  if (physical) {
    await form.getByLabel("Телефон *").fill("+380501234567");
    await selectDepartment(page);
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
  await expect(form.getByText("SAVE30", { exact: false })).toBeVisible();
}

async function openCheckout(page: Page, format: "paper" | "digital" | "mixed" = "paper") {
  await page.goto("/books/test-book");
  if (format === "digital") await page.getByRole("radio", { name: /Електронна/ }).check();
  await page.getByRole("button", { name: /Купити/ }).click();
  if (format === "mixed") {
    await cart(page).getByRole("button", { name: "Закрити", exact: true }).click();
    await page.getByRole("radio", { name: /Електронна/ }).check();
    await page.getByRole("button", { name: /Купити|Додати до кошика/ }).click();
  }
  await cart(page).getByRole("textbox", { name: "Промокод" }).fill("SAVE30");
  await cart(page).getByRole("button", { name: "Застосувати", exact: true }).click();
  await expect(cart(page).getByText("SAVE30", { exact: true })).toBeVisible();
  await cart(page).getByRole("button", { name: "Оформити замовлення" }).click();
  await expect(checkout(page)).toBeVisible();
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
  test.describe(`checkout corrections at ${viewport.width}px`, () => {
    test.use({ viewport, hasTouch: viewport.width < 640 });
    test.beforeEach(async ({ page, request }) => {
      await resetMockApi(request);
      await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
      await page.route("https://widget.novapost.com/**", route => route.fulfill({ contentType: "text/html; charset=utf-8", body:
        `<button onclick='parent.postMessage(${JSON.stringify(department)}, "http://127.0.0.1:3100")'>Обрати тестове відділення</button><button onclick='parent.postMessage(${JSON.stringify(replacementDepartment)}, "http://127.0.0.1:3100")'>Обрати інше відділення</button>` }));
      await page.route("https://example.invalid/**", route => route.fulfill({ contentType: "text/html", body: "Mock payment handoff" }));
      await page.route("**/api/PromoCode/validate?**", route => route.fulfill({ json: { code: "SAVE30", type: 0, value: 30, applicableProductItemIds: null, remainingUsages: null } }));
    });

    test("clears corrected client errors on blur without submitting or invalidating untouched fields", async ({ page, request }, info) => {
      await openCheckout(page);
      await expect(checkout(page).locator('[aria-invalid="true"]')).toHaveCount(0);
      await submit(page).click();
      await expect(checkout(page).getByText("Введіть ім'я", { exact: true })).toBeVisible();
      await checkout(page).getByLabel(/Ім.я \*/).scrollIntoViewIfNeeded();
      await capture(page, info, "validation");
      const firstName = checkout(page).getByLabel(/Ім.я \*/);
      await firstName.fill("Леся");
      await firstName.press("Tab");
      await capture(page, info, "corrected-errors");
      if (before) return;
      await expect(firstName).toHaveAttribute("aria-invalid", "false");
      await expect(checkout(page).getByText("Введіть ім'я", { exact: true })).toHaveCount(0);
      await expect(checkout(page).getByLabel(/Прізвище \*/)).toHaveAttribute("aria-invalid", "true");
      await checkout(page).getByLabel("Телефон *").fill("123");
      await checkout(page).getByLabel("Телефон *").press("Tab");
      await expect(checkout(page).getByText(/Введіть дійсний телефон/)).toBeVisible();
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
      await fillDetails(page);
      await submit(page).click();
      await expect(page).toHaveURL("https://example.invalid/test-payment");
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(1);
    });

    if (viewport.width === 1440) test("keeps feedback for overlong corrected fields and accepts the supported length boundaries", async ({ page, request }) => {
      await openCheckout(page, "digital");
      const firstName = checkout(page).getByLabel(/Ім.я \*/);
      const lastName = checkout(page).getByLabel(/Прізвище \*/);
      const email = checkout(page).getByLabel("Email *");
      await firstName.fill("А".repeat(101));
      await lastName.fill("Б".repeat(101));
      await email.fill("a".repeat(315) + "@x.com");
      await submit(page).click();
      for (const field of [firstName, lastName, email]) await expect(field).toHaveAttribute("aria-invalid", "true");
      await firstName.fill("В".repeat(101));
      await firstName.press("Tab");
      await expect(firstName).toHaveAttribute("aria-invalid", "true");
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
      for (const [field, value] of [[firstName, "А".repeat(100)], [lastName, "Б".repeat(100)], [email, "a".repeat(314) + "@x.com"]] as const) {
        await field.fill(value);
        await field.press("Tab");
        await expect(field).toHaveAttribute("aria-invalid", "false");
      }
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
      await submit(page).click();
      await expect(page).toHaveURL("https://example.invalid/test-payment");
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(1);
    });

    test("associates safe customer errors, links corrections, and clears only changed valid fields", async ({ page }, info) => {
      await openCheckout(page);
      await fillDetails(page);
      let calls = 0;
      let payload: unknown;
      await page.route("**/api/invoice", async route => {
        calls++;
        payload = route.request().postDataJSON();
        await route.fulfill(calls === 1 ? { status: 400, json: { title: "SECRET exception", detail: "SECRET stack", errors: { "customer.firstName": ["SECRET name"], "Customer.LastName": ["SECRET surname"], "customer.email": ["SECRET email"], "customer.phone": ["SECRET phone"], "customer.department.id": ["SECRET department"], orderNote: ["SECRET note"] } } } : { json: { redirectUrl: "https://example.invalid/test-payment" } });
      });
      await submit(page).click();
      await expect(submit(page)).toBeEnabled();
      await capture(page, info, "server-validation");
      if (before) return;
      await expect(summary(page)).toBeFocused();
      await expectDetails(checkout(page));
      await expect(checkout(page)).not.toContainText("SECRET");
      await expect(checkout(page).locator('[aria-invalid="true"]')).toHaveCount(5);
      await expect(checkout(page).getByLabel("Email *")).toHaveAccessibleDescription(/Перевірте.*email/);
      await expectNoA11yViolations(page, "checkout customer rejection");
      await summary(page).getByRole("link", { name: "Email", exact: true }).click();
      await expect(checkout(page).getByLabel("Email *")).toBeFocused();
      await checkout(page).getByLabel("Email *").press("Tab");
      await expect(checkout(page).getByLabel("Email *")).toHaveAttribute("aria-invalid", "true");
      for (const [label, value] of [[/Ім.я \*/, "Леся-Марія"], [/Прізвище \*/, "Косач"], ["Email *", "new@example.com"], ["Телефон *", "+380671234567"], [noteLabel, "Новий коментар"]] as const) {
        await checkout(page).getByLabel(label).fill(value);
        await checkout(page).getByLabel(label).press("Tab");
        await expect(checkout(page).getByLabel(label)).toHaveAttribute("aria-invalid", "false");
      }
      await selectDepartment(page, true);
      await expect(summary(page)).toHaveCount(0);
      expect(calls).toBe(1);
      await page.route("https://example.invalid/**", route => route.fulfill({ contentType: "text/html", body: "Mock payment handoff" }));
      await submit(page).click();
      await expect(page).toHaveURL("https://example.invalid/test-payment");
      expect(calls).toBe(2);
      expect(payload).toEqual({ customer: { firstName: "Леся-Марія", lastName: "Косач", email: "new@example.com", phone: "+380671234567", department: replacementDepartment }, items: [{ productId: paperId, quantity: 1 }], promoCode: "SAVE30", orderNote: "Новий коментар" });
    });

    test("identifies the rejected item and returns to its removal control with the draft intact", async ({ page }, info) => {
      await openCheckout(page, "mixed");
      await fillDetails(page);
      let calls = 0;
      let payload: unknown;
      await page.route("**/api/invoice", async route => {
        calls++;
        payload = route.request().postDataJSON();
        await route.fulfill(calls === 1 ? { status: 400, json: { errors: { "items[1].productId": ["SECRET unavailable"] } } } : { json: { redirectUrl: "https://example.invalid/test-payment" } });
      });
      await submit(page).click();
      await expect(submit(page)).toBeEnabled();
      await capture(page, info, "item-rejection");
      if (before) return;
      await expect(summary(page)).toBeFocused();
      await expect(checkout(page)).not.toContainText("SECRET");
      await summary(page).getByRole("link", { name: /Електронна/ }).click();
      const rejectedLine = checkout(page).getByRole("group", { name: /Електронна/ });
      await expect(rejectedLine).toBeFocused();
      await expect(rejectedLine).toHaveAccessibleDescription(/Перевірте доступність/);
      await capture(page, info, "item-correction");
      await rejectedLine.getByRole("button", { name: /Змінити.*кошик/ }).click();
      const cartLine = cart(page).getByRole("group", { name: /Електронна/ });
      await expect(cartLine.getByRole("button", { name: "Видалити з кошика" })).toBeFocused();
      await cartLine.getByRole("button", { name: "Видалити з кошика" }).click();
      await cart(page).getByRole("button", { name: "Оформити замовлення" }).click();
      await expectDetails(checkout(page));
      await expect(checkout(page).getByText("320 грн", { exact: true })).toBeVisible();
      await page.route("https://example.invalid/**", route => route.fulfill({ body: "Mock payment handoff" }));
      await submit(page).click();
      await expect(page).toHaveURL("https://example.invalid/test-payment");
      expect(calls).toBe(2);
      expect(payload).toEqual({ customer: { firstName: "Леся", lastName: "Українка", email: "lesya@example.com", phone: "+380501234567", department }, items: [{ productId: paperId, quantity: 1 }], promoCode: "SAVE30", orderNote: note });
    });

    test("retains uncorrected fields, handles mixed unknown paths, and allows promo correction", async ({ page }) => {
      await openCheckout(page, "digital");
      await fillDetails(page, false);
      let calls = 0;
      await page.route("**/api/invoice", async route => {
        calls++;
        await route.fulfill({ status: 400, json: { errors: { "customer.email": ["SECRET"], promoCode: ["SECRET"], "items[99].productId": ["SECRET"] } } });
      });
      await submit(page).click();
      await expect(summary(page)).toBeFocused();
      await expect(summary(page)).toContainText("Перевірте або видаліть промокод");
      await expect(summary(page)).toContainText("Не вдалося визначити");
      await checkout(page).getByLabel("Email *").fill("invalid");
      await checkout(page).getByLabel("Email *").press("Tab");
      await expect(checkout(page).getByLabel("Email *")).toHaveAttribute("aria-invalid", "true");
      await expect(checkout(page).getByLabel("Email *")).toHaveAccessibleDescription("Введіть дійсний email");
      await checkout(page).getByLabel("Email *").fill("new@example.com");
      await checkout(page).getByLabel("Email *").press("Tab");
      await expect(checkout(page).getByLabel("Email *")).toHaveAttribute("aria-invalid", "false");
      await expect(summary(page)).toContainText("Не вдалося визначити");
      expect(calls).toBe(1);
      await summary(page).getByRole("button", { name: "Перевірити кошик" }).click();
      await cart(page).getByRole("button", { name: "Видалити промокод" }).click();
      await cart(page).getByRole("button", { name: "Оформити замовлення" }).click();
      await expect(checkout(page).getByLabel("Email *")).toHaveValue("new@example.com");
      await expect(checkout(page).getByRole("group", { name: /Електронна/ }).getByText("180 грн", { exact: true })).toBeVisible();
      expect(calls).toBe(1);
    });

    test("retains the cart and shows retry for a malformed successful response", async ({ page }) => {
      await openCheckout(page, "digital");
      await fillDetails(page, false);
      await page.route("**/api/invoice", route => route.fulfill({ status: 200, json: { detail: "SECRET malformed success" } }));
      await submit(page).click();
      await expect(summary(page)).toBeFocused();
      await expect(summary(page).getByRole("button", { name: "Спробувати ще раз" })).toBeVisible();
      await expectDetails(checkout(page), false);
      await expect(page).toHaveURL(/\/books\/test-book$/);
      await expect(checkout(page)).not.toContainText("SECRET");
    });

    for (const failure of ["unknown", "malformed", "500", "network"] as const) {
      test(`offers persistent recovery for ${failure} without losing context`, async ({ page }, info) => {
        await openCheckout(page, "digital");
        await fillDetails(page, false);
        let calls = 0;
        let payload: unknown;
        await page.route("**/api/invoice", async route => {
          calls++;
          payload = route.request().postDataJSON();
          if (calls > 1) return route.fulfill({ json: { redirectUrl: "https://example.invalid/test-payment" } });
          if (failure === "network") return route.abort("failed");
          if (failure === "malformed") return route.fulfill({ status: 400, body: "SECRET malformed HTML", contentType: "text/html" });
          await route.fulfill({ status: failure === "500" ? 500 : 400, json: { title: "SECRET exception", detail: "SECRET internal stack", errors: { "internal.secret": ["SECRET value"] } } });
        });
        await submit(page).click();
        await expect(submit(page)).toBeEnabled();
        await capture(page, info, failure === "500" ? "invoice-error" : `${failure}-rejection`);
        if (before) return;
        await expect(summary(page)).toBeFocused();
        await expect(summary(page)).toContainText(failure === "500" || failure === "network" ? "тимчасово" : "Перевірте дані");
        await expect(checkout(page)).not.toContainText("SECRET");
        await expect(page).toHaveURL(/\/books\/test-book$/);
        await expectDetails(checkout(page), false);
        await expect(checkout(page).getByText("150 грн", { exact: true })).toBeVisible();
        await expect(checkout(page).getByText("x1", { exact: true })).toBeVisible();
        await expectNoA11yViolations(page, `checkout ${failure} recovery`);
        if (failure === "unknown" || failure === "malformed") {
          await summary(page).getByRole("button", { name: "Перевірити кошик", exact: true }).click();
          await expect(cart(page)).toBeVisible();
          await cart(page).getByRole("button", { name: "Оформити замовлення" }).click();
          await expectDetails(checkout(page), false);
        }
        await page.route("https://example.invalid/**", route => route.fulfill({ body: "Mock payment handoff" }));
        if (failure === "500" || failure === "network") await summary(page).getByRole("button", { name: "Спробувати ще раз", exact: true }).click();
        else await submit(page).click();
        await expect(page).toHaveURL("https://example.invalid/test-payment");
        expect(calls).toBe(2);
        expect(payload).toEqual({ customer: { firstName: "Леся", lastName: "Українка", email: "lesya@example.com" }, items: [{ productId: digitalId, quantity: 1 }], promoCode: "SAVE30", orderNote: note });
      });
    }
  });
}
