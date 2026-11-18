// Smoke test: checks the manifest and file structure, loads every study,
// pokes it with pointer, click, wheel and key input, and fails on any script error.
// Then checks that the catalog renders, filters and opens the viewer.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { ROOT, loadManifest, serve, pool } = require('./lib.cjs');

const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);

function checkStructure(works) {
  if (works.length !== 100) fail('manifest', `expected 100 studies, found ${works.length}`);
  const seen = new Set();
  for (const w of works) {
    const where = `#${w.n} ${w.file}`;
    if (seen.has(w.n)) fail(where, 'duplicate number');
    seen.add(w.n);
    for (const k of ['title', 'cat', 'blurb', 'try', 'thumb']) if (!w[k]) fail(where, `missing ${k}`);
    const file = path.join(ROOT, w.file);
    if (!fs.existsSync(file)) { fail(where, 'file missing'); continue; }
    if (!fs.existsSync(path.join(ROOT, w.thumb))) fail(where, `thumbnail missing (${w.thumb})`);
    const html = fs.readFileSync(file, 'utf8');
    if (!/^<!doctype html>/i.test(html)) fail(where, 'missing <!doctype html>');
    if (!/<html lang="[a-z-]+"/i.test(html)) fail(where, 'missing <html lang>');
    if (!/<meta name="viewport"/.test(html)) fail(where, 'missing viewport meta');
    const t = /<title>([^<]+)<\/title>/.exec(html);
    if (!t) fail(where, 'missing <title>');
    else if (t[1] !== w.title) fail(where, `title "${t[1]}" does not match manifest "${w.title}"`);
    if (/<img\b/i.test(html)) fail(where, 'studies must not use bitmap <img> tags');
  }
  const onDisk = fs.readdirSync(path.join(ROOT, 'works')).filter(f => /^\d{3}-.*\.html$/.test(f));
  for (const f of onDisk) if (!works.some(w => w.file === `works/${f}`)) fail(`works/${f}`, 'not listed in manifest');
}

const IGNORED = [/Failed to load resource/i, /net::ERR_/i, /fonts\.(googleapis|gstatic)\.com/i, /AudioContext was not allowed to start/i];

async function exercise(browser, base, w) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !IGNORED.some(r => r.test(m.text()))) errs.push(m.text()); });
  try {
    await page.goto(base + w.file, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(700);
    for (const [x, y] of [[300, 200], [600, 375], [900, 500], [450, 600]]) { await page.mouse.move(x, y, { steps: 4 }); }
    await page.mouse.down(); await page.mouse.move(700, 420, { steps: 6 }); await page.mouse.up();
    await page.mouse.click(600, 375);
    await page.mouse.dblclick(620, 380);
    await page.mouse.wheel(0, 200);
    await page.keyboard.press('a'); await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const canvasOk = await page.evaluate(() => document.body && document.body.getBoundingClientRect().height > 0);
    if (!canvasOk) errs.push('page body did not render');
  } catch (e) { errs.push(e.message); }
  for (const e of errs) fail(`#${w.n} ${w.file}`, e);
  await page.close();
}

async function checkCatalog(browser, base, works) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(base + 'index.html', { waitUntil: 'load' });
  const plates = await page.locator('.plate').count();
  if (plates !== works.length) fail('catalog', `rendered ${plates} plates, expected ${works.length}`);
  await page.getByRole('button', { name: /^Sound/ }).click();
  const sound = works.filter(w => w.cat === 'Sound').length;
  const shown = await page.locator('.plate:not([hidden])').count();
  if (shown !== sound) fail('catalog', `Sound filter shows ${shown}, expected ${sound}`);
  await page.getByRole('button', { name: /^All/ }).click();
  await page.evaluate(() => { location.hash = 'no-042'; });
  await page.waitForTimeout(400);
  if (!(await page.locator('#room').isVisible())) fail('catalog', 'viewer did not open for #no-042');
  const src = await page.locator('#frame').getAttribute('src');
  const w42 = works.find(w => w.n === 42);
  if (src !== w42.file) fail('catalog', `viewer loaded ${src}, expected ${w42.file}`);
  await page.locator('#next').click();
  await page.waitForTimeout(200);
  if (!(await page.evaluate(() => location.hash)).endsWith('043')) fail('catalog', 'next button did not advance to #no-043');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  if (await page.locator('#room').isVisible()) fail('catalog', 'Esc did not close the viewer');
  for (const e of errs) fail('catalog', e);
  await page.close();
}

(async () => {
  const works = loadManifest();
  checkStructure(works);
  const { server, base } = await serve();
  const browser = await chromium.launch();
  let done = 0;
  await pool(works, 4, async w => { await exercise(browser, base, w); done++; if (done % 20 === 0) console.log(`exercised ${done}/${works.length}`); });
  await checkCatalog(browser, base, works);
  await browser.close(); server.close();
  if (failures.length) { console.error(`\n${failures.length} problem(s):\n` + failures.map(f => '  ✗ ' + f).join('\n')); process.exit(1); }
  console.log(`✓ ${works.length} studies and the catalog passed`);
})().catch(e => { console.error(e); process.exit(1); });
