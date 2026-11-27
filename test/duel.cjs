// Equal-cost unit match-ups on open ground: how many units and how much value each side has left.
// Usage: node test/duel.cjs [rounds]   (needs test/page.html from sim.cjs)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const rounds = +(process.argv[2] || 6);
  const b = await chromium.launch();
  const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e.stack || e)));
  await pg.goto('file://' + path.join(__dirname, 'page.html'));
  const ups = [
    [['tank', 3], ['rocket', 8]],
    [['rifle', 24], ['rocket', 8]],
    [['tank', 3], ['rifle', 24]],
    [['tank', 3], ['rifle', 12], ['rocket', 4]],   // mixed: last two entries are side B
  ];
  for (const up of ups) {
    const A = [up[0]], B = up.slice(1);
    const r = await pg.evaluate(([A, B, rounds]) => {
      const cf = window.__cf; let res = [];
      for (let k = 0; k < rounds; k++) {
        cf.setAuto(true); cf.newGame(100 + k); cf.setAuto(false);
        const G = cf.G; G.demo = true;
        for (const tm of G.teams) tm.ai = false;
        for (const e of [...G.ents]) { G.byId.delete(e.id); }
        G.ents.length = 0; window.__clearBmap();
        const T = 32, y0 = 30 * T;
        const spawn = (team, list, x0) => { let i = 0; for (const [type, n] of list) for (let j = 0; j < n; j++, i++) window.__addUnit(team, type, x0 + (i % 4) * 18 + Math.random() * 4, y0 + Math.floor(i / 4) * 18 - 50); };
        spawn(0, A, 6 * T); spawn(1, B, 16 * T);
        const val = t => G.ents.filter(e => e.team === t).reduce((a, e) => a + window.__cost(e.type) * e.hp / e.maxhp, 0);
        const v0 = [val(0), val(1)];
        for (const e of G.ents) window.__amove(e, e.team === 0 ? 17 * T : 6 * T, y0);
        let t = 0;
        while (t < 120 * 30 && G.ents.some(e => e.team === 0) && G.ents.some(e => e.team === 1)) { cf.step(); t++; if (t % 150 === 0) for (const e of G.ents) if (e.order.type === 'idle') window.__amove(e, e.team === 0 ? 17 * T : 6 * T, y0); }
        res.push([val(0) / v0[0], val(1) / v0[1], t / 30]);
      }
      return res;
    }, [A, B, rounds]);
    const avg = i => (r.reduce((a, x) => a + x[i], 0) / r.length);
    const winsA = r.filter(x => x[0] > x[1]).length;
    console.log(`${JSON.stringify(A)} vs ${JSON.stringify(B)}: A wins ${winsA}/${r.length}, value left A ${(avg(0) * 100).toFixed(0)}% B ${(avg(1) * 100).toFixed(0)}%, ${avg(2).toFixed(0)}s`);
  }
  console.log('ERRORS', errs.slice(0, 5));
  await b.close();
})();
