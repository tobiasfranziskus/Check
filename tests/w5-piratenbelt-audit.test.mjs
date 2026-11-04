// W5-Auftrag C: nichtproduktives Piratenbelt-/Kopfgeld-/Pilotenaudit.
// Diese Tests prüfen (a) das Auditwerkzeug selbst und (b) das TATSÄCHLICHE Ist-Verhalten des
// unveränderten Regel-14-Kerns. Sie sind KEINE Abnahme einer künftigen Integration; die späteren
// Abnahmetests A1–A6 sind in docs/W5_PIRATENBELT_OEKONOMIE.md nur als Anforderung definiert.
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../tools/w5-piratenbelt-audit.mjs';

const htmlVorher = A.SHA(fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'));
const kern = A.ladeKern();
const ref = A.referenzwerte(kern);

test('Referenzwerte stammen aus den vorhandenen Regel-14-Daten', () => {
  assert.equal(ref.regelVersion, 14);
  assert.deepEqual(ref.kopfgeld, { klein: 120, mittel: 180, gross: 240 });
  assert.equal(ref.kopfgeldFaktorSpieler, 3);
  assert.equal(ref.jaeger.basis, 900);
  assert.equal(ref.jaeger.betriebJeStunde, 50);
  assert.deepEqual(ref.piratenErsatzpreis, { pirat_klein: 300, pirat_mittel: 450, pirat_gross: 900 });
  assert.deepEqual(ref.anomalien.map((a) => a.system), ['dravos', 'meridian'], 'zwei Piratenanomalien ohne Staatsjäger');
  assert.deepEqual(ref.anomalien[0].piraten, { pirat_klein: 1 });
  assert.deepEqual(ref.anomalien[1].piraten, { pirat_mittel: 1, pirat_gross: 1 });
  assert.ok(ref.jaeger.kaufStart >= ref.jaeger.basis, 'Kaufpreis inkl. Gebühr aus Kernpreisfunktion');
});

// Hilfszustand mit erzwungener Begegnung, ausschließlich über eine Regelkopie.
function begegnung({ owner, piraten = { pirat_klein: 1 }, jaeger = 1, system = 'dravos', seed = 3 }) {
  const r = A.regelKopie(kern.rules); r.world.patrouilleChance = 1000;
  const p = A.pruefZustand(kern, r, { seed, system, jaeger, owner, piraten });
  return { r, ...p };
}

test('IST: Abschuss schöpft genau ein Kopfgeld beim Schiffseigentümer (Spieler ×3, NPC ×1)', () => {
  for (const [owner, faktor] of [['house', 3], ['npc1', 1]]) {
    let gefunden = false;
    for (let seed = 1; seed < 40 && !gefunden; seed++) {
      const { r, s, piratIds } = begegnung({ owner, seed });
      const c0 = s.owners[owner].cash; const m0 = s.minted;
      kern.sicherheit.patrouille(s, r);
      if (s.ships[piratIds[0]]) continue;
      gefunden = true;
      assert.equal(s.minted - m0, 120 * faktor);
      assert.equal(s.owners[owner].cash - c0, 120 * faktor);
      // erneuter Aufruf: Pirat ist entfernt, kein zweites Kopfgeld
      kern.sicherheit.patrouille(s, r);
      assert.equal(s.minted - m0, 120 * faktor, 'kein doppeltes Kopfgeld');
      assert.ok(kern.core.audit(s).ok);
    }
    assert.ok(gefunden, `kein Abschuss für ${owner} gefunden`);
  }
});

test('IST: Piratenersatz zahlt Ersatzpreis an Piratenmarkt, verbraucht aber keine Hüllenware', () => {
  const r = A.regelKopie(kern.rules);
  const s = kern.core.createState(5, r);
  const dravos = Object.values(s.ships).find((x) => x.owner === 'pirates' && x.system === 'dravos');
  delete s.ships[dravos.id]; delete s.stats.verkaeufe[dravos.id];
  const kasse = s.owners.pirates.cash; const markt = s.owners.st_meridian.cash;
  const ledger = JSON.stringify(s.ledger); const lager = JSON.stringify(s.stations);
  kern.sicherheit.piratenErsatz(s, r);
  assert.equal(s.owners.pirates.cash, kasse - 300);
  assert.equal(s.owners.st_meridian.cash, markt + 300, 'reiner Transfer, keine Senke');
  assert.equal(JSON.stringify(s.ledger), ledger, 'BEFUND: Hülle entsteht ohne Waren-/Materialbuchung');
  assert.equal(JSON.stringify(s.stations), lager);
  assert.ok(Object.values(s.ships).some((x) => x.owner === 'pirates' && x.system === 'dravos'));
  // ohne Kasse kein Ersatz
  const t = kern.core.createState(5, r);
  const p2 = Object.values(t.ships).find((x) => x.owner === 'pirates' && x.system === 'dravos');
  delete t.ships[p2.id]; delete t.stats.verkaeufe[p2.id]; t.owners.pirates.cash = 299; t.owners.st_meridian.cash += 3000 - 299;
  kern.sicherheit.piratenErsatz(t, r);
  assert.ok(!Object.values(t.ships).some((x) => x.owner === 'pirates' && x.system === 'dravos'), 'kein Gratisrespawn');
});

test('IST: Spielerjagd stoppt ohne Betriebsbudget; NPC-Jäger werden nicht gestoppt (Lücke)', () => {
  for (const owner of ['house', 'npc1']) {
    const { r, s, jaegerIds } = begegnung({ owner });
    const j = s.ships[jaegerIds[0]]; j.arbeit = 60;
    const rest = s.owners[owner].cash - 10; s.owners[owner].cash = 10; s.owners.fonds_aldera.cash += rest;
    kern.core.betriebskosten(s, r);
    if (owner === 'house') assert.equal(j.auftrag, 'halten', 'Spieler: automatisch gestoppt');
    else assert.equal(j.auftrag, 'jagd', 'BEFUND: NPC-Jäger jagt trotz fehlendem Budget weiter');
    assert.equal(s.owners[owner].cash, 0, 'Teilzahlung 10 von 50 ISK, Rest unbezahlt');
    assert.ok(kern.core.audit(s).ok);
  }
});

test('IST: Jagd ohne Beute kostet nur NPC-Jäger Betrieb, nicht den Spieler', () => {
  for (const [owner, erwartet] of [['house', 0], ['npc1', 60]]) {
    const { r, s, jaegerIds } = begegnung({ owner, piraten: {} });
    kern.core.reise(s, r);
    assert.equal(s.ships[jaegerIds[0]].arbeit, erwartet === 0 ? 0 : 1);
  }
});

test('Kampfstatistik nutzt die echte Patrouille und ist deterministisch', () => {
  const a = A.kampfStatistik(kern, { system: 'dravos', jaeger: 1, owner: 'house', proben: 200 });
  const b = A.kampfStatistik(kern, { system: 'dravos', jaeger: 1, owner: 'house', proben: 200 });
  assert.deepEqual(a, b);
  assert.ok(a.kampfJe1000h > 450 && a.kampfJe1000h < 750, 'Begegnungsquote nahe patrouilleChance 600');
  const m = A.kampfStatistik(kern, { system: 'meridian', jaeger: 1, owner: 'house', proben: 200 });
  assert.ok(m.jaegerVerlusteJe1000h > a.jaegerVerlusteJe1000h, 'Meridian gefährlicher als Dravos');
});

test('Stundenrechnung und Rentabilitätsgitter trennen Kopfgeld, Betrieb und Hüllenersatz', () => {
  const st = A.kampfStatistik(kern, { system: 'dravos', jaeger: 1, owner: 'npc1', proben: 200 });
  const x = A.stundenRechnung(ref, st);
  assert.equal(x.faktor, 1);
  assert.equal(x.je1000h.nettoBetreiber, x.je1000h.kopfgeldBrutto - x.je1000h.betriebTransferAnFonds - x.je1000h.huellenErsatzKauf);
  const g = A.rentabilitaetsGitter(ref, { klasse: 'pirat_klein' });
  const null0 = g.zeilen.find((z) => z.abschuesse === 0 && z.verluste === 0 && z.faktor === 1);
  assert.equal(null0.netto, -5000, '0 Abschüsse = 100 h × 50 ISK Betrieb Verlust');
  const grenze = g.grenzen.find((z) => z.faktor === 1 && z.verlusteJe100h === 0);
  assert.equal(grenze.mindestAbschuesseJe100h, Math.ceil(5000 / 120));
});

test('Finanzierungsvarianten: Bilanzidentität, kein Respawn ohne Hülle oder Einnahmen, Emission getrennt', () => {
  const basis = { system: 'dravos', klasse: 'pirat_klein', nachfrageJe1000h: 590, verlusteJe1000h: 0, stunden: 24 * 30 };
  for (const pb of Object.keys(A.PB_VARIANTEN)) for (const kg of Object.keys(A.KG_VARIANTEN)) for (const faktor of [1, 3]) {
    const l = A.finanzierungsLauf(ref, { ...basis, pb, kg, faktor, huellenLager: 3, emissionsDeckel: 500 });
    assert.ok(l.bilanzOk, `${pb}/${kg}`);
    assert.ok(l.piratenRespawns <= Math.floor(ref.piratenStartkasse / 300), 'endliche Piratenkasse');
    if (pb !== 'PB0_ist') assert.equal(l.respawnOhneHuelle, 0);
    if (pb === 'PB0_ist') assert.equal(l.zulaessig, false);
    if (pb === 'PB1_endlich' || pb === 'PB3_einnahmegebunden') assert.equal(l.piratenRespawns, 0, 'Ratting-only: keine Einnahmen');
    if (pb === 'PB2_werftkauf') assert.ok(l.piratenRespawns <= 3, 'nicht mehr als Hüllenlager');
    if (kg === 'KG1_staatskasse' || kg === 'KG2_systemfonds') assert.equal(l.neuGeschoepft, 0);
    if (kg === 'KG3_deckel') assert.ok(l.neuGeschoepft <= 500);
    assert.equal(l.kopfgeldGezahlt + l.kopfgeldUnbezahlt, l.abschuesse * 120 * faktor, 'genau ein Anspruch je Abschuss');
  }
  // Nullbudget: Betreiber ohne Kasse jagt nie
  const n = A.finanzierungsLauf(ref, { ...basis, pb: 'PB0_ist', kg: 'KG0_emission', betreiberStart: 0 });
  assert.equal(n.jagdStunden, 0); assert.equal(n.abschuesse, 0); assert.equal(n.neuGeschoepft, 0);
});

test('XP gehört zur Pilot-ID, wird nur einmal je Beleg vergeben und überlebt Schiffsverlust', () => {
  const reg = A.neuesPilotenRegister();
  A.pilotAnlegen(reg, { pilotId: 'p_b', art: 'npc', arbeitgeber: 'npc1' });
  A.pilotAnlegen(reg, { pilotId: 'p_a', art: 'spieler', arbeitgeber: 'house' });
  A.pilotZuweisen(reg, 'p_a', 'sh100'); A.pilotZuweisen(reg, 'p_b', 'sh101');
  const beleg = { belegId: 'abschuss:1:sh050', tick: 60, system: 'dravos', piratKlasse: 'pirat_mittel',
    teilnehmer: [{ pilotId: 'p_b', schiffId: 'sh101' }, { pilotId: 'p_a', schiffId: 'sh100' }] };
  assert.deepEqual(A.abschussXpVergeben(reg, beleg), { vergeben: true, anteile: { p_a: 8, p_b: 7 } });
  assert.equal(A.abschussXpVergeben(reg, beleg).vergeben, false, 'keine Doppelvergabe');
  assert.equal(A.abschussXpVergeben(reg, { ...beleg, belegId: 'x', teilnehmer: [] }).vergeben, false, 'ohne Teilnehmer keine XP');
  assert.ok(A.schiffVerloren(reg, 'p_a', 'sh100'));
  assert.equal(reg.piloten.p_a.xp, 8, 'Verlust löscht keine XP'); assert.equal(reg.piloten.p_a.schiff, null);
  A.pilotZuweisen(reg, 'p_a', 'sh102');
  assert.deepEqual(reg.piloten.p_a.schiffsHistorie, ['sh100', 'sh102']);
  // Save/Load-Rundreise stabil und manipulationssicher
  const t = A.registerSpeichern(reg);
  assert.equal(A.registerSpeichern(A.registerLaden(t)), t);
  const kaputt = JSON.parse(t); kaputt.piloten.p_a.xp = 999;
  assert.throws(() => A.registerLaden(JSON.stringify(kaputt)), /nicht durch Belege gedeckt/);
  assert.throws(() => A.registerLaden(JSON.stringify({ ...JSON.parse(t), version: 2 })), /Registerversion/);
});

test('Ränge und Kampfbonus sind begrenzt', () => {
  assert.equal(A.rangVon(0).rang, 0); assert.equal(A.rangVon(149).rang, 1); assert.equal(A.rangVon(1000).rang, 4);
  assert.equal(A.rangVon(10 ** 9).rang, 4);
  assert.equal(A.trefferMitBonus(511, 0), 511);
  assert.equal(A.trefferMitBonus(511, 10 ** 9), 511 + Math.floor(511 * 4 / 100), 'Deckel +4 %');
});

test('Gehalt, Pacht und Kopfgeldbeteiligung sind Transfers; Unterdeckung bleibt offener Anspruch', () => {
  const v = A.vertragsAbrechnung({ modell: 'konzernauftrag', kopfgeld: 0, stunden: 100, betriebJeStunde: 50,
    konzernKasse: 2000, gehaltJeStunde: 10, anteilPilotProzent: 20 });
  assert.ok(v.bilanzOk); assert.equal(v.konten.konzern, 0); assert.equal(v.offenerAnspruch, 4000);
  const p = A.vertragsAbrechnung({ modell: 'pacht', kopfgeld: 3600, stunden: 100, betriebJeStunde: 50,
    konzernKasse: 0, pilotKasse: 500, pachtJeStunde: 15 });
  assert.ok(p.bilanzOk); assert.equal(p.pilotNetto, 3600 - 5000 - 15 * 100 + p.offenerAnspruch);
  assert.ok(p.buchungen.filter((b) => b.zweck === 'kopfgeld').length === 1, 'eine Kopfgeldquelle');
});

test('Echter Kern, kurze Läufe: Kauf, Jagd, Nullbudget, Konzernersatz deterministisch und audit-sauber', () => {
  const tage = 3;
  for (const sz of ['ratting_dravos', 'null_budget', 'konzern_meridian', 'null_kopfgeld']) for (const seed of [42, 7]) {
    const a = A.kernLauf(kern, seed, sz, { tage }); const b = A.kernLauf(kern, seed, sz, { tage });
    assert.equal(a.hash, b.hash, `${sz}/${seed} deterministisch`);
    assert.ok(a.auditOk, `${sz}/${seed} Kernaudit`);
    assert.equal(a.befehleAbgelehnt, 0);
    assert.equal(a.xpDoppelAbgelehnt, a.belege, 'jede Wiederholung eines Belegs abgelehnt');
    assert.equal(a.pilot.xp, Object.values(a.register.belege).reduce((n, x) => n + Object.values(x.anteile).reduce((p, q) => p + q, 0), 0));
    if (sz === 'null_budget') { assert.equal(a.kopfgeldJaeger, 0); assert.ok(a.autostopps > 0); assert.equal(a.jagdStunden, 0); }
    if (sz === 'null_kopfgeld') assert.equal(a.minted, 0);
    if (sz === 'konzern_meridian') assert.ok(a.kaeufe >= 1 && a.kernIndienstJaeger === a.kaeufe, 'NPC-Jäger nur über bezahlten ersatzkauf');
    if (sz === 'ratting_dravos') assert.equal(a.kaeufe, 1);
  }
});

test('Dateigrenze: index.html bleibt unverändert', () => {
  assert.equal(A.SHA(fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')), htmlVorher);
  assert.equal(kern.htmlSha256, htmlVorher);
});
