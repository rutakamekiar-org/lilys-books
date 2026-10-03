// Documentation-only API double. Binds to loopback and never contacts payment,
// delivery, notification, or persistence services.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const catalog = JSON.parse(await readFile(new URL('./catalog-snapshot.json', import.meta.url), 'utf8'));
// The corresponding images are already checked into the storefront. Use those
// assets locally, retaining the original public API snapshot as provenance.
for (const product of catalog) {
  const localAsset = value => value?.replace(/^https:\/\/zvychajna\.pp\.ua(?=\/images\/)/, '');
  product.imageUrl = localAsset(product.imageUrl);
  product.imageUrls = product.imageUrls?.map(localAsset);
}
let scenario = 'normal';
let invoiceRequests = 0;
let lastInvoiceRequest = null;
const scenarios = ['normal', 'empty', 'unavailable', 'product-error', 'invoice-error', 'invoice-loading'];
const send = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': 'http://127.0.0.1:3100',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1:4100');
    if (req.method === 'OPTIONS') return send(res, 200, {});
    if (url.pathname === '/__health') return send(res, 200, { ok: true });
    if (url.pathname === '/__control/state') return send(res, 200, { scenario, invoiceRequests, lastInvoiceRequest });
    if (req.method === 'POST' && url.pathname === '/__control/scenario') {
      let body = ''; for await (const chunk of req) body += chunk;
      const next = JSON.parse(body).scenario;
      if (!scenarios.includes(next)) return send(res, 400, { scenarios });
      scenario = next; invoiceRequests = 0; lastInvoiceRequest = null;
      return send(res, 200, { scenario });
    }
    const products = scenario === 'empty' ? [] : structuredClone(catalog);
    if (scenario === 'unavailable') for (const product of products) for (const item of product.items) {
      item.isAvailable = false; item.canPreorder = false;
    }
    if (url.pathname === '/api/products') return send(res, 200, products);
    if (url.pathname.startsWith('/api/products/')) {
      if (scenario === 'product-error') return send(res, 500, { message: 'Controlled baseline failure' });
      const product = products.find(p => p.slug === decodeURIComponent(url.pathname.slice('/api/products/'.length)));
      return send(res, product ? 200 : 404, product ?? {});
    }
    if (url.pathname === '/api/PromoCode/validate') {
      const code = url.searchParams.get('code');
      return send(res, code === 'BASELINE10' ? 200 : 404, code === 'BASELINE10'
        ? { code, type: 1, value: 10, applicableProductItemIds: null, remainingUsages: null }
        : { message: 'Invalid baseline promo' });
    }
    if (req.method === 'POST' && url.pathname === '/api/invoice') {
      let body = ''; for await (const chunk of req) body += chunk;
      lastInvoiceRequest = JSON.parse(body); invoiceRequests++;
      if (scenario === 'invoice-loading') await new Promise(resolve => setTimeout(resolve, 15000));
      if (scenario === 'invoice-error') return send(res, 500, { message: 'Controlled invoice failure' });
      // Return to the existing home screen; this is not proof of payment success.
      return send(res, 200, { redirectUrl: 'http://127.0.0.1:3100/' });
    }
    return send(res, 404, {});
  } catch (error) { send(res, 400, { message: error.message }); }
});
server.listen(4100, '127.0.0.1', () => console.log('ZVY-52 capture API: http://127.0.0.1:4100'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
