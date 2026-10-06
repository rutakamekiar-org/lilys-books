import { test, expect } from "@playwright/test";
import { resetMockApi } from "./helpers";
import { expectNoA11yViolations } from "./a11y";
import { getProductGalleryImages } from "../../src/lib/product-gallery";

test("gallery deduplicates absolute and relative storefront covers", () => {
  const cover = "/images/products/zvychajna/book.webp";
  expect(getProductGalleryImages(`https://zvychajna.pp.ua${cover}`, [cover])).toEqual([cover]);
  expect(getProductGalleryImages(`https://www.zvychajna.pp.ua${cover}`, [cover, "/images/detail.webp", cover]))
    .toEqual([cover, "/images/detail.webp"]);
  expect(getProductGalleryImages(cover, ["https://other.example/images/products/zvychajna/book.webp"]))
    .toHaveLength(2);
});

test.beforeEach(async ({ request }) => { await resetMockApi(request); });

for (const width of [360, 390]) {
  test.describe(`book gallery ${width}`, () => {
    test.use({ viewport: { width, height: 844 }, hasTouch: true });
    test("cover is a preview; enlarged gallery navigates and restores focus", async ({ page }) => {
      await page.goto("/books/brunette-stories");
      await expect(page.getByRole("button", { name: "Наступне фото" })).toHaveCount(0);
      const preview = page.getByRole("button", { name: "Відкрити зображення книги: Excerpt Book", exact: true });
      await preview.click();
      const gallery = page.getByRole("dialog", { name: "Excerpt Book", exact: true });
      await expect(gallery.getByText("Зображення книги", { exact: true })).toHaveCount(0);
      await expect(gallery.getByRole("status")).toHaveText("1 / 3");
      const coverSource = await preview.getByRole("img").getAttribute("src");
      await expect(gallery.getByRole("img", { name: "Excerpt Book", exact: true })).toHaveAttribute("src", /zvychajna/);
      expect(coverSource).toContain("zvychajna");
      const rail = gallery.getByRole("group", { name: "Зображення: Excerpt Book", exact: true });
      const box = (await rail.boundingBox())!;
      expect(box.width).toBeGreaterThan(280);
      expect(box.height).toBeGreaterThan(400);
      await expectNoA11yViolations(page, "expanded book gallery");
      await gallery.getByRole("button", { name: "Наступне фото" }).click();
      await expect.poll(() => rail.evaluate(node => node.scrollLeft)).toBeGreaterThan(100);
      await expect(gallery.getByRole("status")).toHaveText("2 / 3");
      await page.keyboard.press("Escape");
      await expect(preview).toBeFocused();
      await preview.click();
      await expect(gallery.getByRole("status")).toHaveText("2 / 3");
      const reopenedRail = gallery.getByRole("group", { name: "Зображення: Excerpt Book", exact: true });
      await expect.poll(() => reopenedRail.evaluate(node => Math.round(node.scrollLeft / node.clientWidth))).toBe(1);
      await expect.poll(() => reopenedRail.evaluate(rail => {
        const box = rail.getBoundingClientRect();
        return Array.from(rail.querySelectorAll("img")).some(image => {
          const rect = image.getBoundingClientRect();
          return rect.left < box.right && rect.right > box.left && image.complete && image.naturalWidth > 0;
        });
      })).toBe(true);
      await gallery.getByRole("button", { name: "Попереднє фото" }).click();
      await expect.poll(() => reopenedRail.evaluate(node => node.scrollLeft)).toBeLessThan(2);
      await expect(gallery.getByRole("status")).toHaveText("1 / 3");
      await page.keyboard.press("Escape");
      await expect(gallery).toBeHidden();
      await expect(preview).toBeFocused();
      await preview.click();
      await gallery.getByRole("button", { name: "Закрити", exact: true }).click();
      await expect(preview).toBeFocused();
    });

    test("Buy opens the cart without an added-to-cart toast", async ({ page }) => {
      await page.goto("/books/test-book");
      await page.getByRole("button", { name: "Купити — 350 грн", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Кошик", exact: true })).toBeVisible();
      await expect(page.getByText(/додано до кошика/)).toHaveCount(0);
    });
  });
}

test("desktop Buy is silent while Add to cart shows confirmation", async ({ page }) => {
  await page.goto("/books/test-book");
  await page.getByRole("button", { name: "Купити — 350 грн", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Кошик", exact: true })).toBeVisible();
  await expect(page.getByText(/додано до кошика/)).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("radio", { name: /Електронна/ }).check();
  await page.getByRole("button", { name: "Додати в кошик", exact: true }).click();
  await expect(page.getByText(/додано до кошика/)).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
