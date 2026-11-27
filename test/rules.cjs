// Rule checks: tanks crush enemy infantry; attack-moving units turn on whoever shoots them; the MCV drives, turns and unfolds.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e.stack || e)));
  await pg.goto('file://' + path.join(__dirname, 'page.html'));
  const out = await pg.evaluate(() => {
    const cf = window.__cf, T = 32, res = {};
    const fresh = () => { cf.setAuto(true); cf.newGame(7); cf.setAuto(false); const G = cf.G; G.demo = true; for (const tm of G.teams) tm.ai = false; for (const e of G.ents) G.byId.delete(e.id); G.ents.length = 0; window.__clearBmap(); return G; };
    // 1. crush: a tank told to drive through a line of enemy riflemen that cannot hurt it fast enough
    let G = fresh();
    const tank = window.__addUnit(0, 'tank', 5 * T, 30 * T);
    const inf = []; for (let k = 0; k < 4; k++) { const u = window.__addUnit(1, 'rifle', (8 + k * 0.7) * T, 30 * T); u.hp = u.maxhp; inf.push(u); }
    window.__move(tank, 13 * T, 30 * T);
    for (let i = 0; i < 30 * 6; i++) cf.step();
    res.crushed = inf.filter(u => !G.byId.has(u.id)).length + '/4 riflemen crushed, tank hp ' + (tank.hp | 0) + '/' + tank.maxhp + ', squash decals ' + G.decals.filter(d => d.k === 'squash').length;
    // 2. retaliation: an enemy tank attack-moving past our tank should switch to it once shot
    G = fresh();
    const attacker = window.__addUnit(1, 'tank', 6 * T, 30 * T);
    const target = window.__addBuilding(0, 'power', 10, 24);   // a harmless building it goes for
    window.__attack(attacker, target); G.teams[1].ai = true;
    const shooter = window.__addUnit(0, 'tank', 9 * T, 33 * T);
    for (let i = 0; i < 30 * 3; i++) cf.step();
    res.retaliate = 'enemy tank (AI) now targets ' + (attacker.target === shooter ? 'our tank (good)' : attacker.target === target ? 'the power plant (bad)' : String(attacker.target && attacker.target.type));
    // 3. MCV: deploy drives to the spot, turns, unfolds into a yard
    G = fresh();
    const mcv = window.__addUnit(0, 'mcv', 9.3 * T, 30.4 * T); mcv.dir = 2.5;
    window.__deploy(mcv);
    const seen = new Set(); let t = 0;
    while (t < 30 * 8) { cf.step(); t++; const y = G.ents.find(e => e.type === 'hq'); if (G.byId.has(mcv.id)) seen.add(mcv.order.type); if (y) { seen.add(y.unfold !== undefined ? 'unfolding' : 'yard ready'); if (y.unfold === undefined) break; } }
    res.mcv = [...seen].join(' -> ') + ' in ' + (t / 30).toFixed(1) + 's';
    return res;
  });
  console.log(out);
  console.log('ERRORS', errs);
  await b.close();
})();
