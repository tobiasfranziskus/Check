// K1 [DRAFT]: der Spieler darf eine vorhandene, selbst gekaufte Aldera-Frachterhülle
// persönlich im gemeinsamen Flugkern steuern. Keine W3-Entladung im Freiflug,
// kein kostenloser Einkauf, keine zusätzliche Emission und kein anderes Save-Format.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Welt = require('../prototypes/welt/welt-kern.js');
const Alt = require('../prototypes/w5ac/rule191-w5-ferry-core.js');
const geld = (s) => Object.values(s.owners).reduce((n, x) => n + x.cash, 0);
function pr(w, s, phase) {
  const a = w.audit(s);
  assert.equal(a.ok, true, phase + ': ' + JSON.stringify(a.fehler));
  assert.equal(geld(s), 33000, phase + ': alle Eigentümerkassen');
  assert.equal(s.minted, 0); assert.equal(s.burned, 0);
}
const ausführen = (w, s, type, extra = {}) => {
  const cmd = { type, owner: 'house', ...extra };
  const r = w.execute(s, cmd);
  assert.equal(r.ok, true, type + ': ' + r.reason);
};
function verweigern(w, s, cmd, muster) {
  const h = w.canonical(s);
  const r = w.execute(s, cmd);
  assert.equal(r.ok, false, 'abgelehnt: ' + JSON.stringify(cmd));
  assert.match(r.reason, muster);
  assert.equal(w.canonical(s), h, 'Ablehnung vollständig atomar');
}
test('K1/Frachter: Originalkauf statt Gratishülle – begrenztes Lager, unverändertes Regel195', () => {
  const w = Welt.erstellen(), s = w.createState(42);
  const before = w.canonical(s), price = w.rules.economy.waren.frachter.basis;
  const count = Object.keys(s.ships).length, stock = s.stations.st_aldera.lager.frachter;
  assert.ok(stock >= 1, 'reales Aldera-Gründungslager');
  assert.ok(s.owners.house.cash >= price + 40, 'keine Gratisfinanzierung');
  verweigern(w, s, { type: 'shipBuy', owner: 'pilot_house', klasse: 'frachter', station: 'st_aldera' }, /Komplettkauf/);
  verweigern(w, s, { type: 'shipBuy', owner: 'house', klasse: 'frachter', station: 'st_nadir' }, /Komplettkauf|W5/);
  assert.equal(w.canonical(s), before);
  const money = s.owners.house.cash, yard = s.owners[w.rules.erzpilot.werftOwner].cash;
  ausführen(w, s, 'shipBuy', { klasse: 'frachter', station: 'st_aldera' });
  const sh = Object.values(s.ships).find(x => x.owner === 'house' && x.klasse === 'frachter');
  assert.ok(sh);
  assert.equal(sh.system, 'aldera'); assert.equal(sh.phase, 'dock');
  assert.equal(sh.flug.lage, 'angedockt');
  assert.equal(Object.keys(s.ships).length, count + 1);
  assert.equal(s.stations.st_aldera.lager.frachter, stock - 1);
  assert.equal(s.owners.house.cash, money - price);
  assert.equal(s.owners[w.rules.erzpilot.werftOwner].cash, yard + price);
  pr(w, s, 'bezahlter Schiffs- und Eigentumswechsel');

  const legacy = Alt.createPrivateWageResearch({ buyerCash: 1536, carrierCash: 2000 });
  const saved = legacy.core.createW5State(42);
  const original = legacy.core.canonical(saved);
  const attempt = legacy.core.execute(saved,
    { type:'shipBuy', owner:'house', klasse:'frachter', station:'st_aldera' }, legacy.rules);
  assert.equal(attempt.ok, false, 'Produktregel195 erteilt kein neues Frachterkaufrecht');
  assert.equal(legacy.core.canonical(saved), original, 'Regel195 bleibt byte- und verhaltensgleich');
});
test('K1/Frachter: realer 2D-Flug mit gebundenem Lohngeld, Save/Load und Dock-Rückzahlung', () => {
  const w = Welt.erstellen(), s = w.createState(42);
  ausführen(w, s, 'shipBuy', { klasse: 'frachter', station: 'st_aldera' });
  const sh = Object.values(s.ships).find(x => x.owner === 'house' && x.klasse === 'frachter');
  const id = sh.id, money = s.owners.house.cash, wage = s.owners.pilot_house.cash;
  verweigern(w, s, { type:'shipUndock', owner:'transport', schiff:id }, /Besitzer/);
  verweigern(w, s, { type:'shipFreight', owner:'house', schiff:id }, /W3|Spedition|Transport|Finanzierung|nur/);
  ausführen(w, s, 'shipUndock', { schiff:id });
  const konto = s.kanon.flugdienst[id].konto;
  assert.equal(s.owners[konto].cash, w.daten.flug.reserveMinuten * w.daten.flug.lohnJeMinute);
  assert.equal(s.owners.house.cash, money - 40);
  w.minute(s);
  assert.equal(sh.flug.lage, 'frei');
  ausführen(w, s, 'shipSteer', { schiff:id, kurs:0, fahrt:60 });
  for (let i=0; i<3; i++) w.minute(s);
  assert.ok(sh.flug.x > 0, 'echte 2D-Position statt abstraktem Transit');
  assert.ok(s.owners.pilot_house.cash > wage, 'bezahlte echte Flugminuten');
  assert.equal(sh.system, 'aldera'); assert.equal(sh.phase, 'dock');
  verweigern(w, s, { type:'shipFreightIce', owner:'house', schiff:id }, /physisch angedockt/);
  verweigern(w, s, { type:'shipReposition', owner:'house', schiff:id }, /physisch angedockt/);
  const saved = w.save(s), h = w.hash(s);
  assert.equal(w.hash(w.load(saved)), h, 'identischer Flugstand in Save/Load');
  pr(w, s, 'Freiflug');
  ausführen(w, s, 'shipDock', { schiff:id, station:'st_aldera' });
  let minuten=0;
  while (sh.flug.lage !== 'angedockt' && minuten++ < 90) w.minute(s);
  assert.equal(sh.flug.lage, 'angedockt', 'originaler Core-Dockprozess');
  assert.equal(s.kanon.flugdienst[id], undefined, 'Dienst am Dock beendet');
  assert.equal(s.owners[konto].cash, 0, 'Restreserve exakt zurückerstattet');
  assert.ok(s.owners.house.cash < money, 'Pilotenlohn wird nicht kostenlos erstattet');
  assert.equal(sh.ladung.eis || 0, 0);
  assert.equal(sh.ladung.erz || 0, 0);
  pr(w, s, 'Rückkehr am Dock');
  assert.equal(w.hash(w.load(w.save(s))), w.hash(s), 'Dockstate identisch nach Save/Load');
});
test('K1/Frachter: keine Übernahme fremder Frachter und keine rückwirkende Preisregel', () => {
  const w = Welt.erstellen(), s = w.createState(42);
  ausführen(w, s, 'shipBuy', { klasse:'frachter', station:'st_aldera' });
  const own = Object.values(s.ships).find(x => x.owner === 'house' && x.klasse === 'frachter');
  verweigern(w, s, { type:'shipUndock', owner:'npc3', schiff:own.id }, /Besitzer/);
  // W3-Spedition darf ihre Frachter nicht heimlich dem Spieler zum Handflug überlassen.
  const npc = w.execute(s, { type:'shipBuy', owner:'transport', klasse:'frachter', station:'st_aldera' });
  assert.equal(npc.ok, false, 'einmal gekaufte Hülle nicht nochmals vorhanden');
  const gefälscht = structuredClone(s);
  const f = gefälscht.ships[own.id]; f.owner = 'transport'; f.flug.lage = 'frei';
  assert.equal(w.audit(gefälscht).ok, false, 'Fremdeigentum/falscher Freiflug bei Manipulation abgelehnt');
  pr(w, s, 'keine Doppelverwendung der Ware');
});
