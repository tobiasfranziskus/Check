// K2-QA: unabhängige Zwischenzustandsprüfung ohne neue Produktions-/Geldregeln.
// Die Zustände stammen ausschließlich aus echten S12-Minuten, nicht aus erfundenen Warenbeständen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SZENARIEN, vorbereiten } from '../tools/welt-szenarien.mjs';

const S12 = SZENARIEN.find((s) => s.id === 'S12');
const geld = (s) => Object.values(s.owners).reduce((summe, o) => summe + o.cash, 0);
const buch = (s, art) => Object.entries(s.kanon.buch.summen)
  .filter(([k]) => k.startsWith(art + '|')).reduce((n, [, wert]) => n + wert, 0);

function momentaufnahmen() {
  const { welt, state, protokoll } = vorbereiten(S12);
  assert.ok(protokoll.every((p) => p.ok), 'Gründung nur aus bezahlten Originalbefehlen');
  let arbeit, rueckfracht;
  for (let minute = 0; minute < 14 * 1440; minute++) {
    welt.minute(state);
    const b = state.kanon.minerWerft;
    if (!arbeit && b?.auftrag?.gearbeitet > 0) {
      assert.equal(welt.audit(state).ok, true, 'während bezahlter Werftarbeit konsistent');
      arbeit = welt.save(state);
    }
    if (!rueckfracht && b?.transport) {
      assert.equal(welt.audit(state).ok, true, 'während Miner-Rückfracht konsistent');
      rueckfracht = welt.save(state);
    }
    if (arbeit && rueckfracht) break;
  }
  assert.ok(arbeit, 'S12 muss eine tatsächlich finanzierte Bauphase erreichen');
  assert.ok(rueckfracht, 'S12 muss einen tatsächlich beladenen Frachter erreichen');
  return { welt, arbeit, rueckfracht };
}

// Aufwendige echte S12-Probe einmalig aufbauen; Tests laden jeweils isolierte Kopien.
let gesicherteProbe;
function probe() { return gesicherteProbe ||= momentaufnahmen(); }

test('K2-QA: Lohnkonto ist während des Baus gedeckt; Save/Load mitten in der Arbeit reproduziert die exakten Minuten', () => {
  const { welt: w, arbeit } = probe();
  const s = w.load(arbeit), b = s.kanon.minerWerft;
  const dauer = w.rules.w5.dauer, lohn = w.rules.w5.lohnJeMinute;
  const vorher = b.auftrag.gearbeitet, fertig = b.fertig, gezahlt = buch(s, 'miner-arbeitslohn');
  const reserve = s.owners.k1_miner_arbeit.cash;
  assert.ok(vorher > 0 && vorher < dauer);
  assert.equal(reserve, (dauer - vorher) * lohn, 'Restarbeit bleibt real in Treuhand');
  const minuten = Math.min(10, dauer - vorher - 1);
  assert.ok(minuten > 0);
  const gleich = w.load(arbeit);
  for (let i = 0; i < minuten; i++) { w.minute(s); w.minute(gleich); }
  assert.equal(s.kanon.minerWerft.auftrag.gearbeitet, vorher + minuten);
  assert.equal(s.kanon.minerWerft.fertig, fertig, 'keine Hülle vor Arbeitsabschluss');
  assert.equal(s.owners.k1_miner_arbeit.cash, reserve - minuten * lohn);
  assert.equal(buch(s, 'miner-arbeitslohn') - gezahlt, minuten * lohn);
  assert.equal(w.hash(s), w.hash(gleich), 'unabhängig geladene Kopien laufen deterministisch');
  assert.equal(w.hash(w.load(w.save(s))), w.hash(s), 'erneuter Roundtrip aus Zwischenzustand');
  assert.equal(w.audit(s).ok, true);
  assert.equal(geld(s), 33000);
});

test('K2-QA: echte Miner-Rückfracht bindet Käufergeld und bezahlt den Transporteur erst nach Dockankunft', () => {
  const { welt: w, rueckfracht } = probe();
  const s = w.load(rueckfracht), b = s.kanon.minerWerft;
  const transport = b.transport;
  const schiff = s.ships[transport.schiff];
  const fracht = w.rules.w5n.flugMinuten * w.rules.w3.arbeitJeMinute;
  assert.equal(s.owners.k1_miner_fracht.cash, fracht, 'vollständige Rückfracht ist reserviert');
  assert.equal(schiff.ladung.miner, 1, 'wirkliche Hülle im Frachtraum');
  assert.equal(s.stations.st_nadir.lager.miner || 0, 0, 'nicht zugleich im Nadir-Lager');
  const vorher = b.geliefert, zahlung = buch(s, 'miner-fracht'), reserve = buch(s, 'miner-frachtreserve');
  const parallel = w.load(rueckfracht);
  let schritte = 0;
  while (s.kanon.minerWerft.geliefert === vorher) {
    w.minute(s); w.minute(parallel);
    assert.ok(++schritte <= 180, 'Rückfahrt muss nach echter Flugzeit ankommen');
    assert.equal(w.hash(s), w.hash(parallel), 'Replay auch während Frachterreise');
    assert.equal(w.audit(s).ok, true, 'minutenweise Geld-/Warenprüfung');
  }
  assert.ok(schritte > 1, 'kein sofortiger Teleport bei Verladung');
  assert.equal(s.kanon.minerWerft.geliefert, vorher + 1);
  assert.equal(s.owners.k1_miner_fracht.cash, 0, 'Treuhand erst bei Lieferung geleert');
  assert.equal(buch(s, 'miner-fracht') - zahlung, fracht, 'genau eine Zahlung an den Spediteur');
  assert.equal(buch(s, 'miner-frachtreserve') - reserve, 0, 'keine zweite Belastung des Käufers');
  assert.equal(s.ships[transport.schiff].ladung.miner || 0, 0);
  assert.equal(geld(s), 33000); assert.equal(w.audit(s).ok, true);
  assert.equal(w.hash(w.load(w.save(s))), w.hash(s));
});

test('K2-QA: unabhängiger Audit verweigert Geld- und Materialmanipulation in laufender Werft und unterwegs', () => {
  const { welt: w, arbeit, rueckfracht } = probe();
  const faelle = [
    ['Materialbeleg', arbeit, (s) => { s.kanon.minerWerft.materialVerbraucht += 1; }],
    ['Werfttreuhand', arbeit, (s) => { s.owners.k1_miner_arbeit.cash += 1; }],
    ['Frachttreuhand', rueckfracht, (s) => { s.owners.k1_miner_fracht.cash = 0; }],
    ['Doppellager', rueckfracht, (s) => { s.stations.st_nadir.lager.miner += 1; }],
    ['Huelle vom Frachter entfernt', rueckfracht, (s) => { delete s.ships[s.kanon.minerWerft.transport.schiff].ladung.miner; }],
  ];
  for (const [titel, json, eingriff] of faelle) {
    const s = w.load(json);
    assert.equal(w.audit(s).ok, true, titel + ': gültige Ausgangsbasis');
    eingriff(s);
    const pruefung = w.audit(s);
    assert.equal(pruefung.ok, false, titel + ': Manipulation muss entdeckt werden');
    assert.match(pruefung.fehler.join('; '), /K2-Minerwerft|Wirtschaft|Kasse|Buch/);
    assert.throws(() => w.save(s), /ungültigen Zustand/, titel + ': keine korrumpierte Sicherung');
  }
});
