// Isolierende 90-Tage-Kontrollen für den bestätigten Spielerfall, keine Regeländerung.
// LONGTERM_SOURCE_COMMIT=$(git rev-parse HEAD) node tools/longterm-v12-player-probes.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { coreSource, engine, independentAudit, sum } from './longterm-v12-observer.mjs';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const { c, r } = engine(coreSource(html));
const cases = {
  'nur-miner': [{ type: 'shipMine', schiff: 'sh001', ware: 'erz' }],
  'nur-handel': [{ type: 'shipHandeln', schiff: 'sh002' }],
  'nur-kauf': [{ type: 'shipTrade', schiff: 'sh002', ware: 'frachter', menge: 1, kauf: true },
    { type: 'shipActivate', schiff: 'sh002', klasse: 'frachter' }],
};
const results = [];
for (const [scenario, cmds] of Object.entries(cases)) {
  let s = c.createState(42), replay = c.createState(42);
  const points = [];
  for (let tick = 1; tick <= 90 * 1440; tick++) {
    if (cmds[tick - 1]) for (const state of [s, replay]) assert(c.submit(state, { owner: 'house', ...cmds[tick - 1] }, r).ok);
    const a = c.step(s, r), b = c.step(replay, r);
    assert.deepEqual(a, b); assert(a.every(x => x.ok));
    if (tick % 60 === 0) for (const state of [s, replay]) { assert(c.audit(state).ok); independentAudit(state); }
    if (tick % 1440 === 0) assert.equal(c.hash(s), c.hash(replay));
    if ([30, 90].includes(tick / 1440)) {
      assert.equal(c.canonical(s), c.canonical(replay));
      replay = c.load(c.save(replay), undefined, r);
      assert.equal(c.canonical(s), c.canonical(replay));
      points.push(structuredClone({ day: tick / 1440, hash: c.hash(s), shortage: s.stats.mangel,
        totalShortage: sum(Object.values(s.stats.mangel).flatMap(Object.values)),
        cash: Object.fromEntries(Object.entries(s.owners).map(([id, o]) => [id, o.cash])),
        fleets: Object.fromEntries(['house','npc1','npc2','npc3'].map(id => [id, Object.values(s.ships).filter(sh => sh.owner === id).length])) }));
    }
  }
  results.push({ scenario, seed: 42, commands: cmds, hourlyAuditsPerTrajectory: 2160, dailyHashComparisons: 90, points });
  console.log('PLAYER_PROBE_PASS ' + JSON.stringify(results.at(-1)));
}
const out = process.env.LONGTERM_PROBE_OUT || 'work/langzeit-probes';
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'player-probes.json'), JSON.stringify({
  sourceCommit: process.env.LONGTERM_SOURCE_COMMIT || process.env.GITHUB_SHA,
  codeSha256: createHash('sha256').update(html).digest('hex'), node: process.version, results,
}) + '\n');
