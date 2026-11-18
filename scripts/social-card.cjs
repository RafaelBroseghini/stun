// Renders social-card.jpg: the catalog's first screen in a wide viewport,
// sized for X/Twitter "summary_large_image" and Open Graph (1.91:1).
//   node scripts/social-card.cjs
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { ROOT, serve } = require('./lib.cjs');

const WIDTH = 1600, HEIGHT = 838, SCALE = 1.5; // → 2400 × 1257 px

(async () => {
  const { server, base } = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: SCALE, colorScheme: 'light' });
  await page.goto(base + 'index.html', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // Wait for the thumbnails that are on screen.
  await page.waitForFunction(() => [...document.querySelectorAll('.frame img')]
    .filter(i => i.getBoundingClientRect().top < innerHeight)
    .every(i => i.complete && i.naturalWidth > 0), null, { timeout: 15000 });
  await page.waitForTimeout(600);
  const out = path.join(ROOT, 'social-card.jpg');
  fs.writeFileSync(out, await page.screenshot({ type: 'jpeg', quality: 86 }));
  console.log('wrote', path.relative(ROOT, out), `${WIDTH * SCALE}×${Math.round(HEIGHT * SCALE)}`);
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
