import { expect, test } from "@playwright/test";
import { resetMockApi } from "./helpers";

const siteBaseUrl = "http://127.0.0.1:3100";
const expectedPaths = [
  "/",
  "/about",
  "/books",
  "/books/brunette-stories",
  "/books/test-book",
  "/books/unavailable-book",
  "/events",
  "/return-policy",
];

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
  const revalidation = await request.post("/api/revalidate", {
    headers: { "x-revalidation-secret": "zvy11-test-secret" },
    data: { slug: "test-book" },
  });
  expect(revalidation.status()).toBe(200);
});

test("sitemap contains every canonical indexable page exactly once", async ({ page, request }) => {
  const response = await request.get("/sitemap.xml");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/xml");

  const xml = await response.text();
  const parsed = await page.evaluate(value => {
    const document = new DOMParser().parseFromString(value, "application/xml");
    return {
      error: document.querySelector("parsererror")?.textContent ?? null,
      locations: Array.from(document.getElementsByTagName("loc"), node => node.textContent ?? ""),
      urlCount: document.getElementsByTagName("url").length,
    };
  }, xml);

  expect(parsed.error).toBeNull();
  expect(parsed.locations).toHaveLength(parsed.urlCount);
  expect(new Set(parsed.locations).size).toBe(parsed.locations.length);

  const urls = parsed.locations.map(location => new URL(location));
  expect(urls.map(url => url.pathname).sort()).toEqual([...expectedPaths].sort());

  for (const url of urls) {
    expect(url.origin).toBe(siteBaseUrl);
    expect(url.search).toBe("");
    expect(url.hash).toBe("");

    const pageResponse = await request.get(url.pathname, { maxRedirects: 0 });
    expect(pageResponse.status(), `${url.pathname} must be directly indexable`).toBe(200);

    const html = await pageResponse.text();
    expect(html).not.toContain('<meta name="robots" content="noindex');
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical, `${url.pathname} must render a canonical URL`).toBeTruthy();

    const canonicalUrl = new URL(canonical as string);
    expect(canonicalUrl.origin).toBe(siteBaseUrl);
    expect(canonicalUrl.pathname).toBe(url.pathname);
    expect(canonicalUrl.search).toBe("");
  }

  expect(xml).not.toContain("<lastmod>");
  expect(xml).not.toContain("?v=");
  expect(parsed.locations).not.toContain(`${siteBaseUrl}/books/inactive-book`);
});
