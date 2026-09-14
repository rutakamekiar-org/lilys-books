import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectNoA11yViolations } from "./a11y";
import { resetMockApi } from "./helpers";

async function openCart(page: Page) {
  await page.goto("/books/test-book");
  await page.getByRole("button", { name: /Купити/ }).click();
  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toBeVisible();
  return cart;
}

async function openCheckout(page: Page) {
  const cart = await openCart(page);
  await cart.getByRole("button", { name: "Оформити замовлення" }).click();
  const checkout = page.getByRole("dialog", { name: "Оформлення замовлення" });
  await expect(checkout).toBeVisible();
  return checkout;
}

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test("home page has no accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoA11yViolations(page, "the home page");
});

test("catalog page has no accessibility violations", async ({ page }) => {
  await page.goto("/books");
  await expect(page.getByRole("link", { name: /Test Book/ }).first()).toBeVisible();
  await expectNoA11yViolations(page, "the catalog page");
});

test("product details page has no accessibility violations", async ({ page }) => {
  await page.goto("/books/brunette-stories");
  await expect(page.getByRole("heading", { level: 1, name: "Excerpt Book" })).toBeVisible();
  await expectNoA11yViolations(page, "the product details page");
});

test("excerpt dialog has no accessibility violations", async ({ page }) => {
  await page.goto("/books/brunette-stories");
  await page.getByRole("button", { name: "Читати уривок" }).first().click();

  const excerpt = page.getByRole("dialog", { name: /Читати уривок/ });
  await expect(excerpt).toBeVisible();
  await expect(excerpt.getByText("Завантаження...")).toBeHidden();
  await expectNoA11yViolations(page, "the excerpt dialog");
});

test("cart dialog has no accessibility violations", async ({ page }) => {
  const cart = await openCart(page);
  await expect(cart.getByText("Test Book", { exact: true })).toBeVisible();
  await expectNoA11yViolations(page, "the cart dialog");
});

test("checkout dialog has no accessibility violations", async ({ page }) => {
  await openCheckout(page);
  await expectNoA11yViolations(page, "the checkout dialog");
});

test("checkout dialog has no accessibility violations while showing validation errors", async ({ page }) => {
  const checkout = await openCheckout(page);
  await checkout.getByRole("button", { name: "Підтвердити замовлення" }).click();
  await expect(checkout.getByText("Введіть ім'я")).toBeVisible();
  await expectNoA11yViolations(page, "the checkout dialog with validation errors");
});

test("product imagery carries meaningful alternative text", async ({ page }) => {
  await page.goto("/books");
  await expect(page.getByRole("img", { name: "Test Book" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Excerpt Book" })).toBeVisible();

  // The carousel shows several views of one cover: the first carries the product name and
  // the rest are explicitly decorative, so a screen reader does not repeat the same title.
  await page.goto("/books/brunette-stories");
  await expect(page.getByRole("img", { name: "Excerpt Book" })).toBeVisible();

  const alternatives = await page.locator("img").evaluateAll(images =>
    images.map(image => image.getAttribute("alt")),
  );
  expect(alternatives.length).toBeGreaterThan(0);
  expect(alternatives, "every image declares an alt attribute").not.toContain(null);
  for (const alternative of alternatives) {
    expect(alternative, "alt text must describe the image, not name a file").not.toMatch(
      /\.(webp|png|jpe?g|svg)$|^(image|photo|picture|фото|зображення)$/i,
    );
  }

  // Icon-only controls are named, and their glyphs are hidden from assistive technology.
  await expect(page.getByRole("button", { name: "Додати в кошик" })).toBeVisible();
  await expect(page.locator("button i.fa-cart-plus")).toHaveAttribute("aria-hidden", "true");
});
