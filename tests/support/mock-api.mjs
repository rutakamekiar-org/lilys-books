import { createServer } from "node:http";

const port = 4100;
const host = "127.0.0.1";

const existingProduct = {
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

const unavailableProduct = {
  ...existingProduct,
  id: "20000000-0000-4000-8000-000000000001",
  name: "Unavailable Book",
  slug: "unavailable-book",
  isHero: false,
  seoDescription: "An unavailable test product.",
  items: [{ ...existingProduct.items[0], id: "21000000-0000-4000-8000-000000000001", name: "Паперова Unavailable Book", isAvailable: false, canPreorder: false }],
};

function initialState() {
  return {
    products: [structuredClone(existingProduct), structuredClone(unavailableProduct)],
    failingSlugs: new Set(),
    invoiceRequests: 0,
  };
}

let state = initialState();

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Access-Control-Allow-Headers": "Content-Type, X-Revalidation-Secret",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(status === 204 ? undefined : JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);

  if (request.method === "OPTIONS") return sendJson(response, 204, {});
  if (request.method === "GET" && url.pathname === "/__health") return sendJson(response, 200, { ok: true });

  if (request.method === "POST" && url.pathname === "/__control/reset") {
    state = initialState();
    return sendJson(response, 200, { reset: true });
  }

  if (request.method === "POST" && url.pathname === "/__control/products") {
    const product = await readJson(request);
    state.products = [...state.products.filter(candidate => candidate.slug !== product.slug), product];
    return sendJson(response, 200, product);
  }

  if (request.method === "POST" && url.pathname === "/__control/failures") {
    const body = await readJson(request);
    state.failingSlugs = new Set(body.slugs ?? []);
    return sendJson(response, 200, { slugs: [...state.failingSlugs] });
  }

  if (request.method === "GET" && url.pathname === "/__control/state") {
    return sendJson(response, 200, { products: state.products, failingSlugs: [...state.failingSlugs], invoiceRequests: state.invoiceRequests });
  }

  if (request.method === "GET" && url.pathname === "/api/products") {
    return sendJson(response, 200, state.products.filter(product => product.isActive !== false));
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/products/")) {
    const slug = decodeURIComponent(url.pathname.slice("/api/products/".length));
    if (state.failingSlugs.has(slug)) return sendJson(response, 500, { error: "Simulated product API failure." });
    const product = state.products.find(candidate => candidate.slug === slug && candidate.isActive !== false);
    return sendJson(response, product ? 200 : 404, product ?? { error: "Not found." });
  }

  if (request.method === "POST" && url.pathname === "/api/invoice") {
    state.invoiceRequests += 1;
    return sendJson(response, 200, { redirectUrl: "https://example.invalid/test-payment" });
  }

  return sendJson(response, 404, { error: "Unknown mock endpoint." });
});

server.listen(port, host, () => console.log(`ZVY-11 mock API listening on http://${host}:${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
