// Reproduzierbarer 90-Tage-Vergleich; Node 22, keine Abhängigkeiten.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('<script>') + 8, html.indexOf('const m_data_oberflaeche'));
const expected = JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-v8.json', import.meta.url)));
const rules = new Function(source + ';return m_data_rules.RULES;')();
let sales = 0;
const observed = source.replace("buche(state, schiff.owner, 'kosten', fee);", "buche(state, schiff.owner, 'kosten', fee); if(!kauf && schiff.klasse==='frachter' && state.owners[schiff.owner].kind==='trader') sale();");
const core = new Function('sale', observed + ';return m_core_index;')(() => sales++);
const plain = new Function(source + ';return m_core_index;')();
const report = [];
for (const entry of expected) {
  sales = 0;
  const s = core.createState(entry.seed);
  let ongoing = null, maxBlock = 0;
  const points = [];
  const start = performance.now();
  for (let tick = 1; tick <= 129600; tick++) {
    core.step(s);
    const traders = Object.values(s.ships).filter(x => x.klasse === 'frachter' && s.owners[x.owner].kind === 'trader');
    const blocked = traders.length > 0 && traders.every(x => {
      if (x.phase !== 'dock') return false;
      const st = s.systems[x.system].station;
      const p = core.preis(s, st, 'treibstoff');
      return !(x.ladung.treibstoff || 0) && (!(s.stations[st].lager.treibstoff || 0) || s.owners[x.owner].cash < p + core.gebuehr(s, rules, st, p));
    });
    if (blocked && ongoing === null) ongoing = tick;
    if (!blocked && ongoing !== null) { maxBlock = Math.max(maxBlock, tick - ongoing); ongoing = null; }
    if (tick % 60 === 0) assert(core.audit(s).ok);
    const ref = entry.points.find(p => p.tick === tick);
    if (ref) {
      const mangel = Object.values(s.stats.mangel).reduce((a, z) => a + Object.values(z).reduce((a, b) => a + b, 0), 0);
      assert.equal(core.hash(s), ref.hash, `Seed ${entry.seed}, Tick ${tick}`);
      assert.equal(mangel, ref.mangel);
      assert.equal(sales, ref.sales);
      points.push({ tick, hash: core.hash(s), mangel, sales });
    }
  }
  const repeat = plain.createState(entry.seed);
  for (const point of points) {
    while (repeat.tick < point.tick) plain.advance(repeat, Math.min(10000, point.tick - repeat.tick));
    assert.equal(plain.hash(repeat), point.hash);
  }
  assert.equal(core.hash(core.load(core.save(s))), core.hash(s));
  assert.equal(ongoing, null);
  report.push({ seed: entry.seed, maxBlock, seconds: (performance.now() - start) / 1000, points });
  console.log(JSON.stringify(report.at(-1)));
}
