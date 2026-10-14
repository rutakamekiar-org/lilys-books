import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { mockApiUrl, resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";

const reference = "40000000-0000-4000-8000-000000000040";
const successUrl = `/payment/success#reference=${reference}`;

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
    test.describe(`separate payment returns at ${viewport.width}px`, () => {
        test.use({ viewport });
        test.beforeEach(async ({ page, request }) => {
            await resetMockApi(request);
            await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
        });

        test("shows saved confirmation without invoice details or status controls", async ({ page, request }, info) => {
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "hold" } });
            const forbiddenRequests: string[] = [];
            page.on("request", req => { if (req.url().includes("/invoice/status") || /monobank|mono\.bank|mbnk\.biz/.test(req.url())) forbiddenRequests.push(req.url()); });
            await page.goto(successUrl);
            await expect(page.getByRole("heading", { name: "Оплату підтверджено", exact: true })).toBeVisible();
            await expect(page.getByText("Номер замовлення")).toHaveCount(0);
            await expect(page.getByText("Сума замовлення")).toHaveCount(0);
            await expect(page.getByRole("button", { name: /статус|Продовжити оплату|повторити/ })).toHaveCount(0);
            await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
            await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
            await expectNoA11yViolations(page, "confirmed payment");
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            if (process.env.ZVY40_EVIDENCE === "after") {
                const dir = path.join(process.cwd(), "docs/payment-recovery/separate-redirects");
                await mkdir(dir, { recursive: true });
                await page.evaluate(() => document.fonts.ready);
                const filename = path.join(dir, `success-${viewport.width}x${viewport.height}.png`);
                await page.screenshot({ path: filename, animations: "disabled", caret: "hide" });
                await info.attach("success", { path: filename, contentType: "image/png" });
            }
            await page.reload();
            await expect(page.getByRole("heading", { name: "Оплату підтверджено", exact: true })).toBeVisible();
            const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
            expect(state.invoiceRequests).toBe(0);
            expect(forbiddenRequests).toEqual([]);
        });

        test("failure return needs no payment confirmation request", async ({ page, request }, info) => {
            await page.goto("/payment/failure?status=success");
            await expect(page.getByRole("heading", { name: "Оплату не завершено", exact: true })).toBeVisible();
            await expectNoA11yViolations(page, "failure");
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).paymentConfirmationRequests).toBe(0);
            if (process.env.ZVY40_EVIDENCE === "after") {
                const dir = path.join(process.cwd(), "docs/payment-recovery/separate-redirects");
                await mkdir(dir, { recursive: true });
                await page.evaluate(() => document.fonts.ready);
                const filename = path.join(dir, `failure-${viewport.width}x${viewport.height}.png`);
                await page.screenshot({ path: filename, animations: "disabled", caret: "hide" });
                await info.attach("failure", { path: filename, contentType: "image/png" });
            }
            const button = page.getByRole("button", { name: "Переглянути кошик", exact: true });
            await button.focus();
            await page.keyboard.press("Enter");
            await expect(page.getByRole("dialog", { name: "Кошик", exact: true })).toBeVisible();
            await page.keyboard.press("Escape");
            await expect(button).toBeFocused();
        });

        test("a direct success URL cannot assert payment", async ({ page, request }, info) => {
            await page.goto("/payment/success?status=success");
            await expect(page.getByRole("heading", { name: "Не вдалося підтвердити оплату", exact: true })).toBeVisible();
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).paymentConfirmationRequests).toBe(0);
            await page.goto("/payment/success#reference=50000000-0000-4000-8000-000000000040&status=success");
            await expect(page.getByRole("heading", { name: "Не вдалося підтвердити оплату", exact: true })).toBeVisible();
            await expectNoA11yViolations(page, "unconfirmed");
            if (process.env.ZVY40_EVIDENCE === "after") {
                const dir = path.join(process.cwd(), "docs/payment-recovery/separate-redirects");
                await mkdir(dir, { recursive: true });
                await page.evaluate(() => document.fonts.ready);
                const filename = path.join(dir, `unconfirmed-${viewport.width}x${viewport.height}.png`);
                await page.screenshot({ path: filename, animations: "disabled", caret: "hide" });
                await info.attach("unconfirmed", { path: filename, contentType: "image/png" });
            }
        });

        test("a delayed saved confirmation succeeds automatically without stealing focus", async ({ page, request }) => {
            await page.goto(successUrl);
            await expect(page.getByRole("heading", { name: "Завершуємо оплату", exact: true })).toBeVisible();
            const link = page.getByRole("link", { name: "Повернутися до магазину", exact: true });
            await link.focus();
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "hold" } });
            await expect(page.getByRole("heading", { name: "Оплату підтверджено", exact: true })).toBeVisible();
            await expect(link).toBeFocused();
        });

        test("missing confirmation never becomes failure and stops automatic reads", async ({ page, request }) => {
            await page.goto(successUrl);
            await expect(page.getByRole("heading", { name: "Не вдалося підтвердити оплату", exact: true })).toBeVisible({ timeout: 20000 });
            await expect(page.getByRole("heading", { name: "Оплату не завершено", exact: true })).toHaveCount(0);
            const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
            expect(state.paymentConfirmationRequests).toBe(5);
            expect(state.invoiceRequests).toBe(0);
            await expect(page.getByRole("button", { name: /статус/ })).toHaveCount(0);
        });

        test("replacement reference cannot reuse a previous successful result", async ({ page, request }) => {
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "hold" } });
            await page.goto(successUrl);
            await expect(page.getByRole("heading", { name: "Оплату підтверджено", exact: true })).toBeVisible();
            await page.evaluate(() => { location.hash = "reference=50000000-0000-4000-8000-000000000040"; });
            await expect(page.getByRole("heading", { name: "Не вдалося підтвердити оплату", exact: true })).toBeVisible();
        });

        test("revisiting the same reference cannot reuse a cached successful confirmation", async ({ page, request }) => {
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "hold" } });
            await page.goto(successUrl);
            await expect(page.getByRole("heading", { name: "Оплату підтверджено", exact: true })).toBeVisible();
            await page.evaluate(() => { location.hash = "reference=invalid"; });
            await expect(page.getByRole("heading", { name: "Не вдалося підтвердити оплату", exact: true })).toBeVisible();
            await page.route("**/api/invoice/confirmation/**", async route => {
                await new Promise(resolve => setTimeout(resolve, 250));
                await route.fulfill({ status: 503, json: {} });
            });
            await page.evaluate(value => { location.hash = `reference=${value}`; }, reference);
            await expect(page.getByRole("heading", { name: "Завершуємо оплату", exact: true })).toBeVisible();
            await expect(page.getByRole("heading", { name: "Оплату підтверджено", exact: true })).toHaveCount(0);
            await expect(page.getByRole("heading", { name: "Не вдалося підтвердити оплату", exact: true })).toBeVisible();
            await expect(page.getByRole("link", { name: "Зв’язатися з нами", exact: true })).toHaveAttribute("href", "mailto:lillykukharets0325@gmail.com");
        });

        test("malformed confirmation is neutral", async ({ page }) => {
            await page.route("**/api/invoice/confirmation/**", route => route.fulfill({ contentType: "application/json", body: '{"confirmed":"true"}' }));
            await page.goto(successUrl);
            await expect(page.getByRole("heading", { name: "Не вдалося підтвердити оплату", exact: true })).toBeVisible();
        });
    });
}
