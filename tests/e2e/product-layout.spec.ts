import { expect, test } from "@playwright/test";
import { existingProduct } from "../fixtures/products.mjs";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

// The default headless shell never reports layout-shift entries; the full Chromium build does.
test.use({ channel: "chromium" });

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

const paragraph = "Тиха історія про звичайне життя, яке раптом виявляється зовсім не звичайним: про дружбу, вибір і сміливість бути собою.";
// Production descriptions run to several paragraphs, far past the six collapsed lines at every width.
const longDescription = Array.from({ length: 6 }, () => paragraph).join("\n\n");

type Shift = { value: number; sources: string[] };

// Overflows on phones but fits the desktop column: only the browser can tell, so the row stays reserved.
const mediumDescription = [paragraph, paragraph].join("\n");

for (const { label, description, overflows } of [
  { label: "long", description: longDescription, overflows: () => true },
  { label: "medium", description: mediumDescription, overflows: (width: number) => width > 960 ? false : undefined },
  { label: "short", description: "Коротка анотація.", overflows: () => false },
]) {
  test(`product page keeps its layout while scripts and covers arrive late (${label} description)`, async ({ page, request }) => {
    const expectToggle = overflows(page.viewportSize()!.width);
    const product = makeProduct({
      slug: `layout-${label}-description`,
      hasExcerpt: true,
      externalBookRatings: existingProduct.externalBookRatings,
      items: existingProduct.items,
      description,
    });
    expect((await request.post(`${mockApiUrl}/__control/products`, { data: product })).ok()).toBe(true);

    await page.addInitScript(() => {
      const shifts: Shift[] = [];
      (window as unknown as { __shifts: Shift[] }).__shifts = shifts;
      new PerformanceObserver(list => {
        for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean; sources: { node?: Node }[] }[]) {
          if (entry.hadRecentInput) continue;
          shifts.push({
            value: entry.value,
            sources: entry.sources.map(source => (source.node as Element | undefined)?.className?.toString() ?? String(source.node?.nodeName)),
          });
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    let releaseScripts!: () => void;
    const scriptsReady = new Promise<void>(resolve => { releaseScripts = resolve; });
    let releaseImages!: () => void;
    const imagesReady = new Promise<void>(resolve => { releaseImages = resolve; });
    await page.route("**/_next/static/chunks/**", async route => {
      if (route.request().resourceType() === "script") await scriptsReady;
      await route.continue();
    });
    await page.route("**/_next/image?**", async route => { await imagesReady; await route.continue(); });

    try {
      await page.goto(`/books/${product.slug}`, { waitUntil: "commit" });
      const panel = page.getByRole("region", { name: "Опис", exact: true });
      const blocks = page.locator("main h1, main section[aria-labelledby], main [class*=coverActions]");
      await expect(panel).toBeVisible();
      const boxes = async () => blocks.evaluateAll(nodes => nodes.map(node => {
        const { top, height } = node.getBoundingClientRect();
        return { top: Math.round(top + window.scrollY), height: Math.round(height) };
      }));
      // Shifts only count against painted content, so let the server-rendered page paint first.
      await expect.poll(() => page.evaluate(() => performance.getEntriesByName("first-contentful-paint").length)).toBe(1);
      const beforeHydration = await boxes();

      // BookDetail refreshes the product from its first effect, after it has measured the description.
      const refreshed = page.waitForResponse(response => response.url().endsWith(`/api/products/${product.slug}`));
      releaseScripts();
      await refreshed;
      const toggle = panel.getByRole("button", { name: "Читати далі ↓", exact: true });
      if (expectToggle !== undefined) await expect(toggle).toHaveCount(expectToggle ? 1 : 0);

      releaseImages();
      const cover = page.locator("main img[fetchpriority=high]").filter({ visible: true });
      await expect.poll(() => cover.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

      expect(await page.evaluate(() => (window as unknown as { __shifts: Shift[] }).__shifts)).toEqual([]);
      expect(await boxes()).toEqual(beforeHydration);

      if (expectToggle) {
        const text = panel.locator(`#book-description-${product.slug}`);
        const collapsed = (await panel.boundingBox())!.height;
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await expect(toggle).toHaveAttribute("aria-controls", `book-description-${product.slug}`);
        await toggle.click();
        const collapse = panel.getByRole("button", { name: "Згорнути ↑", exact: true });
        await expect(collapse).toHaveAttribute("aria-expanded", "true");
        // Expanded, the panel shows the whole text above the toggle.
        const expanded = (await panel.boundingBox())!;
        expect(expanded.height).toBeGreaterThan(collapsed);
        expect((await collapse.boundingBox())!.y).toBeGreaterThanOrEqual((await text.boundingBox())!.y + (await text.boundingBox())!.height);
        await collapse.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        expect((await panel.boundingBox())!.height).toBeCloseTo(collapsed, 0);
      }
    } finally {
      releaseScripts();
      releaseImages();
    }
  });
}
