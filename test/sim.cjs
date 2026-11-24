// Headless checks: loads the page, then runs AI-vs-AI games at full speed and logs how they go.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const src = fs.readFileSync(path.join(__dirname, '../src/game.html'), 'utf8');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${src}</body></html>`;
  fs.writeFileSync(path.join(__dirname, 'page.html'), html);
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.stack || e)));
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto('file://' + path.join(__dirname, 'page.html'));
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: path.join(__dirname, 'title.png') });
  const seeds = (process.argv[2] || '1,2,3').split(',').map(Number);
  const diff = +(process.argv[3] || 1);
  for (const seed of seeds) {
    const r = await pg.evaluate(([seed, diff]) => {
      const cf = window.__cf; cf.setAuto(true); cf.setDifficulty(diff); cf.newGame(seed); cf.setAuto(false);
      const G = cf.G; G.demo = true;
      const log = []; const t0 = performance.now(); let worst = 0;
      for (let m = 1; m <= 30 && !G.over; m++) {
        for (let i = 0; i < 1800 && !G.over; i++) { const a = performance.now(); cf.step(); worst = Math.max(worst, performance.now() - a); }
        const c = tm => { const o = {}; for (const e of G.ents) if (e.team === tm) o[e.type] = (o[e.type] || 0) + 1; return o; };
        log.push(`min ${m}: T0 $${G.teams[0].credits | 0} mined ${G.teams[0].mined} ${JSON.stringify(c(0))} | T1 $${G.teams[1].credits | 0} mined ${G.teams[1].mined} ${JSON.stringify(c(1))}`);
      }
      return { log, over: G.over, t: G.t | 0, ms: performance.now() - t0, worst };
    }, [seed, diff]);
    console.log('seed', seed, 'over', r.over, 'at', r.t, 's; sim ms', r.ms | 0, 'worst step ms', r.worst.toFixed(1));
    console.log(r.log.join('\n'));
  }
  console.log('ERRORS', errs.slice(0, 10));
  await b.close();
})();
