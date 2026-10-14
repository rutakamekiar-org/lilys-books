import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { mockApiUrl, resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";

const reference = "40000000-0000-4000-8000-000000000040";
const successUrl = `/payment/success#reference=${reference}`;
const digitalId = "11000000-0000-4000-8000-000000000002";
const paperId = "11000000-0000-4000-8000-000000000001";
const cart = (page: Page) => page.getByRole("dialog", { name: "Кошик", exact: true });
const checkout = (page: Page) => page.getByRole("dialog", { name: "Оформлення замовлення", exact: true });
const submit = (page: Page) => checkout(page).getByRole("button", { name: "Підтвердити замовлення", exact: true });

async function fillCustomer(page: Page) {
    await checkout(page).getByLabel(/Ім.я \*/).fill("Леся");
    await checkout(page).getByLabel(/Прізвище \*/).fill("Українка");
    await checkout(page).getByLabel("Email *").fill("lesya@example.com");
    await checkout(page).getByLabel("Коментар до замовлення (необов’язково)").fill("Особистий коментар");
}

async function handoff(page: Page, promo = false) {
    await page.goto("/books/test-book");
    await page.getByRole("radio", { name: /Електронна/ }).check();
    await page.getByRole("button", { name: /Купити/ }).click();
    if (promo) {
        await cart(page).getByRole("textbox", { name: "Промокод" }).fill("NEAR-TOTAL");
        await cart(page).getByRole("button", { name: "Застосувати", exact: true }).click();
        await expect(cart(page).getByText("NEAR-TOTAL", { exact: true })).toBeVisible();
    }
    await cart(page).getByRole("button", { name: "Оформити замовлення", exact: true }).click();
    await fillCustomer(page);
    await submit(page).click();
    await expect(page).toHaveURL("https://example.invalid/test-payment");
}

async function selections(page: Page) {
    return page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]").map((item: { itemId: string; quantity: number }) => ({ itemId: item.itemId, quantity: item.quantity })));
}

async function capture(page: Page, info: TestInfo, state: string, viewport: { width: number; height: number }) {
    if (process.env.ZVY40_EVIDENCE !== "after" || viewport.width !== 390) return;
    const directory = path.join(process.cwd(), "docs/payment-recovery/separate-redirects");
    await mkdir(directory, { recursive: true });
    await page.evaluate(() => document.fonts.ready);
    const filename = path.join(directory, `${state}-${viewport.width}x${viewport.height}.png`);
    await page.screenshot({ path: filename, animations: "disabled", caret: "hide" });
    await info.attach(state, { path: filename, contentType: "image/png" });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
    test.describe(`simple cart payment cleanup at ${viewport.width}px`, () => {
        test.use({ viewport });
        test.beforeEach(async ({ page, request }) => {
            await resetMockApi(request);
            await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
            await page.route("https://example.invalid/**", route => route.fulfill({ contentType: "text/html", body: "<p>Controlled payment handoff</p>" }));
        });

        test("minimal hidden tab snapshot cleans only trusted purchased lines and is consumed once", async ({ page, request }) => {
            await handoff(page);
            await page.goto("/payment/failure");
            expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
            const storage = await page.evaluate(() => ({ local: JSON.stringify({ ...localStorage }), session: JSON.stringify({ ...sessionStorage }), snapshots: JSON.parse(sessionStorage.getItem("paymentSelections") ?? "[]") }));
            expect(storage.local).not.toContain(reference);
            expect(Object.keys(storage.snapshots[0]).sort()).toEqual(["items", "reference"]);
            expect(Object.keys(storage.snapshots[0].items[0]).sort()).toEqual(["itemId", "quantity", "selectionId"]);
            for (const detail of ["Леся", "Українка", "lesya@example.com", "Особистий коментар", "example.invalid"]) expect(storage.local + storage.session).not.toContain(detail);
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "hold" } });
            await page.goto(successUrl);
            await expect(page.getByRole("heading", { name: "Оплату підтверджено", exact: true })).toBeVisible();
            await expect.poll(() => selections(page)).toEqual([]);
            expect(await page.evaluate(() => sessionStorage.getItem("paymentSelections"))).toBeNull();
            await page.goto("/books/test-book");
            await page.getByRole("radio", { name: /Електронна/ }).check();
            await page.getByRole("button", { name: /Купити/ }).click();
            await page.goto(successUrl);
            await expect(page.getByRole("heading", { name: "Оплату підтверджено", exact: true })).toBeVisible();
            expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(1);
        });

        test("failure keeps the normal cart without any previous-order panel", async ({ page, request }, info) => {
            await handoff(page);
            await page.goto("/payment/failure");
            await page.getByRole("button", { name: "Переглянути кошик", exact: true }).click();
            await expect(cart(page).getByText("Test Book", { exact: true })).toBeVisible();
            await expect(cart(page).getByText(/Перевірте попередню оплату/)).toHaveCount(0);
            expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).paymentConfirmationRequests).toBe(0);
            await expectNoA11yViolations(page, "failure cart");
            await capture(page, info, "failure-cart", viewport);
            await page.reload();
            expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
        });

        test("newer additions survive confirmation of the original selection", async ({ page, request }) => {
            await handoff(page);
            await page.goto("/books/test-book");
            await page.getByRole("radio", { name: /Паперова/ }).check();
            await page.getByRole("button", { name: /Купити/ }).click();
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "hold" } });
            await page.goto(successUrl);
            await expect(page.getByRole("heading", { name: "Оплату підтверджено", exact: true })).toBeVisible();
            await expect.poll(() => selections(page)).toEqual([{ itemId: paperId, quantity: 1 }]);
        });

        test("manually removed and re-added selection is preserved", async ({ page, request }) => {
            await handoff(page);
            await page.goto("/payment/failure");
            await page.getByRole("button", { name: "Переглянути кошик", exact: true }).click();
            await cart(page).getByRole("button", { name: /Видалити/ }).click();
            await page.goto("/books/test-book");
            await page.getByRole("radio", { name: /Електронна/ }).check();
            await page.getByRole("button", { name: /Купити/ }).click();
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "hold" } });
            await page.goto(successUrl);
            await expect(page.getByRole("heading", { name: "Оплату підтверджено", exact: true })).toBeVisible();
            expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
        });

        test("an unconfirmed success return keeps the cart", async ({ page }) => {
            await handoff(page);
            await page.route("**/api/invoice/confirmation/**", route => route.fulfill({ status: 503, contentType: "application/json", body: '{}' }));
            await page.goto(successUrl);
            await expect(page.getByRole("heading", { name: "Не вдалося підтвердити оплату", exact: true })).toBeVisible();
            expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
        });

        test("ordinary checkout revalidates the promo before another invoice is created", async ({ page, request }) => {
            await handoff(page, true);
            await request.post(`${mockApiUrl}/__control/promo`, { data: { state: "invalid" } });
            await page.goto("/payment/failure");
            await page.getByRole("button", { name: "Переглянути кошик", exact: true }).click();
            await cart(page).getByRole("button", { name: "Оформити замовлення", exact: true }).click();
            await fillCustomer(page);
            await submit(page).click();
            await expect(cart(page).getByText("Промокод більше не діє. Перевірте оновлену суму без знижки.", { exact: true })).toBeVisible();
            await expect(cart(page).getByText(/Перевірте попередню оплату/)).toHaveCount(0);
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(1);
            await cart(page).getByRole("button", { name: "Оформити замовлення", exact: true }).click();
            await submit(page).click();
            await expect(page).toHaveURL("https://example.invalid/test-payment");
            const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
            expect(state.invoiceRequests).toBe(2);
            expect(state.lastInvoiceRequest.promoCode).toBeUndefined();
            expect(state.paymentConfirmationRequests).toBe(0);
        });
    });
}
