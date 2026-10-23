import { expect, test } from "@playwright/test";
import { events } from "../../src/data/events";
import { resetMockApi } from "./helpers";

// LocalDateTime fills dates in after hydration; any published event year shows it has.
const eventYears = new RegExp([...new Set(events.filter(e => e.published !== false).map(e => new Date(e.date).getUTCFullYear()))].join("|"));

// The default headless shell never reports layout-shift entries; the full Chromium build does.
test.use({ channel: "chromium" });

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

type Shift = { value: number; sources: string[] };

test("event cards keep their layout while scripts and photos arrive late", async ({ page }) => {
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
    await page.goto("/events", { waitUntil: "commit" });
    const cards = page.getByRole("article");
    await expect(cards).toHaveCount(3);
    const boxes = async () => cards.evaluateAll(nodes => nodes.map(node => {
      const { top, height } = node.getBoundingClientRect();
      return { top: Math.round(top + window.scrollY), height: Math.round(height) };
    }));
    // Shifts only count against painted content, so let the server-rendered cards paint first.
    await expect.poll(() => page.evaluate(() => performance.getEntriesByName("first-contentful-paint").length)).toBe(1);
    const beforeHydration = await boxes();

    releaseScripts();
    // The gallery arrows enable only once the carousel has hydrated and measured its rail.
    await expect(page.getByRole("button", { name: "Наступне фото" }).first()).toBeEnabled();
    await expect(cards.first().getByText(eventYears).filter({ visible: true })).toBeVisible();

    releaseImages();
    const covers = page.getByRole("group", { name: /Зображення події:/ }).locator("img[loading=eager]");
    await expect(covers).toHaveCount(2);
    for (const cover of await covers.all()) {
      await expect.poll(() => cover.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    expect(await page.evaluate(() => (window as unknown as { __shifts: Shift[] }).__shifts)).toEqual([]);
    expect(await boxes()).toEqual(beforeHydration);
  } finally {
    releaseScripts();
    releaseImages();
  }
});
