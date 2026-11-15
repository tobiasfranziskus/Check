import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const W6 = require('../tools/w6-szenarien.cjs');
const QA = require('../tools/w6-independent-longrun.cjs');

test('QA W6: short and partial reporting intervals reach the advertised final day', () => {
  for (const days of [1, 31]) {
    const r = W6.lauf(W6.SZENARIEN[0], days);
    assert.equal(r.zustand.tick, days * 1440);
    assert.equal(r.ende.tag, days);
    assert.deepEqual(r.fehler, []);
    assert.equal(r.welt.hash(r.welt.load(r.welt.save(r.zustand))), r.hash);
  }
  for (const days of [0, -1, 1.5, NaN, Infinity])
    assert.throws(() => W6.lauf(W6.SZENARIEN[0], days), RangeError);
  assert.throws(() => W6.lauf(W6.SZENARIEN[0], 1, 0), RangeError);
});

test('QA W6: reverse replacement matching and both policy switches preserve correct reserves', () => {
  const {welt: w, s} = W6.start(W6.SZENARIEN[1].politik);
  w.advance(s, 14400);
  QA.check(w, s);
  assert.ok(w.bericht(s).schiffe.filter(sh => sh.buchwert === 0).length >= 2);
  assert.ok(s.kanon.ersatzkaeufe >= 8);
  for (const mode of ['npc-off', 'automation-off', 'retirement-off']) {
    const copy = w.load(w.save(s));
    if (mode === 'npc-off') w.npcAutoSetzen(copy, false);
    if (mode === 'automation-off') w.politikSetzen(copy, {automatik: false});
    if (mode === 'retirement-off') w.politikSetzen(copy, {stilllegung: false});
    const hulls = w.bericht(copy).schiffe;
    for (const owner of ['npc3', 'transport']) {
      const owned = hulls.filter(sh => sh.owner === owner);
      const depreciation = owned.reduce((n, sh) => n + w.rules.economy.waren[sh.klasse].basis - sh.buchwert, 0);
      const expected = Math.max(0, Math.min(copy.owners[owner].cash - (copy.kanon.politik.betriebsreserve[owner] || 0) - depreciation,
        copy.owners[owner].cash + owned.reduce((n, sh) => n + sh.buchwert, 0) - w.rules.owners.find(o => o.id === owner).cash));
      assert.equal(w.ausschuettbar(copy, owner), expected, mode + ': ' + owner);
    }
    const decisions = structuredClone(copy.kanon.npc.befehle);
    if (mode !== 'retirement-off') {
      w.advance(copy, 60);
      assert.deepEqual(copy.kanon.npc.befehle, decisions);
    }
    assert.deepEqual(W6.pruefen(w, copy), []);
    assert.equal(w.hash(w.load(w.save(copy))), w.hash(copy));
  }
});
