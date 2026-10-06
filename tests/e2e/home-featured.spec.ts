import { expect, test, type Locator } from "@playwright/test";
import { existingProduct, unavailableProduct } from "../fixtures/products.mjs";
import { expectNoA11yViolations } from "./a11y";
import { mockApiUrl, resetMockApi } from "./helpers";

const description = Array.from({ length: 18 }, (_, index) =>
  `Розділ ${index + 1}. Повний опис рекомендованої книги залишається доступним після ціни й переходу до деталей.`,
).join("\n\n");
const paper = { ...existingProduct.items[0], price: 499 };
const digital = { ...existingProduct.items[1], price: 199, discountPrice: 149 };

async function bounds(locator: Locator) {
  return locator.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x, y: rect.y + window.scrollY, width: rect.width, height: rect.height };
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
  test.describe(`home featured offer at ${viewport.width}px`, () => {
    test.use({ viewport });
    test.beforeEach(async ({ page, request }) => {
      await resetMockApi(request);
      await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
        ? route.continue() : route.abort());
    });

    test("offer and full description follow the device reading order, with correct navigation", async ({ page, request }) => {
      const product = { ...existingProduct, description, items: [paper, digital] };
      expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
      await page.goto("/");
      const title = page.getByRole("heading", { level: 1, name: "«Test Book»" });
      const details = page.getByRole("link", { name: "Детальніше", exact: true });
      const price = page.getByText("Від 149 грн", { exact: true });
      const text = page.getByText(description, { exact: true }).filter({ visible: true });
      await expect(price).toBeVisible();
      await expect(details).toHaveCount(1);
      await expect(text).toHaveCount(1);
      const heading = await bounds(title);
      const amount = await bounds(price);
      const action = await bounds(details);
      const supporting = await bounds(text);
      const reviews = page.getByRole("link", { name: "Перейти на сторінку книги на Goodreads", exact: true });
      const rating = page.getByRole("link", { name: /Середня оцінка/ });
      await expect(reviews).toHaveCount(1);
      await expect(rating).toHaveCount(1);
      const ratingBounds = await bounds(rating);
      const reviewsBounds = await bounds(reviews);
      expect(heading.y + heading.height).toBeLessThan(amount.y);
      expect(amount.y + amount.height).toBeLessThanOrEqual(action.y);
      if (viewport.width < 600) {
        expect(ratingBounds.y + ratingBounds.height).toBeLessThanOrEqual(amount.y);
        expect(action.y + action.height).toBeLessThan(reviewsBounds.y);
        expect(reviewsBounds.y + reviewsBounds.height).toBeLessThan(supporting.y);
        expect(action.y + action.height).toBeLessThan(supporting.y);
      } else {
        expect(reviewsBounds.y + reviewsBounds.height).toBeLessThan(amount.y);
        expect(supporting.y + supporting.height).toBeLessThan(amount.y);
      }
      const descriptionFollows = await text.evaluate(node => {
        const link = [...document.querySelectorAll("main a")].find(a => a.textContent?.trim() === "Детальніше")!;
        return Boolean(link.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
      expect(descriptionFollows).toBe(viewport.width < 600);
      const snapshot = await page.locator("main").ariaSnapshot();
      expect(snapshot.match(/Розділ 1\./g)).toHaveLength(1);
      expect(action.x).toBeGreaterThanOrEqual(0);
      expect(action.x + action.width).toBeLessThanOrEqual(viewport.width);
      expect(action.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expectNoA11yViolations(page, `${viewport.width}px featured home`);
      if (viewport.width < 600) {
        await rating.focus();
        await page.keyboard.press("Tab");
        await expect(details).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(reviews).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        await expect(details).toBeFocused();
      } else {
        await reviews.focus();
        await page.keyboard.press("Tab");
        await expect(details).toBeFocused();
      }
      await expect(details).toHaveAttribute("href", "/books/test-book");
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/books\/test-book$/);
      await expect(page.getByRole("heading", { level: 1, name: "Test Book", exact: true })).toBeVisible();
      expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
    });

    test("live discounts, zero prices and missing editions keep the offer truthful", async ({ page }) => {
      const scenarios = [
        { items: [paper, digital], price: "Від 149 грн" },
        { items: [paper, { ...digital, discountPrice: null }], price: "Від 199 грн" },
        { items: [{ ...paper, discountPrice: 0 }], price: "Від 0 грн" },
        { items: [], price: null },
      ];
      for (const scenario of scenarios) {
        await page.route("**/api/products", route => route.fulfill({ json: [{ ...existingProduct, items: scenario.items, description }] }));
        await page.goto("/");
        const price = page.getByText(/^Від .* грн$/);
        if (scenario.price) await expect(price).toHaveText(scenario.price);
        else await expect(price).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Детальніше", exact: true })).toHaveAttribute("href", "/books/test-book");
        await expect(page.getByText(description, { exact: true }).filter({ visible: true })).toHaveCount(1);
        await page.unroute("**/api/products");
      }
    });

    test("a failed or empty refresh retains the existing safe offer and navigation", async ({ page }) => {
      for (const failed of [true, false]) {
        await page.route("**/api/products", route => failed
          ? route.fulfill({ status: 503, json: { error: "Controlled unavailable catalog" } })
          : route.fulfill({ json: [] }));
        const refresh = page.waitForResponse(response => response.url().endsWith("/api/products"));
        await page.goto("/");
        await refresh;
        await expect(page.getByRole("heading", { level: 1, name: "«Test Book»" })).toBeVisible();
        await expect(page.getByText("Від 180 грн", { exact: true })).toBeVisible();
        await expect(page.getByRole("link", { name: "Детальніше", exact: true })).toHaveAttribute("href", "/books/test-book");
        await expect(page.getByText("Controlled unavailable catalog")).toHaveCount(0);
        await expect(page.getByRole("navigation").first()).toBeVisible();
        await page.unroute("**/api/products");
      }
    });

    test("a long title and absent description do not clip the price or action", async ({ page }) => {
      const name = "Дуже довга назва рекомендованої книги ".repeat(8) + "БезПробілів".repeat(15);
      await page.route("**/api/products", route => route.fulfill({ json: [{ ...existingProduct, name, description: "", externalBookRatings: [], items: [paper] }, unavailableProduct] }));
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1, name: `«${name}»` })).toBeVisible();
      await expect(page.getByText("Від 499 грн", { exact: true })).toBeVisible();
      const details = page.getByRole("link", { name: "Детальніше", exact: true });
      await expect(details).toHaveAttribute("href", "/books/test-book");
      if (viewport.width < 600) {
        for (const locator of [page.getByRole("heading", { level: 1 }), details]) {
          const rect = await bounds(locator);
          expect(rect.x).toBeGreaterThanOrEqual(0);
          expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
          expect(await locator.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
        }
      }
    });

    test("an initially empty catalog has no invented offer and keeps navigation available", async ({ page, request }) => {
      const revalidate = async () => {
        const response = await request.post("/api/revalidate", {
          headers: { "x-revalidation-secret": "zvy11-test-secret" },
          data: { slug: "test-book" },
        });
        expect(response.ok()).toBe(true);
      };
      try {
        const state = await (await request.get(`${mockApiUrl}/__control/state`)).json();
        for (const product of state.products) {
          expect((await request.post(`${mockApiUrl}/__control/products`, { data: { ...product, isActive: false } })).ok()).toBe(true);
        }
        await revalidate();
        const refresh = page.waitForResponse(response => response.url().endsWith("/api/products"));
        await page.goto("/");
        await refresh;
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Детальніше", exact: true })).toHaveCount(0);
        await expect(page.getByText(/^Від .* грн$/)).toHaveCount(0);
        await expect(page.getByRole("navigation").first()).toBeVisible();
        expect((await (await request.get(`${mockApiUrl}/__control/state`)).json()).invoiceRequests).toBe(0);
      } finally {
        await resetMockApi(request);
        await revalidate();
        // Restore the prerendered home offer for subsequent tests, including failures.
        expect((await request.get("/")).ok()).toBe(true);
      }
    });
  });
}
