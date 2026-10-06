import { expect, test, type Page, type Locator } from "@playwright/test";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

async function swipe(page: Page, header: Locator, distance: number, startOffset = 12, duration = 0, cancel = false) {
  const box = (await header.boundingBox())!;
  const session = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + startOffset;
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 5; step++) {
    if (duration) await new Promise(resolve => setTimeout(resolve, duration / 5));
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + distance * step / 5 }] });
  }
  await session.send("Input.dispatchTouchEvent", { type: cancel ? "touchCancel" : "touchEnd", touchPoints: [] });
  await session.detach();
}

test.beforeEach(async ({ request }) => { await resetMockApi(request); });

for (const width of [360, 390]) {
  test.describe(`sheet dismissal ${width}`, () => {
    test.use({ viewport: { width, height: 844 }, hasTouch: true });
    for (const kind of ["cart", "excerpt"]) {
      test(`${kind}: short drags stay open; downward swipes and backdrop taps close and restore focus`, async ({ page }) => {
        await page.goto(kind === "cart" ? "/books/test-book" : "/books/brunette-stories");
        const opener = kind === "cart"
          ? page.getByRole("button", { name: "Купити — 350 грн", exact: true })
          : page.getByRole("button", { name: "Читати уривок", exact: true });
        await opener.click();
        const dialog = page.getByRole("dialog", { name: kind === "cart" ? "Кошик" : /Читати уривок/, exact: kind === "cart" });
        const heading = dialog.getByRole("heading", { level: 2 }).first();
        const header = heading.locator("..");
        const panel = header.locator("..");
        if (kind === "excerpt") {
          const subtitle = heading.locator("span").last();
          expect(await subtitle.evaluate(node => getComputedStyle(node).display)).toBe("block");
          expect(await subtitle.evaluate(node => parseFloat(getComputedStyle(node).fontSize)))
            .toBeLessThan(await heading.evaluate(node => parseFloat(getComputedStyle(node).fontSize)));
        }
        const originalTop = (await panel.boundingBox())!.y;
        await swipe(page, header, 30);
        await expect(dialog).toBeVisible();
        await swipe(page, header, 110, 12, 600);
        await expect(dialog).toBeVisible();
        expect(await panel.evaluate(node => getComputedStyle(node).transitionDuration)).toBe("0.18s");
        await expect.poll(async () => Math.abs((await panel.boundingBox())!.y - originalTop)).toBeLessThan(1);
        await swipe(page, header, 120, 12, 400, true);
        await expect(dialog).toBeVisible();
        await expect.poll(async () => Math.abs((await panel.boundingBox())!.y - originalTop)).toBeLessThan(1);
        await swipe(page, header, (await panel.boundingBox())!.height * .3, 12, 700);
        await expect(dialog).toBeVisible();
        expect(await panel.evaluate(node => node.getAnimations().some(animation => animation.playState === "running"))).toBe(true);
        await expect(dialog).toBeHidden();
        const returningOpener = kind === "cart" ? page.getByRole("button", { name: "Переглянути кошик", exact: true }) : opener;
        await expect(returningOpener).toBeFocused();
        await returningOpener.click();
        await swipe(page, header, 90);
        await expect(dialog).toBeHidden();
        await expect(returningOpener).toBeFocused();
        await page.emulateMedia({ reducedMotion: "reduce" });
        await returningOpener.click();
        await swipe(page, header, 110, 12, 600);
        await expect(dialog).toBeVisible();
        expect(await panel.evaluate(node => getComputedStyle(node).transitionDuration)).toBe("0s");
        await page.keyboard.press("Escape");
        await returningOpener.click();
        await page.mouse.click(8, 20);
        await expect(dialog).toBeHidden();
        await expect(returningOpener).toBeFocused();
      });
    }
    test("swiping excerpt text scrolls the reading region without closing the sheet", async ({ page, request }) => {
      await request.post(`${mockApiUrl}/__control/products`, { data: makeProduct({ slug: "zvychajna", hasExcerpt: true }) });
      await page.goto("/books/zvychajna");
      await page.getByRole("button", { name: "Читати уривок", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: /Читати уривок/ });
      const text = dialog.getByRole("region", { name: "Текст уривку", exact: true });
      await expect(text.getByText("Завантаження...", { exact: true })).toBeHidden();
      await swipe(page, text, -120, 200);
      await expect.poll(() => text.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
      await expect(dialog).toBeVisible();
    });
  });
}

test("desktop Add to cart adds once without opening any dialog; Buy opens the cart", async ({ page }) => {
  await page.goto("/books/test-book");
  await expect(page.getByRole("link", { name: "Назад до книг" })).toHaveCount(0);
  await page.getByRole("button", { name: "Додати в кошик", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Вже в кошику", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Кошик, 1 товарів", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Купити — 350 грн", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Кошик", exact: true })).toBeVisible();
  const items = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") ?? "[]"));
  expect(items).toHaveLength(1);
  expect(items[0].quantity).toBe(1);
});
