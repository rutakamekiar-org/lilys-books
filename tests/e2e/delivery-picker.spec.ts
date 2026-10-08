import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { mockApiUrl, resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";

const widgetUrl = "https://widget.novapost.com/division/index.html";
const noteLabel = "Коментар до замовлення (необов’язково)";
const note = "  Зателефонуйте перед відправленням  ";
const branches = [17, 23].map(number => ({
  id: `test-department-${number}`, shortName: `Відділення №${number}`,
  address: `Київ, вул. Тестова, ${number}`,
  addressParts: { city: "Київ", street: "Тестова", building: `${number}` },
}));
type ProviderState = "loading" | "loaded" | "empty" | "failure";
const providerStates: ProviderState[] = ["loading", "loaded", "empty", "failure"];
const picker = (page: Page) => page.getByRole("dialog", { name: "Вибрати відділення", exact: true });
const checkout = (page: Page) => page.getByRole("dialog", { name: "Оформлення замовлення", exact: true });
const opener = (page: Page) => checkout(page).getByRole("button", { name: /Відділення Нової Пошти/ });
const close = (page: Page) => picker(page).getByRole("button", { name: "Закрити", exact: true });

function providerHtml(state: ProviderState) {
  const content = state === "empty" ? "<p>Відділень не знайдено</p>" : branches.map(branch =>
    `<button onclick='parent.postMessage(${JSON.stringify(branch)}, "http://127.0.0.1:3100")'>Обрати ${branch.shortName}</button>`).join("");
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Controlled provider</title>
    <style>body{margin:0;font:16px sans-serif;background:#fff}main{padding:16px}h2{font-size:2em;margin:.67em 0}button{display:block;padding:12px;margin:12px 0} .space{height:1200px}</style></head>
    <body><main aria-label="Тестовий провайдер"><h2>Тестовий вибір відділення</h2>${content}<div class="space"></div><p>Кінець тестових результатів</p></main></body></html>`;
}

async function mockProvider(page: Page, state: ProviderState) {
  await page.unroute(widgetUrl);
  // Keep navigation genuinely pending for the loading case. Closing the iframe
  // cancels it; no live carrier request is made in any scenario.
  await page.route(widgetUrl, async route => {
    if (state === "loading") await new Promise<void>(resolve => page.once("close", () => resolve()));
    else if (state === "failure") await route.abort("failed");
    else await route.fulfill({ contentType: "text/html; charset=utf-8", body: providerHtml(state) });
  });
}

async function setup(page: Page) {
  await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
    ? route.continue() : route.abort());
  await mockProvider(page, "loaded");
  await page.goto("/books/test-book");
  await page.getByRole("button", { name: /Купити/ }).click();
  const cart = page.getByRole("dialog", { name: "Кошик", exact: true });
  await cart.getByRole("button", { name: "Оформити замовлення" }).click();
  await checkout(page).getByLabel(/Ім.я \*/).fill("Леся");
  await checkout(page).getByLabel(/Прізвище \*/).fill("Українка");
  await checkout(page).getByLabel("Email *").fill("lesya@example.com");
  await checkout(page).getByLabel("Телефон *").fill("+380501234567");
  await checkout(page).getByLabel(noteLabel).fill(note);
}

async function choose(page: Page, index: number) {
  await opener(page).click();
  await page.frameLocator('iframe[title="Nova Poshta Widget"]')
    .getByRole("button", { name: `Обрати ${branches[index].shortName}`, exact: true }).click();
  await expect(picker(page)).toHaveCount(0);
  await expect(opener(page)).toBeFocused();
}

async function expectDetails(page: Page, branch?: typeof branches[number]) {
  await expect(checkout(page)).toBeVisible();
  await expect(checkout(page).getByLabel(/Ім.я \*/)).toHaveValue("Леся");
  await expect(checkout(page).getByLabel(/Прізвище \*/)).toHaveValue("Українка");
  await expect(checkout(page).getByLabel("Email *")).toHaveValue("lesya@example.com");
  await expect(checkout(page).getByLabel("Телефон *")).toHaveValue("+380501234567");
  await expect(checkout(page).getByLabel(noteLabel)).toHaveValue(note);
  await expect(checkout(page).getByText("Всього до сплати:").locator("..")).toHaveText("Всього до сплати:350 грн");
  await expect(opener(page)).toContainText(branch?.shortName ?? "Обрати відділення або поштомат");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]").map((item: { itemId: string; quantity: number }) =>
    ({ itemId: item.itemId, quantity: item.quantity })))).toEqual([{ itemId: "11000000-0000-4000-8000-000000000001", quantity: 1 }]);
}

async function expectLayout(page: Page, width: number) {
  await expect(close(page)).toBeVisible();
  const header = picker(page).getByRole("heading", { level: 2 }).locator("..");
  const panel = header.locator("..");
  const frame = picker(page).locator("iframe");
  const [headerBox, panelBox, frameBox, closeBox] = await Promise.all([header.boundingBox(), panel.boundingBox(), frame.boundingBox(), close(page).boundingBox()]);
  expect(headerBox).not.toBeNull();
  expect(frameBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 1);
  expect(frameBox!.y + frameBox!.height).toBeLessThanOrEqual(panelBox!.y + panelBox!.height + 1);
  expect(closeBox!.x).toBeGreaterThanOrEqual(0);
  expect(closeBox!.x + closeBox!.width).toBeLessThanOrEqual(width);
  expect(closeBox!.y + closeBox!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  expect(await panel.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (width <= 640) {
    expect(closeBox!.width).toBeGreaterThanOrEqual(44);
    expect(closeBox!.height).toBeGreaterThanOrEqual(44);
    expect(panelBox!.y).toBeCloseTo(56, 0);
    expect(await panel.evaluate(node => getComputedStyle(node).borderTopLeftRadius)).toBe("18px");
  }
}

async function capture(page: Page, info: TestInfo, state: ProviderState) {
  const phase = process.env.ZVY68_EVIDENCE_PHASE;
  if (!phase) return;
  if (phase !== "before" && phase !== "after") throw new Error("Unknown evidence phase");
  const directory = path.join(process.cwd(), "docs/delivery-picker", phase);
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  const viewport = page.viewportSize()!;
  const filename = path.join(directory, `SCR-05-delivery-picker-${state}-${viewport.width}x${viewport.height}.jpg`);
  await page.screenshot({ path: filename, type: "jpeg", quality: 85, animations: "disabled", caret: "hide" });
  await info.attach(state, { path: filename, contentType: "image/jpeg" });
}

async function swipe(page: Page, header: Locator, distance: number, duration = 0, cancel = false) {
  const box = (await header.boundingBox())!;
  const session = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + 12;
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 5; step++) {
    if (duration) await new Promise(resolve => setTimeout(resolve, duration / 5));
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + distance * step / 5 }] });
  }
  await session.send("Input.dispatchTouchEvent", { type: cancel ? "touchCancel" : "touchEnd", touchPoints: [] });
  await session.detach();
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
  test.describe(`delivery picker at ${viewport.width}px`, () => {
    test.use({ viewport, hasTouch: viewport.width < 640 });
    test.beforeEach(async ({ page, request }) => { await resetMockApi(request); await setup(page); });

    test("capture controlled loading, loaded, empty and failure evidence", async ({ page }, info) => {
      test.skip(!process.env.ZVY68_EVIDENCE_PHASE, "Explicit evidence run only");
      const visibleExits: boolean[] = [];
      for (const state of providerStates) {
        await mockProvider(page, state);
        const navigation = state === "failure" ? page.waitForEvent("requestfailed", request => request.url() === widgetUrl) : page.waitForRequest(widgetUrl);
        await opener(page).click();
        await navigation;
        if (state === "loaded" || state === "empty") await expect(page.frameLocator('iframe[title="Nova Poshta Widget"]').getByRole("heading")).toBeVisible();
        await capture(page, info, state);
        visibleExits.push(await close(page).isVisible());
        // Escape is a host event here, deliberately not a provider keyboard test.
        await page.keyboard.press("Escape");
        await expect(picker(page)).toHaveCount(0);
      }
      expect(visibleExits).toEqual([true, true, true, true]);
    });

    for (const state of providerStates) {
      for (const prior of [false, true]) {
        test(`${state}: Close preserves ${prior ? "the previous branch" : "an empty selection"} and checkout`, async ({ page, request }) => {
          if (prior) await choose(page, 0);
          await mockProvider(page, state);
          const navigation = state === "failure" ? page.waitForEvent("requestfailed", request => request.url() === widgetUrl) : page.waitForRequest(widgetUrl);
          await opener(page).click();
          await navigation;
          if (state === "loaded" || state === "empty") await expect(page.frameLocator('iframe[title="Nova Poshta Widget"]').getByRole("heading")).toBeVisible();
          await expectLayout(page, viewport.width);
          await close(page).click();
          await expect(picker(page)).toHaveCount(0);
          await expect(opener(page)).toBeFocused();
          await expectDetails(page, prior ? branches[0] : undefined);
          expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
        });
      }
    }

    for (const key of ["Enter", "Space", "Escape"]) {
      test(`${key} on the host exit closes only the picker and restores focus`, async ({ page }) => {
        await choose(page, 0);
        await opener(page).focus();
        await page.keyboard.press("Enter");
        await expect(close(page)).toBeFocused();
        await page.keyboard.press(key);
        await expect(picker(page)).toHaveCount(0);
        await expect(opener(page)).toBeFocused();
        await expectDetails(page, branches[0]);
      });
    }

    test("selecting a replacement updates only delivery and submits the current items and details", async ({ page, request }) => {
      await choose(page, 0);
      await choose(page, 1);
      await mockProvider(page, "empty");
      await opener(page).click();
      await close(page).click();
      await expectDetails(page, branches[1]);
      await page.route("https://example.invalid/**", route => route.fulfill({ contentType: "text/html", body: "<p>Mock payment handoff</p>" }));
      await checkout(page).getByRole("button", { name: "Підтвердити замовлення" }).click();
      await expect(page).toHaveURL("https://example.invalid/test-payment");
      const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
      expect(state.invoiceRequests).toBe(1);
      expect(state.lastInvoiceRequest).toEqual({
        customer: { firstName: "Леся", lastName: "Українка", email: "lesya@example.com", phone: "+380501234567", department: branches[1] },
        items: [{ productId: "11000000-0000-4000-8000-000000000001", quantity: 1 }], orderNote: note.trim(),
      });
    });

    test("host dialog accessibility", async ({ page }) => {
      await opener(page).click();
      await expect(close(page)).toBeFocused();
      await expectNoA11yViolations(page, "the delivery picker with a controlled provider");
    });

    if (viewport.width < 640) {
      test("scrolling controlled iframe content does not dismiss the host sheet", async ({ page }) => {
        await opener(page).click();
        const frame = page.frameLocator('iframe[title="Nova Poshta Widget"]');
        await expect(frame.getByRole("heading")).toBeVisible();
        const header = picker(page).getByRole("heading", { level: 2 }).locator("..");
        const panel = header.locator("..");
        const frameBox = (await picker(page).locator("iframe").boundingBox())!;
        const session = await page.context().newCDPSession(page);
        const x = frameBox.x + frameBox.width / 2;
        const y = frameBox.y + frameBox.height - 80;
        await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
        await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - 200 }] });
        await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await session.detach();
        await expect.poll(() => frame.getByRole("main").evaluate(node => node.ownerDocument.scrollingElement!.scrollTop)).toBeGreaterThan(0);
        await expect(picker(page)).toBeVisible();
        expect((await panel.boundingBox())!.y).toBeCloseTo(56, 0);
        await expect(close(page)).toBeVisible();
      });

      test("shared sheet gestures, cancellation, reduced motion and backdrop return to checkout", async ({ page }) => {
        await choose(page, 0);
        await opener(page).click();
        const header = picker(page).getByRole("heading", { level: 2 }).locator("..");
        const panel = header.locator("..");
        await swipe(page, header, 30);
        await expect(picker(page)).toBeVisible();
        await swipe(page, header, 110, 600);
        await expect(picker(page)).toBeVisible();
        await swipe(page, header, 120, 400, true);
        await expect(picker(page)).toBeVisible();
        await expect.poll(async () => Math.abs((await panel.boundingBox())!.y - 56)).toBeLessThan(1);
        await swipe(page, header, (await panel.boundingBox())!.height * .3, 700);
        await expect(picker(page)).toHaveCount(0);
        await expect(opener(page)).toBeFocused();
        await expectDetails(page, branches[0]);
        await opener(page).click();
        await page.mouse.click(8, 20);
        await expect(picker(page)).toHaveCount(0);
        await expect(opener(page)).toBeFocused();
        await page.emulateMedia({ reducedMotion: "reduce" });
        await opener(page).click();
        expect(await panel.evaluate(node => getComputedStyle(node).transitionDuration)).toBe("0s");
        await swipe(page, header, 90);
        await expect(picker(page)).toHaveCount(0);
        await expect(opener(page)).toBeFocused();
        await expectDetails(page, branches[0]);
      });
    }
  });
}

test("host exit remains available around both responsive breakpoints", async ({ page, request }) => {
  await resetMockApi(request);
  await setup(page);
  await opener(page).click();
  for (const width of [320, 640, 641, 767, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    await expectLayout(page, width);
  }
  await close(page).click();
  await expect(opener(page)).toBeFocused();
});
