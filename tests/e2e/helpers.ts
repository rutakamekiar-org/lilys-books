import type { APIRequestContext } from "@playwright/test";

export const mockApiUrl = "http://127.0.0.1:4100";

export async function resetMockApi(request: APIRequestContext) {
  const response = await request.post(`${mockApiUrl}/__control/reset`);
  if (!response.ok()) throw new Error(`Mock API reset failed with ${response.status()}.`);
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
