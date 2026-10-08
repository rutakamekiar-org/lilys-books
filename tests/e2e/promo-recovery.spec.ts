import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";

const itemId = "31000000-0000-4000-8000-000000000001";
const product = makeProduct({ name: "Звичайна. Перша частина дилогії", slug: "zvychajna", items: [{
  id: itemId, name: "Паперова Звичайна", type: 1, format: 1, isAvailable: true,
  canPreorder: false, price: 499, discountPrice: 399, currency: "UAH", note: null,
}] });
const promo = { code: "AUDIT10", type: 1, value: 10, applicableProductItemIds: null, remainingUsages: null };
const invalid = "Невірний або недійсний промокод";
const temporary = "Не вдалося перевірити промокод через тимчасову помилку. Спробуйте ще раз.";
const cart = (page: Page) => page.getByRole("dialog", { name: "Кошик", exact: true });
const input = (page: Page) => cart(page).getByRole("textbox", { name: "Промокод", exact: true });

async function unchanged(page: Page, selection: unknown) {
  await expect(cart(page).getByText("Всього:", { exact: true }).locator("..")).toHaveText("Всього:798 грн");
  await expect(cart(page).getByText("Знижка:", { exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]"))).toEqual(selection);
  expect(await page.evaluate(() => localStorage.getItem("appliedPromocode"))).toBeNull();
}

async function capture(page: Page, info: TestInfo, state: string, width: number) {
  const phase = process.env.ZVY71_EVIDENCE_PHASE;
  if (!phase) return;
  if (!["before", "after"].includes(phase)) throw new Error("Unknown evidence phase");
  const directory = path.join(process.cwd(), "docs/storefront-promo-recovery", phase);
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  const filename = path.join(directory, `SCR-04-promo-${state}-${width}x${width === 1440 ? 900 : 844}.jpg`);
  // Finishing Toastify animations can dismiss the old feedback during a capture.
  await page.waitForTimeout(400);
  await page.screenshot({ path: filename, type: "jpeg", quality: 85, animations: "allow", caret: "hide" });
  await info.attach(state, { path: filename, contentType: "image/jpeg" });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
  test.describe(`promo recovery at ${viewport.width}px`, () => {
    test.use({ viewport, hasTouch: viewport.width < 640 });
    test.beforeEach(async ({ page, request }) => {
      await resetMockApi(request);
      expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
      await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
        ? route.continue() : route.abort());
      await page.goto(`/books/${product.slug}`);
      await page.getByRole("button", { name: /Купити/ }).click();
      await cart(page).getByRole("button", { name: "Збільшити кількість" }).click();
    });
    test.afterEach(async ({ request }) => {
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    test("records matched controlled loading, invalid, outage and recovered evidence", async ({ page }, info) => {
      test.skip(!process.env.ZVY71_EVIDENCE_PHASE, "Explicit evidence run only");
      let status = 404;
      let release: () => void = () => {};
      const pending = new Promise<void>(resolve => { release = resolve; });
      let calls = 0;
      await page.route("**/api/PromoCode/validate?**", async route => {
        calls += 1;
        if (calls === 1) await pending;
        await route.fulfill({ status, json: status === 200 ? promo : { message: "Controlled promo failure" } });
      });
      await input(page).fill("AUDIT10");
      await cart(page).getByRole("button", { name: "Застосувати", exact: true }).click();
      try {
        await expect(input(page).locator("..").getByRole("button")).toBeDisabled();
        await capture(page, info, "loading", viewport.width);
      } finally { release(); }
      await expect(page.getByRole("alert").filter({ hasText: invalid })).toBeVisible();
      await capture(page, info, "invalid", viewport.width);
      if (process.env.ZVY71_EVIDENCE_PHASE === "before") {
        await expect(page.getByRole("alert").filter({ hasText: invalid })).toBeHidden({ timeout: 8000 });
      }
      status = 503;
      await input(page).press("Enter");
      await expect(page.getByRole("alert").filter({ hasText: process.env.ZVY71_EVIDENCE_PHASE === "before" ? invalid : temporary })).toBeVisible();
      await capture(page, info, "outage", viewport.width);
      if (process.env.ZVY71_EVIDENCE_PHASE === "before") {
        await expect(page.getByRole("alert").filter({ hasText: invalid })).toBeHidden({ timeout: 8000 });
      }
      status = 200;
      await input(page).press("Enter");
      await expect(cart(page).getByText("AUDIT10", { exact: true })).toBeVisible();
      await expect(cart(page).getByText("Всього:", { exact: true }).locator("..")).toHaveText("Всього:718 грн");
      await expect(page.getByRole("alert").filter({ hasText: "Промокод застосовано!" })).toBeHidden({ timeout: 8000 });
      await capture(page, info, "applied", viewport.width);
      expect(calls).toBe(3);
    });

    for (const failure of ["invalid", "expired", "400", "422", "network", "503", "500", "429", "401"] as const) {
      test(`${failure} retains code and amounts, then recovers with unchanged code`, async ({ page }, info) => {
        const selection = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]"));
        let calls = 0;
        let recover = false;
        let releaseRetry: () => void = () => {};
        const pendingRetry = new Promise<void>(resolve => { releaseRetry = resolve; });
        await page.route("**/api/PromoCode/validate?**", async route => {
          calls += 1;
          const url = new URL(route.request().url());
          expect(url.searchParams.get("code")).toBe("AUDIT10");
          expect(url.searchParams.getAll("productItemIds")).toEqual([itemId]);
          if (recover) {
            if (failure === "503") await pendingRetry;
            return route.fulfill({ json: promo });
          }
          if (failure === "network") return route.abort("failed");
          const status = failure === "invalid" || failure === "expired" ? 404 : Number(failure);
          // HTML failure bodies must retain the actual transport status too.
          return route.fulfill({ status, contentType: "text/html", body: failure });
        });
        await input(page).fill("AUDIT10");
        await input(page).press("Enter");
        const rejected = ["invalid", "expired", "400", "422"].includes(failure);
        const feedback = cart(page).getByRole("alert");
        await expect(feedback).toHaveText(rejected ? `${invalid}. Перевірте код або введіть інший.` : temporary);
        await expect(input(page)).toHaveValue("AUDIT10");
        await expect(input(page)).toHaveAttribute("aria-describedby", await feedback.getAttribute("id") ?? "");
        await expect(input(page)).toHaveAttribute("aria-invalid", rejected ? "true" : "false");
        await unchanged(page, selection);
        if (failure === "invalid" || failure === "503") {
          // Both feedback kinds must outlive the previous five-second toast.
          await page.waitForTimeout(5500);
          await expectNoA11yViolations(page, `cart promo ${failure} feedback at ${viewport.width}px`);
        }
        await expect(page.locator(".Toastify__toast--error")).toHaveCount(0);
        await expect(feedback).toBeVisible();
        const button = cart(page).getByRole("button", { name: rejected ? "Застосувати" : "Повторити", exact: true });
        await expect(button).toBeInViewport({ ratio: 1 });
        expect(await cart(page).evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
        expect(await feedback.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
        await cart(page).getByRole("button", { name: "Закрити", exact: true }).click();
        await page.getByRole("button", { name: /^Кошик, / }).click();
        await expect(feedback).toBeVisible();
        recover = true;
        const action = input(page).locator("..").getByRole("button");
        const checkout = cart(page).getByRole("button", { name: "Оформити замовлення", exact: true });
        const checkoutBackground = await checkout.evaluate(node => getComputedStyle(node).backgroundColor);
        if (failure === "503") {
          expect(await action.evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(checkoutBackground);
        }
        await button.click();
        if (failure === "503") {
          try {
            await expect(action).toBeDisabled();
            await expect(action).toHaveAccessibleName("Перевіряємо промокод");
            await expect(action.locator("svg")).toBeVisible();
            await expect(input(page)).toHaveAttribute("readonly", "");
            expect(await action.evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(checkoutBackground);
            const bounds = (await action.boundingBox())!;
            await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
            await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
            await input(page).press("Enter");
            await expect.poll(() => calls).toBe(2);
            await unchanged(page, selection);
            if (process.env.ZVY71_EVIDENCE_PHASE === "after") await capture(page, info, "retry-loading", viewport.width);
          } finally { releaseRetry(); }
        }
        await expect(cart(page).getByText("AUDIT10", { exact: true })).toBeVisible();
        await expect(feedback).toHaveCount(0);
        await expect(cart(page).getByText("Всього:", { exact: true }).locator("..")).toHaveText("Всього:718 грн");
        expect(calls).toBe(2);
        await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]"))).toEqual(selection);
        await cart(page).getByRole("button", { name: "Закрити", exact: true }).click();
        await page.reload();
        await page.getByRole("button", { name: /^Кошик, / }).click();
        await expect(cart(page).getByText("AUDIT10", { exact: true })).toBeVisible();
        expect(calls).toBe(2); // Existing stored promos are not revalidated on refresh.
      });
    }

    test("loading blocks repeated Enter and correction clears stale feedback", async ({ page }) => {
      const selection = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]"));
      let calls = 0;
      let release: () => void = () => {};
      const pending = new Promise<void>(resolve => { release = resolve; });
      await page.route("**/api/PromoCode/validate?**", async route => {
        calls += 1;
        if (calls === 1) await pending;
        return route.fulfill({ status: 404, json: { message: "Invalid code" } });
      });
      const apply = input(page).locator("..").getByRole("button");
      await expect(apply).toBeDisabled();
      await input(page).fill("   ");
      await input(page).press("Enter");
      expect(calls).toBe(0);
      await input(page).fill("AUDIT10");
      await input(page).press("Enter");
      try {
        await expect(apply).toBeDisabled();
        await expect(apply).toHaveAccessibleName("Перевіряємо промокод");
        await expect(input(page)).toHaveAttribute("readonly", "");
        await input(page).press("x");
        await expect(input(page)).toHaveValue("AUDIT10");
        await input(page).press("Enter");
        await input(page).press("Enter");
        await expect.poll(() => calls).toBe(1);
        await unchanged(page, selection);
      } finally { release(); }
      await expect(cart(page).getByRole("alert")).toBeVisible();
      await input(page).fill("CORRECTED");
      await expect(cart(page).getByRole("alert")).toHaveCount(0);
      await expect(apply).toBeEnabled();
      await input(page).press("Tab");
      await expect(apply).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(cart(page)).toHaveCount(0);
    });
  });
}
