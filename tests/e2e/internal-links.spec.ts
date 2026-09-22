import { expect, test } from "@playwright/test";
import { resetMockApi } from "./helpers";

const siteBaseUrl = "http://127.0.0.1:3100";
const essentialPaths = ["/books", "/events", "/about", "/return-policy"];
const representativeRoutes = ["/", "/books", "/books/test-book", "/events", "/about", "/return-policy"];
const expectedProductPaths = [
  "/books/brunette-stories",
  "/books/test-book",
  "/books/unavailable-book",
];

function renderedHrefs(html: string): string[] {
  return [...html.matchAll(/\shref="([^"]+)"/g)].map(match => match[1].replaceAll("&amp;", "&"));
}

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
  const revalidation = await request.post("/api/revalidate", {
    headers: { "x-revalidation-secret": "zvy11-test-secret" },
    data: { slug: "test-book" },
  });
  expect(revalidation.status()).toBe(200);
});

test("essential navigation is present in initial rendered HTML", async ({ request }) => {
  for (const route of representativeRoutes) {
    const response = await request.get(route);
    expect(response.status(), `${route} must load directly`).toBe(200);

    const html = await response.text();
    const hrefs = renderedHrefs(html);
    for (const path of essentialPaths) {
      expect(hrefs, `${route} must link to ${path}`).toContain(path);
    }

    const legacyLinks = hrefs.filter(href => {
      const url = new URL(href, siteBaseUrl);
      return url.origin === siteBaseUrl && url.searchParams.has("v");
    });
    expect(legacyLinks, `${route} must not emit legacy v links`).toEqual([]);
  }
});

test("catalog and product pages expose clean reciprocal discovery paths", async ({ request }) => {
  const catalogResponse = await request.get("/books");
  expect(catalogResponse.status()).toBe(200);
  const catalogHrefs = renderedHrefs(await catalogResponse.text());
  const productPaths = [...new Set(catalogHrefs.filter(href => href.startsWith("/books/")))].sort();

  expect(productPaths).toEqual(expectedProductPaths);
  expect(productPaths).not.toContain("/books/inactive-book");

  for (const productPath of productPaths) {
    const productResponse = await request.get(productPath);
    expect(productResponse.status(), `${productPath} must load directly`).toBe(200);

    const productHtml = await productResponse.text();
    expect(productHtml).toContain('aria-label="Навігація по каталогу"');
    expect(productHtml).toContain("Назад до книг");
    expect(productHtml).toContain("fa-arrow-left");
    expect(renderedHrefs(productHtml)).toContain("/books");
  }
});
