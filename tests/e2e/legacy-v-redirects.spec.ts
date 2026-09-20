import { expect, test } from "@playwright/test";
import { resetMockApi } from "./helpers";

const siteBaseUrl = "http://127.0.0.1:3100";

const storefrontRoutes = [
  { name: "home", path: "/" },
  { name: "collection", path: "/books" },
  { name: "content", path: "/about" },
  { name: "product", path: "/books/test-book" },
];

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

for (const route of storefrontRoutes) {
  test(`${route.name} legacy v URL redirects permanently to clean canonical output`, async ({ request }) => {
    const response = await request.get(`${route.path}?v=legacy`, { maxRedirects: 0 });

    expect(response.status()).toBe(308);
    const location = response.headers().location;
    const destination = new URL(location, siteBaseUrl);
    expect(destination.href).toBe(`${siteBaseUrl}${route.path}`);

    const cleanResponse = await request.get(destination.href, { maxRedirects: 0 });
    expect(cleanResponse.status()).toBe(200);

    const html = await cleanResponse.text();
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical).toBeTruthy();
    const canonicalUrl = new URL(canonical as string);
    expect(canonicalUrl.origin).toBe(siteBaseUrl);
    expect(canonicalUrl.pathname).toBe(route.path);
    expect(canonicalUrl.search).toBe("");
  });
}

test("redirect removes every v value and preserves unrelated query parameters", async ({ request }) => {
  const response = await request.get("/books?v=first&utm_source=newsletter&v=second&filter=available", {
    maxRedirects: 0,
  });

  expect(response.status()).toBe(308);
  const location = new URL(response.headers().location, siteBaseUrl);
  expect(location.origin).toBe(siteBaseUrl);
  expect(location.pathname).toBe("/books");
  expect(location.searchParams.has("v")).toBe(false);
  expect(location.searchParams.get("utm_source")).toBe("newsletter");
  expect(location.searchParams.get("filter")).toBe("available");

  const cleanResponse = await request.get(location.toString(), { maxRedirects: 0 });
  expect(cleanResponse.status()).toBe(200);

  const html = await cleanResponse.text();
  expect(html).toContain(`<link rel="canonical" href="${siteBaseUrl}/books"`);
  expect(html).not.toContain(`<link rel="canonical" href="${siteBaseUrl}/books?`);
});

test("robots no longer blocks legacy v variants", async ({ request }) => {
  const response = await request.get("/robots.txt");

  expect(response.status()).toBe(200);
  const robots = await response.text();
  expect(robots).not.toContain("Disallow: /*?v=");
  expect(robots).not.toContain("Disallow: /*?v%3D");
});
