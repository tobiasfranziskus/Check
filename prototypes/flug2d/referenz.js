/* Aphros Void · Flug2D-Sandboxwelt und fester Referenzlauf [ANALYSE].
 * Enthält bewusst KEINE Wirtschaft: keine Konten, keine Ladung, keine Verträge.
 * Der "Auftragsersatz" unten steht nur für die spätere Core-Logik (Fracht voll -> Station);
 * er erzeugt ausschließlich dieselben validierten Flugbefehle wie der Spieler.
 */
(function(scope){
'use strict';
const F = typeof module === 'object' && module.exports ? require('./flug-kern.js') : scope.FlugKern;
const N = F.DATEN.schritteJeMinute;

function welt() {
  const schiff = (id, owner, klasse) => ({ id, owner, klasse, system: 'aldera', phase: 'dock', flug: F.koerperAngedockt('aldera') });
  return { tick: 0, flug: { schritt: 0 },
    ships: { sp1: schiff('sp1', 'house', 'miner'), np1: schiff('np1', 'npc3', 'miner'),
      fr1: schiff('fr1', 'transport', 'frachter'), jg1: schiff('jg1', 'house', 'jaeger') },
    sandbox: { np1: { ziel: 'feld', ware: 'erz', minuten: 0 } } };
}
// Minutenhaken der Sandbox. Im echten Core steht hier der unveränderte Minuten-Tick.
function minute(state) {
  state.tick += 1;
  for (const id of Object.keys(state.sandbox).sort()) {
    const plan = state.sandbox[id], s = state.ships[id];
    const amZiel = plan.ziel === 'feld' ? F.imFeld(s, plan.ware) : s.flug.lage === 'angedockt';
    if (amZiel && ++plan.minuten >= (plan.ziel === 'feld' ? 3 : 1)) { plan.ziel = plan.ziel === 'feld' ? 'station' : 'feld'; plan.minuten = 0; }
    F.fuehreZu(state, s, plan.ziel === 'feld' ? { art: 'feld', id: s.system + ':' + plan.ware } : { art: 'station', id: 'st_' + s.system });
  }
}
const index = (state) => state.tick * N + state.flug.schritt;
// Führt n Flugschritte aus. befehle: [[schrittIndex, cmd], ...]; Wirkung genau vor dem genannten Schritt.
function vor(state, n, befehle = []) {
  const ergebnisse = [];
  for (let i = 0; i < n; i++) {
    const jetzt = index(state);
    for (const [wann, cmd] of befehle) if (wann === jetzt) ergebnisse.push(F.ausfuehren(state, cmd));
    if (F.schritt(state)) minute(state);
  }
  return ergebnisse;
}
const SKRIPT = Object.freeze([
  [0, { type: 'shipUndock', owner: 'house', schiff: 'sp1' }],
  [10, { type: 'shipUndock', owner: 'transport', schiff: 'fr1' }],
  [20, { type: 'shipUndock', owner: 'house', schiff: 'jg1' }],
  [45, { type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 224, fahrt: 100 }],
  [60, { type: 'shipApproach', owner: 'transport', schiff: 'fr1', zielArt: 'feld', ziel: 'aldera:eis' }],
  [70, { type: 'shipSteer', owner: 'house', schiff: 'jg1', kurs: 40, fahrt: 100 }],
  [300, { type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 16, fahrt: 60 }],
  [330, { type: 'shipSteer', owner: 'house', schiff: 'jg1', kurs: 170, fahrt: 35 }],
  [500, { type: 'shipFlyTo', owner: 'house', schiff: 'sp1', x: -320000, y: 480000 }],
  [640, { type: 'shipSteer', owner: 'house', schiff: 'jg1', kurs: 250, fahrt: 100 }],
  [900, { type: 'shipApproach', owner: 'house', schiff: 'sp1', zielArt: 'feld', ziel: 'aldera:eis' }],
  [1200, { type: 'shipDock', owner: 'house', schiff: 'jg1', station: 'st_aldera' }],
  [1800, { type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 0, fahrt: 0 }],
  [1900, { type: 'shipDock', owner: 'house', schiff: 'sp1', station: 'st_aldera' }],
  [2400, { type: 'shipDock', owner: 'transport', schiff: 'fr1', station: 'st_aldera' }],
]);
const SCHRITTE = 60 * N;
function lauf() { const s = welt(); vor(s, SCHRITTE, SKRIPT); return s; }
// Kettenhash über jede volle Spielminute: erkennt auch Abweichungen, die sich bis zum Ende wieder angleichen.
// core = m_core_index des bestehenden Cores (hashString/canonical werden wiederverwendet, nicht kopiert).
function kette(core) {
  const s = welt(); let h = '';
  for (let m = 0; m < SCHRITTE / N; m++) { vor(s, N, SKRIPT); h = core.hashString(h + core.canonical(s)); }
  return h;
}

const api = Object.freeze({ welt, minute, index, vor, lauf, kette, SKRIPT, SCHRITTE,
  // Kettenhash des Referenzlaufs (60 Spielminuten, 3600 Flugschritte), berechnet mit m_core_hash
  // des unveränderten Regel195-Cores unter Node 22 / V8. Safari muss denselben Wert liefern.
  HASH: 'e2674c1ef11678ba' });
if (typeof module === 'object' && module.exports) module.exports = api; else scope.FlugReferenz = api;
})(globalThis);
