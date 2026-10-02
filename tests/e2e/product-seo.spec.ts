import { expect, test, type APIRequestContext } from "@playwright/test";
import { existingProduct } from "../fixtures/products.mjs";
import { makeProduct, mockApiUrl, resetMockApi } from "./helpers";

function productJsonLd(html: string) {
  const entities = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => JSON.parse(match[1]));
  const products = entities.filter(value => [value["@type"]].flat().includes("Product"));
  expect(products).toHaveLength(1);
  expect(entities.filter(value => [value["@type"]].flat().includes("Book"))).toHaveLength(
    [products[0]["@type"]].flat().includes("Book") ? 1 : 0,
  );
  return products[0];
}

async function createProduct(request: APIRequestContext, overrides: Record<string, unknown>) {
  const product = makeProduct(overrides);
  const response = await request.post(`${mockApiUrl}/__control/products`, { data: product });
  expect(response.ok()).toBe(true);
  return product;
}

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test("one Product/Book entity has stable identity, current images, publisher and direct offers", async ({ request }) => {
  const response = await request.get("/books/test-book");
  expect(response.status()).toBe(200);
  const product = productJsonLd(await response.text());
  const url = "http://127.0.0.1:3100/books/test-book";
  expect(product).toMatchObject({
    "@context": "https://schema.org",
    "@type": ["Product", "Book"],
    "@id": `${url}#product`,
    sku: existingProduct.id,
    name: existingProduct.name,
    url,
    mainEntityOfPage: url,
    image: ["http://127.0.0.1:3100/images/products/zvychajna/book.webp"],
    description: existingProduct.seoDescription,
    author: { "@type": "Person", name: existingProduct.author },
    publisher: { "@type": "Organization", name: existingProduct.physicalDetails.publisher },
    isbn: existingProduct.physicalDetails.isbn,
    datePublished: "2026",
    bookFormat: ["https://schema.org/PrintBook", "https://schema.org/EBook"],
  });
  expect(product).not.toHaveProperty("workExample");
  expect(product).not.toHaveProperty("brand");
  expect(product.offers).toHaveLength(existingProduct.items.length);
  for (const item of existingProduct.items) {
    expect(product.offers).toContainEqual({
      "@type": "Offer",
      "@id": `${url}#offer-${item.id}`,
      sku: item.id,
      name: item.name,
      url,
      price: String(item.price),
      priceCurrency: "UAH",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    });
  }
});

test("discounted paper and digital offers match the visible format prices", async ({ page, request }) => {
  const product = await createProduct(request, {
    slug: "seo-discount-book",
    items: [
      { ...existingProduct.items[0], discountPrice: 299.95 },
      existingProduct.items[1],
    ],
  });
  const response = await page.goto(`/books/${product.slug}`);
  const jsonLd = productJsonLd(await response!.text());
  expect(jsonLd.offers.map((offer: { price: string }) => offer.price)).toEqual(["299.95", "180"]);
  expect(jsonLd.offers.every((offer: { priceCurrency: string }) => offer.priceCurrency === "UAH")).toBe(true);
  await expect(page.getByRole("radio", { name: "Паперова • 299.95 грн" })).toBeChecked();
  await expect(page.getByRole("button", { name: /Купити —/ })).toContainText("299.95 грн");
  await page.getByRole("radio", { name: "Електронна • 180 грн" }).check();
  await expect(page.getByRole("button", { name: /Купити —/ })).toHaveText("Купити — 180 грн");
});

test("zero-price discounts match the visible purchase price", async ({ page, request }) => {
  const product = await createProduct(request, {
    slug: "seo-free-book",
    items: [{ ...existingProduct.items[0], discountPrice: 0 }],
  });
  const response = await page.goto(`/books/${product.slug}`);
  expect(productJsonLd(await response!.text()).offers[0]).toMatchObject({ price: "0", priceCurrency: "UAH" });
  await expect(page.getByRole("button", { name: /Купити —/ })).toContainText("0 грн");
  await expect(page.getByRole("button", { name: /Купити —/ }).locator("del")).toHaveText("350");
});

for (const availability of [
  { slug: "seo-in-stock", isAvailable: true, canPreorder: true, schema: "InStock", label: /Купити —/ },
  { slug: "seo-preorder", isAvailable: false, canPreorder: true, schema: "PreOrder", label: /Передзамовити —/ },
  { slug: "seo-unavailable", isAvailable: false, canPreorder: false, schema: "OutOfStock", label: "Немає в наявності" },
]) {
  test(`offer availability matches the purchase controls: ${availability.schema}`, async ({ page, request }) => {
    const product = await createProduct(request, {
      slug: availability.slug,
      items: [{ ...existingProduct.items[0], isAvailable: availability.isAvailable, canPreorder: availability.canPreorder }],
    });
    const response = await page.goto(`/books/${product.slug}`);
    expect(productJsonLd(await response!.text()).offers[0].availability).toBe(`https://schema.org/${availability.schema}`);
    const button = page.getByRole("button", { name: availability.label, exact: true });
    if (availability.schema === "OutOfStock") await expect(button).toBeDisabled();
    else await expect(button).toBeEnabled();
  });
}

test("unknown author and publisher are omitted and blank SEO text falls back to content", async ({ request }) => {
  const product = await createProduct(request, {
    slug: "seo-missing-fields",
    author: null,
    physicalDetails: { publisher: "  " },
    seoDescription: "  ",
    description: "Опис книги без відомого видавця.",
  });
  const jsonLd = productJsonLd(await (await request.get(`/books/${product.slug}`)).text());
  expect(jsonLd.description).toBe(product.description);
  for (const field of ["author", "publisher", "brand", "isbn", "datePublished"]) {
    expect(jsonLd).not.toHaveProperty(field);
  }
});

for (const type of [2, 3]) {
  test(`non-book product type ${type} does not claim Book metadata`, async ({ request }) => {
    const product = await createProduct(request, { slug: `seo-product-type-${type}`, type });
    const html = await (await request.get(`/books/${product.slug}`)).text();
    const jsonLd = productJsonLd(html);
    expect(jsonLd["@type"]).toBe("Product");
    expect(html).toContain('<meta property="og:type" content="website"');
    expect(html).not.toContain('<meta property="book:isbn"');
    for (const field of ["bookFormat", "isbn", "author", "publisher", "datePublished"]) {
      expect(jsonLd).not.toHaveProperty(field);
    }
    expect(jsonLd.offers[0]).toMatchObject({ price: "420", priceCurrency: "UAH" });
  });
}

test("JSON-LD safely round-trips quotes and closing script tags from product data", async ({ request }) => {
  const name = 'Книга </script><script id="seo-injected">alert("test")</script> & «цитати»';
  const product = await createProduct(request, { slug: "seo-script-text", name });
  const html = await (await request.get(`/books/${product.slug}`)).text();
  expect(productJsonLd(html).name).toBe(name);
  expect(html).not.toContain('<script id="seo-injected">');
  expect(html).toContain("\\u003c/script>");
});

test("long contributor lists stay out of concise search and social titles", async ({ page, request }) => {
  const name = "Під шепіт снігу: збірка різдвяної прози";
  const product = await createProduct(request, {
    slug: "seo-anthology",
    name,
    author: Array.from({ length: 20 }, (_, index) => `Український автор ${index + 1}`).join(", "),
  });
  await page.goto(`/books/${product.slug}`);
  await expect(page).toHaveTitle(`${name} | Lily's Books`);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", name);
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", name);
  expect(productJsonLd(await (await request.get(`/books/${product.slug}`)).text()).author.name).toBe(product.author);
});

test("long product names receive a bounded title without changing their visible name", async ({ page, request }) => {
  const name = "Українська збірка оповідань про зимові подорожі, родинне тепло та несподівані зустрічі";
  const product = await createProduct(request, { slug: "seo-long-name", name });
  await page.goto(`/books/${product.slug}`);
  const title = await page.title();
  expect(title.length).toBeLessThanOrEqual(70);
  expect(title).toMatch(/^Українська збірка оповідань/);
  expect(title).toContain("… | Lily's Books");
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
});

test("every sitemap page has distinct concise metadata in the initial HTML", async ({ page, request }) => {
  await request.post("/api/revalidate", {
    headers: { "x-revalidation-secret": "zvy11-test-secret" },
    data: { slug: "test-book" },
  });
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  expect(urls.length).toBeGreaterThan(5);
  const titles: string[] = [];
  const descriptions: string[] = [];
  for (const url of urls) {
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    const metadata = await page.evaluate(html => {
      const document = new DOMParser().parseFromString(html, "text/html");
      return {
        title: document.querySelector("title")?.textContent ?? "",
        description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
      };
    }, await response.text());
    expect(metadata.title.length, url).toBeGreaterThan(0);
    expect(metadata.title.length, url).toBeLessThanOrEqual(70);
    expect(metadata.description.length, url).toBeGreaterThan(0);
    expect(metadata.description.length, url).toBeLessThanOrEqual(160);
    titles.push(metadata.title);
    descriptions.push(metadata.description);
  }
  expect(new Set(titles).size).toBe(urls.length);
  expect(new Set(descriptions).size).toBe(urls.length);
});
