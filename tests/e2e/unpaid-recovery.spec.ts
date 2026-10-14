import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { mockApiUrl, resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";

const reference = "40000000-0000-4000-8000-000000000040";
const receiptUrl = `/payment#reference=${reference}`;
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
    await page.goto(receiptUrl);
    await expect(page.getByRole("heading", { name: "Оплата ще очікується", exact: true })).toBeVisible();
}

async function selections(page: Page) {
    return page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]").map((item: { itemId: string; quantity: number }) => ({ itemId: item.itemId, quantity: item.quantity })));
}

async function capture(page: Page, info: TestInfo, state: string, viewport: { width: number; height: number }) {
    if (process.env.ZVY40_EVIDENCE !== "after") return;
    const directory = path.join(process.cwd(), "docs/payment-recovery/after");
    await mkdir(directory, { recursive: true });
    await page.evaluate(() => document.fonts.ready);
    const filename = path.join(directory, `${state}-${viewport.width}x${viewport.height}.png`);
    await page.screenshot({ path: filename, animations: "disabled", caret: "hide" });
    await info.attach(state, { path: filename, contentType: "image/png" });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
    test.describe(`unpaid recovery at ${viewport.width}px`, () => {
        test.use({ viewport });
        test.beforeEach(async ({ page, request }) => {
            await resetMockApi(request);
            await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
            await page.route("https://example.invalid/**", route => route.fulfill({ contentType: "text/html", body: "<p>Controlled payment handoff</p>" }));
        });

        test("keeps a nonpersonal tab-only snapshot and consumes purchased lines only on trusted success", async ({ page, request }) => {
            await handoff(page);
            expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
            const storage = await page.evaluate(() => ({ local: JSON.stringify({ ...localStorage }), session: JSON.stringify({ ...sessionStorage }) }));
            expect(storage.local).not.toContain(reference);
            expect(storage.session).toContain(reference);
            for (const detail of ["Леся", "Українка", "lesya@example.com", "Особистий коментар"]) {
                expect(storage.local + storage.session).not.toContain(detail);
            }
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "success" } });
            await page.reload();
            await expect(page.getByRole("heading", { name: "Оплата успішна", exact: true })).toBeVisible();
            await expect.poll(() => selections(page)).toEqual([]);
            expect(await page.evaluate(() => sessionStorage.getItem("paymentAttempts"))).toBeNull();
            // Re-adding after receipt consumption must survive a successful receipt revisit.
            await page.goto("/books/test-book");
            await page.getByRole("radio", { name: /Електронна/ }).check();
            await page.getByRole("button", { name: /Купити/ }).click();
            await page.goto(receiptUrl);
            await expect(page.getByRole("heading", { name: "Оплата успішна", exact: true })).toBeVisible();
            expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(1);
        });

        for (const [status, title] of [["init", "Оплата ще очікується"], ["failure", "Оплата не завершена"], ["reversed", "Оплату скасовано"], ["unknown", "Оплату не підтверджено"]]) {
            test(`retains and reviews selection for ${status}`, async ({ page, request }, info) => {
                await handoff(page);
                await request.post(`${mockApiUrl}/__control/payment`, { data: { status } });
                await page.reload();
                await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
                expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
                await expectNoA11yViolations(page, `unpaid ${status}`);
                await capture(page, info, `recovery-${status}`, viewport);
                await page.getByRole("button", { name: /Переглянути кошик і повторити|Переглянути товари/, exact: true }).click();
                await expect(cart(page)).toBeVisible();
                await expect(cart(page).getByText("Test Book", { exact: true })).toBeVisible();
                await expect(cart(page).getByRole("button", { name: "Замовлення TEST-ORDER-40", exact: true })).toBeVisible();
                expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(1);
            });
        }

        test("resumes the original pending invoice instead of posting a duplicate", async ({ page, request }) => {
            await handoff(page);
            await page.getByRole("button", { name: "Переглянути товари", exact: true }).click();
            await expect(cart(page)).toBeVisible();
            await cart(page).getByRole("button", { name: "Оформити замовлення", exact: true }).click();
            await fillCustomer(page);
            await submit(page).click();
            await expect(page).toHaveURL(new RegExp("/payment#reference="));
            await expect(checkout(page)).toBeHidden();
            await expect(page.locator("dl").getByText("180 грн", { exact: true })).toBeVisible();
            await page.getByRole("button", { name: "Продовжити оплату", exact: true }).click();
            await expect(page).toHaveURL("https://example.invalid/test-payment");
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(1);
        });

        test("a later successful invoice preserves newer quantities and remove-readd identities", async ({ page, request }) => {
            await handoff(page);
            await page.getByRole("navigation").getByRole("button", { name: /Кошик/ }).click();
            await cart(page).getByRole("button", { name: "Видалити з кошика", exact: true }).click();
            await cart(page).getByRole("button", { name: "Закрити", exact: true }).click();
            await page.goto("/books/test-book");
            await page.getByRole("radio", { name: /Електронна/ }).check();
            await page.getByRole("button", { name: /Купити/ }).click();
            await cart(page).getByRole("button", { name: "Закрити", exact: true }).click();
            await page.getByRole("radio", { name: /Паперова/ }).check();
            await page.getByRole("button", { name: /Купити|Додати до кошика/ }).click();
            await cart(page).getByRole("button", { name: "Збільшити кількість", exact: true }).click();
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "hold" } });
            await page.goto(receiptUrl);
            await expect(page.getByRole("heading", { name: "Оплату підтверджено", exact: true })).toBeVisible();
            expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }, { itemId: paperId, quantity: 2 }]);
        });

        test("reviews fresh prices and rejects an expired promo before retry", async ({ page, request }, info) => {
            await handoff(page, true);
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "failure" } });
            await request.post(`${mockApiUrl}/__control/promo`, { data: { state: "invalid" } });
            const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
            const product = state.products.find((candidate: { slug: string }) => candidate.slug === "test-book");
            product.items[1].discountPrice = 160;
            await request.post(`${mockApiUrl}/__control/products`, { data: product });
            await page.reload();
            await page.getByRole("button", { name: "Переглянути кошик і повторити", exact: true }).click();
            await expect(cart(page)).toBeVisible();
            await expect(cart(page).getByText("Всього:", { exact: true }).locator("..")).toHaveText("Всього:160 грн");
            await expect(cart(page).getByText(/Промокод більше не діє/)).toBeVisible();
            expect(await page.evaluate(() => localStorage.getItem("appliedPromocode"))).toBeNull();
            await capture(page, info, "retry-price-promo", viewport);
            await cart(page).getByRole("button", { name: "Оформити замовлення", exact: true }).click();
            await fillCustomer(page);
            await submit(page).click();
            await expect(page).toHaveURL("https://example.invalid/test-payment");
            const retried = await (await request.get(`${mockApiUrl}/__control/state`)).json();
            expect(retried.invoiceRequests).toBe(2);
            expect(retried.lastInvoiceRequest.promoCode).toBeUndefined();
        });

        for (const failure of ["error", "empty", "unavailable", "promo-error"]) {
            test(`blocks recovery on fresh ${failure}`, async ({ page, request }) => {
                await handoff(page, failure === "promo-error");
                await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "failure" } });
                if (failure === "error" || failure === "empty") await request.post(`${mockApiUrl}/__control/catalog`, { data: { state: failure } });
                else if (failure === "promo-error") await request.post(`${mockApiUrl}/__control/promo`, { data: { state: "error" } });
                else {
                    const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
                    const product = state.products.find((candidate: { slug: string }) => candidate.slug === "test-book");
                    product.items[1].isAvailable = false;
                    product.items[1].canPreorder = false;
                    await request.post(`${mockApiUrl}/__control/products`, { data: product });
                }
                await page.reload();
                await page.getByRole("button", { name: "Переглянути кошик і повторити", exact: true }).click();
                await expect(page.getByText(/Не вдалося перевірити товари або промокод|Деякі товари більше недоступні/).first()).toBeVisible();
                await expect(cart(page)).toBeHidden();
                expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
                expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(1);
            });
        }

        test("recovery records are absent in a new tab and malformed records fail closed", async ({ page, context }) => {
            await handoff(page);
            const other = await context.newPage();
            await other.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
            await other.goto(receiptUrl);
            expect(await other.evaluate(() => sessionStorage.getItem("paymentAttempts"))).toBeNull();
            await expect(other.getByRole("button", { name: "Продовжити оплату", exact: true })).toHaveCount(0);
            await other.close();
            await page.evaluate(() => sessionStorage.setItem("paymentAttempts", '{"paymentUrl":"javascript:alert(1)"}'));
            await page.reload();
            await expect(page.getByRole("heading", { name: "Оплата ще очікується", exact: true })).toBeVisible();
            await expect(page.getByRole("button", { name: "Продовжити оплату", exact: true })).toHaveCount(0);
            expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
        });

        test("ordinary cart retry rechecks changed prices before another invoice POST", async ({ page, request }) => {
            await handoff(page);
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "failure" } });
            await page.getByRole("navigation").getByRole("button", { name: /Кошик/ }).click();
            await cart(page).getByRole("button", { name: "Оформити замовлення", exact: true }).click();
            await fillCustomer(page);
            const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
            const product = state.products.find((candidate: { slug: string }) => candidate.slug === "test-book");
            product.items[1].discountPrice = 160;
            await request.post(`${mockApiUrl}/__control/products`, { data: product });
            await submit(page).click();
            await expect(cart(page)).toBeVisible();
            await expect(cart(page).getByText("Всього:", { exact: true }).locator("..")).toHaveText("Всього:160 грн");
            await expect(cart(page).getByText(/Ціни або знижка змінилися/)).toBeVisible();
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(1);
        });

        test("explicit recovery of a removed pending selection is finalized by its original successful invoice", async ({ page, request }) => {
            await handoff(page);
            await page.getByRole("navigation").getByRole("button", { name: /Кошик/ }).click();
            await cart(page).getByRole("button", { name: "Видалити з кошика", exact: true }).click();
            await cart(page).getByRole("button", { name: "Закрити", exact: true }).click();
            await page.getByRole("button", { name: "Переглянути товари", exact: true }).click();
            await expect(cart(page).getByText("Test Book", { exact: true })).toBeVisible();
            await cart(page).getByRole("button", { name: "Закрити", exact: true }).click();
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "success" } });
            await page.getByRole("button", { name: "Перевірити статус", exact: true }).click();
            await expect(page.getByRole("heading", { name: "Оплата успішна", exact: true })).toBeVisible();
            await expect.poll(() => selections(page)).toEqual([]);
        });

        test("a delayed recovery review never restores an already paid selection", async ({ page, request }) => {
            await handoff(page);
            await page.getByRole("navigation").getByRole("button", { name: /Кошик/ }).click();
            await cart(page).getByRole("button", { name: "Видалити з кошика", exact: true }).click();
            await cart(page).getByRole("button", { name: "Закрити", exact: true }).click();
            let release: () => void = () => {};
            const pending = new Promise<void>(resolve => { release = resolve; });
            let requested = false;
            await page.route("**/api/products", async route => { requested = true; await pending; await route.continue(); });
            try {
                await page.getByRole("button", { name: "Переглянути товари", exact: true }).click();
                await expect.poll(() => requested).toBe(true);
                await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "success" } });
                await page.getByRole("button", { name: "Перевірити статус", exact: true }).click();
                await expect(page.getByRole("heading", { name: "Оплата успішна", exact: true })).toBeVisible();
                await expect.poll(() => page.evaluate(() => sessionStorage.getItem("paymentAttempts"))).toBeNull();
            } finally { release(); }
            await expect(page.getByText("Стан оплати змінився. Перевірте статус замовлення.", { exact: true }).first()).toBeVisible();
            expect(await selections(page)).toEqual([]);
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(1);
        });

        test("edits during the retry status precheck cannot post the old selection", async ({ page, request }) => {
            await handoff(page);
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "failure" } });
            await page.getByRole("navigation").getByRole("button", { name: /Кошик/ }).click();
            await cart(page).getByRole("button", { name: "Оформити замовлення", exact: true }).click();
            await fillCustomer(page);
            let release: () => void = () => {};
            const pending = new Promise<void>(resolve => { release = resolve; });
            let requested = false;
            await page.route(`**/api/invoice/status/${reference}`, async route => { requested = true; await pending; await route.continue(); });
            try {
                await submit(page).click();
                await expect.poll(() => requested).toBe(true);
                await checkout(page).getByRole("button", { name: "Закрити", exact: true }).click();
                await page.getByRole("navigation").getByRole("button", { name: /Кошик/ }).click();
                await cart(page).getByRole("button", { name: "Видалити з кошика", exact: true }).click();
            } finally { release(); }
            await expect(cart(page).getByText("Кошик змінився під час перевірки. Перегляньте його ще раз.", { exact: true })).toBeVisible();
            expect(await selections(page)).toEqual([]);
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(1);
        });
    });
}
