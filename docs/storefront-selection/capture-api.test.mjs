import test from 'node:test';
import assert from 'node:assert/strict';
import { productsFor, createAuditServer } from './capture-api.mjs';

test('normal snapshot retains six offers, effective prices and preorder flags', () => {
  const products = productsFor('normal');
  assert.equal(products.length, 6);
  const book = products.find(p => p.slug === 'zvychajna');
  assert.deepEqual(book.items.map(i => i.price), [499, 199]);
  assert.equal(products.find(p => p.slug === 'pid_shepit_snihu').items[0].canPreorder, true);
  assert.ok(products.every(p => p.imageUrl.startsWith('/images/')));
});
test('partial availability retains purchasable digital alternative without mutating the snapshot', () => {
  const book = productsFor('paper-unavailable').find(p => p.slug === 'zvychajna');
  assert.equal(book.items[0].isAvailable, false);
  assert.equal(book.items[0].canPreorder, false);
  assert.equal(book.items[1].isAvailable, true);
  assert.equal(productsFor('normal').find(p => p.slug === 'zvychajna').items[0].isAvailable, true);
});
test('discount fixture preserves base prices and separates effective edition prices', () => {
  const book = productsFor('discount').find(p => p.slug === 'zvychajna');
  assert.deepEqual(book.items.map(i => [i.price, i.discountPrice]), [[499, 399], [199, 149]]);
});
test('unavailable suggestion does not disable the parent book', () => {
  const products = productsFor('suggestion-unavailable');
  assert.equal(products.find(p => p.slug === 'inaksha-art').items[0].isAvailable, false);
  assert.equal(products.find(p => p.slug === 'inaksha').items[0].isAvailable, true);
});
test('controlled failure and invoice refusal stay in loopback', async () => {
  const server = createAuditServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const invalid = await fetch(`${base}/__control/scenario`, { method: 'POST', body: JSON.stringify({ scenario: 'unknown' }) });
    assert.equal(invalid.status, 400);
    await fetch(`${base}/__control/scenario`, { method: 'POST', body: JSON.stringify({ scenario: 'product-error' }) });
    assert.equal((await fetch(`${base}/api/products/zvychajna`)).status, 500);
    assert.equal((await fetch(`${base}/api/invoice`, { method: 'POST', body: '{}' })).status, 409);
    const state = await (await fetch(`${base}/__control/state`)).json();
    assert.equal(state.invoiceRequests, 1);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
