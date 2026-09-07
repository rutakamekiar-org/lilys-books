import { expect, test } from "@playwright/test";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

function jsonLdFrom(html: string): Array<Record<string, unknown>> {
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => JSON.parse(match[1]) as Record<string, unknown>);
}

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test("existing product returns server-rendered SEO metadata and Book JSON-LD", async ({ request }) => {
  const response = await request.get("/books/test-book");
  expect(response.status()).toBe(200);
  const html = await response.text();

  expect(html).toContain("<title>Test Book — Test Author | Lily&#x27;s Books</title>");
  expect(html).toContain('<meta name="description" content="SEO description for the test book."');
  expect(html).toContain('<link rel="canonical" href="http://127.0.0.1:3100/books/test-book"');

  const book = jsonLdFrom(html).find(value => value["@type"] === "Book");
  expect(book).toMatchObject({
    "@context": "https://schema.org",
    "@type": "Book",
    name: "Test Book",
    url: "http://127.0.0.1:3100/books/test-book",
    description: "SEO description for the test book.",
    isbn: "978-1-23456-789-0",
  });
  expect(book?.workExample).toEqual(expect.arrayContaining([
    expect.objectContaining({
      offers: expect.objectContaining({
        price: "350",
        priceCurrency: "UAH",
        availability: "https://schema.org/InStock",
      }),
    }),
  ]));
});

test("a newly created active product gets a route without rebuilding", async ({ page, request }) => {
  const product = makeProduct();
  await request.post(`${mockApiUrl}/__control/products`, { data: product });

  const response = await page.goto(`/books/${product.slug}`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: product.name as string })).toBeVisible();
  await expect(page).toHaveTitle("New Dynamic Book — Dynamic Author | Lily's Books");
});

test("unavailable product remains indexable but cannot be purchased", async ({ page }) => {
  const response = await page.goto("/books/unavailable-book");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("button", { name: "Немає в наявності" })).toBeDisabled();

  const book = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes =>
    nodes.map(node => JSON.parse(node.textContent ?? "{}"))
      .find(value => value["@type"] === "Book"),
  );
  expect(book.workExample[0].offers.availability).toBe("https://schema.org/OutOfStock");
});

test("missing product returns 404", async ({ request }) => {
  const response = await request.get("/books/does-not-exist");
  expect(response.status()).toBe(404);
});

test("product API failure remains a server error instead of becoming a false 404", async ({ request }) => {
  await request.post(`${mockApiUrl}/__control/failures`, { data: { slugs: ["broken-book"] } });
  const response = await request.get("/books/broken-book");
  expect(response.status()).toBe(500);
});

test("authorized revalidation refreshes cached product metadata", async ({ request }) => {
  const slug = `cache-book-${Date.now()}`;
  const initial = makeProduct({ id: "40000000-0000-4000-8000-000000000001", slug, name: "Cached Book v1", seoDescription: "Cached description v1." });
  await request.post(`${mockApiUrl}/__control/products`, { data: initial });
  expect(await (await request.get(`/books/${slug}`)).text()).toContain("Cached Book v1");

  await request.post(`${mockApiUrl}/__control/products`, { data: { ...initial, name: "Cached Book v2", seoDescription: "Cached description v2." } });
  const revalidation = await request.post("/api/revalidate", {
    headers: { "x-revalidation-secret": "zvy11-test-secret" },
    data: { slug },
  });
  expect(revalidation.status()).toBe(200);
  expect(await revalidation.json()).toMatchObject({
    revalidated: true,
    paths: expect.arrayContaining(["/", "/books", `/books/${slug}`, "/sitemap.xml"]),
  });

  const refreshedHtml = await (await request.get(`/books/${slug}`)).text();
  expect(refreshedHtml).toContain("Cached Book v2");
  expect(refreshedHtml).toContain("Cached description v2.");
});
