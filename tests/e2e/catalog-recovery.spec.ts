import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { mockApiUrl, resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";

async function catalog(request: APIRequestContext, state: string) {
  expect((await request.post(`${mockApiUrl}/__control/catalog`, { data: { state } })).ok()).toBe(true);
  expect((await request.post("/api/revalidate", {
    headers: { "x-revalidation-secret": "zvy11-test-secret" },
    data: { slug: "zvychajna" },
  })).ok()).toBe(true);
}

async function screenshot(page: Page, stem: string) {
  const phase = process.env.ZVY72_EVIDENCE_PHASE;
  if (!phase) return;
  if (!["before", "after"].includes(phase)) throw new Error("Unknown evidence phase");
  const directory = path.join(process.cwd(), "docs/catalog-recovery", phase);
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(directory, `${stem}.jpg`), type: "jpeg", quality: 85, fullPage: true, animations: "disabled" });
}

test.beforeEach(async ({ page, request }) => {
  await resetMockApi(request);
  await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
    ? route.continue() : route.abort());
});

for (const width of [1440, 390, 360]) {
  test.describe(`catalog recovery at ${width}px`, () => {
    test.use({ viewport: { width, height: width === 1440 ? 900 : 844 } });
    for (const route of ["/", "/books"]) {
      const screen = route === "/" ? "home" : "catalog";
      const stem = `${screen}-${width}x${width === 1440 ? 900 : 844}`;

      test(`${screen} records cold failure and successful empty evidence`, async ({ page, request }) => {
        test.skip(!process.env.ZVY72_EVIDENCE_PHASE, "Evidence capture is opt-in.");
        for (const state of ["error", "empty"]) {
          await catalog(request, state);
          await page.goto(route);
          await expect(page.getByRole("article")).toHaveCount(0);
          if (process.env.ZVY72_EVIDENCE_PHASE === "before") {
            if (route === "/books") await expect(page.getByText("Поки що немає книг для відображення.")).toBeVisible();
            else await expect(page.locator("main h1")).toHaveCount(0);
          } else {
            if (state === "error") await expect(page.getByRole("button", { name: "Спробувати ще раз" })).toBeEnabled();
            else await expect(page.getByText("Поки що немає книг для відображення.")).toBeVisible();
          }
          await screenshot(page, `${stem}-${state}`);
        }
      });

      test(`${screen} distinguishes a cold failure and recovers once through retry`, async ({ page, request }) => {
        await catalog(request, "error");
        await page.goto(route);
        const error = page.getByRole("heading", { name: "Не вдалося завантажити книги" });
        const retry = page.getByRole("button", { name: "Спробувати ще раз" });
        await expect(error).toBeVisible();
        await expect(retry).toBeEnabled();
        await expect(page.getByText("Поки що немає книг для відображення.")).toHaveCount(0);
        await expect(page.locator("body")).not.toContainText(/internal service|Simulated catalog|Request failed|invalid internal/);
        await expect(page.getByRole("navigation", { name: "Основна навігація" })).toBeVisible();
        await expectNoA11yViolations(page, `${screen} catalog failure at ${width}px`);

        let release!: () => void;
        let started!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const received = new Promise<void>(resolve => { started = resolve; });
        let requests = 0;
        await request.post(`${mockApiUrl}/__control/catalog`, { data: { state: "ready" } });
        await page.route("**/api/products", async intercepted => {
          requests += 1;
          started();
          await gate;
          await intercepted.continue();
        });
        await retry.focus();
        await page.keyboard.press("Enter");
        await received;
        await expect(page.getByRole("status")).toHaveText("Завантажуємо книги…");
        await expect(page.getByRole("button", { name: "Завантажуємо…" })).toBeDisabled();
        await expect(error).toHaveCount(0);
        // A second click and a foreground refresh cannot start another request.
        await page.getByRole("button", { name: "Завантажуємо…" }).dispatchEvent("click");
        await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
        await screenshot(page, `${stem}-loading`);
        expect(requests).toBe(1);
        release();
        if (route === "/books") await expect(page.getByRole("article").first()).toBeVisible();
        else await expect(page.getByRole("link", { name: "Детальніше", exact: true })).toBeVisible();
        await expect(error).toHaveCount(0);
        await expect(page.getByRole("status")).toHaveCount(0);
        await expect(retry).toHaveCount(0);
        await screenshot(page, `${stem}-recovered`);
        await expect(page.locator("main")).toContainText("грн");
        if (route === "/books") {
          const offer = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Test Book", exact: true }) });
          await expect(offer.getByText("350 грн", { exact: true })).toBeVisible();
          await expect(offer.getByText("180 грн", { exact: true })).toBeVisible();
          await offer.getByRole("button", { name: "Додати в кошик: Паперова, Test Book", exact: true }).click();
          await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]")
            .map((item: { itemId: string; quantity: number }) => ({ itemId: item.itemId, quantity: item.quantity }))))
            .toEqual([{ itemId: "11000000-0000-4000-8000-000000000001", quantity: 1 }]);
        } else await expect(page.getByText("Від 180 грн", { exact: true })).toBeVisible();
        expect(requests).toBe(1);
        const state = await request.get(`${mockApiUrl}/__control/state`);
        expect(state.ok()).toBe(true);
        expect((await state.json()).invoiceRequests).toBe(0);
      });

      test(`${screen} shows a successful empty catalog separately from loading`, async ({ page, request }) => {
        await catalog(request, "empty");
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        await page.route("**/api/products", async intercepted => { await gate; await intercepted.continue(); });
        await page.goto(route);
        await expect(page.getByRole("status")).toHaveText("Завантажуємо книги…");
        await expect(page.getByText("Поки що немає книг для відображення.")).toHaveCount(0);
        release();
        await expect(page.getByText("Поки що немає книг для відображення.")).toBeVisible();
        await expect(page.getByRole("button", { name: "Спробувати ще раз" })).toHaveCount(0);
        await expect(page.getByRole("status")).toHaveCount(0);
        await expect(page.getByRole("navigation", { name: "Основна навігація" })).toBeVisible();
        await expectNoA11yViolations(page, `${screen} empty at ${width}px`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      });
    }
  });
}

for (const route of ["/", "/books"]) {
  test(`${route} renders a safe cold error before hydration`, async ({ request }) => {
    await catalog(request, "error");
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain("Не вдалося завантажити книги");
    expect(html).toContain("Спробувати ще раз");
    expect(html).not.toContain("Поки що немає книг для відображення.");
    expect(html).not.toMatch(/Simulated catalog|internal service|Request failed/);
  });

  test(`${route} keeps a malformed response recoverable and clears error on an empty retry`, async ({ page, request }) => {
    await catalog(request, "malformed");
    await page.goto(route);
    const retry = page.getByRole("button", { name: "Спробувати ще раз" });
    await expect(retry).toBeEnabled();
    await expect(page.locator("body")).not.toContainText(/invalid internal|invalid data|ZodError/);
    const failedRetry = page.waitForResponse(response => response.url() === `${mockApiUrl}/api/products`);
    await retry.click();
    await failedRetry;
    await expect(retry).toBeEnabled();
    await expect(page.getByText("Поки що немає книг для відображення.")).toHaveCount(0);
    await request.post(`${mockApiUrl}/__control/catalog`, { data: { state: "empty" } });
    await retry.click();
    await expect(page.getByText("Поки що немає книг для відображення.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Не вдалося завантажити книги" })).toHaveCount(0);
    await expect(retry).toHaveCount(0);
  });

  test(`${route} can retry a disconnected browser request`, async ({ page, request }) => {
    await catalog(request, "empty");
    await page.route("**/api/products", intercepted => intercepted.abort("failed"));
    await page.goto(route);
    const retry = page.getByRole("button", { name: "Спробувати ще раз" });
    await expect(retry).toBeEnabled();
    await expect(page.getByText("Поки що немає книг для відображення.")).toHaveCount(0);
    await request.post(`${mockApiUrl}/__control/catalog`, { data: { state: "ready" } });
    await page.unroute("**/api/products");
    await retry.click();
    if (route === "/books") await expect(page.getByRole("article").first()).toBeVisible();
    else await expect(page.getByRole("link", { name: "Детальніше", exact: true })).toBeVisible();
    await expect(retry).toHaveCount(0);
  });

  test(`${route} preserves existing warm offers through a background failure`, async ({ page, request }) => {
    await catalog(request, "ready");
    const initialRefresh = page.waitForResponse(response => response.url() === `${mockApiUrl}/api/products`);
    await page.goto(route);
    await initialRefresh;
    await expect(page.getByRole("heading", { name: /Test Book/, exact: false }).first()).toBeVisible();
    await request.post(`${mockApiUrl}/__control/catalog`, { data: { state: "error" } });
    const refresh = page.waitForResponse(response => response.url() === `${mockApiUrl}/api/products` && response.status() === 503);
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await refresh;
    await expect(page.getByRole("heading", { name: /Test Book/, exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Спробувати ще раз" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Не вдалося завантажити книги" })).toHaveCount(0);
  });
}
