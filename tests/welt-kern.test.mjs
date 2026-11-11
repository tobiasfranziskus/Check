// Kanonische Welt K1 (Forschungsregel 199): ein Zustand, ein Tick, Ortsbindung im Core.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Welt = require('../prototypes/welt/welt-kern.js');
const Kern = require('../prototypes/w5ac/rule191-w5-ferry-core.js');
const Flug = require('../prototypes/flug2d/flug-kern.js');

const geld = (s) => Object.values(s.owners).reduce((n, o) => n + o.cash, 0);
function neu(politik = {}, kapital = {}) {
  const w = Welt.erstellen(kapital), s = w.createState(42, { politik });
  const ok = (cmd) => { const r = w.execute(s, cmd); assert.equal(r.ok, true, cmd.type + ': ' + r.reason); return r; };
  // Ein abgelehnter Befehl darf weder Geld, Ware, Position noch Zufallszustand verändern.
  const nein = (cmd, muster) => {
    const vorher = w.canonical(s), r = w.execute(s, cmd);
    assert.equal(r.ok, false, 'muss abgelehnt werden: ' + JSON.stringify(cmd));
    if (muster) assert.match(r.reason, muster);
    assert.equal(w.canonical(s), vorher, 'Ablehnung ohne Nebenwirkung: ' + (cmd && cmd.type));
    return r.reason;
  };
  const pruefe = (text) => { const a = w.audit(s); assert.equal(a.ok, true, text + ': ' + JSON.stringify(a.fehler)); assert.equal(geld(s), 33000, text); };
  return { w, s, ok, nein, pruefe };
}
function mitSpielerMiner(politik) {
  const x = neu(politik);
  x.ok({ type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' });
  x.miner = Object.values(x.s.ships).find((sh) => sh.owner === 'house').id;
  return x;
}
const lohnVon = (x, id) => x.s.kanon.buch.summen['fluglohn|k1_flug_' + id + '|pilot_house'] || 0;
const bis = (x, bedingung, grenze = 200) => { let n = 0; while (!bedingung()) { x.w.minute(x.s); if (++n > grenze) throw Error('Bedingung nicht erreicht'); } return n; };

test('K1: Start ist eine einzige Welt mit Regel 199, 33.000 ISK und Flugkörper für jede Hülle', () => {
  const { w, s, pruefe } = neu();
  assert.equal(s.rulesVersion, 199); assert.equal(s.schema, 8); assert.equal(s.kanon.modell, 1);
  assert.equal(s.initialSupply, 33000); assert.equal(s.minted, 0); assert.equal(s.burned, 0);
  for (const sh of Object.values(s.ships)) assert.equal(sh.flug.lage, 'angedockt');
  assert.deepEqual(Object.keys(s.flug), ['schritt']);
  pruefe('Start');
  assert.equal(w.regel, Welt.REGEL);
});

test('K1-Haken lassen Regel195 bitgleich: unabhängig vor der Änderung berechnete Hashes', () => {
  // Referenzen stammen aus dem unveränderten Kern des Commits vor den K1-Haken (Seeds 1, 7, 42).
  const erwartet = { 1: 'fe10d9bb3aa1fd15', 7: '33f54f1760062707', 42: 'f7a96c4b9b4ed6b1' };
  for (const seed of [1, 7, 42]) {
    const e = Kern.createPrivateWageResearch({ buyerCash: 1536, carrierCash: 2000 }), c = e.core, r = e.rules, s = c.createW5State(seed);
    const x = (type, owner, extra = {}) => { const q = c.execute(s, { type, owner, ...extra }, r); assert.equal(q.ok, true, type); };
    x('shipBuy', 'transport', { station: 'st_aldera', klasse: 'frachter' }); x('shipBuy', 'house', { station: 'st_aldera', klasse: 'miner' });
    const fr = Object.values(s.ships).find((v) => v.klasse === 'frachter'), mi = Object.values(s.ships).find((v) => v.owner === 'house');
    x('shipMine', 'house', { schiff: mi.id, ware: 'eis' }); c.advance(s, 50, r); x('shipWait', 'house', { schiff: mi.id });
    x('shipFreight', 'transport', { schiff: fr.id }); c.advance(s, 120, r); x('shipFreightIce', 'transport', { schiff: fr.id }); c.advance(s, 60, r);
    x('stationWater', 'st_nadir', { station: 'st_nadir' }); c.advance(s, 20, r); x('pilotWaterBuy', 'pilot_erz', { menge: 6 }); c.advance(s, 2000, r);
    assert.equal(r.rulesVersion, 195); assert.equal(c.hash(s), erwartet[seed]); assert.equal(c.audit(s).ok, true);
    assert.equal(s.kanon, undefined); assert.equal(s.flug, undefined);
  }
  assert.throws(() => Kern.createResearch({ kanon: true }), /W5ad/);
});

test('K1: Förderung nur im Rohstofffeld – Auftrag am Dock fördert nichts', () => {
  const x = mitSpielerMiner();
  x.ok({ type: 'shipMine', owner: 'house', schiff: x.miner, ware: 'eis' });
  x.w.advance(x.s, 30);
  assert.equal(x.s.ships[x.miner].ladung.eis || 0, 0, 'kein Eis am Dock');
  assert.equal(x.s.w5n.eisAbgebaut, 0); assert.equal(x.s.w5n.mineLohn, 0);
  x.ok({ type: 'shipUndock', owner: 'house', schiff: x.miner });
  bis(x, () => x.s.ships[x.miner].flug.lage === 'frei');
  x.ok({ type: 'shipApproach', owner: 'house', schiff: x.miner, zielArt: 'feld', ziel: 'aldera:eis' });
  let unterwegs = 0;
  while (!Flug.imFeld(x.s.ships[x.miner], 'eis')) { x.w.minute(x.s); unterwegs++; assert.ok(unterwegs < 60); }
  assert.ok(unterwegs >= 5, 'echte Flugzeit zum Feld');
  const vorher = x.s.ships[x.miner].ladung.eis || 0;
  x.w.advance(x.s, 10);
  assert.equal((x.s.ships[x.miner].ladung.eis || 0) - vorher, 10, 'eine Einheit je Minute im Feld');
  assert.equal(x.s.w5n.mineLohn, x.s.w5n.mineMinuten * 2, 'jede Förderminute bezahlt');
  x.pruefe('im Feld');
});

test('K1: Ware bleibt an Bord – Verkauf nur am Dock, kein Fernverkauf und keine Feld-Sofortabnahme', () => {
  const x = mitSpielerMiner();
  x.ok({ type: 'shipShuttle', owner: 'house', schiff: x.miner, ware: 'eis' });
  const sh = x.s.ships[x.miner];
  bis(x, () => (sh.ladung.eis || 0) >= 50, 120);
  // Regel195 hätte bei 50 Eis sofort im Feld verkauft; in K1 bleibt die Station unbezahlt und leer.
  assert.equal(x.s.w5n.mineVerkauft, 0); assert.equal(x.s.stations.st_aldera.lager.eis, 0);
  assert.notEqual(sh.flug.lage, 'angedockt');
  const kern = x.w.kern.execute(x.s, { type: 'shipSellIce', owner: 'house', schiff: x.miner, menge: 50 }, x.w.rules);
  assert.equal(kern.ok, false, 'auch der Kernbefehl selbst lehnt den Fernverkauf ab');
  const kasse = x.s.owners.house.cash + x.s.owners[x.s.kanon.flugdienst[x.miner].konto].cash;
  bis(x, () => x.s.w5n.mineVerkauft === 50, 60);
  assert.equal(x.s.stations.st_aldera.lager.eis, 50);
  assert.ok(x.s.owners.house.cash + (x.s.owners['k1_flug_' + x.miner]?.cash || 0) >= kasse + 250 - 40, '250 ISK Erlös abzüglich bezahlter Flugminuten');
  x.pruefe('nach Dockverkauf');
});

test('K1: Erzauftrag wird erst am Dock abgerechnet; Storno im Raum verkauft nichts', () => {
  const { w, s, pruefe } = neu();
  const id = Object.keys(s.ships)[0], sh = s.ships[id];
  assert.equal(sh.owner, 'npc3'); assert.deepEqual(s.kanon.pendel[id], { ware: 'erz' });
  let n = 0;
  while (!(s.erzpilotVertraege[id] && (sh.ladung.erz || 0) >= 10)) { w.minute(s); assert.ok(++n < 80); }
  const treuhand = s.owners[s.erzpilotVertraege[id].konto].cash, lager = s.stations.st_aldera.lager.erz;
  assert.equal(treuhand, 500, 'Käufer hat die Charge vor Arbeitsbeginn gebunden');
  // Storno im Raum: Treuhand zurück, Ware bleibt an Bord, Station erhält nichts.
  const erz = sh.ladung.erz;
  assert.equal(w.kern.execute(s, { type: 'shipWait', owner: 'npc3', schiff: id }, w.rules).ok, true);
  assert.equal(sh.ladung.erz, erz); assert.equal(s.stations.st_aldera.lager.erz, lager);
  assert.equal(s.erzpilotVertraege[id], undefined);
  pruefe('nach Storno im Raum');
  // Neuer Auftrag, volle Charge, Abrechnung genau dann, wenn das Schiff am Dock liegt.
  w.kern.execute(s, { type: 'shipMine', owner: 'npc3', schiff: id, ware: 'erz' }, w.rules);
  n = 0;
  const verkauft = () => s.stats.verkaeufe[id];
  const vor = verkauft();
  while (verkauft() === vor) {
    w.minute(s); assert.ok(++n < 200);
    if (verkauft() !== vor) assert.equal(sh.flug.lage === 'angedockt' || s.kanon.flugdienst[id] !== undefined, true);
  }
  assert.equal(s.ledger.erz.mined >= 50, true);
  pruefe('nach Erzabnahme');
});

test('K1: ungültige Befehle haben keine Nebenwirkung', () => {
  const x = mitSpielerMiner();
  x.ok({ type: 'shipBuy', owner: 'transport', klasse: 'frachter', station: 'st_aldera' });
  const fr = Object.values(x.s.ships).find((sh) => sh.klasse === 'frachter').id;
  x.nein(null); x.nein({ type: 'gibtEsNicht', owner: 'house' });
  x.nein({ type: 'shipUndock', owner: 'npc3', schiff: x.miner }, /Besitzer/);
  x.nein({ type: 'shipUndock', owner: 'transport', schiff: fr }, /nur Miner/);
  x.nein({ type: 'shipSteer', owner: 'house', schiff: x.miner, kurs: 10, fahrt: 50 }, /freien Flug/);
  x.nein({ type: 'shipSellIce', owner: 'house', schiff: x.miner, menge: 5 });
  x.nein({ type: 'householdBuy', owner: 'fonds_aldera', menge: 1 }, /nicht genug Wasser/);
  x.nein({ type: 'householdBuy', owner: 'house', menge: 1 }, /Haushalt/);
  x.nein({ type: 'householdBuy', owner: 'fonds_aldera', menge: 0 });
  x.nein({ type: 'householdBuy', owner: 'fonds_aldera', menge: 1, station: 'st_nadir' }, /unerlaubtes Feld/);
  x.nein({ type: 'dividendPay', owner: 'house', betrag: 1 }, /Überschuss/);
  x.nein({ type: 'dividendPay', owner: 'pilot_eis', betrag: 1 }, /Firma/);
  x.nein({ type: 'pilotWaterBuy', owner: 'pilot_eis', menge: 1 }, /Wohnort/);
  x.nein({ type: 'shipShuttle', owner: 'house', schiff: x.miner, ware: 'kristall' }, /Vorkommen/);
  x.nein({ type: 'shipShuttleStop', owner: 'house', schiff: x.miner }, /kein laufender/);
  x.nein({ type: 'shipFreightIce', owner: 'transport', schiff: fr }, /Eischarge/);
  x.nein({ type: 'stationWater', owner: 'st_nadir', station: 'st_nadir' }, /Eis fehlt/);
  x.ok({ type: 'shipShuttle', owner: 'house', schiff: x.miner, ware: 'eis' });
  x.nein({ type: 'shipDock', owner: 'house', schiff: x.miner, station: 'st_aldera' }, /Pendelauftrag/);
  x.nein({ type: 'shipMine', owner: 'house', schiff: x.miner, ware: 'erz' }, /Pendelauftrag/);
  x.pruefe('nach Ablehnungen');
});

test('K1: Flugarbeit ist vorfinanziert, minutengenau bezahlt und wird am Dock abgerechnet', () => {
  const x = mitSpielerMiner();
  const haus = x.s.owners.house.cash;
  x.ok({ type: 'shipUndock', owner: 'house', schiff: x.miner });
  assert.equal(x.s.owners.house.cash, haus - 40, '40 ISK Reserve vor dem Abdocken gebunden');
  assert.equal(x.s.owners['k1_flug_' + x.miner].cash, 40);
  bis(x, () => x.s.ships[x.miner].flug.lage === 'frei');
  x.ok({ type: 'shipFlyTo', owner: 'house', schiff: x.miner, x: 200000, y: 0 });
  x.w.advance(x.s, 6);
  x.ok({ type: 'shipDock', owner: 'house', schiff: x.miner, station: 'st_aldera' });
  bis(x, () => x.s.ships[x.miner].flug.lage === 'angedockt');
  const minuten = lohnVon(x, x.miner);
  assert.ok(minuten >= 8, 'jede begonnene Flugminute zählt');
  assert.equal(x.s.owners.pilot_house.cash, minuten, '1 ISK je Flugminute an den eigenen Piloten');
  assert.equal(x.s.owners.house.cash, haus - minuten, 'Rest der Reserve zurück an den Eigentümer');
  assert.equal(x.s.owners['k1_flug_' + x.miner].cash, 0);
  assert.equal(x.s.kanon.verschleiss[x.miner], minuten, 'Nutzung der Hülle mitgezählt');
  x.pruefe('nach Rückkehr');
});

test('K1: ohne Kapital kein Abdocken; geht das Geld im Flug aus, stoppt das Schiff statt unbezahlt zu fliegen', () => {
  const x = mitSpielerMiner();
  // Der Eigentümer gibt sein Geld vollständig weiter (zulässiger gepaarter Transfer im Test über Flugreserven).
  x.ok({ type: 'shipUndock', owner: 'house', schiff: x.miner });
  bis(x, () => x.s.ships[x.miner].flug.lage === 'frei');
  x.ok({ type: 'shipFlyTo', owner: 'house', schiff: x.miner, x: 3000000, y: 3000000 });
  // Kasse des Eigentümers durch echten Kauf weiterer Hüllen leeren: 2 Miner zu 600 ISK.
  x.ok({ type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' });
  x.ok({ type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' });
  const rest = x.s.owners.house.cash + x.s.owners['k1_flug_' + x.miner].cash, schonBezahlt = lohnVon(x, x.miner);
  x.w.advance(x.s, rest + 30);
  const d = x.s.kanon.flugdienst[x.miner];
  assert.equal(d.gestrandet, true, 'Antrieb aus mangels Lohn');
  assert.equal(x.s.owners.house.cash, 0);
  const bezahlt = lohnVon(x, x.miner);
  assert.equal(x.s.owners.pilot_house.cash, bezahlt);
  assert.equal(bezahlt - schonBezahlt, rest, 'genau das vorhandene Geld wurde für Flugminuten verdient');
  const b = x.s.ships[x.miner].flug, ort = [b.x, b.y];
  x.w.advance(x.s, 20);
  assert.deepEqual([b.x, b.y], ort, 'gestrandetes Schiff bewegt sich nicht weiter');
  assert.equal(x.s.owners.pilot_house.cash, bezahlt, 'kein Lohn ohne Arbeit, keine Arbeit ohne Lohn');
  x.nein({ type: 'shipDock', owner: 'house', schiff: x.miner, station: 'st_aldera' }, /nicht finanziert/);
  const zweiter = Object.values(x.s.ships).filter((sh) => sh.owner === 'house')[1].id;
  x.nein({ type: 'shipUndock', owner: 'house', schiff: zweiter }, /nicht vorfinanziert/);
  x.pruefe('gestrandet');
});

test('K1: Frachter teilen den Flugzustand – im Dock oder im bezahlten Transit, nie im Freiflug', () => {
  const x = mitSpielerMiner({ ausschuettung: { house: 1000 } });
  x.ok({ type: 'shipBuy', owner: 'transport', klasse: 'frachter', station: 'st_aldera' });
  x.ok({ type: 'shipShuttle', owner: 'house', schiff: x.miner, ware: 'eis' });
  const fr = Object.values(x.s.ships).find((sh) => sh.klasse === 'frachter');
  bis(x, () => fr.phase === 'reise', 200);
  assert.equal(fr.flug.lage, 'transit'); assert.equal(fr.ladung.eis, 50);
  assert.equal(x.s.owners.w5n_fracht_kauf.cash, 490); assert.equal(x.s.owners.w5n_fracht_arbeit.cash, 120);
  // Bis zum Abschluss der Rundfracht ist der Körper ausschließlich im Transit; Flugbefehle sind gesperrt.
  let minuten = 0;
  while (x.s.w5n.frachtAbgeschlossen === 0) {
    assert.equal(fr.flug.lage, fr.phase === 'reise' ? 'transit' : 'angedockt');
    if (minuten === 30) x.nein({ type: 'shipDock', owner: 'transport', schiff: fr.id, station: 'st_nadir' }, /nur Miner/);
    x.w.minute(x.s); assert.ok(++minuten <= 121);
  }
  assert.equal(minuten, 120, 'Hin- und Rückflug je 60 bezahlte Kernminuten');
  assert.equal(fr.system, 'aldera'); assert.ok(['angedockt', 'transit'].includes(fr.flug.lage));
  assert.equal(x.s.w5n.eisGeliefert, 50); assert.equal(x.s.w5ag.paid.eis, 120);
  assert.ok(x.s.kanon.verschleiss[fr.id] >= 120, 'Frachter nutzt sich je bezahlter Flugminute ab');
  x.w.politikSetzen(x.s, { eisfracht: false });
  bis(x, () => fr.phase === 'dock', 130);
  assert.equal(fr.flug.lage, 'angedockt'); assert.equal(fr.flug.anker, 'st_aldera');
  x.pruefe('nach Rundfracht');
});

test('K1: ein ruhender Flugkörper ist ein Fixpunkt des Flugkerns (Grundlage der Minutenabkürzung)', () => {
  const x = mitSpielerMiner();
  x.ok({ type: 'shipShuttle', owner: 'house', schiff: x.miner, ware: 'eis' });
  let geprueft = 0;
  for (let i = 0; i < 4000 && geprueft < 400; i++) {
    x.w.teilschritt(x.s);
    for (const sh of Object.values(x.s.ships)) {
      if (!x.w.ruht(sh) || sh.flug.lage !== 'frei') continue;
      const kopie = JSON.parse(JSON.stringify({ ships: { [sh.id]: sh }, flug: { schritt: 0 } }));
      const vorher = JSON.stringify(kopie.ships[sh.id].flug);
      for (let k = 0; k < 60; k++) Flug.schritt(kopie);
      assert.equal(JSON.stringify(kopie.ships[sh.id].flug), vorher, 'ruhender Körper unverändert');
      geprueft++;
    }
  }
  assert.ok(geprueft >= 100, 'ruhende freie Körper tatsächlich geprüft: ' + geprueft);
});

test('K1: gleiche Befehle ergeben gleichen Hash – Minutenweg und 60 Teilschritte sind bitgleich', () => {
  function lauf(teil) {
    const x = mitSpielerMiner({ ausschuettung: { house: 1000 } });
    x.ok({ type: 'shipBuy', owner: 'transport', klasse: 'frachter', station: 'st_aldera' });
    x.ok({ type: 'shipShuttle', owner: 'house', schiff: x.miner, ware: 'eis' });
    if (teil) for (let i = 0; i < 1440 * 60; i++) x.w.teilschritt(x.s); else x.w.advance(x.s, 1440);
    x.pruefe('Tag 1');
    return { hash: x.w.hash(x.s), tick: x.s.tick, wasser: x.s.w5n.wasserProduziert };
  }
  const a = lauf(false), b = lauf(false), c = lauf(true);
  assert.deepEqual(a, b, 'Replay');
  assert.deepEqual(a, c, 'Teilschritte');
  assert.ok(a.wasser > 0);
});

test('K1: Save/Load-Roundtrip während Förderung, Flug, Andocken, Transit, Wasserwerk, Rückfracht und offener Treuhand', () => {
  const x = mitSpielerMiner({ ausschuettung: { house: 1000 } });
  x.ok({ type: 'shipBuy', owner: 'transport', klasse: 'frachter', station: 'st_aldera' });
  x.ok({ type: 'shipShuttle', owner: 'house', schiff: x.miner, ware: 'eis' });
  const gesehen = new Set();
  const lagen = () => {
    const mi = x.s.ships[x.miner], a = x.s.w5n.frachtauftrag;
    const l = [];
    if (mi.flug.lage === 'frei' && Flug.imFeld(mi, 'eis') && mi.auftrag === 'foerdern') l.push('foerderung');
    if (mi.flug.lage === 'frei' && !Flug.imFeld(mi, 'eis')) l.push('flug');
    if (mi.flug.lage === 'andocken') l.push('andocken');
    if (mi.flug.lage === 'abdocken') l.push('abdocken');
    if (a?.phase === 'hin') l.push('transit-hin');
    if (a?.phase === 'rueck') l.push('transit-rueck');
    if (x.s.w5n.fabrikauftrag) l.push('wasserwerk');
    if (x.s.kanon.rueckfracht) l.push('rueckfracht-an-bord');
    if (Object.keys(x.s.erzpilotVertraege).length) l.push('erz-treuhand');
    if (x.s.owners.w5n_fracht_kauf?.cash > 0) l.push('fracht-treuhand');
    if (x.s.flug.schritt !== 0) l.push('teilschritt');
    return l;
  };
  for (let i = 0; i < 600 * 60 && gesehen.size < 11; i++) {
    x.w.teilschritt(x.s);
    const neue = lagen().filter((l) => !gesehen.has(l));
    if (!neue.length) continue;
    neue.forEach((l) => gesehen.add(l));
    const json = x.w.save(x.s), hash = x.w.hash(x.s);
    const kopie = x.w.load(json);
    assert.equal(x.w.hash(kopie), hash, 'Hash nach Laden: ' + neue.join());
    assert.equal(x.w.save(kopie), json, 'bitgleiches JSON: ' + neue.join());
    // Beide Welten laufen identisch weiter – nichts wurde umgedeutet oder verloren.
    const original = x.w.load(json);
    for (let k = 0; k < 400; k++) { x.w.teilschritt(kopie); x.w.teilschritt(original); }
    assert.equal(x.w.hash(kopie), x.w.hash(original), 'identische Fortsetzung: ' + neue.join());
  }
  assert.deepEqual([...gesehen].sort(), ['abdocken', 'andocken', 'erz-treuhand', 'flug', 'foerderung', 'fracht-treuhand',
    'rueckfracht-an-bord', 'teilschritt', 'transit-hin', 'transit-rueck', 'wasserwerk']);
});

test('K1: Laden weist manipulierte, fremde und unvollständige Stände ab', () => {
  const x = mitSpielerMiner({ ausschuettung: { house: 1000 } });
  x.ok({ type: 'shipBuy', owner: 'transport', klasse: 'frachter', station: 'st_aldera' });
  x.ok({ type: 'shipShuttle', owner: 'house', schiff: x.miner, ware: 'eis' });
  x.w.advance(x.s, 400);
  const json = x.w.save(x.s);
  const faelschungen = {
    'geschenktes Geld': (r) => { r.owners.house.cash += 1; },
    'verschobenes Geld ohne Beleg': (r) => { r.owners.house.cash += 5; r.owners.st_nadir.cash -= 5; },
    'gefälschtes Netto': (r) => { r.kanon.netto.house = (r.kanon.netto.house || 0) + 7; },
    'Wasser aus dem Nichts': (r) => { r.stations.st_aldera.lager.wasser += 1; },
    'Eis aus dem Nichts': (r) => { r.ships[x.miner].ladung.eis = (r.ships[x.miner].ladung.eis || 0) + 1; },
    'Fluglohn ohne Minute': (r) => { r.kanon.fluglohnMinuten += 1; },
    'Schiff ohne Körper': (r) => { delete r.ships[x.miner].flug; },
    'Körper mit Treibstoff': (r) => { r.ships[x.miner].flug.treibstoff = 100; },
    'Emission': (r) => { r.minted = 100; r.owners.house.cash += 100; },
    'Regel195-Kennung': (r) => { r.rulesVersion = 195; },
    'künftiges Schema': (r) => { r.schema = 9; },
    'fehlendes Weltbuch': (r) => { delete r.kanon; },
    'fremdes Datenmodell': (r) => { r.kanon.modell = 2; },
  };
  for (const [name, f] of Object.entries(faelschungen)) {
    const roh = JSON.parse(json); f(roh);
    assert.throws(() => x.w.load(JSON.stringify(roh)), Error, name);
  }
  assert.throws(() => x.w.load('{'), /nicht lesbar/);
  assert.equal(x.w.hash(x.w.load(json)), x.w.hash(x.s), 'Original bleibt ladbar');
});

test('K1: Pendelende im Raum führt das Schiff erst zum Dock und verkauft die Ladung dort', () => {
  const x = mitSpielerMiner();
  x.ok({ type: 'shipShuttle', owner: 'house', schiff: x.miner, ware: 'eis' });
  const sh = x.s.ships[x.miner];
  bis(x, () => (sh.ladung.eis || 0) >= 20, 80);
  x.ok({ type: 'shipShuttleStop', owner: 'house', schiff: x.miner });
  assert.equal(x.s.kanon.pendel[x.miner].beenden, true);
  bis(x, () => x.s.kanon.pendel[x.miner] === undefined, 80);
  assert.equal(sh.flug.lage, 'angedockt'); assert.equal(sh.ladung.eis || 0, 0);
  assert.equal(x.s.w5n.mineVerkauft, x.s.w5n.eisAbgebaut);
  x.w.advance(x.s, 120);
  assert.equal(sh.flug.lage, 'angedockt', 'ohne Auftrag bleibt das Schiff kostenfrei im Dock');
  assert.equal(x.s.kanon.flugdienst[x.miner], undefined);
  x.pruefe('nach Pendelende');
});

test('K1: Verschleiß mindert den Buchwert; die Rücklage ist nicht ausschüttbar', () => {
  const x = mitSpielerMiner({ ausschuettung: { house: 0 } });
  x.ok({ type: 'shipBuy', owner: 'transport', klasse: 'frachter', station: 'st_aldera' });
  x.ok({ type: 'shipShuttle', owner: 'house', schiff: x.miner, ware: 'eis' });
  x.w.advance(x.s, 1440);
  const b = x.w.bericht(x.s), haus = b.firmen.house;
  const aktiv = x.s.kanon.verschleiss[x.miner];
  assert.ok(aktiv > 600);
  assert.equal(x.w.buchwert(x.s, x.miner), 600 - Math.floor(aktiv * 300 / 1000));
  assert.equal(haus.ruecklage, 600 - haus.anlagewert);
  // Ausschüttbar ist höchstens der Überschuss über Anfangskapital, Betriebsreserve und Rücklage.
  assert.ok(haus.ausschuettbar <= haus.kasse - haus.ruecklage - 250);
  assert.ok(haus.ausschuettbar <= haus.kasse + haus.anlagewert - 3000);
  x.nein({ type: 'dividendPay', owner: 'house', betrag: haus.ausschuettbar + 1 }, /Überschuss/);
  if (haus.ausschuettbar > 0) {
    x.ok({ type: 'dividendPay', owner: 'house', betrag: haus.ausschuettbar });
    assert.equal(x.s.owners.eigner_house.cash, haus.ausschuettbar);
  }
  x.pruefe('nach Ausschüttung');
});
