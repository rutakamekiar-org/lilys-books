import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const configuredBaseUrl = process.env.CUTOVER_BASE_URL?.trim();
const canonicalBaseUrl = (process.env.CUTOVER_CANONICAL_BASE_URL ?? "https://zvychajna.pp.ua")
  .trim()
  .replace(/\/$/, "");
const apiBaseUrl = (process.env.CUTOVER_API_URL ?? "https://api.zvychajna.pp.ua")
  .trim()
  .replace(/\/$/, "");

if (!configuredBaseUrl) {
  throw new Error("CUTOVER_BASE_URL is required.");
}

const candidateBaseUrl = configuredBaseUrl.replace(/\/$/, "");
const candidateOrigin = new URL(candidateBaseUrl).origin;

function jsonLdFrom(html: string): Array<Record<string, unknown>> {
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => JSON.parse(match[1]) as Record<string, unknown>);
}

async function productPaths(request: APIRequestContext): Promise<string[]> {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);

  const sitemap = await response.text();
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(match => new URL(match[1]).pathname)
    .filter(path => path.startsWith("/books/"));
}

async function openPurchasableProduct(page: Page, request: APIRequestContext): Promise<void> {
  for (const path of await productPaths(request)) {
    const response = await page.goto(path);
    if (response?.status() !== 200) {
      continue;
    }

    const buyButton = page.getByRole("button", { name: /Купити/ });
    if (await buyButton.isVisible() && await buyButton.isEnabled()) {
      await buyButton.click();
      return;
    }
  }

  throw new Error("The production sitemap did not contain an available product for checkout validation.");
}

test.describe("desktop deployment acceptance", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Desktop-only cutover check");
  });

  test("serves production robots and sitemap content", async ({ request }) => {
    const robotsResponse = await request.get("/robots.txt");
    expect(robotsResponse.status()).toBe(200);
    expect(robotsResponse.headers()["content-type"]).toContain("text/plain");
    expect(await robotsResponse.text()).toContain(`Sitemap: ${canonicalBaseUrl}/sitemap.xml`);

    const sitemapResponse = await request.get("/sitemap.xml");
    expect(sitemapResponse.status()).toBe(200);
    expect(sitemapResponse.headers()["content-type"]).toContain("xml");

    const locations = [...(await sitemapResponse.text()).matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(match => match[1]);
    expect(locations.length).toBeGreaterThan(1);
    expect(locations).toContain(`${canonicalBaseUrl}/`);
    expect(locations.every(location => location.startsWith(`${canonicalBaseUrl}/`))).toBe(true);
    expect(locations.some(location => location.startsWith(`${canonicalBaseUrl}/books/`))).toBe(true);
  });

  test("renders crawlable product metadata and Book JSON-LD", async ({ request }) => {
    const [productPath] = await productPaths(request);
    expect(productPath).toBeTruthy();

    const response = await request.get(productPath);
    expect(response.status()).toBe(200);
    const html = await response.text();

    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
    expect(html).toContain(`<link rel="canonical" href="${canonicalBaseUrl}${productPath}"`);
    expect(html).toMatch(/<meta property="og:title" content="[^"]+"/);

    const book = jsonLdFrom(html).find(value => value["@type"] === "Book");
    expect(book).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Book",
      url: `${canonicalBaseUrl}${productPath}`,
    });
    expect(book?.name).toBeTruthy();
  });

  test("reaches checkout validation without creating an invoice", async ({ page, request }) => {
    let invoiceRequests = 0;
    page.on("request", outgoingRequest => {
      if (outgoingRequest.method() === "POST" && /\/api\/invoice\//i.test(outgoingRequest.url())) {
        invoiceRequests += 1;
      }
    });

    await openPurchasableProduct(page, request);

    const cart = page.getByRole("dialog", { name: "Кошик" });
    if (!await cart.isVisible()) {
      const addOnOffer = page.getByRole("dialog", { name: "Разом цікавіше?" });
      if (await addOnOffer.isVisible()) {
        await page.keyboard.press("Escape");
        await expect(addOnOffer).toBeHidden();
      }

      await page.getByRole("navigation").getByRole("button", { name: /Кошик/ }).click();
    }

    await expect(cart).toBeVisible();
    await cart.getByRole("button", { name: "Оформити замовлення" }).click();

    const checkout = page.getByRole("dialog", { name: "Оформлення замовлення" });
    await expect(checkout).toBeVisible();
    await checkout.getByRole("button", { name: "Підтвердити замовлення" }).click();
    await expect(checkout.getByText("Введіть ім'я")).toBeVisible();
    await expect(checkout.getByText("Введіть прізвище")).toBeVisible();
    await expect(checkout.getByText("Введіть дійсний email")).toBeVisible();
    await expect(checkout.getByText(/Введіть дійсний телефон/)).toBeVisible();
    expect(invoiceRequests).toBe(0);
  });

  test("returns branded, non-indexable error pages", async ({ page }) => {
    for (const path of [
      "/books/zvy-12-product-that-does-not-exist",
      "/zvy-12-route-that-does-not-exist",
    ]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { name: "Цю сторінку не знайдено" })).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });

  test("production API allows the candidate origin", async ({ request }) => {
    const response = await request.fetch(`${apiBaseUrl}/health`, {
      method: "OPTIONS",
      headers: {
        Origin: candidateOrigin,
        "Access-Control-Request-Method": "GET",
      },
    });

    expect(response.status()).toBe(204);
    expect(response.headers()["access-control-allow-origin"]).toBe(candidateOrigin);
    expect(response.headers()["access-control-allow-methods"]).toContain("GET");
  });
});

test("mobile navigation and cart remain usable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop-chromium", "Mobile-only cutover check");

  await page.goto("/");
  const navigation = page.getByRole("navigation");
  await expect(navigation).toBeVisible();

  for (const name of ["Головна", "Магазин", "Події", "Про мене"]) {
    const link = navigation.getByRole("link", { name });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
  }

  await navigation.getByRole("link", { name: "Магазин" }).click();
  await expect(page).toHaveURL(/\/books$/);

  const cartButton = navigation.getByRole("button", { name: /Кошик/ });
  await cartButton.scrollIntoViewIfNeeded();
  await cartButton.click();
  await expect(page.getByRole("dialog", { name: "Кошик" })).toBeVisible();
});
