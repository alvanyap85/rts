// Screenshots of a real (player-side) game: start from the title, let the AI play the player's side for a while,
// then look at the base and at a fight. Usage: node shot.cjs [scale]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const scale = +(process.argv[2] || 1);
  const b = await chromium.launch();
  const vw = +(process.argv[3] || 844), vh = +(process.argv[4] || 390);
  const pg = await b.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: scale, hasTouch: true });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.stack || e)));
  await pg.goto('file://' + path.join(__dirname, 'page.html'));
  await pg.waitForTimeout(800);
  await pg.click('#startBtn');
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: path.join(__dirname, 'g0-start.png') });
  // let the AI drive the player's side for a while
  await pg.evaluate(() => { const G = __cf.G; G.teams[0].ai = true; __cf.fast(30 * 200); G.teams[0].ai = false; });
  await pg.evaluate(() => { const G = __cf.G; const hq = G.ents.find(e => e.team === 0 && e.type === 'hq'); });
  if (await pg.evaluate(() => document.body.classList.contains('compact'))) { await pg.click('#rBuild'); await pg.click('#rRadar'); }
  await pg.click('#tabU');
  // give a few units ranks so the insignia show up
  await pg.evaluate(() => { const us = __cf.G.ents.filter(e => e.team === 0 && e.kind === 'u' && e.type !== 'harv'); us.slice(0, 3).forEach(u => u.rank = 1); us.slice(3, 6).forEach(u => u.rank = 2); });
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: path.join(__dirname, 'g1-base.png') });
  // find a fight
  for (let k = 0; k < 40; k++) {
    const found = await pg.evaluate(() => {
      const G = __cf.G; __cf.fast(30);
      const p = G.proj[0] || G.fx.find(f => f.k === 'tracer');
      if (!p) return false;
      return [p.x, p.y];
    });
    if (found) {
      await pg.evaluate(([x, y]) => { const G = __cf.G; G.reveal = true; __cf.fast(1); }, found);
      await pg.evaluate(([x, y]) => window.__cam && window.__cam(x, y), found);
      break;
    }
  }
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(__dirname, 'g2-fight.png') });
  console.log('ERRORS', errs);
  await b.close();
})();
