import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('.', import.meta.url);
const states = JSON.parse(await readFile(new URL('states.json', root), 'utf8'));
const captures = JSON.parse(await readFile(new URL('captures.json', root), 'utf8'));
const published = JSON.parse(await readFile(new URL('published-assets.json', root), 'utf8').catch(() => '[]'));
const base = (await readFile(new URL('REFERENCE.md', root), 'utf8')).split('<!-- GENERATED-STATES -->')[0];
const sections = states.map(([id, title, purpose, understanding, next]) => {
  const entries = captures.filter(entry => entry.id === id);
  if (entries.length < 3) throw new Error('Missing state captures: ' + id);
  const representative = entries.find(entry => entry.viewport.width === 1440 && !entry.fullPage) ?? entries[0];
  const asset = published.find(entry => entry.id === id);
  const evidence = asset?.assetUrl ?? 'paired/' + id + '.jpg';
  return `### ${id} — ${title}\n\nRoute: \`${new URL(representative.url).pathname}\` (overlays retain this route).\n\nPurpose: ${purpose}\n\nCustomer must understand: ${understanding}\n\nSetup: ${representative.setup}\n\nExpected next action: ${next}\n\nCaptures: desktop 1440 × 900, mobile 390 × 844, narrow 360 × 844; ordered left to right below. ${entries.some(entry => entry.fullPage) ? 'Full-page supplements are shown; export heights vary.' : 'Viewport captures are shown.'} All originals, UTC times and exact exported dimensions are listed in captures.json. The environment and untested-state limitations above apply to this state.\n\n![${id}: desktop, mobile and narrow mobile](${evidence})\n\nOriginals: ${entries.map(entry => '`' + entry.filename + '`').join(', ')}.\n`;
}).join('\n');
const md = base + '<!-- GENERATED-STATES -->\n\n' + sections;
await writeFile(new URL('REFERENCE.md', root), md);
const escaped = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const cards = states.map(([id,title,purpose,understanding,next]) => {
  const entry = captures.find(item => item.id === id);
  return `<section id="${id}"><h2>${escaped(id + ' — ' + title)}</h2><p><b>Route:</b> ${escaped(new URL(entry.url).pathname)}</p><p><b>Purpose:</b> ${escaped(purpose)}</p><p><b>Understand:</b> ${escaped(understanding)}</p><p><b>Setup:</b> ${escaped(entry.setup)}</p><p><b>Next:</b> ${escaped(next)}</p><a href="paired/${id}.jpg"><img loading="lazy" src="paired/${id}.jpg" alt="${id}: desktop, mobile and narrow mobile"></a></section>`;
}).join('');
await writeFile(new URL('index.html', root), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ZVY-52 storefront baseline</title><style>body{font:16px/1.6 system-ui;margin:2rem auto;padding:0 1rem;max-width:1400px;color:#142233}a{color:#174c98}section{border-top:1px solid #ddd;padding:1rem 0}img{display:block;width:100%;height:auto}nav{display:flex;gap:1rem;flex-wrap:wrap}</style><h1>ZVY-52 storefront baseline</h1><p>36 states · 117 original captures · desktop 1440×900 / mobile 390×844 / narrow 360×844. Approved for completeness and correctness on 2026-10-04.</p><p>Images preserve native exports with their dimensions labeled. Full-page height varies. Local mock API; no real payments. Read <a href="REFERENCE.md">the full environment, journeys, reproduction steps, limitations and review gate</a>, or <a href="captures.json">the original-file manifest</a>. Click any paired image for its native size.</p><nav>${states.map(([id]) => `<a href="#${id}">${id}</a>`).join('')}</nav>${cards}</html>`);
console.log(`Rendered ${states.length} state descriptions; ${published.length} uploaded assets linked.`);
