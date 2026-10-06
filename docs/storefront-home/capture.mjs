// Run against the local baseline API and storefront only; no production calls.
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after.');
const root = new URL('./', import.meta.url);
await mkdir(new URL(`${phase}/`, root), { recursive: true });
const browser = await chromium.launch();
const metrics = [];
try {
  // Discard prerendered data from earlier test runs before using the baseline API.
  const revalidationContext = await browser.newContext();
  const revalidation = await revalidationContext.request.post('http://127.0.0.1:3100/api/revalidate', {
    headers: { 'x-revalidation-secret': process.env.CAPTURE_REVALIDATION_SECRET ?? 'local-home-capture' },
    data: { slug: 'inaksha' },
  });
  if (!revalidation.ok()) throw new Error('Local capture revalidation failed.');
  await revalidationContext.close();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname)
      ? route.continue() : route.abort());
    await page.goto('http://127.0.0.1:3100/');
    await page.getByRole('heading', { level: 1 }).waitFor();
    await page.locator('main img').evaluate(async image => { await image.decode(); });
    await page.evaluate(() => document.fonts.ready);
    const size = `${viewport.width}x${viewport.height}`;
    await page.screenshot({ path: fileURLToPath(new URL(`${phase}/home-${size}.png`, root)), animations: 'disabled' });
    await page.screenshot({ path: fileURLToPath(new URL(`${phase}/home-${size}-full.png`, root)), fullPage: true, animations: 'disabled' });
    const measured = await page.evaluate(() => {
      const bounds = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
      const title = document.querySelector('h1');
      const cover = document.querySelector('main img');
      const action = [...document.querySelectorAll('main a')].find(a => a.textContent.trim() === 'Детальніше');
      return { title: bounds(title), cover: bounds(cover), titleFont: getComputedStyle(title).fontSize, action: bounds(action), href: action.getAttribute('href') };
    });
    // Compare the rating pixels directly with the original viewport capture.
    // Only the separate Goodreads button is allowed to move on mobile.
    if (phase === 'after') {
      const rating = await page.getByRole('link', { name: /Середня оцінка/ }).boundingBox();
      if (rating && rating.y + rating.height <= viewport.height) {
        const region = { left: Math.floor(rating.x), top: Math.floor(rating.y), width: Math.ceil(rating.width), height: Math.ceil(rating.height) };
        const original = await sharp(fileURLToPath(new URL(`before/home-${size}.png`, root))).extract(region).raw().toBuffer();
        const current = await sharp(fileURLToPath(new URL(`${phase}/home-${size}.png`, root))).extract(region).raw().toBuffer();
        // Reordering changes the card height and its subtle background gradient.
        // Allow one RGB step for that backdrop, while retaining the rating pixels.
        if (original.length !== current.length || original.some((value, index) => Math.abs(value - current[index]) > 1)) {
          throw new Error(`Rating changed at ${viewport.width}px.`);
        }
      }
    }
    metrics.push({ viewport, ...measured });
    if (viewport.width < 600) {
      await page.evaluate(y => window.scrollTo(0, y), Math.max(0, measured.title.y - 120));
      await page.screenshot({ path: fileURLToPath(new URL(`${phase}/home-${size}-offer.png`, root)), animations: 'disabled' });
    }
    await page.close();
  }
  await writeFile(new URL(`${phase}/metrics.json`, root), JSON.stringify(metrics, null, 2) + '\n');
} finally { await browser.close(); }

if (phase === 'after') {
  const before = JSON.parse(await readFile(new URL('before/metrics.json', root), 'utf8'));
  for (const [index, result] of metrics.entries()) {
    for (const key of ['title', 'cover', 'titleFont', 'href']) {
      if (JSON.stringify(result[key]) !== JSON.stringify(before[index][key])) throw new Error(`${key} changed at ${result.viewport.width}px.`);
    }
    if (result.viewport.width === 1440 && JSON.stringify(result.action) !== JSON.stringify(before[index].action)) {
      throw new Error('Desktop action moved.');
    }
  }
  for (const { viewport } of metrics) {
    const size = `${viewport.width}x${viewport.height}`;
    const suffix = viewport.width < 600 ? '-offer' : '';
    const left = await readFile(new URL(`before/home-${size}${suffix}.png`, root));
    const right = await readFile(new URL(`after/home-${size}${suffix}.png`, root));
    const gap = 24;
    const width = viewport.width * 2 + gap;
    const label = Buffer.from(`<svg width="${width}" height="48"><rect width="100%" height="100%" fill="#faf9f7"/><g font-family="Segoe UI,Arial" font-size="20" fill="#1f1f1f"><text x="16" y="31">Before · ${viewport.width}px</text><text x="${viewport.width + gap + 16}" y="31">After · ${viewport.width}px</text></g></svg>`);
    await sharp({ create: { width, height: viewport.height + 48, channels: 3, background: '#faf9f7' } })
      .composite([{ input: label, top: 0, left: 0 }, { input: left, top: 48, left: 0 }, { input: right, top: 48, left: viewport.width + gap }])
      .png().toFile(fileURLToPath(new URL(`comparison-${size}.png`, root)));
  }
}
console.log(`${phase} captures saved; all requests restricted to loopback.`);
