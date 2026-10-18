import type { APIRequestContext, Locator, Page } from "@playwright/test";

// Local parallel runs (tools/test-e2e-parallel.mjs) give each shard its own ports.
export const appUrl = `http://127.0.0.1:${process.env.E2E_APP_PORT ?? 3100}`;
export const mockApiUrl = `http://127.0.0.1:${process.env.E2E_API_PORT ?? 4100}`;
export const revalidationSecret = "zvy11-test-secret";

/** Drops the app's cached home, catalog, sitemap and `/books/<slug>` pages. */
export async function revalidateCatalog(request: APIRequestContext, slug = "test-book") {
  const response = await request.post("/api/revalidate", {
    headers: { "x-revalidation-secret": revalidationSecret },
    data: { slug },
  });
  if (!response.ok()) throw new Error(`App revalidation failed with ${response.status()}.`);
}

/**
 * Resets the mock API and the app pages cached from it, so no test inherits
 * catalog data that an earlier test configured and revalidated.
 */
export async function resetMockApi(request: APIRequestContext) {
  const response = await request.post(`${mockApiUrl}/__control/reset`);
  if (!response.ok()) throw new Error(`Mock API reset failed with ${response.status()}.`);
  await revalidateCatalog(request);
}

export function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "30000000-0000-4000-8000-000000000001",
    name: "New Dynamic Book",
    slug: "new-dynamic-book",
    type: 1,
    genre: "Dynamic fiction",
    imageUrl: "/images/products/zvychajna/book.webp",
    imageUrls: ["/images/products/zvychajna/book.webp"],
    items: [{ id: "31000000-0000-4000-8000-000000000001", name: "Паперова New Dynamic Book", type: 1, format: 1, isAvailable: true, canPreorder: false, price: 420, discountPrice: null, currency: "UAH", note: null }],
    externalBookRatings: [],
    externalLinks: [],
    physicalDetails: { seriesName: null, publisher: "Test Publisher", pages: 180, coverType: "Тверда", publicationYear: 2026, size: "130 × 200 mm", weight: 0.35, paperType: "Offset", isbn: "978-1-11111-111-1" },
    seoDescription: "SEO description for a newly created book.",
    description: "Created after the frontend test server was started.",
    hasExcerpt: false,
    author: "Dynamic Author",
    ageRating: "12+",
    isHero: false,
    isActive: true,
    ...overrides,
  };
}

// A swipe without a duration is a flick lasting this long.
const FLICK_MS = 60;

/**
 * Touch-drags vertically from near the top of `target` (CDP touch events, so sheets see real pointers).
 * Every event is stamped with the gesture's intended timing: useSheetDismiss judges flicks by velocity,
 * and each CDP round trip (~18ms, more under parallel load) would otherwise slow a flick below its
 * threshold. Slow drags still wait in real time, so stamps never run ahead of the clock.
 */
export async function swipe(page: Page, target: Locator, distance: number,
  { startOffset = 12, duration = 0, cancel = false }: { startOffset?: number; duration?: number; cancel?: boolean } = {}) {
  const box = (await target.boundingBox())!;
  const session = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + startOffset;
  const start = Date.now() / 1000;
  const stepSeconds = (duration || FLICK_MS) / 5 / 1000;
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }], timestamp: start });
  for (let step = 1; step <= 5; step++) {
    if (duration) await new Promise(resolve => setTimeout(resolve, duration / 5));
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove", touchPoints: [{ x, y: y + distance * step / 5 }], timestamp: start + step * stepSeconds,
    });
  }
  await session.send("Input.dispatchTouchEvent", {
    type: cancel ? "touchCancel" : "touchEnd", touchPoints: [], timestamp: start + 5 * stepSeconds + 0.001,
  });
  await session.detach();
}
