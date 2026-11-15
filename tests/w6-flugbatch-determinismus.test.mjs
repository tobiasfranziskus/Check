// W6 [ANALYSE]: Flug-Batch darf weder Flug-/Wirtschaftszustand noch Hash veraendern.
// Externer Einzelteilschritt bleibt die unabhaengige 60-Schritte-Referenz.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const W6 = require('../tools/w6-szenarien.cjs');
const S02 = W6.SZENARIEN.find((x) => x.id === 'S02').politik;

function paar() {
  const {welt, s} = W6.start(S02);
  return {welt, schnell:s, einzeln:welt.load(welt.save(s))};
}
function gleich(welt, schnell, einzeln) {
  assert.equal(schnell.tick, einzeln.tick);
  assert.equal(schnell.flug.schritt, einzeln.flug.schritt);
  assert.equal(welt.canonical(schnell), welt.canonical(einzeln),
    'gesamte kanonische Welt statt nur Endhash muss uebereinstimmen');
  assert.equal(welt.hash(schnell), welt.hash(einzeln));
  assert.deepEqual(W6.pruefen(welt, schnell), []);
  assert.deepEqual(W6.pruefen(welt, einzeln), []);
}
function einzelnFertig(welt, s, minuten) {
  for (let i=0; i<minuten*60; i++) welt.teilschritt(s);
}

test('W6: Minuten-Batch ist ueber 240 Minuten bitgleich zu 60 originalen Einzelschritten', () => {
  const {welt, schnell, einzeln} = paar();
  for (let m=1; m<=240; m++) {
    welt.minute(schnell);
    einzelnFertig(welt, einzeln, 1);
    if ([1, 20, 60, 120, 240].includes(m)) gleich(welt, schnell, einzeln);
  }
});

test('W6: auf halbem Flugschritt gestartete Wirtschaftsminute endet kanonisch gleich', () => {
  const {welt, schnell, einzeln} = paar();
  for (let i=0; i<17; i++) {
    welt.teilschritt(schnell);
    welt.teilschritt(einzeln);
  }
  gleich(welt, schnell, einzeln);
  welt.minute(schnell);
  for (let i=0; i<43; i++) welt.teilschritt(einzeln);
  gleich(welt, schnell, einzeln);
  // Danach muss auch ein beliebig weiterer vollstaendiger Minutenlauf gleich bleiben.
  welt.minute(schnell);
  einzelnFertig(welt, einzeln, 1);
  gleich(welt, schnell, einzeln);
});

test('W6: nach einem originalfinanzierten neuen Schiff wird die Batch-ID-Liste neu aufgebaut', () => {
  const {welt, schnell, einzeln} = paar();
  const vorher = Object.keys(schnell.ships).length;
  const kauf = {type:'shipBuy', owner:'house', klasse:'miner', station:'st_aldera'};
  const a = welt.execute(schnell, kauf);
  const b = welt.execute(einzeln, kauf);
  assert.deepEqual(a,b);
  assert.equal(a.ok,true, 'gekaufte und finanzierte Originalhuelle');
  assert.equal(Object.keys(schnell.ships).length, vorher+1);
  gleich(welt, schnell, einzeln);
  for (let m=0; m<8; m++) {
    welt.minute(schnell);
    einzelnFertig(welt, einzeln, 1);
  }
  gleich(welt, schnell, einzeln);
  assert.equal(welt.hash(welt.load(welt.save(schnell))), welt.hash(schnell), 'Save/Load unveraendert');
});
