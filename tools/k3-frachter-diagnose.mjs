// Nur Diagnose des Original-K2-Core; keine neuen Befehle, Waren oder Geldquellen.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { vorbereiten, SZENARIEN } from './welt-szenarien.mjs';

export function nachrechnen(w, s) {
  const sum = (xs) => xs.reduce((a, b) => a + b, 0);
  const kassen = Object.fromEntries(Object.entries(s.owners).map(([id, o]) => [id, o.cash]));
  assert.ok(Object.values(kassen).every(n => Number.isSafeInteger(n) && n >= 0));
  assert.equal(sum(Object.values(kassen)), 33000);
  assert.equal(s.minted, 0); assert.equal(s.burned, 0);
  assert.equal(sum(Object.values(s.kanon.netto)), 0);
  const massen = {};
  for (const [ware, l] of Object.entries(s.ledger)) {
    const vorhanden = sum(Object.values(s.stations).map(x => x.lager[ware] || 0))
      + sum(Object.values(s.ships).map(x => x.ladung[ware] || 0));
    const soll = l.initial + l.mined + l.produced + l.imported - l.consumed - l.exported;
    assert.equal(vorhanden, soll, ware + ': Lager und Fracht unabhängig gezählt');
    // Gekaufte Hüllen bleiben auch nach Stilllegung körperlich existent.
    if (['miner', 'frachter'].includes(ware))
      assert.equal(Object.values(s.ships).filter(x => x.klasse === ware).length, l.consumed);
    massen[ware] = { ...l, vorhanden };
  }
  assert.equal(s.w4.erzVerbraucht, s.w4.materialErzeugt * 2);
  assert.equal(s.w4.materialErzeugt, s.ledger.material.produced);
  assert.equal(s.w5.materialVerbraucht, s.w5.begonnen * w.rules.w5.material);
  assert.equal(s.ledger.material.consumed, s.w5.materialVerbraucht + (s.kanon.minerWerft?.materialVerbraucht || 0));
  assert.equal(s.w5.arbeitsGezahlt, (s.w5.fertig * w.rules.w5.dauer + (s.w5.auftrag?.gearbeitet || 0)) * w.rules.w5.lohnJeMinute);
  assert.equal(s.owners.w5_arbeit_treuhand?.cash || 0, s.w5.arbeitsGebunden - s.w5.arbeitsGezahlt);
  assert.equal(s.w5ac.allocated - s.w5ac.paid, s.owners.w5ac_transfer_reserved.cash);
  assert.equal(s.w5ac.paid, sum(s.w5ac.completed.map(x => x.kosten)) + (s.w5ac.active?.gearbeitet || 0) * w.rules.w5Transfer.lohnJeMinute);
  return { kassen, massen, nullsaldo: sum(Object.values(s.kanon.netto)), weltgeld: sum(Object.values(kassen)) };
}
export function moment(w, s) {
  const b = w.bericht(s);
  return { tick: s.tick, hash: w.hash(s), ...nachrechnen(w, s), firmen: b.firmen,
    gebunden: b.gebunden, stationen: structuredClone(s.stations),
    frachter: b.schiffe.filter(x => x.klasse === 'frachter').map(x => ({ ...x,
      system: s.ships[x.id].system, phase: s.ships[x.id].phase, auftrag: s.ships[x.id].auftrag,
      ladung: { ...s.ships[x.id].ladung } })),
    w3: structuredClone(s.w3), w4: structuredClone(s.w4), w5: structuredClone(s.w5),
    transfer: structuredClone(s.w5ac), minerWerft: structuredClone(s.kanon.minerWerft || null),
    auftraege: b.auftraege, produktion: b.produktion, verkaeufe: b.verkaeufe };
}
export function diagnose(seed = 42, minuten = 14 * 1440, gate = () => {}) {
  const lauf = vorbereiten(SZENARIEN.find(x => x.id === 'S12'), seed);
  const { welt: w, state: s } = lauf;
  const ereignisse = [], still = new Set();
  let zuletzt = {}, ersterStillstand;
  for (let i = 0; i < minuten; i++) {
    w.minute(s); nachrechnen(w, s);
    const b = w.bericht(s);
    const werte = { bau: s.w5.begonnen, fertig: s.w5.fertig, kauf: s.w5.verkauft,
      transfer: s.w5ac.completed.length, erz: s.w3.abgeschlossen, eis: s.w5n.frachtAbgeschlossen,
      wasser: s.w5n.fabrikFertig, absatz: b.verkaeufe.wasserErloes };
    for (const [art, n] of Object.entries(werte)) if (n > (zuletzt[art]?.n || 0)) {
      zuletzt[art] = { tick: s.tick, n };
      if (['bau', 'fertig', 'kauf', 'transfer', 'erz'].includes(art)) ereignisse.push({ art, n, ...moment(w, s) });
    }
    for (const sh of b.schiffe) if (sh.stillgelegt && !still.has(sh.id)) {
      still.add(sh.id); ereignisse.push({ art: 'stilllegung', schiff: sh.id, ...moment(w, s) });
    }
    if (!ersterStillstand && b.schiffe.filter(x => x.klasse === 'frachter').every(x => x.stillgelegt)
      && s.w5.fertig > 0 && !s.w5.auftrag && !s.w5n.frachtauftrag && !s.w3.auftrag
      && !s.stations.st_nadir.lager.frachter) ersterStillstand = moment(w, s);
    gate(w, s);
  }
  assert.equal(w.audit(s).ok, true);
  return { basis: 'd7fe397401cfb8513bd1a7a79dba05483b8a9c71', seed,
    kosten: { material: w.rules.w5.material, materialISK: w.rules.w5.material * w.rules.w5.materialPreis,
      werftArbeit: w.rules.w5.dauer * w.rules.w5.lohnJeMinute,
      kauf: w.rules.w5.verkaufsPreis, transfer: w.rules.w5n.flugMinuten * w.rules.w5Transfer.lohnJeMinute,
      folgearbeit: 2 * w.rules.w5n.flugMinuten * w.rules.w3.arbeitJeMinute },
    zuletzt, ersterStillstand, ereignisse, ende: moment(w, s) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(JSON.stringify(diagnose(Number(process.argv[2] || 42)), null, 2));
