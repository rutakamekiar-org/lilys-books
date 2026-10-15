import { test, expect, type Page } from "@playwright/test";
import { mockApiUrl, resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";

const digitalId = "11000000-0000-4000-8000-000000000002";
const paperId = "11000000-0000-4000-8000-000000000001";
const cart = (page: Page) => page.getByRole("dialog", { name: "Кошик", exact: true });
const checkout = (page: Page) => page.getByRole("dialog", { name: "Оформлення замовлення", exact: true });

async function isolate(page: Page) {
    await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
    await page.route("https://example.invalid/**", route => route.fulfill({ contentType: "text/html", body: "<p>Controlled payment handoff</p>" }));
}

async function addBook(page: Page, format: RegExp) {
    await page.goto("/books/test-book");
    await page.getByRole("radio", { name: format }).check();
    await page.getByRole("button", { name: /Купити/ }).click();
}

async function handoff(page: Page) {
    await addBook(page, /Електронна/);
    await cart(page).getByRole("button", { name: "Оформити замовлення", exact: true }).click();
    await checkout(page).getByLabel(/Ім.я \*/).fill("Леся");
    await checkout(page).getByLabel(/Прізвище \*/).fill("Українка");
    await checkout(page).getByLabel("Email *").fill("lesya@example.com");
    await checkout(page).getByRole("button", { name: "Підтвердити замовлення", exact: true }).click();
    await expect(page).toHaveURL("https://example.invalid/test-payment");
}

async function selections(page: Page) {
    return page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]").map((item: { itemId: string; quantity: number }) => ({ itemId: item.itemId, quantity: item.quantity })));
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
    test.describe(`payment returns at ${viewport.width}px`, () => {
        test.use({ viewport });
        test.beforeEach(async ({ page, request }) => {
            await resetMockApi(request);
            await isolate(page);
        });

        test("success return thanks the customer and clears the cart", async ({ page, request }) => {
            await handoff(page);
            await page.goto("/payment/success");
            await expect(page.getByRole("heading", { name: "Дякуємо за покупку!", exact: true })).toBeVisible();
            await expect.poll(() => selections(page)).toEqual([]);
            await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
            await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
            await expectNoA11yViolations(page, "payment success");
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            await page.reload();
            expect(await selections(page)).toEqual([]);
            expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(1);
        });

        test("failure return keeps the cart and opens it from the keyboard", async ({ page }) => {
            await handoff(page);
            await page.goto("/payment/failure");
            await expect(page.getByRole("heading", { name: "Оплату не завершено", exact: true })).toBeVisible();
            expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
            await expectNoA11yViolations(page, "payment failure");
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            const button = page.getByRole("button", { name: "Переглянути кошик", exact: true });
            await button.focus();
            await page.keyboard.press("Enter");
            await expect(cart(page).getByText("Test Book", { exact: true })).toBeVisible();
            await page.keyboard.press("Escape");
            await expect(button).toBeFocused();
            await page.reload();
            expect(await selections(page)).toEqual([{ itemId: digitalId, quantity: 1 }]);
        });

        test("a success return in a new tab clears the cart in the original tab too", async ({ page, context }) => {
            await handoff(page);
            await page.goto("/books/test-book");
            const returnTab = await context.newPage();
            await isolate(returnTab);
            await returnTab.goto("/payment/success");
            await expect(returnTab.getByRole("heading", { name: "Дякуємо за покупку!", exact: true })).toBeVisible();
            await expect.poll(() => selections(returnTab)).toEqual([]);
            // The original tab must not write the purchased book back when its cart changes.
            await page.getByRole("radio", { name: /Паперова/ }).check();
            await page.getByRole("button", { name: /Купити/ }).click();
            await expect.poll(() => selections(page)).toEqual([{ itemId: paperId, quantity: 1 }]);
        });
    });
}
