// Audit-only loopback API. No production or external service calls.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const snapshot = JSON.parse(await readFile(new URL('../storefront-baseline/catalog-snapshot.json', import.meta.url), 'utf8'));
export const scenarios = ['normal', 'unavailable', 'paper-unavailable', 'discount', 'suggestion-unavailable', 'product-error', 'product-loading'];
export function productsFor(scenario) {
  if (!scenarios.includes(scenario)) throw new Error('Unknown audit scenario');
  const products = structuredClone(snapshot);
  for (const product of products) {
    const local = value => value?.replace(/^https:\/\/zvychajna\.pp\.ua(?=\/images\/)/, '');
    product.imageUrl = local(product.imageUrl);
    product.imageUrls = product.imageUrls?.map(local);
    for (const item of product.items) {
      if (scenario === 'unavailable' || (scenario === 'paper-unavailable' && product.slug === 'zvychajna' && item.type === 1) || (scenario === 'suggestion-unavailable' && product.slug === 'inaksha-art')) {
        item.isAvailable = false;
        item.canPreorder = false;
      }
      if (scenario === 'discount' && product.slug === 'zvychajna') item.discountPrice = item.type === 1 ? 399 : 149;
    }
  }
  return products;
}
export function createAuditServer() {
  let scenario = 'normal';
  let invoiceRequests = 0;
  let productRequests = 0;
  const send = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': 'http://127.0.0.1:3100', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (req.method === 'OPTIONS') return send(res, 200, {});
      if (url.pathname === '/__health') return send(res, 200, { ok: true });
      if (url.pathname === '/__control/state') return send(res, 200, { scenario, invoiceRequests, productRequests });
      if (req.method === 'POST' && url.pathname === '/__control/scenario') {
        let body = ''; for await (const chunk of req) body += chunk;
        const next = JSON.parse(body).scenario;
        if (!scenarios.includes(next)) return send(res, 400, { scenarios });
        scenario = next; productRequests = 0; invoiceRequests = 0;
        return send(res, 200, { scenario });
      }
      if (url.pathname === '/api/products') return send(res, 200, productsFor(scenario));
      if (url.pathname.startsWith('/api/products/')) {
        productRequests++;
        const currentScenario = scenario;
        if (currentScenario === 'product-loading') await new Promise(resolve => setTimeout(resolve, 5000));
        if (currentScenario === 'product-error') return send(res, 500, { message: 'Controlled ZVY-54 product failure' });
        const product = productsFor(currentScenario).find(p => p.slug === decodeURIComponent(url.pathname.slice('/api/products/'.length)));
        return send(res, product ? 200 : 404, product ?? {});
      }
      if (req.method === 'POST' && url.pathname === '/api/invoice') {
        invoiceRequests++;
        return send(res, 409, { message: 'Invoice submission is outside this selection audit' });
      }
      return send(res, 404, {});
    } catch { send(res, 400, { message: 'Invalid local audit request' }); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createAuditServer();
  server.listen(4100, '127.0.0.1', () => console.log('ZVY-54 audit API: http://127.0.0.1:4100'));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
