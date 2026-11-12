import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseK5, gegenversuch, pruefen } from '../tools/k5-terminal-diagnose.mjs';
import { laufenK4 } from '../tools/k4-ore-allocation.mjs';

const hashes = { 42: { k4: 'c23397a320fa63ff', probe: '032e95033baa5e2c' },
  7: { k4: '4a818a41b592f887', probe: '49214bdb90ded7a0' } };
for (const seed of [42, 7]) test('K5 Seed ' + seed + ': K4 unverändert, Ursache, eine gedeckte 50-Eis-Kette und atomare Ablehnungen', () => {
  const { w, terminalSave, bericht: r } = diagnoseK5(seed, 90);
  // Unveränderter K4-Algorithmus läuft unabhängig, nicht nur dieselbe Diagnose zweimal.
  const k4 = laufenK4(seed, 2, 90);
  assert.equal(r.ende.hash, k4.hash);
  assert.equal(r.ende.hash, hashes[seed].k4);
  assert.equal(r.checkpoints[20160].hash, { 42: '52b6fca43d1018a2', 7: '8f34e59d66f6d471' }[seed]);
  assert.equal(r.checkpoints[43200].hash, { 42: '134a00c2125b22f5', 7: 'a0e35cbd84a25152' }[seed]);
  assert.equal(r.zuletzt.wasserVerkauf.tick, 21611);
  assert.equal(r.zuletzt.eisFoerderung.tick, 21024);
  assert.equal(r.zuletzt.eisAbschluss.tick, 21132);
  assert.equal(r.zuletzt.wasserProduktion.tick, 21172);
  assert.equal(r.zuletzt.materialVerbrauch.tick, 18073);
  assert.equal(r.zuletzt.materialVerbrauch.wert, 75);
  assert.equal(r.ereignisse.find(x => x.arten.some(a => a.startsWith('Miner-Erzfracht'))).tick, 19632);
  assert.equal(r.ereignisse.find(x => x.arten.includes('Stilllegung sh018')).tick, 21024);
  assert.equal(r.ereignisse.find(x => x.arten.some(a => a.startsWith('Ersatzminer house'))).tick, 21035);
  const s = w.load(terminalSave), start = r.checkpoints[21612];
  assert.equal(start.gebunden, 0);
  assert.deepEqual(start.offen.queue, []);
  assert.deepEqual(start.offen.erzBergbau, {});
  assert.equal(start.erzMarkt.status, 'absatzstopp');
  assert.equal(start.erzMarkt.planbar, 0);
  assert.equal(start.erzVertraege.auftraege, 0);
  assert.equal(start.waren.erz.vorhanden, 0);
  assert.equal(start.waren.erz.mined, 2150);
  assert.equal(start.waren.erz.exported, 2000);
  assert.equal(start.waren.erz.consumed, 150);
  assert.equal(start.waren.material.vorhanden, 0);
  assert.equal(start.waren.material.consumed, 8 * 5 + 7 * 5);
  assert.equal(start.waren.eis.vorhanden, 12);
  assert.equal(start.lager.st_aldera.waren.eis, 2);
  const fremdesEis = start.schiffe.filter(sh => (sh.ladung.eis || 0) > 0);
  assert.equal(fremdesEis.length, 5);
  assert.ok(fremdesEis.every(sh => sh.owner === 'house' && sh.stillgelegt && sh.ladung.eis === 2));
  const frei = start.schiffe.filter(sh => !sh.stillgelegt);
  assert.deepEqual(frei.map(sh => sh.id), ['sh004', 'sh005', 'sh006', 'sh008', 'sh020']);
  assert.equal(frei.at(-1).buchwert, 624);
  assert.equal(frei.at(-1).ort, 'angedockt');
  assert.equal(frei.at(-1).anker, 'st_aldera');
  assert.match(start.quotes.sh020.eis.grund, /50er-Eischarge/);
  assert.match(start.quotes.sh020.erz.grund, /Erzcharge/);
  assert.match(start.raffinerie.grund, /Erz/);
  assert.match(start.werft.grund, /Material/);
  assert.equal(r.ablehnungen.length, 9);
  // Gegenbuchungen mit gleicher Gesamtgeldmenge und falsche Güter/Hüllen erkennen.
  const unrecht = w.load(terminalSave); unrecht.owners.npc3.cash--; unrecht.owners.house.cash++;
  assert.throws(() => pruefen(w, unrecht), /Kasse aus Anfang/);
  const ware = w.load(terminalSave); ware.stations.st_aldera.lager.eis++;
  assert.throws(() => pruefen(w, ware), /Lager und Fracht/);
  const huelle = w.load(terminalSave); delete huelle.ships.sh004;
  assert.throws(() => pruefen(w, huelle));
  const falsch = w.load(terminalSave); falsch.ships.sh004.owner = 'unbekannt';
  assert.throws(() => pruefen(w, falsch));
  const probe = gegenversuch(w, terminalSave);
  assert.equal(probe.moeglich, true);
  assert.equal(probe.ende.tick, 21865);
  assert.equal(probe.ende.hash, hashes[seed].probe);
  assert.equal(probe.delta.eisFoerderung, 50);
  assert.equal(probe.delta.eisVerkauf, 50);
  assert.equal(probe.delta.eisLieferung, 50);
  assert.equal(probe.delta.eisAbschluss, 1);
  assert.equal(probe.delta.wasserProduktion, 50);
  assert.equal(probe.delta.wasserVerkauf, 50);
  for (const k of ['erzFoerderung','export','erzLieferung','material','materialVerbrauch','minerBeginn','minerFertig','minerLieferung','frachterKauf'])
    assert.equal(probe.delta[k], 0, k + ': keine künstliche Ersatz-/Warenkette');
  assert.equal(probe.ende.gebunden, 0);
  assert.equal(probe.ende.weltgeld, 33000);
  assert.equal(probe.ende.minted, 0); assert.equal(probe.ende.burned, 0);
  assert.deepEqual(probe.minerArbeit, { foerderlohn: 100, fluglohn: 42 });
  assert.ok(probe.minerArbeit.foerderlohn + probe.minerArbeit.fluglohn <= probe.budget.miner);
  assert.equal(probe.kontenDelta.npc3, 108); // 250 realer Dockverkauf minus 142 Arbeit
  assert.equal(probe.kontenDelta.transport, 120); // 240 Frachtentgelt minus 120 Löhne
  assert.equal(probe.kontenDelta.st_nadir, 110); // 700 Absatz minus 490 Frachtkauf minus 100 Arbeit
  assert.equal(probe.kontenDelta.house, 0); // kein fremder Eigentümer zur Rettung umgebucht
  assert.equal(probe.kontenDelta.export, 0);
  assert.deepEqual(probe.befehle.map(x => x.tick), [21612, 21612, 21693]);
  assert.deepEqual(probe.replay.map(x => x.art).sort(), ['eisfracht', 'minerflug', 'wasserwerk']);
  assert.ok(probe.replay.every(x => x.minuten === 130));
  assert.equal(w.hash(s), start.hash, 'unberührter Ausgangssave');
  console.log('K5_RESULT ' + JSON.stringify({ seed, k4Hash: r.ende.hash, probeHash: probe.ende.hash,
    tick: probe.ende.tick, delta: probe.delta, arbeit: probe.minerArbeit, weltgeld: probe.ende.weltgeld }));
});
