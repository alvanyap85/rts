// Close-up screenshot of the base at high zoom (for checking voxel detail).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto('file://' + path.join(__dirname, 'page.html'));
  await pg.click('#startBtn');
  await pg.evaluate(() => { const G = __cf.G; G.teams[0].ai = true; __cf.fast(30 * 200); G.teams[0].ai = false; });
  await pg.evaluate(() => { const G = __cf.G; const h = G.ents.find(e => e.team === 0 && e.type === 'hq'); window.__zoom(1.9); __cam(h.x + 40, h.y + 20); for (const e of G.ents) if (e.kind === 'b' && e.team === 0 && e.type === 'power') e.hp = e.maxhp * 0.6; });
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: path.join(__dirname, 'zoom.png') });
  console.log('ERRORS', errs);
  await b.close();
})();
