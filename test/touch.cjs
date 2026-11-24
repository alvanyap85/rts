// Drives a real game by touch: build a power plant and place it, select the tank, order a move.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.stack || e)));
  await pg.goto('file://' + path.join(__dirname, 'page.html'));
  await pg.waitForTimeout(600);
  await pg.tap('#startBtn');
  await pg.waitForTimeout(300);
  const st = () => pg.evaluate(() => { const G = __cf.G, t = G.teams[0]; return { cr: t.credits | 0, bq: t.bq && { type: t.bq.type, prog: +t.bq.prog.toFixed(2), ready: t.bq.ready }, power: t.cnt.power || 0 }; });
  console.log('deploy btn visible', await pg.isVisible('#deployBtn'));
  await pg.tap('#deployBtn');
  await pg.waitForTimeout(100);
  console.log('after deploy', await pg.evaluate(() => __cf.G.teams[0].cnt), await pg.evaluate(() => document.getElementById('msgs').textContent));
  await pg.tap('.bb[aria-label="发电厂"]');
  await pg.evaluate(() => __cf.fast(30 * 8));
  console.log('after build', await st());
  await pg.waitForTimeout(200);
  await pg.tap('.bb[aria-label="发电厂"]');            // enter placing
  await pg.waitForTimeout(200);
  console.log('placing bar visible', await pg.isVisible('#placeBar'));
  await pg.tap('#placeOk');
  await pg.waitForTimeout(200);
  console.log('after place', await st());
  // select the tank by tapping it, then tap ground
  const tank = await pg.evaluate(() => { const G = __cf.G; const u = G.ents.find(e => e.team === 0 && e.type === 'tank'); const r = document.getElementById('cv').getBoundingClientRect(); return { sx: (u.x - 0) , id: u.id }; });
  const pos = await pg.evaluate(() => {
    const G = __cf.G; const u = G.ents.find(e => e.team === 0 && e.type === 'tank');
    // convert world->screen using the camera exposed through a tiny probe
    return window.__w2s(u.x, u.y);
  });
  await pg.touchscreen.tap(pos.x, pos.y);
  await pg.waitForTimeout(100);
  console.log('selected', await pg.evaluate(() => document.getElementById('selInfo').textContent));
  await pg.touchscreen.tap(pos.x + 150, pos.y - 60);
  const before = await pg.evaluate(() => { const u = __cf.G.ents.find(e => e.team === 0 && e.type === 'tank'); return [u.x | 0, u.y | 0, u.order.type]; });
  await pg.evaluate(() => __cf.fast(30 * 4));
  const after = await pg.evaluate(() => { const u = __cf.G.ents.find(e => e.team === 0 && e.type === 'tank'); return [u.x | 0, u.y | 0, u.order.type]; });
  console.log('tank before', before, 'after', after);
  // queue infantry: needs barracks, expect deny message
  await pg.tap('#tabU'); await pg.tap('.bb[aria-label="步枪兵"]');
  await pg.waitForTimeout(100);
  console.log('msg', await pg.evaluate(() => document.getElementById('msgs').textContent));
  await pg.screenshot({ path: path.join(__dirname, 'touch.png') });
  console.log('ERRORS', errs);
  await b.close();
})();
