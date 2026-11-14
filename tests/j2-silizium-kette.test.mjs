import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {versuch, bestand, ablehnen} from '../tools/j2-silizium-gate.mjs';
const require = createRequire(import.meta.url);
const J1 = require('../prototypes/welt/j1-wirtschaftsaudit.cjs');

for (const seed of [42,7]) test(`J2 seed ${seed}: finanzierter Minerbau, örtliche Kauf-/Transportblocker und Replay`, async () => {
  const {report:r,w,s,readySave} = await versuch(seed);
  assert.deepEqual((await versuch(seed)).report, r, 'vollständiger unabhängiger Befehls-/Zeit-Replay');
  assert.equal(r.status, 'BLOCKED_NOT_IMPLEMENTED');
  assert.equal(r.deliveredSilicon, 0);
  const reference = seed === 42
    ? ['c5d9d3becc36c4a4','9800a1bdcd4a969f']
    : ['d7fbd58bc707e2ae','1b68f9747e61ed8f'];
  assert.equal(r.final.hash, reference[0], 'unabhängig ohne J2-Werkzeug erzeugte Originalreferenz');
  assert.equal(r.purchased.ships.find(x => x.owner === 'house').system, 'aldera');
  const [buy, refine, build] = r.transcript;
  assert.equal(buy.before.cash.werft_extern, 0);
  assert.equal(buy.after.cash.werft_extern, 750);
  assert.equal(refine.after.warehouses.st_nadir.erz, refine.before.warehouses.st_nadir.erz - 10);
  assert.equal(refine.after.warehouses.st_nadir.material, 5);
  assert.equal(refine.after.cash.st_nadir, refine.before.cash.st_nadir - 20);
  assert.equal(build.started.cash.werft_extern, 220);
  assert.equal(build.started.cash.k1_miner_arbeit, 30);
  assert.equal(build.started.cash.st_nadir, build.before.cash.st_nadir + 500);
  assert.equal(build.after.cash.k1_miner_arbeit, 0);
  assert.equal(build.after.cash.arbeiter_werft_nadir, build.before.cash.arbeiter_werft_nadir + 30);
  assert.equal(build.after.tick - build.before.tick, 30);
  assert.equal(build.after.minerYard.fertig - build.before.minerYard.fertig, 1);
  assert.equal(build.after.minerYard.wartetAuf, 'house');
  assert.equal(build.after.warehouses.st_nadir.miner, 1);
  assert.equal(build.after.ships.filter(x => x.klasse === 'miner' && x.system === 'nadir').length, 0);

  const cmd = {type:'stationBuildMiner', owner:'werft_extern', station:'st_nadir', besteller:'house'};
  // Kontrollierte ungültige Negativfixtures, KEINE simulierten legalen Kapitaltransfers.
  // Prüfen nur atomare Ablehnung am existierenden K2-Vertrag, keine Silizium-API.
  for (const mutate of [
    z => {z.owners.werft_extern.cash = 529;},
    z => {z.owners.house.cash = 659;},
    z => {z.stations.st_nadir.lager.material = 4;},
  ]) {const z = w.load(readySave); mutate(z); ablehnen(w,z,cmd);}
  ablehnen(w,s,cmd); // fertiggestellte, noch gebundene Hülle blockiert Doppelbau
  ablehnen(w,s,{type:'shipMine',owner:'house',schiff:'nicht-vorhanden',ware:'silizium'});
  const npcMiner = Object.values(s.ships).find(x => x.owner === 'npc3' && x.klasse === 'miner');
  ablehnen(w,s,{type:'shipMine',owner:'house',schiff:npcMiner.id,ware:'silizium'});
  const valid = w.save(s);
  for (const mutate of [
    z => {z.kanon.minerWerft.fertig++;},
    z => {z.kanon.minerWerft.wartetAuf = 'transport';},
    z => {z.owners.k1_miner_arbeit.cash++;z.owners.house.cash--;},
    z => {z.stations.st_nadir.lager.silizium = 8;},
    z => {z.ledger.silizium = {initial:8,mined:0,produced:0,consumed:0,imported:0,exported:0};z.stations.st_nadir.lager.silizium=8;},
  ]) {
    const z = JSON.parse(valid); mutate(z);
    assert.equal(J1.inspect(w,z).audit.ok, false);
    assert.throws(() => J1.loadChecked(w,JSON.stringify(z)));
  }
  const replay = w.load(valid);
  w.advance(s,120); w.advance(replay,120);
  assert.equal(w.hash(s),w.hash(replay)); bestand(w,s);
  assert.equal(w.hash(s), reference[1]);
  console.log('J2_REFERENCE', JSON.stringify({seed,minerStockHash:r.final.hash,after120:w.hash(s),silicon:0}));
});
