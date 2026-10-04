// Derive review images and an offline index from untouched browser exports.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('.', import.meta.url);
const journal = (await readFile(new URL('capture-journal.ndjson', root), 'utf8')).trim().split(/\r?\n/).map(JSON.parse);
const latest = new Map(journal.map(entry => [entry.filename, entry]));
const findings = JSON.parse(await readFile(new URL('findings.json', root), 'utf8'));
const checks = JSON.parse(await readFile(new URL('checks.json', root), 'utf8'));
for (const finding of findings) {
  for (const evidence of finding.evidence) {
    const [path, checkId] = evidence.split('#');
    if (!path.startsWith('paired/')) await readFile(new URL(path, root));
    if (checkId && !checks.some(check => check.id === checkId)) throw new Error(`Missing check: ${evidence}`);
  }
}
const captures = [];
for (const filename of (await readdir(new URL('screenshots/', root))).filter(name => name.endsWith('.jpg')).sort()) {
  const entry = latest.get(filename);
  if (!entry) throw new Error(`Missing capture metadata: ${filename}`);
  const bytes = await readFile(new URL(`screenshots/${filename}`, root));
  const { width, height } = await sharp(bytes).metadata();
  if (width > entry.viewport.width || width < entry.viewport.width - 16 || (!entry.fullPage && (height > entry.viewport.height || height < entry.viewport.height - 40))) throw new Error(`Unexpected export dimensions: ${filename}`);
  captures.push({ ...entry, image: { width, height }, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await writeFile(new URL('captures.json', root), JSON.stringify(captures, null, 2) + '\n');
await mkdir(new URL('paired/', root), { recursive: true });
await mkdir(new URL('qa/', root), { recursive: true });
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const ids = [...new Set(captures.map(entry => entry.id))];
const uploads = [];
const tiles = [];
const sections = [];
for (const id of ids) {
  const selected = [1440, 390, 360].map(width => captures.find(entry => entry.id === id && entry.viewport.width === width));
  if (selected.some(entry => !entry)) throw new Error(`Missing viewport: ${id}`);
  const pairWidth = selected.reduce((sum, entry) => sum + entry.image.width + 20, 20);
  const header = 66;
  const height = header + Math.max(...selected.map(entry => entry.image.height));
  const layers = [];
  const labels = [];
  let x = 20;
  for (const entry of selected) {
    layers.push({ input: await readFile(new URL(`screenshots/${entry.filename}`, root)), top: header, left: x });
    labels.push(`<text x="${x}" y="27">${escape(id)} · ${entry.viewport.width}×${entry.viewport.height} CSS viewport</text><text x="${x}" y="49">${entry.fullPage ? 'Full page' : 'Viewport'} · export ${entry.image.width}×${entry.image.height}</text>`);
    x += entry.image.width + 20;
  }
  layers.push({ input: Buffer.from(`<svg width="${pairWidth}" height="${header}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#eef1f5"/><g font-family="Arial" font-size="15" fill="#142233">${labels.join('')}</g></svg>`), top: 0, left: 0 });
  const filename = `${id}.jpg`;
  const paired = new URL(`paired/${filename}`, root);
  await sharp({ create: { width: pairWidth, height, channels: 3, background: '#eef1f5' } }).composite(layers).jpeg({ quality: 85 }).toFile(fileURLToPath(paired));
  const bytes = await readFile(paired);
  uploads.push({ id, filename, path: `paired/${filename}`, size: bytes.length, contentType: 'image/jpeg', originals: selected.map(entry => entry.filename), sha256: createHash('sha256').update(bytes).digest('hex') });
  tiles.push(await sharp(bytes).resize({ width: 750, height: 1000, fit: 'inside' }).toBuffer());
  sections.push(`<section id="${escape(id)}"><h2>${escape(id)}</h2><p>${escape(selected[0].route)} — ${escape(selected[0].setup)}</p><a href="paired/${escape(filename)}"><img loading="lazy" src="paired/${escape(filename)}" alt="${escape(id)} desktop, mobile and narrow comparison"></a><p>Originals: ${selected.map(entry => `<a href="screenshots/${escape(entry.filename)}">${escape(entry.filename)}</a>`).join(' · ')}</p></section>`);
}
const tileHeight = Math.max(...await Promise.all(tiles.map(async tile => (await sharp(tile).metadata()).height))) + 20;
for (let start = 0; start < tiles.length; start += 6) {
  const layers = tiles.slice(start, start + 6).map((input, index) => ({ input, left: index % 2 * 750, top: Math.floor(index / 2) * tileHeight }));
  const output = new URL(`qa/contact-${start / 6 + 1}.jpg`, root);
  await sharp({ create: { width: 1500, height: 3 * tileHeight, channels: 3, background: '#fff' } }).composite(layers).jpeg({ quality: 85 }).toFile(fileURLToPath(output));
}
await writeFile(new URL('upload-manifest.json', root), JSON.stringify(uploads, null, 2) + '\n');
await writeFile(new URL('index.html', root), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZVY-55 cart and checkout audit evidence</title><style>body{font:16px/1.5 system-ui;margin:24px;color:#142233}img{max-width:100%;height:auto}section{border-top:1px solid #ccc;padding-top:18px;margin-top:30px}a{color:#164f91}</style><h1>ZVY-55 cart and checkout audit evidence</h1><p>Captured 2026-10-04. Desktop 1440×900, mobile 390×844, narrow 360×844. Browser exports omit some scrollbar space; originals and exact export dimensions are preserved.</p><p><a href="REPORT.md">Report</a> · <a href="findings.json">Findings</a> · <a href="checks.json">Checks</a> · <a href="captures.json">Capture manifest</a></p>${sections.join('\n')}</html>`);
console.log(JSON.stringify({ states: ids.length, originals: captures.length, paired: uploads.length, hashesAndDimensionsVerified: true }));
const reportPath = new URL('REPORT.md', root);
for (const finding of findings) {
  for (const path of finding.evidence.filter(path => path.startsWith('paired/'))) await readFile(new URL(path, root));
}
const report = (await readFile(reportPath, 'utf8')).split('<!-- GENERATED-FINDINGS -->')[0];
const groups = [...new Set(findings.map(finding => finding.group))];
const details = groups.map(group => `### ${group}\n\n` + findings.filter(finding => finding.group === group).map(finding => {
  const evidence = finding.evidence.map(path => path.includes('#') ? `\`${path}\`` : `[${path}](${path})`).join(' · ');
  const pictures = finding.evidence.filter(path => path.startsWith('paired/')).map(path => `![${finding.id}: desktop, mobile and narrow mobile](${path})`).join('\n\n');
  return `#### ${finding.id} — ${finding.title}\n\n**${finding.priority} · ${finding.classification}** · ${finding.status}\n\nScreens: ${finding.screenStates.join(', ')}. Routes: ${finding.routes.join(', ')}. Devices: ${finding.devices.join(', ')}. Scenario: ${finding.scenario}.\n\n${finding.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\n**Actual:** ${finding.actual}\n\n**Expected:** ${finding.expected}\n\n**Customer impact:** ${finding.impact}\n\n**Proposed improvement:** ${finding.improvement}\n\n**Limits:** ${finding.limits}\n\n**Related findings and issues:** ${finding.relatedFindings.length ? finding.relatedFindings.join(', ') : 'none'}.\n\n**Evidence:** ${evidence}\n\n${pictures}\n`;
}).join('\n')).join('\n');
const inventory = [...captures.map(entry => `screenshots/${entry.filename}`), ...uploads.map(entry => entry.path), ...Array.from({ length: Math.ceil(tiles.length / 6) }, (_, index) => `qa/contact-${index + 1}.jpg`)];
await writeFile(reportPath, report + '<!-- GENERATED-FINDINGS -->\n\n' + details + '\n## Generated evidence inventory\n\n' + inventory.map(path => `- [${path}](${path})`).join('\n') + '\n');
