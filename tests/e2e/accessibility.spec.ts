import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectNoA11yViolations } from "./a11y";
import { productionTitleProducts } from "../fixtures/products.mjs";
import { events } from "../../src/data/events";
import { mockApiUrl, resetMockApi, revalidateCatalog } from "./helpers";

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
  // Catalog cards wrap the cover and the visible title in one link, so the title alone names it
  // and the cover stays decorative instead of announcing the same title twice.
  await page.goto("/books");
  for (const name of ["Test Book", "Excerpt Book"]) {
    const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
    await expect(card.getByRole("link", { name })).toBeVisible();
    await expect(card.locator("img")).toHaveAttribute("alt", "");
  }

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
  await expect(page.getByRole("button", { name: "Додати в кошик" }).locator("svg")).toHaveAttribute("aria-hidden", "true");
});

const publishedEvents = events.filter(event => event.published !== false && event.url);

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 800 }]) {
  test.describe(`catalog and event links at ${viewport.width}px`, () => {
    test.use({ viewport });

    // ZVY-77: production cards with no age badge or rating made the link text equal the cover's
    // alt, which axe reports as image-redundant-alt. The local fixtures always had a badge.
    test("catalog cards with title-only links have no accessibility violations", async ({ page, request }) => {
      for (const product of productionTitleProducts) {
        expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
      }
      await revalidateCatalog(request);

      await page.goto("/books");
      const cards = productionTitleProducts.map(product => ({
        product,
        card: page.getByRole("article").filter({ has: page.getByRole("heading", { name: product.name, exact: true }) }),
      }));
      for (const { card } of cards) await expect(card).toBeVisible();
      await expectNoA11yViolations(page, `the catalog with production titles at ${viewport.width}px`);
      for (const { product, card } of cards) {
        await expect(card.getByRole("link", { name: product.name, exact: true })).toBeVisible();
        await expect(card.locator("img")).toHaveAttribute("alt", "");
      }
    });

    // Google flagged identical names on links with different destinations (not an axe rule).
    test("event links name the event they open", async ({ page }) => {
      await page.goto("/events");
      expect(publishedEvents.length).toBeGreaterThan(1);
      for (const event of publishedEvents) {
        const link = page.locator(`a[href="${event.url}"]`);
        await expect(link).toHaveCount(1);
        await expect(link).toHaveAccessibleName(`Перейти до події: ${event.title}`);
      }
      await expectNoA11yViolations(page, `the events page at ${viewport.width}px`);
    });
  });
}
