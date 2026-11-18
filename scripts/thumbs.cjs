// Renders catalog thumbnails (720×450 JPEG) for every study, or for the numbers given:
//   node scripts/thumbs.cjs          all studies
//   node scripts/thumbs.cjs 4 27     only #004 and #027
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { ROOT, loadManifest, serve, pool } = require('./lib.cjs');

(async () => {
  const only = process.argv.slice(2).map(Number);
  const works = loadManifest().filter(w => !only.length || only.includes(w.n));
  const { server, base } = await serve();
  const browser = await chromium.launch();
  const shrink = await browser.newPage();
  await pool(works, 4, async w => {
    const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
    await page.goto(base + w.file, { waitUntil: 'load' });
    await page.waitForTimeout(2600);
    const png = (await page.screenshot({ type: 'png' })).toString('base64');
    await page.close();
    const jpg = await shrink.evaluate(async b64 => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = 720; c.height = 450; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, 720, 450);
      return c.toDataURL('image/jpeg', 0.8).split(',')[1];
    }, png);
    fs.writeFileSync(path.join(ROOT, w.thumb), Buffer.from(jpg, 'base64'));
    console.log('rendered', w.thumb);
  });
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
