// Rebuild metadata and presentation images from the unmodified browser captures.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(new URL('../../package.json', import.meta.url));
const sharp = require('sharp');
const journal = (await readFile(root + 'capture-journal.ndjson', 'utf8')).trim().split(/\r?\n/).map(JSON.parse);
const latest = new Map(journal.map(entry => [entry.filename, entry]));
const captures = [];
for (const filename of (await readdir(root + 'screenshots')).filter(name => name.endsWith('.jpg')).sort()) {
  const entry = latest.get(filename);
  if (!entry) throw new Error('Missing capture metadata: ' + filename);
  const bytes = await readFile(root + 'screenshots/' + filename);
  const { width, height } = await sharp(bytes).metadata();
  // The in-app browser exports the content surface, excluding its scrollbars.
  // Preserve the native bytes; report configured CSS viewport and export size separately.
  if (width > entry.viewport.width || width < entry.viewport.width - 16 || (!entry.fullPage && (height > entry.viewport.height || height < entry.viewport.height - 40))) throw new Error('Unexpected export dimensions: ' + filename);
  captures.push({ ...entry, image: { width, height }, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await writeFile(root + 'captures.json', JSON.stringify(captures, null, 2) + '\n');
await mkdir(root + 'paired', { recursive: true });
await mkdir(root + 'qa', { recursive: true });
const ids = [...new Set(captures.map(entry => entry.id))];
const uploads = [];
const qaTiles = [];
for (const id of ids) {
  const selected = [1440, 390, 360].map(width => captures.find(entry => entry.id === id && entry.viewport.width === width && entry.fullPage) ?? captures.find(entry => entry.id === id && entry.viewport.width === width));
  if (selected.some(entry => !entry)) throw new Error('Missing size: ' + id);
  const pairWidth = 2250, header = 66;
  const height = header + Math.max(...selected.map(entry => entry.image.height));
  let x = 20;
  const layers = [], labels = [];
  for (const entry of selected) {
    layers.push({ input: await readFile(root + 'screenshots/' + entry.filename), top: header, left: x });
    labels.push(`<text x="${x}" y="27">${id} · ${entry.viewport.width}×${entry.viewport.height} viewport</text><text x="${x}" y="49">${entry.fullPage ? 'Full-page supplement' : 'Viewport capture'} · exported ${entry.image.width}×${entry.image.height}</text>`);
    x += entry.image.width + 20;
  }
  layers.push({ input: Buffer.from(`<svg width="${pairWidth}" height="${header}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#eef1f5"/><g font-family="Arial" font-size="15" fill="#142233">${labels.join('')}</g></svg>`), top: 0, left: 0 });
  const filename = id + '.jpg';
  await sharp({ create: { width: pairWidth, height, channels: 3, background: '#eef1f5' } }).composite(layers).jpeg({ quality: 85 }).toFile(root + 'paired/' + filename);
  const bytes = await readFile(root + 'paired/' + filename);
  uploads.push({ id, filename, path: 'paired/' + filename, size: bytes.length, contentType: 'image/jpeg', title: id + ' — desktop / mobile / narrow', originals: selected.map(entry => entry.filename) });
  const tile = await sharp(root + 'paired/' + filename).resize({ width: 750, height: 1000, fit: 'inside' }).toBuffer();
  qaTiles.push(tile);
}
for (let start = 0; start < qaTiles.length; start += 6) {
  const batch = qaTiles.slice(start, start + 6);
  const layers = batch.map((input, index) => ({ input, left: index % 2 * 750, top: Math.floor(index / 2) * 1000 }));
  await sharp({ create: { width: 1500, height: 3000, channels: 3, background: '#ffffff' } }).composite(layers).jpeg({ quality: 85 }).toFile(root + `qa/contact-${start / 6 + 1}.jpg`);
}
await writeFile(root + 'upload-manifest.json', JSON.stringify(uploads, null, 2) + '\n');
console.log(JSON.stringify({ states: ids.length, originals: captures.length, paired: uploads.length, checkedExportDimensions: true }));
