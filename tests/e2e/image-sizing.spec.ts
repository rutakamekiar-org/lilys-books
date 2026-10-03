import { expect, test } from "@playwright/test";

test("portrait, event and product requests match their rendered widths across breakpoints", async ({ browser, baseURL }) => {
  for (const width of [320, 390, 640, 780, 980, 1280]) {
    const context = await browser.newContext({
      baseURL,
      viewport: { width, height: 900 },
      deviceScaleFactor: 1.75,
      javaScriptEnabled: false,
    });
    try {
      const page = await context.newPage();
      for (const route of ["/about", "/events", "/books/test-book"]) {
        await page.goto(route);
        const image = page.getByRole("main").locator("img").first();
        await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).complete)).toBe(true);
        const delivered = await image.evaluate(node => {
          const img = node as HTMLImageElement;
          return {
            requestedWidth: Number(new URL(img.currentSrc).searchParams.get("w")),
            neededWidth: img.getBoundingClientRect().width * window.devicePixelRatio,
            naturalWidth: img.naturalWidth,
          };
        });
        expect(delivered.naturalWidth, `${route} at ${width}px loaded`).toBeGreaterThan(0);
        expect(delivered.requestedWidth, `${route} at ${width}px preserves pixel density`).toBeGreaterThanOrEqual(delivered.neededWidth * 0.95);
        expect(delivered.requestedWidth, `${route} at ${width}px avoids oversized transfers`).toBeLessThanOrEqual(delivered.neededWidth * 1.4);
      }
    } finally {
      await context.close();
    }
  }
});
