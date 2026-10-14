import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { mockApiUrl, resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";

const reference = "40000000-0000-4000-8000-000000000040";
const receiptUrl = `/payment#reference=${reference}`;

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
    test.describe(`payment result at ${viewport.width}px`, () => {
        test.use({ viewport });
        test.beforeEach(async ({ page, request }) => {
            await resetMockApi(request);
            await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
        });

        for (const [status, title] of [
            ["success", "Оплата успішна"], ["hold", "Оплату підтверджено"],
            ["delivered", "Оплата успішна"], ["init", "Оплата ще очікується"],
            ["failure", "Оплата не завершена"], ["reversed", "Оплату скасовано"],
            ["expired", "Оплата не завершена"], ["unknown", "Оплату не підтверджено"],
        ]) {
            test(`shows trusted ${status} without repeating invoice creation`, async ({ page, request }, info) => {
                await request.post(`${mockApiUrl}/__control/payment`, { data: { status } });
                await page.goto(receiptUrl);
                await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
                await expect(page.getByText("TEST-ORDER-40", { exact: true })).toBeVisible();
                await expect(page.getByText("180 грн", { exact: true })).toBeVisible();
                await expectNoA11yViolations(page, `payment ${status}`);
                expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
                if (process.env.ZVY40_EVIDENCE === "after" && ["success", "init", "failure", "reversed", "unknown"].includes(status)) {
                    const directory = path.join(process.cwd(), "docs/payment-recovery/after");
                    await mkdir(directory, { recursive: true });
                    await page.evaluate(() => document.fonts.ready);
                    const filename = path.join(directory, `${status}-${viewport.width}x${viewport.height}.png`);
                    await page.screenshot({ path: filename, animations: "disabled", caret: "hide" });
                    await info.attach(status, { path: filename, contentType: "image/png" });
                }
                await page.reload();
                await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
                expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
            });
        }

        test("ignores asserted success in the URL and missing or unknown references", async ({ page, request }) => {
            await page.goto("/payment?status=success");
            await expect(page.getByRole("heading", { name: "Оплату не підтверджено", exact: true })).toBeVisible();
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).paymentStatusRequests).toBe(0);
            await page.goto("/payment#reference=50000000-0000-4000-8000-000000000040&status=success");
            await expect(page.getByRole("heading", { name: "Оплату не підтверджено", exact: true })).toBeVisible();
            await expect(page.getByText("Номер замовлення")).toHaveCount(0);
        });

        test("allows keyboard status recheck when the trusted callback arrives later", async ({ page, request }) => {
            await page.goto(receiptUrl);
            await expect(page.getByRole("heading", { name: "Оплата ще очікується", exact: true })).toBeVisible();
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "success" } });
            const button = page.getByRole("button", { name: "Перевірити статус", exact: true });
            await button.focus();
            await page.keyboard.press("Enter");
            await expect(page.getByRole("heading", { name: "Оплата успішна", exact: true })).toBeVisible();
            await expect(page.getByRole("heading", { name: "Оплата успішна", exact: true })).toBeFocused();
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
        });

        test("never shows a previous receipt for a replacement reference", async ({ page, request }) => {
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "success" } });
            await page.goto(receiptUrl);
            await expect(page.getByRole("heading", { name: "Оплата успішна", exact: true })).toBeVisible();
            await page.evaluate(() => { location.hash = "reference=50000000-0000-4000-8000-000000000040"; });
            await expect(page.getByRole("heading", { name: "Оплату не підтверджено", exact: true })).toBeVisible();
            await expect(page.getByText("TEST-ORDER-40", { exact: true })).toHaveCount(0);
            await page.evaluate(() => { location.hash = "reference=invalid"; });
            await expect(page.getByRole("heading", { name: "Оплату не підтверджено", exact: true })).toBeVisible();
            await expect(page.getByText("Номер замовлення")).toHaveCount(0);
        });

        test("does not steal focus when an automatic poll succeeds after a pending manual check", async ({ page, request }) => {
            await page.goto(receiptUrl);
            const button = page.getByRole("button", { name: "Перевірити статус", exact: true });
            await expect(button).toBeEnabled();
            await button.focus();
            const checked = page.waitForResponse(response => response.url().includes(`/api/invoice/status/${reference}`));
            await page.keyboard.press("Enter");
            await checked;
            await expect(button).toBeEnabled();
            const storeLink = page.getByRole("link", { name: "Повернутися до магазину", exact: true });
            await storeLink.focus();
            await request.post(`${mockApiUrl}/__control/payment`, { data: { status: "success" } });
            await expect(page.getByRole("heading", { name: "Оплата успішна", exact: true })).toBeVisible();
            await expect(storeLink).toBeFocused();
        });
    });
}
