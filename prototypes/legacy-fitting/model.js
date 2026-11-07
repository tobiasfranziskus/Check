/* Reine Präsentationsdaten: keine Abhängigkeit von Spielkern, DOM oder Persistenz. */
const m_ui_fitting_modell = (() => {
  const groessen = Object.freeze(['S', 'M', 'L']);
  const kategorien = Object.freeze([
    ['laser', 'Laser', true], ['bergbau', 'Bergbau', true],
    ['nachbrenner', 'Nachbrenner', true], ['schild', 'Schildverstärker', true],
    ['batterie', 'Batterie', false], ['radar', 'Radar', false],
    ['fracht', 'Frachtraumerweiterung', false]
  ].map(([id, name, aktiv]) => Object.freeze({ id, name, aktiv })));
  function pruefen(d) {
    if (!d || !d.schiff || !groessen.includes(d.schiff.groesse) || !Array.isArray(d.module) ||
        !Array.isArray(d.schiff.plaetze) || !Array.isArray(d.werte) || !d.vorschauen) {
      throw new TypeError('Ungültiger Fitting-Snapshot');
    }
    const ids = new Set();
    for (const m of d.module) {
      if (!m.id || ids.has(m.id) || !groessen.includes(m.groesse) ||
          ![1, 2, 3].includes(m.mk) || !kategorien.some(k => k.id === m.kategorie)) {
        throw new TypeError('Ungültiges oder doppeltes Modul');
      }
      ids.add(m.id);
    }
    const slots = new Set();
    for (const p of d.schiff.plaetze) {
      if (!p.id || slots.has(p.id) || !groessen.includes(p.groesse) ||
          !kategorien.some(k => k.id === p.kategorie)) throw new TypeError('Ungültiger Platz');
      slots.add(p.id);
    }
    const keys = new Set();
    for (const w of d.werte) {
      if (!w.key || keys.has(w.key) || ![1, -1].includes(w.besser)) throw new TypeError('Ungültige Wertdefinition');
      keys.add(w.key);
    }
    return d;
  }
  function auswahl(d, platzId, modulId) {
    const platz = d.schiff.plaetze.find(p => p.id === platzId);
    const modul = d.module.find(m => m.id === modulId);
    const eingebaut = d.module.find(m => m.id === platz?.modulId) || null;
    const gruende = [];
    if (!platz) gruende.push('Ausrüstungsplatz nicht vorhanden.');
    if (!modul) gruende.push('Modul nicht im Katalog vorhanden.');
    if (platz && modul) {
      if (platz.kategorie !== modul.kategorie) gruende.push('Kategorie passt nicht zum Platz.');
      if (platz.groesse !== modul.groesse) gruende.push(`Inkompatible Größe: ${modul.groesse}; Platz benötigt ${platz.groesse}.`);
      // Fertige Zugangsaussagen des Datenlieferanten; keine Skillregeln im UI.
      gruende.push(...(modul.fehlendeVoraussetzungen || []));
      if (!(modul.bestand > 0)) gruende.push('Nicht im Beispielbestand vorhanden.');
    }
    const kompatibel = !!platz && !!modul && platz.kategorie === modul.kategorie && platz.groesse === modul.groesse;
    const nachher = kompatibel ? d.vorschauen[modulId] : null;
    const zahl = v => typeof v === 'number' && Number.isFinite(v) ? v : null;
    const zeilen = d.werte.map(w => {
      const vorher = zahl(d.aktuelleWerte?.[w.key]);
      const nach = zahl(nachher?.[w.key]);
      const delta = vorher !== null && nach !== null ? Number((nach - vorher).toFixed(6)) : null;
      return { ...w, vorher, nachher: nach, delta,
        ton: delta === null ? 'offen' : delta === 0 ? 'gleich' : delta * w.besser > 0 ? 'besser' : 'schlechter' };
    });
    return { platz, modul, eingebaut, gruende, kompatibel, zeilen,
      vergleichVorhanden: !!nachher, hypothetisch: gruende.length > 0 };
  }
  function starten(snapshot) {
    // Eigene Kopie: auch spätere Änderungen des Aufrufers beeinflussen die Ansicht nicht.
    const daten = pruefen(JSON.parse(JSON.stringify(snapshot)));
    let platzId = daten.schiff.plaetze[0]?.id;
    let modulId = null;
    return {
      daten,
      platzWaehlen(id) {
        if (!daten.schiff.plaetze.some(p => p.id === id)) return false;
        platzId = id; modulId = null; return true;
      },
      modulWaehlen(id) { modulId = id; return auswahl(daten, platzId, modulId); },
      ansicht() { return auswahl(daten, platzId, modulId); }
    };
  }
  return Object.freeze({ groessen, kategorien, pruefen, auswahl, starten });
})();
if (typeof module !== 'undefined') module.exports = m_ui_fitting_modell;
