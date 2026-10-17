import { expect, test, type Locator, type Page } from "@playwright/test";
import { resetMockApi } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

async function openCart(page: Page, scrollY = 0): Promise<Locator> {
  await page.goto("/books/test-book");
  if (scrollY) {
    await page.evaluate(y => window.scrollTo(0, y), scrollY);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollY);
  }
  await page.getByRole("radio", { name: /Електронна/ }).check();
  await page.getByRole("button", { name: /Купити/ }).click();
  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toBeVisible();
  return cart;
}

async function openCheckout(page: Page, scrollY = 0): Promise<Locator> {
  const cart = await openCart(page, scrollY);
  await cart.getByRole("button", { name: "Оформити замовлення" }).click();
  const checkout = page.getByRole("dialog", { name: "Оформлення замовлення" });
  await expect(checkout).toBeVisible();
  return checkout;
}

async function expectNoIosFocusZoom(dialog: Locator) {
  const fields = dialog.locator("input:not([type=radio]):not([type=checkbox]), textarea, select");
  await expect(fields.first()).toBeVisible();
  const sizes = await fields.evaluateAll(nodes => nodes.map(node => parseFloat(getComputedStyle(node).fontSize)));
  expect(sizes.length).toBeGreaterThan(0);
  // iOS Safari zooms the page into focused fields smaller than 16px.
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16);
}

/** Simulates iOS opening the keyboard: the visual viewport shrinks and scrolls down. */
async function simulateKeyboard(page: Page, top: number, height: number) {
  await page.evaluate(([offsetTop, viewportHeight]) => {
    const viewport = window.visualViewport!;
    Object.defineProperty(viewport, "offsetTop", { configurable: true, get: () => offsetTop });
    Object.defineProperty(viewport, "height", { configurable: true, get: () => viewportHeight });
    viewport.dispatchEvent(new Event("resize"));
  }, [top, height]);
}

async function expectPinnedToVisualViewport(dialog: Locator, top: number, height: number) {
  await expect.poll(async () => {
    const box = await dialog.boundingBox();
    return box && { top: Math.round(box.y), bottom: Math.round(box.y + box.height) };
  }).toEqual({ top, bottom: top + height });
}

test("cart text fields are at least 16px so iOS does not zoom on focus", async ({ page }) => {
  await expectNoIosFocusZoom(await openCart(page));
});

test("checkout text fields are at least 16px so iOS does not zoom on focus", async ({ page }) => {
  await expectNoIosFocusZoom(await openCheckout(page));
});

test("cart sheet stays pinned to the visible viewport when the keyboard opens", async ({ page }) => {
  const cart = await openCart(page);
  await simulateKeyboard(page, 300, 450);
  await expectPinnedToVisualViewport(cart, 300, 450);
  await expect(cart.getByRole("heading", { name: "Кошик" })).toBeInViewport();
  await expect(cart.getByRole("textbox", { name: "Промокод", exact: true })).toBeInViewport();
});

test("checkout sheet stays pinned to the visible viewport when the keyboard opens", async ({ page }) => {
  const checkout = await openCheckout(page);
  await simulateKeyboard(page, 300, 450);
  await expectPinnedToVisualViewport(checkout, 300, 450);
  await expect(checkout.getByRole("heading", { name: "Оформлення замовлення" })).toBeInViewport();
});

async function averageBrightness(page: Page, clip: { x: number; y: number; width: number; height: number }) {
  const png = (await page.screenshot({ clip })).toString("base64");
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let total = 0;
    for (let i = 0; i < pixels.length; i += 4) total += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    return total / (pixels.length / 4);
  }, png);
}

test("checkout keeps the page behind it scroll-locked after the cart hands over", async ({ page }) => {
  const overflow = () => page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  const checkout = await openCheckout(page);
  await expect.poll(overflow).toBe("hidden");
  await checkout.getByRole("button", { name: "Закрити" }).first().click();
  await expect(checkout).toBeHidden();
  await expect.poll(overflow).not.toBe("hidden");
});

for (const sheet of ["cart", "checkout"] as const) {
  test(`${sheet} keeps the page behind it still when iOS scrolls to the focused field`, async ({ page }) => {
    const pageTop = () => page.evaluate(() => Math.round(document.querySelector("main")!.getBoundingClientRect().top));
    const dialog = sheet === "cart" ? await openCart(page, 200) : await openCheckout(page, 200);
    const before = await pageTop();

    // overflow: hidden does not stop iOS Safari from scrolling the document to reveal a focused
    // field behind the keyboard, which slides the page around under the sheet.
    await page.evaluate(() => window.scrollTo(0, 500));
    expect(await pageTop()).toBe(before);

    await dialog.getByRole("button", { name: "Закрити" }).first().click();
    await expect(dialog).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(200);
  });

  test(`${sheet} backdrop still dims the page below the visual viewport while the keyboard is open`, async ({ page }) => {
    const dialog = sheet === "cart" ? await openCart(page) : await openCheckout(page);
    await simulateKeyboard(page, 300, 450);
    await expectPinnedToVisualViewport(dialog, 300, 450);
    // iOS draws translucent keyboard and autofill bars over this strip; the page must not show through undimmed.
    expect(await averageBrightness(page, { x: 0, y: 770, width: 390, height: 60 })).toBeLessThan(80);
  });
}

/** Dispatches a one-finger drag on `target` and reports whether the page cancelled it. */
async function dragIsBlocked(target: Locator, dy: number) {
  return target.evaluate((node, distance) => {
    const rect = node.getBoundingClientRect();
    const x = rect.left + Math.min(rect.width / 2, 40);
    const y = rect.top + rect.height / 2;
    const at = (clientY: number) => new Touch({ identifier: 1, target: node, clientX: x, clientY });
    node.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, cancelable: true, touches: [at(y)] }));
    const move = new TouchEvent("touchmove", { bubbles: true, cancelable: true, touches: [at(y + distance)] });
    node.dispatchEvent(move);
    node.dispatchEvent(new TouchEvent("touchend", { bubbles: true, cancelable: true, touches: [] }));
    return move.defaultPrevented;
  }, dy);
}

test("drags on cart chrome cannot pan iOS's viewport, while the promo field keeps native touch", async ({ page }) => {
  const cart = await openCart(page);
  await simulateKeyboard(page, 300, 450);
  await expect(cart.getByRole("heading", { name: "Кошик" })).toBeInViewport();
  // iOS pans the visual viewport for unconsumed drags, which slid the page and sheet in 2.mp4.
  expect(await dragIsBlocked(cart, 60)).toBe(true); // the dimmed backdrop
  expect(await dragIsBlocked(cart.getByText("Всього:"), -60)).toBe(true);
  expect(await dragIsBlocked(cart.getByRole("textbox", { name: "Промокод", exact: true }), -60)).toBe(false);
});

test("checkout form still scrolls by touch, but drags past its edge cannot pan the viewport", async ({ page }) => {
  const checkout = await openCheckout(page);
  const label = checkout.locator("label").filter({ hasText: /^Email/ }).first();
  const scroller = label.locator("xpath=ancestor::*[contains(@class, 'content')][1]");
  expect(await scroller.evaluate(node => node.scrollHeight > node.clientHeight && node.scrollTop === 0)).toBe(true);
  expect(await dragIsBlocked(label, -60)).toBe(false); // finger up: the form scrolls down
  expect(await dragIsBlocked(label, 60)).toBe(true); // finger down at the top: nothing to scroll
  await scroller.evaluate(node => { node.scrollTop = node.scrollHeight; });
  expect(await dragIsBlocked(label, 60)).toBe(false);
  expect(await dragIsBlocked(checkout.getByRole("heading", { name: "Оформлення замовлення" }), 60)).toBe(true);
});

test("closing the last sheet restores normal touch handling on the page", async ({ page }) => {
  const cart = await openCart(page);
  await cart.getByRole("button", { name: "Закрити" }).first().click();
  await expect(cart).toBeHidden();
  expect(await dragIsBlocked(page.getByRole("heading", { level: 1 }).first(), -60)).toBe(false);
});
