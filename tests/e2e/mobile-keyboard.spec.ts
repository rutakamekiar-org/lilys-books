import { expect, test, type Locator, type Page } from "@playwright/test";
import { resetMockApi } from "./helpers";

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

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);
const position = (locator: Locator) => locator.evaluate(node => getComputedStyle(node).position);
const htmlOverflow = (page: Page) => page.evaluate(() => getComputedStyle(document.documentElement).overflow);

/** iOS Safari can only scroll a focused field into view smoothly when no fixed layer contains it. */
async function expectFieldsInDocumentFlow(dialog: Locator) {
  const fields = dialog.locator("input:not([type=radio]):not([type=checkbox]), textarea, select");
  await expect(fields.first()).toBeVisible();
  const fixedAncestors = await fields.evaluateAll(nodes => nodes.flatMap(node => {
    for (let element: Element | null = node; element; element = element.parentElement) {
      if (getComputedStyle(element).position === "fixed") return [element.className || element.tagName];
    }
    return [];
  }));
  expect(fixedAncestors).toEqual([]);
}

async function expectNoIosFocusZoom(dialog: Locator) {
  const fields = dialog.locator("input:not([type=radio]):not([type=checkbox]), textarea, select");
  await expect(fields.first()).toBeVisible();
  const sizes = await fields.evaluateAll(nodes => nodes.map(node => parseFloat(getComputedStyle(node).fontSize)));
  expect(sizes.length).toBeGreaterThan(0);
  // iOS Safari zooms the page into focused fields smaller than 16px.
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16);
}

test.describe("phone sheets", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("cart text fields are at least 16px so iOS does not zoom on focus", async ({ page }) => {
    await expectNoIosFocusZoom(await openCart(page));
  });

  test("checkout text fields are at least 16px so iOS does not zoom on focus", async ({ page }) => {
    await expectNoIosFocusZoom(await openCheckout(page));
  });

  test("the cart replaces the page in document flow and closing restores the page and scroll", async ({ page }) => {
    const cart = await openCart(page, 200);
    // A fixed overlay had to chase iOS's keyboard viewport with JavaScript and jumped (1.mp4–3.mp4).
    expect(await position(cart)).toBe("relative");
    await expect(page.locator("main")).toBeHidden();
    await expect.poll(() => scrollY(page)).toBe(0);
    expect(await htmlOverflow(page)).not.toBe("hidden"); // the document itself scrolls to the focused field
    await expectFieldsInDocumentFlow(cart);
    await expect(cart.getByRole("button", { name: "Оформити замовлення" })).toBeInViewport();
    // The sticky footer must sit below the heading and the item, not over them (4.MP4).
    const footerTop = (await cart.getByRole("textbox", { name: "Промокод", exact: true }).boundingBox())!.y;
    const item = cart.getByRole("group").first();
    const itemBox = (await item.boundingBox())!;
    expect(itemBox.y + itemBox.height).toBeLessThanOrEqual(footerTop);
    expect((await cart.getByRole("heading", { name: "Кошик" }).boundingBox())!.y).toBeLessThan(itemBox.y);

    await cart.getByRole("button", { name: "Закрити" }).first().click();
    await expect(cart).toBeHidden();
    await expect(page.locator("main")).toBeVisible();
    await expect.poll(() => scrollY(page)).toBe(200);
  });

  test("checkout keeps page mode across the cart handover, with header and submit always reachable", async ({ page }) => {
    const checkout = await openCheckout(page, 200);
    expect(await position(checkout)).toBe("relative");
    await expect(page.locator("main")).toBeHidden();
    await expectFieldsInDocumentFlow(checkout);
    const heading = checkout.getByRole("heading", { name: "Оформлення замовлення" });
    const submit = checkout.getByRole("button", { name: "Підтвердити замовлення" });
    await expect(heading).toBeInViewport();
    await expect(submit).toBeInViewport();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => scrollY(page)).toBeGreaterThan(0);
    await expect(heading).toBeInViewport();
    await expect(submit).toBeInViewport();

    await checkout.getByRole("button", { name: "Закрити" }).first().click();
    await expect(checkout).toBeHidden();
    await expect(page.locator("main")).toBeVisible();
    await expect.poll(() => scrollY(page)).toBe(200);
  });
});

test.describe("desktop sheets", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the cart stays a fixed drawer over the page, which is scroll-locked behind it", async ({ page }) => {
    const cart = await openCart(page);
    expect(await position(cart)).toBe("fixed");
    await expect(page.locator("main")).toBeVisible();
    await expect.poll(() => htmlOverflow(page)).toBe("hidden");
    await cart.getByRole("button", { name: "Оформити замовлення" }).click();
    const checkout = page.getByRole("dialog", { name: "Оформлення замовлення" });
    expect(await position(checkout)).toBe("fixed");
    await expect.poll(() => htmlOverflow(page)).toBe("hidden");
    await checkout.getByRole("button", { name: "Закрити" }).first().click();
    await expect.poll(() => htmlOverflow(page)).not.toBe("hidden");
  });
});
