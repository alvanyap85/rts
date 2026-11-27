// Touch gestures, repair and sell. Needs test/page.html from sim.cjs.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const errs = []; pg.on('pageerror', e => errs.push(String(e.stack || e)));
  await pg.goto('file://' + path.join(__dirname, 'page.html'));
  await pg.tap('#startBtn');
  await pg.tap('#deployBtn');
  await pg.evaluate(() => __cf.fast(30 * 4));
  await pg.evaluate(() => { const G = __cf.G; G.teams[0].ai = true; __cf.fast(30 * 150); G.teams[0].ai = false; for (const e of G.ents) if (e.team === 0 && e.kind === 'u' && e.type !== 'harv') e.order = { type: 'idle' }; });
  // synthetic touch pointer events on the map canvas
  const touch = (type, x, y) => pg.evaluate(([type, x, y]) => {
    const cv = document.getElementById('cv'), r = cv.getBoundingClientRect();
    cv.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', clientX: r.left + x, clientY: r.top + y, bubbles: true, isPrimary: true }));
  }, [type, x, y]);
  // 1. long press + drag over our army = box select
  const army = await pg.evaluate(() => { const G = __cf.G; const us = G.ents.filter(e => e.team === 0 && e.kind === 'u' && e.type !== 'harv'); const pts = us.map(u => __w2s(u.x, u.y)); const r = document.getElementById('cv').getBoundingClientRect(); return { n: us.length, pts: pts.map(p => [p.x - r.left, p.y - r.top]) }; });
  const xs = army.pts.map(p => p[0]), ys = army.pts.map(p => p[1]);
  const box = [Math.min(...xs) - 20, Math.min(...ys) - 20, Math.max(...xs) + 20, Math.max(...ys) + 20];
  // bring the army on screen first
  await pg.evaluate(() => { const G = __cf.G; const us = G.ents.filter(e => e.team === 0 && e.kind === 'u' && e.type !== 'harv'); const cx = us.reduce((a, u) => a + u.x, 0) / us.length, cy = us.reduce((a, u) => a + u.y, 0) / us.length; __cam(cx, cy); window.__zoom(0.5); __cam(cx, cy); });
  const on = await pg.evaluate(() => { const G = __cf.G, r = document.getElementById('cv').getBoundingClientRect(); return G.ents.filter(e => e.team === 0 && e.kind === 'u' && e.type !== 'harv').map(u => { const p = __w2s(u.x, u.y); return [p.x - r.left, p.y - r.top]; }).filter(p => p[0] > 0 && p[1] > 0 && p[0] < r.width && p[1] < r.height); });
  const bx = [Math.min(...on.map(p => p[0])) - 15, Math.min(...on.map(p => p[1])) - 15, Math.max(...on.map(p => p[0])) + 15, Math.max(...on.map(p => p[1])) + 15];
  await touch('pointerdown', bx[0], bx[1]);
  await pg.waitForTimeout(420);
  await touch('pointermove', (bx[0] + bx[2]) / 2, (bx[1] + bx[3]) / 2);
  await touch('pointermove', bx[2], bx[3]);
  await touch('pointerup', bx[2], bx[3]);
  console.log('box select: on screen', on.length, 'selected', await pg.evaluate(() => document.getElementById('selInfo').textContent));
  // 2. quick drag pans and flings
  const c0 = await pg.evaluate(() => __cf.G && [window.__camPos()]);
  await touch('pointerdown', 400, 200);
  for (let k = 1; k <= 6; k++) { await touch('pointermove', 400 - k * 30, 200); await pg.waitForTimeout(16); }
  await touch('pointerup', 220, 200);
  const c1 = await pg.evaluate(() => window.__camPos());
  await pg.waitForTimeout(500);
  const c2 = await pg.evaluate(() => window.__camPos());
  console.log('pan: start', c0[0].x | 0, 'after drag', c1.x | 0, 'after glide', c2.x | 0, '| selection kept:', await pg.evaluate(() => document.getElementById('selInfo').textContent.length > 0));
  // 3. repair: damage a power plant, select it, repair
  const pp = await pg.evaluate(() => { const G = __cf.G; const b = G.ents.find(e => e.team === 0 && e.type === 'power'); b.hp = b.maxhp * 0.4; G.teams[0].credits = 2000; __zoom(1); __cam(b.x, b.y); const p = __w2s(b.x, b.y); return { id: b.id, x: p.x, y: p.y }; });
  await pg.touchscreen.tap(pp.x, pp.y);
  await pg.waitForTimeout(150);
  console.log('selected building:', await pg.evaluate(() => document.getElementById('selInfo').textContent), '| buttons:', await pg.isVisible('#repairBtn'), await pg.isVisible('#sellBtn'));
  await pg.tap('#repairBtn');
  const r0 = await pg.evaluate(id => { const b = __cf.G.byId.get(id); return [b.hp | 0, __cf.G.teams[0].credits | 0, !!b.repairing]; }, pp.id);
  await pg.evaluate(() => __cf.fast(30 * 5));
  const r1 = await pg.evaluate(id => { const b = __cf.G.byId.get(id); return [b.hp | 0, __cf.G.teams[0].credits | 0, !!b.repairing]; }, pp.id);
  console.log('repair hp/credits/on', r0, '->', r1);
  // 4. sell: two taps (arm, confirm)
  await pg.tap('#sellBtn');
  console.log('sell button armed:', await pg.textContent('#sellBtn'));
  const cr0 = await pg.evaluate(() => __cf.G.teams[0].credits | 0);
  await pg.tap('#sellBtn');
  await pg.evaluate(() => __cf.fast(40));
  console.log('sold:', !(await pg.evaluate(id => __cf.G.byId.has(id), pp.id)), 'credits', cr0, '->', await pg.evaluate(() => __cf.G.teams[0].credits | 0), '| msg', await pg.textContent('#msgs'));
  await pg.screenshot({ path: path.join(__dirname, 'controls.png') });
  console.log('ERRORS', errs);
  await b.close();
})();
