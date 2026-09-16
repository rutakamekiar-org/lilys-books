import { createServer } from "node:http";
import { productFixtures } from "../fixtures/products.mjs";

const port = 4100;
const host = "127.0.0.1";

function initialState() {
  return {
    products: structuredClone(productFixtures),
    failingSlugs: new Set(),
    invoiceRequests: 0,
    lastInvoiceRequest: null,
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
    return sendJson(response, 200, {
      products: state.products,
      failingSlugs: [...state.failingSlugs],
      invoiceRequests: state.invoiceRequests,
      lastInvoiceRequest: state.lastInvoiceRequest,
    });
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

  if (request.method === "GET" && url.pathname === "/api/PromoCode/validate") {
    const code = url.searchParams.get("code")?.toUpperCase();
    const promos = {
      "NEAR-TOTAL": { code: "NEAR-TOTAL", type: 0, value: 498.95, applicableProductItemIds: null, remainingUsages: null },
      "EXACT-TOTAL": { code: "EXACT-TOTAL", type: 0, value: 499, applicableProductItemIds: null, remainingUsages: null },
    };
    const promo = code ? promos[code] : undefined;
    return sendJson(response, promo ? 200 : 404, promo ?? { error: "Invalid promo code." });
  }

  if (request.method === "POST" && url.pathname === "/api/invoice") {
    state.lastInvoiceRequest = await readJson(request);
    state.invoiceRequests += 1;
    return sendJson(response, 200, { redirectUrl: "https://example.invalid/test-payment" });
  }

  return sendJson(response, 404, { error: "Unknown mock endpoint." });
});

server.listen(port, host, () => console.log(`ZVY-11 mock API listening on http://${host}:${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
