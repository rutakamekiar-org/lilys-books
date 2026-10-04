import test from 'node:test';
import assert from 'node:assert/strict';
import { productsFor, createAuditServer } from './capture-api.mjs';

test('fixtures preserve baseline prices, distinguish discounts and isolate availability changes', () => {
  const normal = productsFor('normal');
  assert.equal(normal.length, 6);
  assert.deepEqual(normal.find(p => p.slug === 'zvychajna').items.map(i => i.price), [499, 199]);
  assert.ok(normal.every(p => p.imageUrl.startsWith('/images/')));
  assert.deepEqual(productsFor('discount').find(p => p.slug === 'zvychajna').items.map(i => i.discountPrice), [399, 149]);
  assert.ok(productsFor('unavailable').every(p => p.items.every(i => !i.isAvailable && !i.canPreorder)));
  assert.equal(productsFor('normal').find(p => p.slug === 'zvychajna').items[0].isAvailable, true);
  assert.throws(() => productsFor('unknown'));
});

async function withServer(run) {
  const server = createAuditServer({ delayMs: 20 });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, value) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
  try { await run({ base, post }); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

test('promo contracts cover global percentage, fixed, restricted, limited, invalid and outage results', () => withServer(async ({ base, post }) => {
  for (const [code, type, value] of [['AUDIT10', 1, 10], ['AUDIT100', 1, 100], ['FIXED50', 0, 50]]) {
    const data = await (await fetch(base + '/api/PromoCode/validate?code=' + code)).json();
    assert.equal(data.type, type); assert.equal(data.value, value);
  }
  const paper = await (await fetch(base + '/api/PromoCode/validate?code=PAPER10')).json();
  assert.deepEqual(paper.applicableProductItemIds, [productsFor('normal').find(p => p.slug === 'zvychajna').items[0].id]);
  assert.equal((await (await fetch(base + '/api/PromoCode/validate?code=ONE10')).json()).remainingUsages, 1);
  assert.equal((await fetch(base + '/api/PromoCode/validate?code=INVALID')).status, 404);
  await post('/__control/scenario', { scenario: 'promo-error' });
  assert.equal((await fetch(base + '/api/PromoCode/validate?code=AUDIT10')).status, 503);
}));

test('invoice fixture records synthetic requests and exposes distinct error, validation and unverified handoff states', () => withServer(async ({ base, post }) => {
  const request = { customer: { firstName: 'Audit', lastName: 'Test', email: 'audit@example.invalid' }, items: [{ productId: 'synthetic', quantity: 1 }], orderNote: 'No real order' };
  for (const [scenario, status] of [['invoice-error', 500], ['invoice-validation', 400], ['unavailable', 400], ['invoice-loading', 200], ['normal', 200]]) {
    await post('/__control/scenario', { scenario });
    const response = await post('/api/invoice', request);
    assert.equal(response.status, status);
    const data = await response.json();
    if (status === 200) assert.equal(data.redirectUrl, 'http://127.0.0.1:3100/?audit-handoff=unverified');
    if (status === 400) assert.ok(data.errors['Items[0].ProductId']);
    const state = await (await fetch(base + '/__control/state')).json();
    assert.deepEqual(state.invoiceRequests, [request]);
  }
  assert.equal((await post('/__control/scenario', { scenario: 'unknown' })).status, 400);
  assert.equal((await fetch(base + '/api/products/missing')).status, 404);
}));

test('changing a scenario during pending submission does not change that request outcome', () => withServer(async ({ base, post }) => {
  await post('/__control/scenario', { scenario: 'invoice-loading' });
  const pending = post('/api/invoice', { items: [] });
  let state;
  do { state = await (await fetch(base + '/__control/state')).json(); } while (!state.invoiceRequests.length);
  await post('/__control/scenario', { scenario: 'invoice-error' });
  assert.equal((await pending).status, 200);
}));
