// Audit-only loopback API. It never contacts payment, delivery or notification services.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const snapshot = JSON.parse(await readFile(new URL('../storefront-baseline/catalog-snapshot.json', import.meta.url), 'utf8'));
export const scenarios = ['normal', 'discount', 'unavailable', 'invoice-error', 'invoice-validation', 'invoice-loading', 'promo-error', 'promo-loading'];
export function productsFor(scenario) {
  if (!scenarios.includes(scenario)) throw new Error('Unknown audit scenario');
  const products = structuredClone(snapshot);
  for (const product of products) {
    const local = value => value?.replace(/^https:\/\/zvychajna\.pp\.ua(?=\/images\/)/, '');
    product.imageUrl = local(product.imageUrl);
    product.imageUrls = product.imageUrls?.map(local);
    for (const item of product.items) {
      if (scenario === 'unavailable') { item.isAvailable = false; item.canPreorder = false; }
      if (scenario === 'discount' && product.slug === 'zvychajna') item.discountPrice = item.type === 1 ? 399 : 149;
    }
  }
  return products;
}
export function createAuditServer({ delayMs = 10000 } = {}) {
  let scenario = 'normal';
  let invoiceRequests = [];
  let promoRequests = [];
  const send = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': 'http://127.0.0.1:3100', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };
  const body = async req => { let value = ''; for await (const chunk of req) value += chunk; return JSON.parse(value); };
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (req.method === 'OPTIONS') return send(res, 200, {});
      if (url.pathname === '/__health') return send(res, 200, { ok: true });
      if (url.pathname === '/__control/state') return send(res, 200, { scenario, invoiceRequests, promoRequests });
      if (req.method === 'POST' && url.pathname === '/__control/scenario') {
        const next = (await body(req)).scenario;
        if (!scenarios.includes(next)) return send(res, 400, { scenarios });
        scenario = next; invoiceRequests = []; promoRequests = [];
        return send(res, 200, { scenario });
      }
      if (url.pathname === '/api/products') return send(res, 200, productsFor(scenario));
      if (url.pathname.startsWith('/api/products/')) {
        const product = productsFor(scenario).find(p => p.slug === decodeURIComponent(url.pathname.slice('/api/products/'.length)));
        return send(res, product ? 200 : 404, product ?? {});
      }
      if (url.pathname === '/api/PromoCode/validate') {
        const current = scenario;
        const code = (url.searchParams.get('code') ?? '').toUpperCase();
        const ids = url.searchParams.getAll('productItemIds');
        promoRequests.push({ code, ids });
        if (current === 'promo-loading') await new Promise(resolve => setTimeout(resolve, delayMs));
        if (current === 'promo-error') return send(res, 503, { message: 'Controlled promo service failure' });
        const paperId = snapshot.find(p => p.slug === 'zvychajna').items.find(i => i.type === 1).id;
        const codes = {
          AUDIT10: { type: 1, value: 10 },
          AUDIT100: { type: 1, value: 100 },
          PAPER10: { type: 1, value: 10, applicableProductItemIds: [paperId] },
          ONE10: { type: 1, value: 10, remainingUsages: 1 },
          FIXED50: { type: 0, value: 50 },
        };
        return codes[code] ? send(res, 200, { code, applicableProductItemIds: null, remainingUsages: null, ...codes[code] }) : send(res, 404, { message: 'Controlled invalid or expired promo' });
      }
      if (req.method === 'POST' && url.pathname === '/api/invoice') {
        const current = scenario;
        invoiceRequests.push(await body(req));
        if (current === 'invoice-loading') await new Promise(resolve => setTimeout(resolve, delayMs));
        if (current === 'invoice-error') return send(res, 500, { message: 'Controlled invoice failure' });
        if (current === 'invoice-validation' || current === 'unavailable') return send(res, 400, { type: 'about:blank', title: 'One or more validation errors occurred.', status: 400, errors: { 'Items[0].ProductId': ['This offer is unavailable.'], 'Customer.Phone': ['Please enter a valid phone number.'] } });
        // The local home return is a handoff fixture, never a verified payment result.
        return send(res, 200, { redirectUrl: 'http://127.0.0.1:3100/?audit-handoff=unverified' });
      }
      return send(res, 404, {});
    } catch { send(res, 400, { message: 'Invalid local audit request' }); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createAuditServer();
  server.listen(4100, '127.0.0.1', () => console.log('ZVY-55 audit API: http://127.0.0.1:4100'));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
