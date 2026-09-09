export const existingProduct = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Test Book",
  slug: "test-book",
  type: 1,
  genre: "Regression fiction",
  imageUrl: "/images/products/zvychajna/book.webp",
  imageUrls: ["/images/products/zvychajna/book.webp"],
  items: [
    { id: "11000000-0000-4000-8000-000000000001", name: "Паперова Test Book", type: 1, format: 1, isAvailable: true, canPreorder: false, price: 350, discountPrice: null, currency: "UAH", note: null },
    { id: "11000000-0000-4000-8000-000000000002", name: "Електронна Test Book", type: 2, format: 2, isAvailable: true, canPreorder: false, price: 180, discountPrice: null, currency: "UAH", note: null },
  ],
  externalBookRatings: [],
  externalLinks: [],
  physicalDetails: { seriesName: null, publisher: "Test Publisher", pages: 240, coverType: "Тверда", publicationYear: 2026, size: "130 × 200 mm", weight: 0.4, paperType: "Offset", isbn: "978-1-23456-789-0" },
  seoDescription: "SEO description for the test book.",
  description: "A deterministic product supplied by the local test API.",
  hasExcerpt: false,
  author: "Test Author",
  ageRating: "12+",
  isHero: true,
  isActive: true,
};

export const unavailableProduct = {
  ...existingProduct,
  id: "20000000-0000-4000-8000-000000000001",
  name: "Unavailable Book",
  slug: "unavailable-book",
  isHero: false,
  seoDescription: "An unavailable test product.",
  items: [{ ...existingProduct.items[0], id: "21000000-0000-4000-8000-000000000001", name: "Паперова Unavailable Book", isAvailable: false, canPreorder: false }],
};

export const inactiveProduct = {
  ...existingProduct,
  id: "50000000-0000-4000-8000-000000000001",
  name: "Inactive Book",
  slug: "inactive-book",
  isHero: false,
  isActive: false,
  items: [{ ...existingProduct.items[0], id: "51000000-0000-4000-8000-000000000001", name: "Паперова Inactive Book" }],
};

export const productFixtures = [existingProduct, unavailableProduct, inactiveProduct];
