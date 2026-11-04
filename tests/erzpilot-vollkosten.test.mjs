import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('const m_data_systeme =');
const end = html.indexOf('const m_data_oberflaeche =');
assert.ok(start >= 0 && end > start);
const api = Function(html.slice(start, end) + '\nreturn m_core_index;')();
const rules = api.ERZ_RULES;
function mitSpieler(seed = 42) {
  const s = api.createErzState(seed);
  const kauf = api.execute(s, { type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' }, rules);
  assert.equal(kauf.ok, true);
  const sh = Object.values(s.ships).find((x) => x.owner === 'house');
  assert.equal(api.execute(s, { type: 'shipMine', owner: 'house', schiff: sh.id, ware: 'erz' }, rules).ok, true);
  return s;
}

test('W1 Vollkosten: Huelle und Lohn werden vorfinanziert, Gewinne schrittweise erarbeitet', () => {
  const s = mitSpieler();
  const direkt = api.pilotWirtschaftsStand(s);
  assert.equal(direkt.ok, true);
  assert.equal(direkt.konzerne.house.netto, -600);
  assert.equal(direkt.konzerne.npc3.netto, -600);
  assert.equal(direkt.amortisationErz, 75);
  api.advance(s, 1, rules);
  const laufend = api.pilotWirtschaftsStand(s);
  assert.equal(laufend.konzerne.house.netto, -602);
  assert.equal(laufend.konzerne.house.gebunden, 98);
  assert.equal(laufend.station.gebunden, 1000);
  assert.equal(laufend.foerderArbeit, 4);
  assert.equal(laufend.fonds, 4);
  assert.equal(laufend.ok, true);
  api.advance(s, 119, rules);
  const nachZweiChargen = api.pilotWirtschaftsStand(s);
  assert.equal(nachZweiChargen.konzerne.house.erloese, 1000);
  assert.equal(nachZweiChargen.konzerne.house.kosten, 800);
  assert.equal(nachZweiChargen.konzerne.house.netto, 200);
  assert.equal(nachZweiChargen.ok, true);
  assert.equal(api.hash(api.loadErz(api.save(s))), api.hash(s));
});

test('W1 Vollkosten: positive Konzernkasse ersetzt weder reale Endnachfrage noch Stationsgeld', () => {
  const s = mitSpieler();
  api.advance(s, 2880, rules);
  const v = api.pilotWirtschaftsStand(s);
  assert.equal(v.konzerne.house.erloese, 10500);
  assert.equal(v.konzerne.house.kosten, 2700);
  assert.equal(v.konzerne.house.netto, 7800);
  assert.equal(v.konzerne.npc3.netto, 7800);
  assert.equal(v.bezahlteHuelle, 1200);
  assert.equal(v.foerderArbeit, 4200);
  assert.equal(v.belegteArbeit, 4200);
  assert.equal(v.fonds, 4200);
  assert.equal(v.station.erloese, 20000);
  assert.equal(v.station.kosten, 21000);
  assert.equal(v.station.netto, -1000);
  assert.equal(v.stationErz, 100);
  assert.equal(v.wertUnverkauft, 1000);
  assert.equal(v.station.frei, 0);
  assert.equal(v.kaeufer.frei, 0);
  assert.equal(v.ok, true);
  assert.equal(api.audit(s).vollkosten.ok, true);
});

test('W1 Vollkosten: bilanzneutraler ungebuchter Konzerntransfer wird unabhaengig erkannt', () => {
  const s = mitSpieler();
  api.advance(s, 120, rules);
  const vorher = api.hash(s);
  assert.equal(api.pilotWirtschaftsStand(s).ok, true);
  s.owners.house.cash -= 15;
  s.owners.werft_extern.cash += 15;
  const a = api.audit(s);
  assert.equal(a.isk.ok, true);
  assert.equal(a.goods.ok, true);
  assert.equal(a.finanzierung.ok, true);
  assert.equal(a.vollkosten.ok, false);
  assert.equal(a.ok, false);
  assert.throws(() => api.loadErz(api.save(s)), /fehlerhaft/);
  assert.notEqual(api.hash(s), vorher);
});

test('W1 Vollkosten: Bericht ist rein lesend, save-stabil und laesst Regel14 hashgleich', () => {
  const s = mitSpieler(13);
  api.advance(s, 7, rules);
  const hash = api.hash(s);
  const once = api.pilotWirtschaftsStand(s);
  const twice = api.pilotWirtschaftsStand(s);
  assert.deepEqual(once, twice);
  assert.equal(api.hash(s), hash);
  const neu = api.loadErz(api.save(s));
  assert.equal(api.hash(neu), hash);
  assert.deepEqual(api.pilotWirtschaftsStand(neu), once);
  const alt = api.createState(42);
  api.advance(alt, 60);
  assert.equal(api.hash(alt), '866776f7d84ef15e');
});
