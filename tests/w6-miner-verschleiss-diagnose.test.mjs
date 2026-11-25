import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {verschleissDiagnose} = require('../tools/m4-management-szenarien.cjs');

test('W6 S02: replay the miner deadlock and measure remaining lifetime at binding', () => {
  const a = verschleissDiagnose();
  assert.deepEqual(verschleissDiagnose(), a, 'deterministic replay');
  assert.equal(a.weltgeld, 33000);
  assert.equal(a.mint, 0);
  assert.equal(a.burn, 0);
  assert.equal(a.reineFoerderminuten, 50);
  const b = a.blockiert;
  assert.ok(b, 'reported 13-day deadlock must reproduce');
  assert.equal(b.miner, 'sh011');
  assert.equal(b.erzAnBord, 22);
  assert.equal(b.rest, 0);
  assert.ok(b.restVorBindung > 0, 'not yet retired when selected');
  assert.equal(b.aktivSeitVorBindung, b.restVorBindung);
  assert.equal(b.bereitsBeiStartGebunden, false);
  assert.equal(b.gebundenBeobachtet - b.vorTick, 1);
  assert.deepEqual(b.treuhand, {w3_kauf_treuhand:740,
    w3_arbeit_treuhand:120,k7_werft_treuhand:530});
  assert.equal(b.storno.ok, false);
  assert.ok(a.protokoll.some(x => x.ergebnis === 'ERZ_ANGENOMMEN' &&
    x.aktivSeitVorBindung >= a.reineFoerderminuten));
  console.log('W6_MINER_VERSCHLEISS ' + JSON.stringify(a));
});
