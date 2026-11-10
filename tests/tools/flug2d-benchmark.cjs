#!/usr/bin/env node
'use strict';
// F0/G0 Forschung: reproduzierbares Szenario, Zeitmessung NUR als Diagnostik.
// Kein Performance-Schwellenwert in CI, keine Veraenderung an Core oder Spielstand.
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const fs = require('node:fs'), path = require('node:path');
const { createHash } = require('node:crypto');
if (process.argv.includes('--vergleich')) {
  const { execFileSync } = require('node:child_process');
  const lauf = args => JSON.parse(execFileSync(process.execPath, [__filename, ...args], { encoding: 'utf8' }));
  const alt = lauf(['--vollscan']), optimiert = lauf([]);
  for (let i = 0; i < alt.messungen.length; i++)
    assert.equal(optimiert.messungen[i].zustandSha256, alt.messungen[i].zustandSha256,
      'Vollscan/Optimierung: identischer kompletter Endzustand');
  console.log(JSON.stringify({ alt, optimiert, alleEndzustaendeIdentisch: true }, null, 2));
  process.exit(0);
}
const datei = path.resolve(__dirname, '../../prototypes/flug2d/flug-kern.js');
let F;
if (process.argv.includes('--vollscan')) {
  const { Module } = require('node:module');
  const original = fs.readFileSync(datei, 'utf8');
  const start = original.indexOf('function richtungZu(dx, dy) {');
  const ende = original.indexOf('function drehen(', start);
  assert.ok(start > 0 && ende > start, 'Vergleichsfunktion eindeutig gefunden');
  const scan = `function richtungZu(dx, dy) {
    let best = 0, wert = -Infinity;
    for (let i = 0; i < 256; i++) {
      const w = dx * cos(i) + dy * sin(i);
      if (w > wert) { wert = w; best = i; }
    }
    return best;
  }
`;
  const mod = new Module(datei);
  mod._compile(original.slice(0, start) + scan + original.slice(ende), datei);
  F = mod.exports;
} else F = require(datei);

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
    zustandSha256: createHash('sha256').update(JSON.stringify(s)).digest('hex'),
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
