import type { APIRequestContext } from "@playwright/test";

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
