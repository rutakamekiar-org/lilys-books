import { test, expect } from "@playwright/test";
import { existingProduct } from "../fixtures/products.mjs";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

const books = [
  { name: "Звичайна. Перша частина дилогії", imageUrl: "/images/products/zvychajna/book.webp" },
  { name: "Брунатні історії: збірка осінніх оповідань", imageUrl: "/images/products/brunette-stories/brunette-stories.png" },
  { name: "Під шепіт снігу: збірка різдвяної прози", imageUrl: "/images/products/pid_shepit_snihu/pid_shepit_snihu.jpg" },
];

for (const width of [320, 360, 390]) {
  test(`mobile covers share a size and align with excerpt at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
    await resetMockApi(request);
    for (const [index, book] of books.entries()) {
      const product = makeProduct({ ...book, slug: `cover-layout-${index}`, imageUrls: [book.imageUrl], hasExcerpt: true,
        externalBookRatings: existingProduct.externalBookRatings });
      expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);
      await page.goto(`/books/${product.slug}`);
      const preview = page.getByRole("button", { name: `Відкрити зображення книги: ${book.name}`, exact: true });
      const excerpt = page.getByRole("button", { name: "Читати уривок", exact: true });
      await expect(preview).toBeVisible();
      await expect.poll(() => preview.locator("img").evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      const image = await preview.locator("img").boundingBox();
      const button = await excerpt.boundingBox();
      expect(image!.width).toBe(112);
      expect(image!.height).toBe(168);
      expect(image!.y + image!.height).toBeCloseTo(button!.y + button!.height, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 390) await page.screenshot({ path: `test-results/cover-layout-${index}-390.png` });
    }
  });
}
