#!/usr/bin/env node
'use strict';
// F0/G0 Forschung: reproduzierbares Szenario, Zeitmessung NUR als Diagnostik.
// Kein Performance-Schwellenwert in CI, keine Veraenderung an Core oder Spielstand.
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const F = require('../../prototypes/flug2d/flug-kern.js');

const SCHRITTE = 12000;
const WELT_90_TAGE = 90 * 24 * 60 * F.DATEN.schritteJeMinute;

function welt(anzahl, aktiv) {
  const s = { flug: { schritt: 0 }, ships: {} };
  for (let i = 0; i < anzahl; i++) {
    const id = 's' + i;
    s.ships[id] = { id, owner: 'forschung', klasse: 'miner', system: 'aldera',
      phase: 'dock', flug: F.koerperAngedockt('aldera') };
  }
  if (aktiv) {
    for (const id of Object.keys(s.ships))
      assert.equal(F.ausfuehren(s, { type: 'shipUndock', owner: 'forschung', schiff: id }).ok, true);
    for (let j = 0; j < F.DATEN.andocken.schritte; j++) F.schritt(s);
  }
  return s;
}

function messen(anzahl, aktiv, schritte = SCHRITTE) {
  const s = welt(anzahl, aktiv), ids = Object.keys(s.ships);
  assert.equal(F.audit(s).ok, true, 'Startzustand');
  const start = performance.now();
  for (let i = 0; i < schritte; i++) {
    if (aktiv && i % 400 === 0) {
      // Wechselnde, weit entfernte Ziele halten Kursregelung aktiv.
      const p = (i / 400) % 2 === 0 ? { x: 3000000, y: -2000000 } : { x: -3000000, y: 2000000 };
      for (const schiff of ids)
        assert.equal(F.ausfuehren(s, { type: 'shipFlyTo', owner: 'forschung', schiff, ...p }).ok,
          true, 'reproduzierbarer Zielwechsel');
    }
    F.schritt(s);
  }
  const ms = performance.now() - start;
  assert.equal(F.audit(s).ok, true, 'Endzustand');
  return {
    schiffe: anzahl, bewegung: aktiv ? 'permanent-anflug' : 'angedockt', flugschritte: schritte,
    sekunden: +(ms / 1000).toFixed(3), mikrosekundenJeFlugschritt: +(ms * 1000 / schritte).toFixed(1),
    hochrechnung90TageMinuten: +(ms / schritte * WELT_90_TAGE / 60000).toFixed(1),
    hinweis: 'Synthetische Hochrechnung bei konstanter Aktivitaet, kein echter 90-Tage-Test'
  };
}

// JIT-Aufwaermen, identische Reihenfolge und Schiffsanzahl fuer alle Messungen.
for (const [n, aktiv] of [[4, false], [4, true], [20, false], [20, true]]) messen(n, aktiv, 1000);
const messungen = [];
for (const [n, aktiv] of [[4, false], [4, true], [20, false], [20, true]])
  messungen.push(messen(n, aktiv));
console.log(JSON.stringify({ profil: 'F0-G0-Synthetik', schritteProMinute: F.DATEN.schritteJeMinute,
  flugschritte90Tage: WELT_90_TAGE, flugschritte13x90: WELT_90_TAGE * 13,
  messungen }, null, 2));
