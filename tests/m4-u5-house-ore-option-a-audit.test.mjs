// Reproduce the limits of the original K7 contract without enabling house W3.
import test from 'node:test';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const W = require('../prototypes/welt/welt-kern.js');
const {pruefen} = require('../tools/w6-szenarien.cjs');
const miner = 'sh001', frachter = 'sh002';
const angebot = {type:'industrialOreOffer',owner:'st_nadir',miner,frachter};
const stornieren = {type:'industrialOreCancel',owner:'st_nadir'};
const pendelStopp = {type:'shipShuttleStop',owner:'npc3',schiff:miner};
const frachtZusage = {type:'industrialOreAcceptFreight',owner:'transport'};

function ausfuehren(w, s, befehl) {
  const r = w.execute(s, befehl);
  assert.equal(r.ok, true, r.reason);
}

function weltZuMinute(minute) {
  const w = W.erstellenJ4c({carrierCash:2000,buyerCash:4000});
  const s = w.createState(42);
  // Put Meridian's original empty miner on standby before starting the clock.
  ausfuehren(w, s, pendelStopp);
  w.advance(s, minute);
  return {w, s};
}

function reservieren(w, s) {
  for (const befehl of [
    angebot,
    {type:'industrialOreAcceptMine',owner:'npc3'},
    frachtZusage,
    {type:'industrialOreAcceptYard',owner:'werft_extern'},
    {type:'industrialOreCommit',owner:'st_nadir'},
  ]) ausfuehren(w, s, befehl);
  assert.deepEqual(pruefen(w, s), []);
}

const treuhand = (s) => ['w3_kauf_treuhand', 'w3_arbeit_treuhand', 'k7_werft_treuhand']
  .map((id) => s.owners[id].cash);

function kopie(w, s) {
  const gespeichert = w.save(s);
  const geladen = w.load(gespeichert);
  assert.equal(w.save(geladen), gespeichert);
  return geladen;
}

function stornierungAbgelehnt(w, s, grund) {
  const vorher = w.save(s);
  const r = w.execute(s, stornieren);
  assert.equal(r.ok, false);
  assert.match(r.reason, grund);
  assert.equal(w.save(s), vorher);
}

test('K7-Original: eine vollständig bezahlte Referenzfahrt erzeugt Material und eine W5-Hülle', () => {
  const {w, s} = weltZuMinute(49);
  reservieren(w, s);
  const vorher = w.save(s);
  const beginn = performance.now();
  function fahren(nachladen) {
    let q = kopie(w, s);
    w.advance(q, 71);
    assert.equal(q.w3.auftrag.phase, 'hin');
    if (nachladen) q = kopie(w, q);
    w.advance(q, q.w3.auftrag.zeit);
    assert.equal(q.w3.auftrag.phase, 'rueck');
    if (nachladen) q = kopie(w, q);
    ausfuehren(w, q, {type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
    w.advance(q, w.rules.w4.dauer);
    ausfuehren(w, q, {type:'industrialOreBuildShip',owner:'werft_extern'});
    w.advance(q, Math.max(q.ships[frachter].ankunft - q.tick, w.rules.w5.dauer));
    return nachladen ? kopie(w, q) : q;
  }
  const weiter = fahren(true);
  const dauerMs = performance.now() - beginn;
  assert.deepEqual(pruefen(w, weiter), []);
  assert.deepEqual(treuhand(weiter), [0, 0, 0]);
  const beleg = weiter.w5ad.freight[0];
  assert.deepEqual([beleg.id, beleg.amount, beleg.end - beleg.start, beleg.work, beleg.fee],
    [frachter, 50, 120, 120, 240]);
  assert.equal(weiter.owners.pilot_erz.cash, 120);
  assert.ok(weiter.ledger.material.produced >= w.rules.w5.material);
  assert.equal(weiter.w5.fertig, 1);
  assert.equal(weiter.ledger.frachter.produced, 1);
  const replay = fahren(false);
  assert.equal(w.save(replay), w.save(weiter));
  assert.equal(w.save(s), vorher);
  console.log('K7_ORIGINAL_REFERENZ', JSON.stringify({
    beleg, hash:w.hash(weiter), minuten:weiter.tick - s.tick, dauerMs,
  }));
});

test('K7-Original: Stundenexport kann die vollständig abgenommene Charge vor Verladung kaufen', () => {
  const {w, s} = weltZuMinute(50);
  reservieren(w, s);
  w.advance(s, 69);
  assert.equal(s.ships[miner].ladung.erz, 50);
  assert.equal(s.ledger.erz.exported, 0);
  w.minute(s);
  assert.equal(s.tick, 120);
  assert.equal(s.kanon.industrieErz.erzAngenommen, true);
  assert.equal(s.w3.auftrag.phase, 'vorbestellt');
  assert.equal(s.stations.st_aldera.lager.erz, 0);
  assert.equal(s.ledger.erz.exported, 50);
  assert.equal(s.w3.geliefert, 0);
  assert.deepEqual(treuhand(s), [740, 120, 530]);
  assert.deepEqual(pruefen(w, s), []);
  stornierungAbgelehnt(w, kopie(w, s), /Ware|Arbeit|Abnahme/);
  console.log('K7_ORIGINAL_EXPORT', JSON.stringify({tick:s.tick, hash:w.hash(s), treuhand:treuhand(s)}));
});

test('K7-Original: Leerstorno löst die Reserven, Pendelstopp nach Arbeit lässt Teilfracht gebunden', () => {
  const {w, s} = weltZuMinute(49);
  reservieren(w, s);
  const leer = kopie(w, s);
  ausfuehren(w, leer, stornieren);
  assert.equal(leer.w3.auftrag, null);
  assert.deepEqual(treuhand(leer), [0, 0, 0]);
  assert.equal(leer.w3.stornoRueckzahlung, 740);
  assert.deepEqual(pruefen(w, leer), []);

  w.advance(s, 34);
  assert.equal(s.ships[miner].ladung.erz, 25);
  stornierungAbgelehnt(w, s, /bezahlte Arbeit oder Waren/);
  ausfuehren(w, s, pendelStopp);
  w.minute(s);
  assert.equal(s.ships[miner].auftrag, 'halten');
  assert.equal(s.ships[miner].ladung.erz, 25);
  assert.equal(s.w3.auftrag.phase, 'vorbestellt');
  assert.deepEqual(treuhand(s), [740, 120, 530]);
  assert.deepEqual(pruefen(w, s), []);
  stornierungAbgelehnt(w, kopie(w, s), /bezahlte Arbeit oder Waren/);
  console.log('K7_ORIGINAL_TEILFRACHT', JSON.stringify({tick:s.tick, hash:w.hash(s), treuhand:treuhand(s)}));
});

test('K7-Original: eine alte Zusage ohne Angebotskennung unterzeichnet auch das Folgeangebot', () => {
  const {w, s} = weltZuMinute(49);
  ausfuehren(w, s, angebot);
  const a = structuredClone(s.kanon.industrieErz);
  ausfuehren(w, s, stornieren);
  ausfuehren(w, s, angebot);
  assert.deepEqual(s.kanon.industrieErz, a);
  // This characterization records the original behavior. The house profile
  // must reject the old signature when implemented with unique offer IDs.
  ausfuehren(w, s, frachtZusage);
  assert.equal(s.kanon.industrieErz.signFracht, true);
  assert.equal(s.w3.auftrag, null);
  assert.deepEqual(pruefen(w, s), []);
});
