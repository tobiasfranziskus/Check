import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../prototypes/legacy-fitting/', import.meta.url);
const source = name => fs.readFileSync(new URL(name, root), 'utf8');
const context = vm.createContext({});
vm.runInContext(source('model.js') + source('examples.js') + source('view.js') + '\nglobalThis.api = {m:m_ui_fitting_modell,d:m_data_fitting_beispiel,v:m_ui_fitting_ansicht}', context);
const {m, d, v} = context.api;
const copy = x => JSON.parse(JSON.stringify(x));
const choose = id => m.auswahl(d, 'platz-laser', id);

test('Legacy-Fitting: sieben Kategorien, S/M/L, MK1–MK3 vollständig und reine Vorschauobjekte', () => {
  assert.equal(d.module.length, 63);
  assert.equal(m.kategorien.filter(k => k.aktiv).length, 4);
  assert.equal(m.kategorien.filter(k => !k.aktiv).length, 3);
  for (const k of m.kategorien) for (const g of ['S','M','L']) for (const mk of [1,2,3]) {
    const mod = d.module.find(x => x.kategorie === k.id && x.groesse === g && x.mk === mk);
    assert.ok(mod?.vorschauobjekt);
  }
  assert.equal(m.pruefen(d), d);
});
test('Legacy-Fitting: Größen werden exakt geprüft, auch kleinere Größe in großem Platz', () => {
  for (const slotSize of ['S','M','L']) for (const size of ['S','M','L']) {
    const data = copy(d); data.schiff.plaetze[0].groesse = slotSize;
    const a = m.auswahl(data, 'platz-laser', `laser-${size}-MK1`);
    assert.equal(a.kompatibel, slotSize === size);
    assert.equal(a.vergleichVorhanden, slotSize === size);
    if (size !== slotSize) assert.ok(a.gruende.some(g => g.includes('Inkompatible Größe')));
  }
});
test('Legacy-Fitting: Auswahl und Platzwechsel sind unabhängig vom Einbauzustand', () => {
  const s = m.starten(d);
  assert.equal(s.modulWaehlen('laser-S-MK2').modul.mk, 2);
  assert.equal(s.ansicht().eingebaut.mk, 1);
  assert.equal(s.platzWaehlen('platz-radar'), true);
  assert.equal(s.ansicht().modul, undefined);
  assert.equal(s.platzWaehlen('unbekannt'), false);
  assert.equal(s.ansicht().platz.id, 'platz-radar');
});
test('Legacy-Fitting: Sperren, fehlender Bestand und unbekannte Module sichtbar', () => {
  const a = choose('laser-S-MK3');
  assert.ok(a.gruende.some(g => g.includes('Technologie MK3')));
  assert.ok(a.gruende.some(g => g.includes('Nicht im Beispielbestand')));
  assert.ok(v.details(a).includes('Hypothetischer Vergleich trotz Sperren'));
  assert.ok(choose('unbekannt').gruende.some(g => g.includes('nicht im Katalog')));
  assert.equal(choose('radar-S-MK1').kompatibel, false);
  assert.ok(m.auswahl(d, 'unbekannt', 'laser-S-MK1').gruende.length);
});
test('Legacy-Fitting: absolute Adapterwerte, nachvollziehbare Differenz und Richtung', () => {
  const a = choose('laser-S-MK2');
  const damage = a.zeilen.find(z => z.key === 'laser');
  assert.deepEqual(copy([damage.vorher, damage.nachher, damage.delta, damage.ton]), [12,18,6,'besser']);
  assert.equal(a.zeilen.find(z => z.key === 'verbrauch').ton, 'schlechter');
  assert.equal(a.zeilen.find(z => z.key === 'schild').delta, 0);
  const radar = m.auswahl(d, 'platz-radar', 'radar-S-MK2');
  assert.equal(radar.zeilen.find(z => z.key === 'radar').ton, 'besser');
  const html = v.details(a);
  for (const text of ['Vorher','Nachher','Differenz','+6 · besser','+3 · schlechter','Nicht verfügbar','= unverändert']) assert.ok(html.includes(text), text);
});
test('Legacy-Fitting: keine erfundenen Nullwerte oder Vergleiche bei fehlenden Daten', () => {
  const data = copy(d); delete data.vorschauen['laser-S-MK1'];
  const a = m.auswahl(data, 'platz-laser', 'laser-S-MK1');
  assert.equal(a.vergleichVorhanden, false);
  assert.ok(a.zeilen.every(z => z.nachher === null && z.delta === null));
  assert.ok(v.details(a).includes('Keine Vergleichswerte'));
  assert.ok(choose('laser-M-MK1').zeilen.every(z => z.delta === null));
});
test('Legacy-Fitting: Eingabesnapshot bleibt auch eingefroren unverändert; keine geteilten Referenzen', () => {
  function freeze(x) { if (x && typeof x === 'object') { Object.values(x).forEach(freeze); Object.freeze(x); } return x; }
  const input = freeze(copy(d)), before = JSON.stringify(input), s = m.starten(input);
  for (const p of input.schiff.plaetze) {
    s.platzWaehlen(p.id);
    for (const mod of input.module) { s.modulWaehlen(mod.id); v.details(s.ansicht()); }
  }
  assert.equal(JSON.stringify(input), before);
  s.daten.schiff.name = 'Ansichtskopie';
  assert.notEqual(input.schiff.name, s.daten.schiff.name);
  const mutable = copy(d), isolated = m.starten(mutable);
  mutable.aktuelleWerte.laser = 999;
  assert.equal(isolated.modulWaehlen('laser-S-MK2').zeilen[0].vorher, 12);
});
test('Legacy-Fitting: Datenfehler und doppelte IDs werden abgewiesen', () => {
  assert.throws(() => m.starten({}), /Snapshot/);
  for (const field of ['groesse','mk','kategorie']) {
    const data = copy(d); data.module[0][field] = 'ungueltig';
    assert.throws(() => m.starten(data), /Modul/);
  }
  const data = copy(d); data.module.push(data.module[0]);
  assert.throws(() => m.starten(data), /Modul/);
});
test('Legacy-Fitting: externe Texte sind escaped; leere und unbekannte Einbauten erklärbar', () => {
  const data = copy(d); data.module[0].name = '<img src=x onerror="boom">';
  const html = v.details(m.auswahl(data, 'platz-laser', 'laser-S-MK1'));
  assert.ok(!html.includes('<img')); assert.ok(html.includes('&lt;img'));
  assert.ok(v.details(m.auswahl(d, 'platz-schild', 'schild-S-MK1')).includes('Platz leer'));
  data.schiff.plaetze[0].modulId = 'veraltet';
  assert.ok(v.details(m.auswahl(data, 'platz-laser', 'laser-S-MK1')).includes('Unbekanntes Modul: veraltet'));
});
