import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { mockApiUrl, resetMockApi } from "./helpers";

const MAX_TAB_STOPS = 60;
/** Comfortably more than any dialog holds, so the tab order wraps several times. */
const TRAP_PRESSES = 40;

/** Walks the tab order until `target` holds focus, so the journey stays keyboard-only. */
async function tabTo(page: Page, target: Locator) {
  for (let stop = 0; stop < MAX_TAB_STOPS; stop += 1) {
    if (await target.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Target was not reachable within ${MAX_TAB_STOPS} tab stops.`);
}

/** The computed focus indicator on the element that actually paints it. */
function focusIndicator(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active || active === document.body) return null;
    // Format radios are invisible overlays, so their label carries the ring.
    const painted = active.matches("input[type='radio']") ? active.closest("label") ?? active : active;
    const style = getComputedStyle(painted);
    return {
      tag: painted.tagName,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      boxShadow: style.boxShadow,
    };
  });
}

async function expectVisibleFocus(page: Page, description: string) {
  const indicator = await focusIndicator(page);
  expect(indicator, `${description} should be focusable`).not.toBeNull();
  const hasOutline = indicator!.outlineStyle !== "none" && indicator!.outlineWidth > 0;
  const hasShadow = indicator!.boxShadow !== "none";
  expect(
    hasOutline || hasShadow,
    `${description} has no visible focus indicator: ${JSON.stringify(indicator)}`,
  ).toBe(true);
}

function activeElementIsInside(dialog: Locator) {
  return dialog.evaluate(element => element.contains(document.activeElement));
}

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test("the catalog to checkout journey can be completed with the keyboard alone", async ({ page, request }) => {
  // The mock invoice redirects to an unreachable payment host; keep the browser on a page.
  await page.route("https://example.invalid/**", route =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<p>payment</p>" }),
  );

  await page.goto("/");

  const navigation = page.getByRole("navigation");
  await tabTo(page, navigation.getByRole("link", { name: "Магазин" }));
  await expectVisibleFocus(page, "the catalog navigation link");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/books$/);

  await tabTo(page, page.getByRole("link", { name: /Test Book/ }).first());
  await expectVisibleFocus(page, "a catalog product link");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/books\/test-book$/);

  // Choose the digital format with the arrow keys: it needs no courier details, so the
  // whole order can be placed without ever leaving the keyboard.
  await tabTo(page, page.getByRole("radio").first());
  await expectVisibleFocus(page, "the format selector");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: /Електронна/ })).toBeChecked();

  const buyButton = page.getByRole("button", { name: /Купити/ });
  await tabTo(page, buyButton);
  await expectVisibleFocus(page, "the buy button");
  await page.keyboard.press("Enter");

  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toBeVisible();
  expect(await activeElementIsInside(cart), "opening the cart moves focus into it").toBe(true);

  await tabTo(page, cart.getByRole("button", { name: "Оформити замовлення" }));
  await expectVisibleFocus(page, "the checkout button");
  await page.keyboard.press("Enter");

  const checkout = page.getByRole("dialog", { name: "Оформлення замовлення" });
  await expect(checkout).toBeVisible();
  expect(await activeElementIsInside(checkout), "opening checkout moves focus into it").toBe(true);

  await tabTo(page, checkout.getByLabel(/Ім.я \*/));
  await page.keyboard.type("Леся");
  await page.keyboard.press("Tab");
  await page.keyboard.type("Українка");
  await page.keyboard.press("Tab");
  await page.keyboard.type("lesya@example.com");

  await tabTo(page, checkout.getByRole("button", { name: "Підтвердити замовлення" }));
  await expectVisibleFocus(page, "the submit button");
  await page.keyboard.press("Enter");

  await expect(checkout).toBeHidden();
  const mockState = await (await request.get(`${mockApiUrl}/__control/state`)).json();
  expect(mockState.invoiceRequests, "the keyboard journey reached the payment handover").toBe(1);
});

test("the cart dialog traps focus, closes with Escape and restores focus to its opener", async ({ page }) => {
  await page.goto("/books/test-book");

  const cartButton = page.getByRole("navigation").getByRole("button", { name: /Кошик/ });
  await tabTo(page, cartButton);
  await expectVisibleFocus(page, "the cart button");
  await page.keyboard.press("Enter");

  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toBeVisible();
  expect(await activeElementIsInside(cart)).toBe(true);

  // A full loop forwards and backwards must never land outside the dialog.
  for (let stop = 0; stop < TRAP_PRESSES; stop += 1) {
    await page.keyboard.press("Tab");
    expect(await activeElementIsInside(cart), `Tab ${stop + 1} escaped the cart dialog`).toBe(true);
  }
  for (let stop = 0; stop < TRAP_PRESSES; stop += 1) {
    await page.keyboard.press("Shift+Tab");
    expect(await activeElementIsInside(cart), `Shift+Tab ${stop + 1} escaped the cart dialog`).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(cart).toBeHidden();
  await expect(cartButton).toBeFocused();
});

test("the excerpt dialog traps focus, closes with Escape and restores focus to its opener", async ({ page }) => {
  await page.goto("/books/brunette-stories");

  const excerptButton = page.getByRole("button", { name: "Читати уривок" }).first();
  await tabTo(page, excerptButton);
  await expectVisibleFocus(page, "the excerpt button");
  await page.keyboard.press("Enter");

  const excerpt = page.getByRole("dialog", { name: /Читати уривок/ });
  await expect(excerpt).toBeVisible();
  expect(await activeElementIsInside(excerpt)).toBe(true);

  for (let stop = 0; stop < TRAP_PRESSES; stop += 1) {
    await page.keyboard.press("Tab");
    expect(await activeElementIsInside(excerpt), `Tab ${stop + 1} escaped the excerpt dialog`).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(excerpt).toBeHidden();
  await expect(excerptButton).toBeFocused();
});

test("the checkout dialog traps focus, closes with Escape and restores focus to the opener", async ({ page }) => {
  await page.goto("/books/test-book");
  const buyButton = page.getByRole("button", { name: /Купити/ });
  await buyButton.click();

  const cart = page.getByRole("dialog", { name: "Кошик" });
  await cart.getByRole("button", { name: "Оформити замовлення" }).click();

  const checkout = page.getByRole("dialog", { name: "Оформлення замовлення" });
  await expect(checkout).toBeVisible();
  expect(await activeElementIsInside(checkout)).toBe(true);

  for (let stop = 0; stop < TRAP_PRESSES; stop += 1) {
    await page.keyboard.press("Tab");
    expect(await activeElementIsInside(checkout), `Tab ${stop + 1} escaped the checkout dialog`).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(checkout).toBeHidden();
  await expect(buyButton).toBeFocused();
});

test("checkout validation errors are announced and tied to their fields", async ({ page }) => {
  await page.goto("/books/test-book");
  await page.getByRole("button", { name: /Купити/ }).click();
  await page.getByRole("dialog", { name: "Кошик" }).getByRole("button", { name: "Оформити замовлення" }).click();

  const checkout = page.getByRole("dialog", { name: "Оформлення замовлення" });
  await checkout.getByRole("button", { name: "Підтвердити замовлення" }).click();

  // role="alert" is what makes a screen reader speak the errors without moving focus.
  await expect(checkout.getByRole("alert")).toHaveCount(5);

  const firstName = checkout.getByLabel(/Ім.я \*/);
  await expect(firstName).toHaveAttribute("aria-invalid", "true");
  await expect(firstName).toHaveAccessibleDescription("Введіть ім'я");

  const email = checkout.getByLabel("Email *");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAccessibleDescription("Введіть дійсний email");

  // The Nova Poshta picker is a button, so its name and error come from ARIA, not <label>.
  // role=button does not support aria-invalid, so the error rides on the description.
  const department = checkout.getByRole("button", { name: /Відділення Нової Пошти/ });
  await expect(department).toHaveAccessibleDescription("Оберіть відділення Нової Пошти");

  // Fixing a field clears its error and its invalid state.
  await firstName.fill("Леся");
  await checkout.getByRole("button", { name: "Підтвердити замовлення" }).click();
  await expect(firstName).toHaveAttribute("aria-invalid", "false");
  await expect(checkout.getByRole("alert")).toHaveCount(4);
});

test("the skip link lets keyboard users jump past the navigation", async ({ page }) => {
  await page.goto("/books");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Перейти до основного вмісту" });
  await expect(skipLink).toBeFocused();
  await expectVisibleFocus(page, "the skip link");

  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});
