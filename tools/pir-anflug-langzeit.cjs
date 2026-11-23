// Reale erste Hausfracht, danach originalfinanzierter autonomer Langzeitlauf.
'use strict';
const assert = require('node:assert/strict');
const J8 = require('../prototypes/verbund/konzern-session.js');
const { SZENARIEN, pruefen } = require('./w6-szenarien.cjs');

const tage = Number(process.argv[2] || 90);
assert(Number.isSafeInteger(tage) && tage >= 1 && tage <= 730);
const j = J8.erstellen();
j.startenPiraten(true, true);
const welt = j.weltReferenz();
welt.politikSetzen(j.zustandReferenz(), SZENARIEN[1].politik);
assert(j.ausfuehren('buy-st_aldera-frachter').ok);
assert(j.ausfuehren('buy-st_aldera-miner').ok);
const f = j.ansicht().schiffe.find(sh => sh.klasse === 'frachter').id;
const m = j.ansicht().schiffe.find(sh => sh.klasse === 'miner').id;
assert(j.ausfuehren('ice-' + m).ok);
welt.advance(j.zustandReferenz(), 120);
assert(j.ausfuehren('freight-' + f).ok);
let s = j.zustandReferenz();
for (let tag = 1; ; tag = Math.min(tage, tag + 30)) {
  welt.advance(s, tag * 1440 - s.tick);
  assert.equal(s.tick, tag * 1440);
  assert.equal(s.kanon.spielerFrachten.gebuehr, 240);
  assert.equal(s.kanon.spielerFrachten.lohn, 120);
  const fehler = pruefen(welt, s).filter(f => f !== 'Weltgeld 33240');
  assert.deepEqual(fehler, []);
  assert.equal(Object.values(s.owners).reduce((summe, o) => summe + o.cash, 0), 33240);
  s = welt.load(welt.save(s));
  console.log(JSON.stringify({ tag, hash: welt.hash(s), pilotlohn: s.owners.pilot_piraten.cash,
    eisGeliefert: s.w5n.eisGeliefert, wasser: s.w5n.wasserProduziert, weltgeld: s.initialSupply }));
  if (tag === tage) break;
}
