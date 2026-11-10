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
if (!FACTORY?.createPrivateWageResearch || !FLUG?.schritt)
  throw Error('F1 benötigt den gemeinsamen Rule196-Forschungskern und F0');
const N = FLUG.DATEN.schritteJeMinute;
const PROFIL = 196;

function erstellen(startkapital = {}, optionen = {}) {
  // F2a darf opt-in eine andere Forschungssave-Kennung verwenden. Der
  // bisherige F1-Einstieg bleibt bitgleich auf Regel196 und wird nie migriert.
  if (!optionen || typeof optionen !== 'object' || Array.isArray(optionen)
    || Object.keys(optionen).some(k => k !== 'researchProfile')
    || (Object.hasOwn(optionen, 'researchProfile') && optionen.researchProfile !== 197))
    throw TypeError('F1: unbekanntes oder ungültiges Forschungsprofil');
  const profil = optionen.researchProfile ?? PROFIL;
  // Die Original-Rule195-Quelldatei bleibt BYTEGLEICH (Singlefile-Reproduzierbarkeit).
  // Der Forschungsvermerk 196 wird nur in serialisierten F1-Ständen verwendet.
  // Für jeden Economy-Aufruf sieht die *selbe* Originalengine Rule195, damit auch
  // ihre internen Owner-/Treuhand-/Export-/Finanzierungs-Prüfungen unverändert greifen.
  const engine = FACTORY.createPrivateWageResearch(startkapital);
  const wirtschaft = engine.core;
  const econRules = engine.rules;
  const rules = Object.freeze({ ...econRules, rulesVersion: profil });
  if (econRules.rulesVersion !== 195 || rules.schema !== 8)
    throw Error('F1: inkompatibler Originalwirtschaftskern');
  function imOriginalCore(state, aktion) {
    if (state?.rulesVersion !== profil)
      throw Error('F1: falsche Regelkennung bei Core-Aufruf');
    state.rulesVersion = econRules.rulesVersion;
    try { return aktion(); }
    finally { state.rulesVersion = profil; }
  }
  // Nur für das ALTE finanzielle Audit/Laden: dieselbe Welt ohne visuelle Flugfelder.
  function wirtschaftsSicht(state) {
    const s = JSON.parse(wirtschaft.canonical(state));
    delete s.flug;
    for (const sh of Object.values(s.ships || {})) delete sh.flug;
    s.rulesVersion = econRules.rulesVersion;
    return s;
  }

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
    if (state?.rulesVersion !== profil || state?.schema !== rules.schema)
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
      const economie = wirtschaft.audit(wirtschaftsSicht(state));
      return Object.freeze({ ...economie, ok: economie.ok && flug.ok, flug });
    } catch (e) {
      return { ok: false, fehler: e.message };
    }
  }
  function createState(seed = rules.startSeed) {
    const state = wirtschaft.createW5State(seed);
    state.rulesVersion = profil;
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
    const result = imOriginalCore(state, () => wirtschaft.execute(state, cmd, econRules));
    if (result.ok) synchronisieren(state);
    return result;
  }
  function submit(state, cmd) {
    pruefen(state);
    // Flugbefehl hat sekundengenaue, sofortige Ausführung (execute), keine
    // nachgelagerte zweite Queue neben der vorhandenen Wirtschaftsbefehlsqueue.
    if (cmd && typeof cmd.type === 'string' && Object.hasOwn(FLUG.BEFEHLE, cmd.type))
      return { ok: false, reason: 'F1: Flugbefehl via execute am Flugschritt übergeben' };
    return imOriginalCore(state, () => wirtschaft.submit(state, cmd, econRules));
  }
  // Nur dieser Einstieg ruft den bestehenden Wirtschaftstick auf: bei Schritt 60.
  function teilschritt(state) {
    pruefen(state);
    if (!FLUG.schritt(state)) return null;
    const result = imOriginalCore(state, () => wirtschaft.step(state, econRules));
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
      const result = imOriginalCore(state, () => wirtschaft.step(state, econRules));
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
    if (roh?.rulesVersion !== profil || roh?.schema !== rules.schema)
      throw Error('F1: fremde Regelversion oder Schema; keine automatische Migration');
    // Der ORIGINAL-Core prüft die vollständige Rule195-Wirtschaftsprojektion.
    // F1-Feldern und Forschungskennung wird dabei NICHT vertraut.
    wirtschaft.loadW5(wirtschaft.canonical(wirtschaftsSicht(roh)));
    if (!audit(roh).ok) throw Error('F1: Wirtschaft/Flug ungültig');
    return roh;
  }
  return Object.freeze({
    rules, researchProfile: profil, createState, execute, submit, teilschritt, fliegen, minute, advance,
    audit, save, load, hash: wirtschaft.hash, canonical: wirtschaft.canonical,
    flugKern: FLUG,
  });
}
const api = Object.freeze({ erstellen, PROFIL, SCHRITTE: N });
if (typeof module === 'object' && module.exports) module.exports = api;
else scope.F1Kopplung = api;
})(globalThis);
