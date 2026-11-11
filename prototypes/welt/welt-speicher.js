/* Aphros Void · Kanonische Spielstandverwaltung [DRAFT, Speicherformat 1 der kanonischen Welt].
 *
 * Browser-/UI-Hülle, kein Bestandteil der Spielregeln: Wandzeit und Weltkennung entstehen
 * ausschließlich hier. Die Simulation bleibt frei von Uhrzeit und Zufall außerhalb des Core-RNG.
 *
 * Eigene Datenbank `aphros-void-welt-v1`. Öffnet, liest, ändert oder löscht NIE eine andere
 * Datenbank (Regel14 `aphros-void`, Regel195 `aphros-void-regel195-v1`, Void-Echoes).
 * IndexedDB ist browser- und ursprungsgebunden: NAS und GitHub Pages teilen keine Stände.
 * Übertragung nur über die JSON-Datei (Export/Import).
 *
 * Unterschiedliche Größen, nie vermischt:
 *   speicherformat (dieser Umschlag) · modell (Datenmodell der Welt) · regel (Spielregeln) · schema (Kernschema)
 */
(function (scope) {
'use strict';
const DATENBANK = 'aphros-void-welt-v1', ABLAGE = 'ablage', SCHLUESSEL = 'welt';
const FORMAT = 'aphros-void-welt', SPEICHERFORMAT = 1;
const MAX_BYTES = 5 * 1024 * 1024, AUTO_RING = 3, MAX_SICHERUNGEN = 40;
const NAME = /^[A-Za-z0-9ÄÖÜäöüß _.-]{1,40}$/;

function pruefsumme(text) {
  let n = 2166136261;
  for (let i = 0; i < text.length; i++) n = Math.imul(n ^ text.charCodeAt(i), 16777619);
  return (n >>> 0).toString(16).padStart(8, '0');
}
function kanonisch(value) {
  if (Array.isArray(value)) return '[' + value.map(kanonisch).join(',') + ']';
  if (value && typeof value === 'object')
    return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + kanonisch(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
class Inkompatibel extends Error {
  constructor(text, art) { super(text); this.name = 'Inkompatibel'; this.art = art; }
}
// Erkennt die Herkunft eines JSON-Textes, ohne ihn zu verändern oder umzudeuten.
function einordnen(text) {
  if (typeof text !== 'string' || text.length === 0 || text.length > MAX_BYTES) return { art: 'ungueltig', grund: 'Ungültige JSON-Größe' };
  let roh;
  try { roh = JSON.parse(text); } catch (_) { return { art: 'ungueltig', grund: 'JSON nicht lesbar' }; }
  if (roh === null || typeof roh !== 'object' || Array.isArray(roh)) return { art: 'ungueltig', grund: 'Kein Spielstandobjekt' };
  if (roh.format === FORMAT) return { art: 'umschlag', roh };
  if (Number.isSafeInteger(roh.schema) && Number.isSafeInteger(roh.rulesVersion)) {
    const v = roh.rulesVersion;
    if (v === 199 && roh.schema === 8) return { art: 'welt-roh', roh };
    if (v === 195 && roh.schema === 8) return { art: 'regel195', roh };
    if (v === 196 || v === 197 || v === 198) return { art: 'flugforschung', regel: v, roh };
    if (v >= 191 && v <= 194) return { art: 'wirtschaftsforschung', regel: v, roh };
    if (v <= 32) return { art: 'regel14-familie', regel: v, roh };
    return { art: 'unbekannt', regel: v, roh };
  }
  return { art: 'fremd', roh };
}
const MELDUNG = Object.freeze({
  regel195: 'Regel195-Stand erkannt. Er wird nicht automatisch umgedeutet; die ausdrückliche, geprüfte Übernahme steht unter „Regel195 übernehmen“.',
  flugforschung: 'Forschungsstand der Flugprofile 196–198. Keine Migration vorgesehen; die Datei bleibt unverändert und kann im jeweiligen Forschungseinstieg geladen werden.',
  wirtschaftsforschung: 'Forschungsstand der Regeln 191–194. Keine Migration; Datei bleibt unverändert aufbewahrt.',
  'regel14-familie': 'Stand der früheren Hauptversion (Regel14-Familie, sieben Systeme, 55.000 ISK). Andere Welt und andere Regeln: keine Migration. Im archivierten Spiel unter versionen/ weiter ladbar.',
  unbekannt: 'Unbekannte oder neuere Regelversion. Wird nicht geladen und nicht verändert.',
  fremd: 'Kein Aphros-Void-Core-Spielstand (z. B. Void-Echoes). Wird nicht importiert; Datei bleibt unverändert.',
});

function erstellen(Welt, optionen = {}) {
  if (!Welt || typeof Welt.erstellen !== 'function' || typeof Welt.ausRegel195 !== 'function')
    throw Error('Speicher benötigt den Kern der kanonischen Welt');
  const uhr = optionen.uhr || (() => new Date().toISOString());
  const kennung = optionen.kennung || (() => {
    const b = new Uint8Array(8);
    scope.crypto.getRandomValues(b);
    return 'w-' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  });

  // Vollständige Ladevalidierung: Der Core lädt den Zustand, prüft Geld-, Waren-, Vertrags-,
  // Flug- und K1-Bilanzen und muss ihn bitgleich wieder ausgeben.
  function zustandPruefen(json) {
    if (typeof json !== 'string' || json.length > MAX_BYTES) throw Error('Ungültige JSON-Größe');
    const roh = JSON.parse(json);
    if (roh?.rulesVersion !== Welt.REGEL || roh?.schema !== 8) throw new Inkompatibel('Nur Regel ' + Welt.REGEL + ' / Schema 8', 'regel');
    const profil = roh.w5ad?.profile;
    if (!profil) throw Error('Anfangskapital des Standes nicht belegt');
    const welt = Welt.erstellen({ carrierCash: profil.carrierCash, buyerCash: profil.buyerCash });
    const state = welt.load(json);
    const wieder = welt.save(state);
    if (kanonisch(roh) !== kanonisch(JSON.parse(wieder))) throw Error('Unvollständiger oder unbekannter Spielstand');
    return { welt, state, json: wieder, hash: welt.hash(state), tick: state.tick, modell: state.kanon.modell };
  }
  function umschlag(geprueft, kopf) {
    return {
      format: FORMAT, speicherformat: SPEICHERFORMAT, weltId: kopf.weltId, revision: kopf.revision,
      modell: geprueft.modell, regel: Welt.REGEL, schema: 8, tick: geprueft.tick, hash: geprueft.hash,
      erstellt: kopf.erstellt, gespeichert: uhr(), herkunft: kopf.herkunft || null,
      pruefsumme: pruefsumme(geprueft.json), zustand: geprueft.json,
    };
  }
  function umschlagPruefen(u) {
    const felder = ['erstellt', 'format', 'gespeichert', 'hash', 'herkunft', 'modell', 'pruefsumme', 'regel', 'revision', 'schema', 'speicherformat', 'tick', 'weltId', 'zustand'];
    if (!u || typeof u !== 'object' || Object.keys(u).sort().join() !== felder.join()) throw Error('Umschlag unvollständig oder mit unbekannten Feldern');
    if (u.format !== FORMAT) throw Error('Fremdes Dateiformat');
    if (u.speicherformat !== SPEICHERFORMAT) throw new Inkompatibel('Speicherformat ' + u.speicherformat + ' wird nicht unterstützt; Datei bleibt unverändert', 'speicherformat');
    if (typeof u.weltId !== 'string' || !/^w-[0-9a-f]{16}$/.test(u.weltId) || !Number.isSafeInteger(u.revision) || u.revision < 1)
      throw Error('Ungültige Welt- oder Revisionskennung');
    if (typeof u.zustand !== 'string' || pruefsumme(u.zustand) !== u.pruefsumme) throw Error('Beschädigter Spielstand (Prüfsumme)');
    const g = zustandPruefen(u.zustand);
    if (g.hash !== u.hash || g.tick !== u.tick || g.modell !== u.modell || u.regel !== Welt.REGEL || u.schema !== 8)
      throw Error('Umschlag passt nicht zum Zustand');
    return g;
  }

  async function oeffnen(ablage) {
    let stand = await ablage.lesen();
    let gesperrt = null;
    const leer = () => ({ speicherformat: SPEICHERFORMAT, revision: 0, aktiv: null, welten: {}, sicherungen: [] });
    function formPruefen(s) {
      if (s === undefined) return;
      if (!s || s.speicherformat !== SPEICHERFORMAT || !Number.isSafeInteger(s.revision) || s.revision < 1
        || !s.welten || typeof s.welten !== 'object' || !Array.isArray(s.sicherungen)
        || !(s.aktiv === null || Object.hasOwn(s.welten, s.aktiv)))
        throw Error('Inkompatible oder beschädigte Speicherablage');
      for (const id of Object.keys(s.welten)) {
        const w = s.welten[id];
        if (!w || !Array.isArray(w.auto) || !w.manuell || typeof w.manuell !== 'object') throw Error('Beschädigte Weltablage ' + id);
        for (const u of [...w.auto, ...Object.values(w.manuell)]) {
          if (u.weltId !== id) throw Error('Fremder Spielstand in Weltablage ' + id);
          umschlagPruefen(u);
        }
      }
      for (const b of s.sicherungen)
        if (!b || typeof b.inhalt !== 'string' || pruefsumme(b.inhalt) !== b.pruefsumme || typeof b.id !== 'string') throw Error('Beschädigte Sicherung');
    }
    try { formPruefen(stand); } catch (e) { gesperrt = e.message; }
    const basis = () => (stand === undefined ? leer() : JSON.parse(JSON.stringify(stand)));
    // Neue Weltkennung, die in dieser Ablage garantiert noch nicht vergeben ist.
    const freieKennung = (neu) => {
      for (let i = 0; i < 16; i++) { const id = kennung(); if (!Object.hasOwn(neu.welten, id)) return id; }
      throw Error('Keine freie Weltkennung');
    };
    // Atomarer Austausch der gesamten Ablage; ein zweiter Tab führt zu einem Konflikt statt zu stillem Überschreiben.
    async function schreiben(neu) {
      if (gesperrt) throw Error('Speichern gesperrt: ' + gesperrt + '. JSON exportieren; Ablage bleibt unverändert.');
      neu.revision = (stand?.revision || 0) + 1;
      try { await ablage.tauschen(stand?.revision || 0, neu); }
      catch (e) { gesperrt = e.message; throw e; }
      stand = neu;
    }
    function sicherung(neu, grund, inhalt, quelle) {
      const p = pruefsumme(inhalt);
      const vorhanden = neu.sicherungen.find((b) => b.pruefsumme === p && b.inhalt === inhalt);
      if (vorhanden) return vorhanden.id;
      if (neu.sicherungen.length >= MAX_SICHERUNGEN)
        throw Error('Sicherungsablage voll (' + MAX_SICHERUNGEN + '). Sicherungen werden nie automatisch gelöscht; bitte exportieren und Ablage bewusst leeren.');
      const id = 'b-' + String(neu.sicherungen.length + 1).padStart(3, '0') + '-' + p;
      neu.sicherungen.push({ id, grund, zeit: uhr(), quelle: quelle || null, pruefsumme: p, inhalt });
      return id;
    }
    const kopfVon = (w) => w.auto.at(-1) || Object.values(w.manuell).sort((a, b) => b.revision - a.revision)[0];
    const naechsteRevision = (w) => Math.max(0, ...w.auto.map((u) => u.revision), ...Object.values(w.manuell).map((u) => u.revision)) + 1;

    const api = {
      get gesperrt() { return gesperrt; },
      get aktiv() { return stand?.aktiv ?? null; },
      uebersicht() {
        const s = stand || leer();
        return {
          aktiv: s.aktiv,
          welten: Object.keys(s.welten).sort().map((id) => {
            const w = s.welten[id];
            const zeile = (u, platz) => ({ platz, revision: u.revision, tick: u.tick, hash: u.hash, gespeichert: u.gespeichert });
            return { weltId: id, herkunft: kopfVon(w)?.herkunft || null,
              auto: w.auto.map((u, i) => zeile(u, 'auto-' + (i + 1))),
              manuell: Object.keys(w.manuell).sort().map((n) => zeile(w.manuell[n], n)) };
          }),
          sicherungen: s.sicherungen.map((b) => ({ id: b.id, grund: b.grund, zeit: b.zeit, quelle: b.quelle, bytes: b.inhalt.length })),
        };
      },
      // Neue Welt als eigener Eintrag; eine vorhandene aktive Welt bleibt vollständig erhalten.
      async neueWelt(json, herkunft = null) {
        const g = zustandPruefen(json), neu = basis(), weltId = freieKennung(neu);
        const u = umschlag(g, { weltId, revision: 1, erstellt: uhr(), herkunft });
        neu.welten[weltId] = { auto: [u], manuell: {} };
        neu.aktiv = weltId;
        await schreiben(neu);
        return u;
      },
      // Autosave: Ring der letzten Stände der aktiven Welt; manuelle Plätze bleiben unberührt.
      async autosave(json) {
        const g = zustandPruefen(json), neu = basis(), w = neu.welten[neu.aktiv];
        if (!w) throw Error('Keine aktive Welt');
        const kopf = kopfVon(w);
        if (w.auto.at(-1)?.zustand === g.json) return w.auto.at(-1);
        const u = umschlag(g, { weltId: neu.aktiv, revision: naechsteRevision(w), erstellt: kopf.erstellt, herkunft: kopf.herkunft });
        w.auto.push(u);
        while (w.auto.length > AUTO_RING) w.auto.shift();
        await schreiben(neu);
        return u;
      },
      // Manueller Platz: ein vorhandener Name wird nur mit ausdrücklicher Bestätigung ersetzt,
      // und der ersetzte Stand wandert vorher in die unveränderlichen Sicherungen.
      async manuell(name, json, ersetzen = false) {
        if (typeof name !== 'string' || !NAME.test(name) || /^auto-\d+$/.test(name)) throw Error('Ungültiger Platzname');
        const g = zustandPruefen(json), neu = basis(), w = neu.welten[neu.aktiv];
        if (!w) throw Error('Keine aktive Welt');
        if (Object.hasOwn(w.manuell, name)) {
          if (!ersetzen) throw Error('Platz „' + name + '“ ist belegt; Überschreiben ausdrücklich bestätigen');
          sicherung(neu, 'vor Überschreiben von ' + name, JSON.stringify(w.manuell[name]), { weltId: neu.aktiv, platz: name });
        }
        const kopf = kopfVon(w);
        const u = umschlag(g, { weltId: neu.aktiv, revision: naechsteRevision(w), erstellt: kopf.erstellt, herkunft: kopf.herkunft });
        w.manuell[name] = u;
        await schreiben(neu);
        return u;
      },
      // Laden prüft erneut vollständig. Der bisherige Arbeitsstand wird vom Aufrufer vorher gesichert.
      laden(weltId, platz) {
        if (gesperrt) throw Error('Ablage gesperrt: ' + gesperrt);
        const w = stand?.welten[weltId];
        if (!w) throw Error('Unbekannte Welt');
        const m = /^auto-(\d+)$/.exec(platz);
        const u = m ? w.auto[Number(m[1]) - 1] : w.manuell[platz];
        if (!u) throw Error('Unbekannter Speicherplatz');
        const g = umschlagPruefen(u);
        return { umschlag: u, welt: g.welt, state: g.state };
      },
      async aktivieren(weltId) {
        const neu = basis();
        if (!Object.hasOwn(neu.welten, weltId)) throw Error('Unbekannte Welt');
        neu.aktiv = weltId;
        await schreiben(neu);
      },
      // Vollständiger Export eines Platzes; die Datei ist ohne diese Ablage wieder importierbar.
      exportieren(weltId, platz) { return JSON.stringify(api.laden(weltId, platz).umschlag); },
      // Rettungsabzug der gesamten Ablage, auch wenn sie gesperrt oder beschädigt ist.
      rohAbzug() { return JSON.stringify(stand === undefined ? null : stand); },
      sicherungExportieren(id) {
        const b = (stand?.sicherungen || []).find((x) => x.id === id);
        if (!b) throw Error('Unbekannte Sicherung');
        return b.inhalt;
      },
      // Import: nie überschreiben. Ein gültiger Stand wird als weiterer Eintrag angelegt;
      // alles andere wird abgewiesen und – auf Wunsch – unverändert als Sicherung aufbewahrt.
      async importieren(text, aufbewahren = true) {
        const e = einordnen(text);
        if (e.art === 'ungueltig') throw Error(e.grund);
        if (e.art !== 'umschlag' && e.art !== 'welt-roh') {
          let id = null;
          if (aufbewahren) { const neu = basis(); id = sicherung(neu, 'inkompatibler Import (' + e.art + ')', text, { regel: e.regel ?? e.roh.rulesVersion ?? null }); await schreiben(neu); }
          const fehler = new Inkompatibel(MELDUNG[e.art] || MELDUNG.unbekannt, e.art);
          fehler.sicherung = id;
          throw fehler;
        }
        const neu = basis();
        let g, weltId, kopf;
        if (e.art === 'umschlag') {
          g = umschlagPruefen(e.roh);
          weltId = e.roh.weltId; kopf = e.roh;
        } else {
          g = zustandPruefen(text);
          weltId = freieKennung(neu); kopf = { erstellt: uhr(), herkunft: { art: 'rohimport' } };
        }
        const w = (neu.welten[weltId] ||= { auto: [], manuell: {} });
        if (w.auto.some((u) => u.zustand === g.json) || Object.values(w.manuell).some((u) => u.zustand === g.json))
          return { weltId, platz: null, bereitsVorhanden: true };
        let n = 1;
        while (Object.hasOwn(w.manuell, 'Import ' + n)) n += 1;
        const platz = 'Import ' + n;
        w.manuell[platz] = umschlag(g, { weltId, revision: naechsteRevision(w), erstellt: kopf.erstellt, herkunft: kopf.herkunft });
        await schreiben(neu);
        return { weltId, platz, bereitsVorhanden: false };
      },
      // Ausdrückliche Übernahme eines Regel195-Exports: Original zuerst unveränderlich sichern,
      // dann als NEUE Welt anlegen. Der Rückweg ist der Export genau dieser Sicherung.
      async regel195Uebernehmen(text) {
        const e = einordnen(text);
        if (e.art !== 'regel195') throw new Inkompatibel(MELDUNG[e.art] || 'Kein Regel195-Stand', e.art);
        const m = Welt.ausRegel195(text); // wirft, wenn irgendein Erhaltungsnachweis fehlt
        const neu = basis(), weltId = freieKennung(neu);
        const sicherungId = sicherung(neu, 'Original vor Übernahme Regel195 → Regel ' + Welt.REGEL, text, { regel: 195, hash: m.nachweis.quellHash });
        const g = zustandPruefen(m.welt.save(m.zustand));
        const herkunft = { art: 'migration', von: 195, nach: Welt.REGEL, quellHash: m.nachweis.quellHash, sicherung: sicherungId };
        neu.welten[weltId] = { auto: [umschlag(g, { weltId, revision: 1, erstellt: uhr(), herkunft })], manuell: {} };
        neu.aktiv = weltId;
        await schreiben(neu);
        return { weltId, sicherung: sicherungId, nachweis: m.nachweis };
      },
    };
    return api;
  }
  return Object.freeze({ oeffnen, zustandPruefen, umschlagPruefen });
}

// Flüchtige Ablage für Tests und als Rückfall ohne IndexedDB (dann ausdrücklich nicht dauerhaft).
function speicherAblage() {
  let inhalt, revision = 0;
  return {
    async lesen() { return inhalt === undefined ? undefined : JSON.parse(inhalt); },
    async tauschen(erwartet, neu) {
      if (revision !== erwartet) throw Error('Anderer Tab hat gespeichert. Zum Schutz gesperrt; JSON exportieren und neu laden.');
      inhalt = JSON.stringify(neu); revision = neu.revision;
    },
  };
}
// IndexedDB-Ablage: ein Datensatz, Austausch nur innerhalb EINER Transaktion mit Revisionsvergleich.
function indexedDbAblage(indexedDB) {
  const db = new Promise((resolve, reject) => {
    const req = indexedDB.open(DATENBANK, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(ABLAGE);
    req.onsuccess = () => { req.result.onversionchange = () => req.result.close(); resolve(req.result); };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(Error('Speicher durch anderen Tab blockiert'));
  });
  return {
    async lesen() {
      const d = await db;
      return new Promise((resolve, reject) => {
        const tx = d.transaction(ABLAGE, 'readonly'), r = tx.objectStore(ABLAGE).get(SCHLUESSEL);
        tx.oncomplete = () => resolve(r.result); tx.onabort = () => reject(tx.error);
      });
    },
    async tauschen(erwartet, neu) {
      const d = await db;
      return new Promise((resolve, reject) => {
        const tx = d.transaction(ABLAGE, 'readwrite'), store = tx.objectStore(ABLAGE), req = store.get(SCHLUESSEL);
        let fehler = null;
        req.onsuccess = () => {
          if ((req.result?.revision || 0) !== erwartet) { fehler = Error('Anderer Tab hat gespeichert. Zum Schutz gesperrt; JSON exportieren und neu laden.'); tx.abort(); return; }
          try { store.put(neu, SCHLUESSEL); } catch (e) { fehler = e; tx.abort(); }
        };
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(fehler || tx.error || Error('Speichern abgebrochen'));
        tx.onerror = () => {};
      });
    },
  };
}

const api = Object.freeze({ erstellen, einordnen, pruefsumme, speicherAblage, indexedDbAblage, Inkompatibel, MELDUNG,
  DATENBANK, FORMAT, SPEICHERFORMAT, AUTO_RING, MAX_SICHERUNGEN });
if (typeof module === 'object' && module.exports) module.exports = api; else scope.AphrosWeltSpeicher = api;
})(globalThis);
