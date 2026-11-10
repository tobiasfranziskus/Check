/* Aphros Void / F1 [DRAFT, nicht im Produkt].
 * Genau EIN Zustand, EIN Wirtschafts-Minuten-Tick: optional 60 Flugteilschritte davor.
 * Keine Ortsbedingungen, keine eigene Finanz-/Produktionslogik oder zweite Spieluhr.
 */
(function (scope) {
'use strict';
const FACTORY = typeof module === 'object' && module.exports
  ? require('../w5ac/rule191-w5-ferry-core.js') : scope.W5acOriginal;
const FLUG = typeof module === 'object' && module.exports
  ? require('./flug-kern.js') : scope.FlugKern;
if (!FACTORY?.createFlightResearch || !FLUG?.schritt)
  throw Error('F1 benötigt den gemeinsamen Rule196-Forschungskern und F0');
const N = FLUG.DATEN.schritteJeMinute;
const PROFIL = 196;

function erstellen(startkapital = {}) {
  // Erzeugt dieselbe W0–W5-Wirtschaft wie Rule195, nur mit eigener Forschungskennung.
  // Alle Wirtschaftsbefehle und ihre Minute kommen ausschließlich aus diesem Core.
  const engine = FACTORY.createFlightResearch(startkapital);
  const wirtschaft = engine.core;
  const rules = engine.rules;
  if (rules.rulesVersion !== PROFIL || rules.schema !== 8)
    throw Error('F1: inkonsistentes Forschungsprofil');

  // Bei Kauf eines finanzierten Miners wird dessen Flugkörper im *gleichen* Zustand ergänzt.
  // Alle übrigen Schiffe bleiben bei F1 bewusst unverändert; Frachter/Jäger erst später.
  function synchronisieren(state) {
    for (const id of Object.keys(state.ships).sort()) {
      const schiff = state.ships[id];
      if (schiff.klasse !== 'miner' || schiff.flug !== undefined) continue;
      if (schiff.phase !== 'dock' || !Object.hasOwn(FLUG.DATEN.systeme, schiff.system))
        throw Error('F1: Miner ohne bekannten stationären Anfangsort: ' + id);
      schiff.flug = FLUG.koerperAngedockt(schiff.system);
    }
  }
  function pruefen(state) {
    if (state?.rulesVersion !== PROFIL || state?.schema !== rules.schema)
      throw Error('F1: inkompatible Regelversion/Schema; keine automatische Migration');
    if (!state.flug || !Number.isSafeInteger(state.flug.schritt))
      throw Error('F1: Flugschrittzähler fehlt');
    if (!state.ships || typeof state.ships !== 'object' || Array.isArray(state.ships))
      throw Error('F1: Schiffsliste unvollständig');
    for (const id of Object.keys(state.ships)) {
      const s = state.ships[id];
      if (s.klasse === 'miner' && !s.flug)
        throw Error('F1: Flugkörper fehlt: ' + id);
      if (s.klasse !== 'miner' && s.flug !== undefined)
        throw Error('F1: fremder Flugkörper: ' + id);
    }
    const flug = FLUG.audit(state);
    if (!flug.ok) throw Error('F1: Flugaudit: ' + flug.grund);
    return flug;
  }
  function audit(state) {
    try {
      const flug = pruefen(state);
      const economie = wirtschaft.audit(state);
      return Object.freeze({ ...economie, ok: economie.ok && flug.ok, flug });
    } catch (e) {
      return { ok: false, fehler: e.message };
    }
  }
  function createState(seed = rules.startSeed) {
    const state = wirtschaft.createW5State(seed);
    state.flug = { schritt: 0 };
    synchronisieren(state);
    if (!audit(state).ok) throw Error('F1: Anfangszustand nicht konsistent');
    return state;
  }
  function execute(state, cmd) {
    pruefen(state);
    const type = cmd && cmd.type;
    if (typeof type === 'string' && Object.hasOwn(FLUG.BEFEHLE, type))
      return FLUG.ausfuehren(state, cmd);
    const result = wirtschaft.execute(state, cmd, rules);
    if (result.ok) synchronisieren(state);
    return result;
  }
  function submit(state, cmd) {
    pruefen(state);
    // Flugbefehl hat sekundengenaue, sofortige Ausführung (execute), keine
    // nachgelagerte zweite Queue neben der vorhandenen Wirtschaftsbefehlsqueue.
    if (cmd && typeof cmd.type === 'string' && Object.hasOwn(FLUG.BEFEHLE, cmd.type))
      return { ok: false, reason: 'F1: Flugbefehl via execute am Flugschritt übergeben' };
    return wirtschaft.submit(state, cmd, rules);
  }
  // Nur dieser Einstieg ruft den bestehenden Wirtschaftstick auf: bei Schritt 60.
  function teilschritt(state) {
    pruefen(state);
    if (!FLUG.schritt(state)) return null;
    const result = wirtschaft.step(state, rules);
    synchronisieren(state);
    return result;
  }
  function fliegen(state, anzahl) {
    if (!Number.isSafeInteger(anzahl) || anzahl < 0 || anzahl > N * rules.maxAdvanceSteps)
      throw RangeError('F1: ungültige Zahl an Flugteilschritten');
    for (let i = 0; i < anzahl; i++) teilschritt(state);
  }
  function minute(state) {
    pruefen(state);
    // Bitgleiche Optimierung: 60 stille F0-Schritte verändern an angedockten
    // Schiffen nichts. Nur wenn wirklich alle Miner ruhig sind, direkt den
    // EINEN bestehenden Wirtschaftstick ausführen. Auch mitten in der Minute
    // bleibt der gespeicherte Schrittindex nach 60 Teilsekunden gleich.
    const ruhig = Object.values(state.ships).every(s => !s.flug || s.flug.lage === 'angedockt');
    if (ruhig) {
      const result = wirtschaft.step(state, rules);
      synchronisieren(state);
      return result;
    }
    let result = null;
    for (let i = 0; i < N; i++) {
      const r = teilschritt(state);
      if (r !== null) result = r;
    }
    return result;
  }
  function advance(state, minuten) {
    if (!Number.isSafeInteger(minuten) || minuten < 0 || minuten > rules.maxAdvanceSteps)
      throw RangeError('F1: ungültige Zahl an Wirtschaftsminuten');
    for (let i = 0; i < minuten; i++) minute(state);
  }
  function save(state) {
    if (!audit(state).ok) throw Error('F1: ungültigen Zustand nicht speichern');
    return wirtschaft.save(state);
  }
  function load(json) {
    // Rule195-Saves dürfen nicht automatisch Regel196 werden und umgekehrt.
    let roh;
    try { roh = JSON.parse(json); } catch (_) { throw Error('F1: JSON nicht lesbar'); }
    if (roh?.rulesVersion !== PROFIL || roh?.schema !== rules.schema)
      throw Error('F1: fremde Regelversion oder Schema; keine automatische Migration');
    // Der ORIGINAL-Core prüft die vollständige wirtschaftliche Vertragsbilanz.
    const geladen = wirtschaft.loadW5(json);
    if (!audit(geladen).ok) throw Error('F1: Wirtschaft/Flug ungültig');
    return geladen;
  }
  return Object.freeze({
    rules, createState, execute, submit, teilschritt, fliegen, minute, advance,
    audit, save, load, hash: wirtschaft.hash, canonical: wirtschaft.canonical,
    flugKern: FLUG,
  });
}
const api = Object.freeze({ erstellen, PROFIL, SCHRITTE: N });
if (typeof module === 'object' && module.exports) module.exports = api;
else scope.F1Kopplung = api;
})(globalThis);
