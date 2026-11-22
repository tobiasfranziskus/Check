import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const J8 = require('../prototypes/verbund/konzern-session.js');
const W5ac = require('../prototypes/w5ac/session.js');
const {pruefen} = require('../tools/w6-szenarien.cjs');

const abgelehnt = 'Kein legitim auswählbarer Spielerauftrag';
const lagerLeer = 'kein Komplettschiff auf Lager';
const wasserLeer = 'Am Wohnort ist nicht genug Wasser tatsächlich vorhanden';
const haushalt = 'water-pilot-house-1';
const werfthuelle = 'buy-st_nadir-frachter';
const route = [
  'buy-st_aldera-miner', 'buy-st_aldera-frachter', 'ice-sh002', 60, 60,
  'freight-sh003', 60, 60, 'freight-sh003', 60, 60
];
const referenzen = {
  204: ['674400c1d181fcf2', 'dd21dd408d18329a', '30a46fa2f3f3a2e3', '4e86f3fc27a6005a', '1df0f18ff779fd4c'],
  207: ['6c83a38cd3dc5a54', '1596faa72b705565', '7f1d0a7e07d6960f', '221e8213a2882308', 'f406d3e1b4a8276a']
};

function starten(regel) {
  const j = J8.erstellen();
  if (regel === 204) j.starten195(W5ac.create(42, 'private195').export(), true);
  else j.startenP8g(true);
  return j;
}

function speichernUndLaden(j) {
  const w = j.weltReferenz();
  const s = j.zustandReferenz();
  assert.deepEqual(pruefen(w, s), []);
  const json = j.exportieren();
  const kopie = J8.erstellen();
  if (s.rulesVersion === 204) kopie.oeffnen204(json, true);
  else kopie.oeffnenP8g(json, true);
  assert.equal(kopie.exportieren(), json);
  assert.equal(kopie.ansicht().hash, j.ansicht().hash);
  return kopie;
}

function ausfuehren(j, schritt) {
  if (typeof schritt === 'number') j.weiterspielen(schritt);
  else {
    const r = j.ausfuehren(schritt);
    assert.equal(r.ok, true, r.reason);
  }
}

function sperre(j, id, reason) {
  const vor = j.exportieren();
  const hash = j.ansicht().hash;
  assert.deepEqual(j.ausfuehren(id), {ok: false, reason});
  assert.equal(j.exportieren(), vor);
  assert.equal(j.ansicht().hash, hash);
}

function pruefpunkt(j, hash) {
  const s = j.zustandReferenz();
  assert.equal(j.ansicht().hash, hash);
  const vor = j.exportieren();
  const angebote = j.angebote();
  const quote = id => angebote.find(o => o.id === id);
  assert.deepEqual([quote(werfthuelle).ok, quote(werfthuelle).reason], [false, lagerLeer]);
  assert.equal(quote('buy-st_nadir-miner').reason,
    'K2/J2a: Nur der echte vorgemerkte Nadir-Miner darf lokal gekauft werden');
  assert.equal(quote('buy-st_nadir-jaeger').reason, 'J4b: noch kein bezahlter Jäger im Lager');
  assert.equal(angebote.some(o => /^(ore-|sil-|reposition-)/.test(o.id)), false);
  assert.equal(s.kanon.industrieErz.phase, 'frei');
  assert.equal(s.w3.abgeschlossen, 0);
  assert.equal(s.w3.auftrag, null);
  assert.equal(s.w4.auftrag, null);
  assert.equal(s.ledger.material.produced, 0);
  assert.equal(s.w5.fertig, 0);
  assert.equal(s.stations.st_aldera.lager.erz, 0);
  for (const ware of ['erz', 'material', 'frachter', 'silizium']) {
    assert.equal(s.stations.st_nadir.lager[ware], 0);
  }
  assert.equal(j.exportieren(), vor);
  const schiffe = Object.values(s.ships).map(({id, owner, klasse, system, phase, ladung}) =>
    ({id, owner, klasse, system, phase, ladung}));
  const kassen = ['house', 'pilot_house', 'st_aldera', 'st_nadir', 'npc3', 'transport', 'werft_extern',
    'w5n_fracht_kauf', 'w5n_fracht_arbeit'];
  console.log('M4_U3_J8', JSON.stringify({
    regel: s.rulesVersion, tick: s.tick, hash, angebote, schiffe,
    stationen: Object.values(s.stations).map(({id, eigentum, lager}) => ({id, eigentum, lager})),
    kassen: Object.fromEntries(kassen.map(id => [id, s.owners[id]?.cash ?? 0])),
    frachten: s.kanon.spielerFrachten
  }));
  speichernUndLaden(j);
  return angebote;
}

for (const regel of [204, 207]) {
  test('M4-U3: Original-J8 vor, während und nach zwei bezahlten F4-Runden in Regel ' + regel, () => {
    const j = starten(regel);
    const replay = starten(regel);
    const hashes = referenzen[regel];
    pruefpunkt(j, hashes[0]);
    if (regel === 204) sperre(j, haushalt, wasserLeer);
    else sperre(j, haushalt, abgelehnt);
    for (const schritt of route.slice(0, 5)) ausfuehren(j, schritt);
    assert.equal(pruefpunkt(j, hashes[1]).find(o => o.id === 'freight-sh003').ok, true);
    ausfuehren(j, 'freight-sh003');
    pruefpunkt(j, hashes[2]);
    sperre(j, 'freight-sh003', 'K1: Wirtschaftsauftrag nur mit physisch angedocktem Frachter');
    const unterwegs = j.zustandReferenz();
    assert.deepEqual(unterwegs.ships.sh003.ladung, {eis: 50});
    assert.equal(unterwegs.owners.w5n_fracht_kauf.cash, 490);
    assert.equal(unterwegs.owners.w5n_fracht_arbeit.cash, 120);
    for (const schritt of route.slice(6, 8)) ausfuehren(j, schritt);
    pruefpunkt(j, hashes[3]);
    if (regel === 204) sperre(j, haushalt, wasserLeer);
    for (const schritt of route.slice(8)) ausfuehren(j, schritt);
    const angebote = pruefpunkt(j, hashes[4]);
    sperre(j, werfthuelle, lagerLeer);
    for (const id of ['industrialOreOffer', 'shipFreight', 'stationRefine', 'stationBuildShip',
      'freight-sh001', 'sil-start-sh002']) sperre(j, id, abgelehnt);
    for (const schritt of route) ausfuehren(replay, schritt);
    assert.equal(j.exportieren(), replay.exportieren());

    const s = j.zustandReferenz();
    const frachten = s.kanon.spielerFrachten;
    assert.deepEqual(frachten.auftraege.map(a => [a.schiff, a.menge, a.start, a.geliefert, a.end]),
      [['sh003', 50, 120, 180, 240], ['sh003', 50, 240, 300, 360]]);
    assert.deepEqual([frachten.gebuehr, frachten.lohn, s.w5n.eisGeliefert], [480, 240, 100]);
    assert.deepEqual([s.ships.sh003.owner, s.ships.sh003.phase, s.ships.sh003.system],
      ['house', 'dock', 'aldera']);
    assert.equal(s.ships.sh001.owner, 'npc3');
    assert.deepEqual([s.owners.house.cash, s.owners.pilot_house.cash, s.owners.st_aldera.cash,
      s.owners.st_nadir.cash], [2310, 303, 255, 3414]);

    if (regel === 207) {
      assert.equal(angebote.some(o => o.id.startsWith('water-pilot-house-')), false);
      return;
    }
    const w = j.weltReferenz();
    for (const [cmd, reason] of [
      [{type: 'industrialOreOffer', miner: 'sh002', frachter: 'sh003'}, 'K7: nur realer Industriekäufer darf bestellen'],
      [{type: 'shipFreight', schiff: 'sh003'}, 'Bezahlter Frachter muss frei in Aldera liegen'],
      [{type: 'stationRefine', station: 'st_nadir'}, 'Nur die Nadir-Raffinerie darf diesen Auftrag bezahlen'],
      [{type: 'stationBuildShip', station: 'st_nadir'}, 'Nur die finanzierende Werft darf Nadir-Schiffe bauen']
    ]) {
      const copy = w.load(j.exportieren());
      assert.equal(w.execute(copy, {...cmd, owner: 'house'}).reason, reason);
      assert.equal(w.save(copy), j.exportieren());
    }

    assert.equal(angebote.find(o => o.id === haushalt).ok, true);
    const privat = speichernUndLaden(j);
    ausfuehren(privat, haushalt);
    const bezahlt = privat.zustandReferenz();
    assert.equal(privat.ansicht().hash, '715c528a9adb2d89');
    assert.deepEqual([bezahlt.owners.house.cash, bezahlt.owners.pilot_house.cash, bezahlt.owners.st_aldera.cash],
      [2310, 287, 271]);
    assert.equal(bezahlt.stations.st_aldera.lager.wasser, s.stations.st_aldera.lager.wasser - 1);
    assert.equal(bezahlt.ledger.wasser.consumed, s.ledger.wasser.consumed + 1);
    assert.deepEqual(bezahlt.ships, s.ships);
    assert.deepEqual(bezahlt.kanon.spielerFrachten, frachten);
    speichernUndLaden(privat);
  });
}

test('M4-U3: NPC-Transport mit derselben Startreserve führt nur im Forschungsstart zur fertigen Hülle', () => {
  for (const regel of [204, 207]) {
    const j = starten(regel);
    for (let i = 0; i < 6; i++) j.weiterspielen(60);
    const s = j.zustandReferenz();
    assert.equal(s.ships.sh002.owner, 'transport');
    assert.equal(s.ships.sh001.owner, 'npc3');
    assert.equal(s.owners.house.cash, 3000);
    const quote = j.angebote().find(o => o.id === werfthuelle);
    if (regel === 204) {
      assert.equal(quote.reason, lagerLeer);
      assert.equal(s.w5.fertig, 0);
      continue;
    }
    assert.equal(j.ansicht().hash, '60758c3afac62296');
    assert.equal(s.kanon.industrieErz.phase, 'geliefert');
    assert.equal(s.w3.abgeschlossen, 1);
    assert.equal(s.ledger.material.produced, 5);
    assert.equal(s.stations.st_nadir.lager.frachter, 1);
    assert.equal(quote.ok, true);
    ausfuehren(j, werfthuelle);
    const bezahlt = j.zustandReferenz();
    assert.equal(bezahlt.owners.house.cash, 2250);
    assert.equal(bezahlt.stations.st_nadir.lager.frachter, 0);
    assert.deepEqual(Object.values(bezahlt.ships).filter(sh => sh.owner === 'house').map(sh => sh.system), ['nadir']);
    speichernUndLaden(j);
  }
});
