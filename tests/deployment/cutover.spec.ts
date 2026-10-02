import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { blockInvoiceWrites } from "../support/cutover-safety";

test.use({ serviceWorkers: "block" });

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

  test("serves the storefront from Netlify with valid HTTPS and HSTS", async ({ request }) => {
    expect(new URL(candidateBaseUrl).protocol).toBe("https:");
    const response = await request.get("/", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(response.headers()["server"]).toMatch(/Netlify/i);
    expect(response.headers()["strict-transport-security"]).toMatch(/(?:^|;)\s*max-age=[1-9]\d*(?:;|$)/i);
  });

  test("www permanently redirects to the apex HTTPS URL", async ({ request }) => {
    test.skip(candidateOrigin !== new URL(canonicalBaseUrl).origin, "Custom-domain cutover check");
    const wwwUrl = new URL(canonicalBaseUrl);
    wwwUrl.hostname = `www.${wwwUrl.hostname}`;

    const response = await request.get(wwwUrl.href, { maxRedirects: 0 });
    expect([301, 308]).toContain(response.status());
    expect(new URL(response.headers()["location"], wwwUrl).href).toBe(new URL(canonicalBaseUrl).href);
  });

  test("production API health is available over valid HTTPS with CORS", async ({ request }) => {
    expect(new URL(apiBaseUrl).protocol).toBe("https:");
    const response = await request.get(`${apiBaseUrl}/health`, {
      maxRedirects: 0,
      headers: { Origin: candidateOrigin },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()["access-control-allow-origin"]).toBe(candidateOrigin);
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

  test("renders crawlable product metadata and Product JSON-LD", async ({ request }) => {
    const [productPath] = await productPaths(request);
    expect(productPath).toBeTruthy();

    const response = await request.get(productPath);
    expect(response.status()).toBe(200);
    const html = await response.text();

    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
    expect(html).toContain(`<link rel="canonical" href="${canonicalBaseUrl}${productPath}"`);
    expect(html).toMatch(/<meta property="og:title" content="[^"]+"/);

    const product = jsonLdFrom(html).find(value => value["@type"] === "Product"
      || (Array.isArray(value["@type"]) && value["@type"].includes("Product")));
    expect(product).toMatchObject({
      "@context": "https://schema.org",
      url: `${canonicalBaseUrl}${productPath}`,
    });
    expect(product?.name).toBeTruthy();
    expect(product?.image).toBeTruthy();
    expect(product?.offers).toEqual(expect.arrayContaining([
      expect.objectContaining({ "@type": "Offer", priceCurrency: "UAH" }),
    ]));
  });

  test("reaches checkout validation without creating an invoice", async ({ page, context, request }) => {
    const blockedInvoiceRequests = await blockInvoiceWrites(context);

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
    expect(blockedInvoiceRequests).toEqual([]);
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
