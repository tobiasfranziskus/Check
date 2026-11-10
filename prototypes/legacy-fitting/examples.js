/* Frei erfundene UI-Fixtures, KEIN Balancing und keine W5-Gegenstandsfreigaben. */
const m_data_fitting_beispiel = (() => {
  const kategorien = ['laser', 'bergbau', 'nachbrenner', 'schild', 'batterie', 'radar', 'fracht'];
  const namen = ['Laser', 'Bergbau', 'Nachbrenner', 'Schildverstärker', 'Batterie', 'Radar', 'Frachtraumerweiterung'];
  const werte = [
    { key: 'laser', label: 'Laserschaden / Zyklus', einheit: 'Beispielpunkte', besser: 1 },
    { key: 'bergbau', label: 'Abbaumenge / Zyklus', einheit: 'Einheiten', besser: 1 },
    { key: 'nachbrenner', label: 'Nachbrennerfaktor', einheit: '×', besser: 1 },
    { key: 'schild', label: 'Schildverstärkung / Zyklus', einheit: 'Beispielpunkte', besser: 1 },
    { key: 'batterie', label: 'Energiekapazität', einheit: 'Beispielpunkte', besser: 1 },
    { key: 'radar', label: 'Aufschaltzeit', einheit: 's', besser: -1 },
    { key: 'fracht', label: 'Frachtraum', einheit: 'Einheiten', besser: 1 },
    { key: 'verbrauch', label: 'Laserenergie / Zyklus', einheit: 'Beispielpunkte', besser: -1 },
    { key: 'tracking', label: 'Tracking', einheit: '', besser: 1 }
  ];
  const aktuelleWerte = { laser: 12, bergbau: 4, nachbrenner: 1.2, schild: 0, batterie: 100, radar: 3, fracht: 80, verbrauch: 5, tracking: null };
  // Bereits vorgegebene Beispielwerte, keine Skalierung nach Größe oder Coreformeln.
  const beispielwerte = {
    laser: [12, 18, 23], bergbau: [4, 6, 9], nachbrenner: [1.2, 1.4, 1.6],
    schild: [8, 12, 16], batterie: [100, 140, 180], radar: [3, 2, 1.5], fracht: [80, 110, 140]
  };
  const module = [], vorschauen = {};
  for (const [i, kategorie] of kategorien.entries()) {
    for (const groesse of ['S', 'M', 'L']) for (const mk of [1, 2, 3]) {
      const id = `${kategorie}-${groesse}-MK${mk}`;
      module.push({ id, kategorie, groesse, mk, name: `${namen[i]} ${groesse} MK${mk}`,
        vorschauobjekt: true, bestand: mk === 3 ? 0 : 1,
        fehlendeVoraussetzungen: mk > 1 ? [`Beispielvoraussetzung fehlt: Technologie MK${mk}.`] : [] });
      vorschauen[id] = { ...aktuelleWerte, [kategorie]: beispielwerte[kategorie][mk - 1] };
      if (kategorie === 'laser') vorschauen[id].verbrauch = [5, 8, 11][mk - 1];
    }
  }
  return { revision: 'fixture-1', schiff: { id: 'demo-schiff', name: 'Aphros · Erprobungsschiff', groesse: 'S',
    plaetze: kategorien.map(kategorie => ({ id: `platz-${kategorie}`, kategorie, groesse: 'S',
      modulId: kategorie === 'schild' ? null : `${kategorie}-S-MK1` })) },
    module, werte, aktuelleWerte: { ...aktuelleWerte, schild: 0 }, vorschauen };
})();
if (typeof module !== 'undefined') module.exports = m_data_fitting_beispiel;
