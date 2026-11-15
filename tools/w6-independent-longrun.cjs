// Independent QA for #385. Research only; never enables W6 in the public UI.
// Run with Node22: node tools/w6-independent-longrun.cjs
'use strict';
const assert = require('node:assert/strict');
const W6 = require('./w6-szenarien.cjs');

// Reverse matching: each newer hull can cover at most one older consumed hull.
// This checks the proposed W6 reserve, not approval of its economic semantics.
function reserve(w, s, owner) {
  const available = {}, prices = w.rules.economy.waren;
  let total = 0;
  for (const sh of w.bericht(s).schiffe.filter(x => x.owner === owner).reverse()) {
    const price = prices[sh.klasse].basis;
    if (sh.buchwert === 0 && (available[sh.klasse] || 0) > 0) available[sh.klasse]--;
    else total += price - sh.buchwert;
    available[sh.klasse] = (available[sh.klasse] || 0) + 1;
  }
  return total;
}
function check(w, s) {
  assert.deepEqual(W6.pruefen(w, s), []);
  assert.equal(s.owners.house.cash, 3000);
  assert.ok(!Object.values(s.ships).some(sh => sh.owner === 'house'));
  for (const owner of ['npc3', 'transport']) {
    const hulls = w.bericht(s).schiffe.filter(sh => sh.owner === owner);
    const initial = w.rules.owners.find(o => o.id === owner).cash;
    const retained = s.kanon.politik.betriebsreserve[owner] || 0;
    const expected = Math.max(0, Math.min(s.owners[owner].cash - retained - reserve(w, s, owner),
      s.owners[owner].cash + hulls.reduce((sum, sh) => sum + sh.buchwert, 0) - initial));
    assert.equal(w.ausschuettbar(s, owner), expected, owner + ': independent reserve');
  }
  assert.equal(w.hash(w.load(w.save(s))), w.hash(s));
}
function run(id = 'S01') {
  const started = performance.now();
  const scenario = W6.SZENARIEN.find(x => x.id === id);
  if (!scenario) throw new RangeError('Unknown scenario: ' + id);
  const {welt: w, s} = W6.start(scenario.politik);
  const checkpoints = [];
  let mid;
  for (let day = 73; day <= 730; day += 73) {
    w.advance(s, day * 1440 - s.tick);
    // Reserve matching applies only when all three W6 switches are active.
    if (s.kanon.politik.stilllegung) check(w, s);
    else {
      assert.deepEqual(W6.pruefen(w, s), []);
      assert.equal(w.hash(w.load(w.save(s))), w.hash(s));
    }
    const result = {day, tick: s.tick, hash: w.hash(s), ...W6.kennzahlen(w, s)};
    checkpoints.push(result);
    console.log(JSON.stringify({checkpoint: result}));
    if (day === 365) mid = w.save(s);
  }
  const replay = w.load(mid);
  w.advance(replay, 365 * 1440);
  assert.deepEqual(W6.pruefen(w, replay), []);
  assert.equal(w.hash(replay), w.hash(s), '365-day saved continuation must match uninterrupted 730-day run');
  const result = {scenario: id, days: 730, checkpoints, replayHash: w.hash(replay),
    elapsedSeconds: (performance.now() - started) / 1000, ok: true};
  console.log(JSON.stringify({result}));
  return result;
}
module.exports = {reserve, check, run};
if (require.main === module) run(process.argv[2] || 'S01');
