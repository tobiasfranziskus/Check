// Kanonische Spielstandverwaltung: Umschlag, Plätze, unveränderliche Sicherungen,
// Import/Export, geprüfte Übernahme von Regel195 und sichere Aufbewahrung alles anderen.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Welt = require('../prototypes/welt/welt-kern.js');
const Speicher = require('../prototypes/welt/welt-speicher.js');
const Kern = require('../prototypes/w5ac/rule191-w5-ferry-core.js');

function hülle() {
  let n = 0, zeit = 0;
  return Speicher.erstellen(Welt, {
    kennung: () => 'w-' + String(++n).padStart(16, '0'),
    uhr: () => '2026-11-11T12:00:' + String(zeit++ % 60).padStart(2, '0') + 'Z',
  });
}
function spiel(minuten = 0) {
  const w = Welt.erstellen({}), s = w.createState(42, { politik: { ausschuettung: { house: 1000 } } });
  for (const cmd of [{ type: 'shipBuy', owner: 'transport', klasse: 'frachter', station: 'st_aldera' },
    { type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' }]) assert.equal(w.execute(s, cmd).ok, true);
  const miner = Object.values(s.ships).find((sh) => sh.owner === 'house').id;
  assert.equal(w.execute(s, { type: 'shipShuttle', owner: 'house', schiff: miner, ware: 'eis' }).ok, true);
  w.advance(s, minuten);
  return { w, s };
}
function regel195(minuten) {
  const e = Kern.createPrivateWageResearch({ buyerCash: 1536, carrierCash: 2000 }), c = e.core, r = e.rules, s = c.createW5State(42);
  const x = (type, owner, extra = {}) => assert.equal(c.execute(s, { type, owner, ...extra }, r).ok, true, type);
  x('shipBuy', 'transport', { station: 'st_aldera', klasse: 'frachter' }); x('shipBuy', 'house', { station: 'st_aldera', klasse: 'miner' });
  const fr = Object.values(s.ships).find((v) => v.klasse === 'frachter'), mi = Object.values(s.ships).find((v) => v.owner === 'house');
  x('shipMine', 'house', { schiff: mi.id, ware: 'eis' }); c.advance(s, 50, r); x('shipWait', 'house', { schiff: mi.id });
  x('shipFreight', 'transport', { schiff: fr.id }); c.advance(s, 120, r); x('shipFreightIce', 'transport', { schiff: fr.id }); c.advance(s, 60, r);
  x('stationWater', 'st_nadir', { station: 'st_nadir' }); c.advance(s, 20, r); x('pilotWaterBuy', 'pilot_erz', { menge: 6 });
  c.advance(s, minuten, r);
  return { json: c.save(s), hash: c.hash(s), engine: e };
}

test('Speicher: eigene Datenbank, getrennte Größen, kein Zugriff auf frühere Ablagen', () => {
  assert.equal(Speicher.DATENBANK, 'aphros-void-welt-v1');
  assert.equal(Speicher.FORMAT, 'aphros-void-welt'); assert.equal(Speicher.SPEICHERFORMAT, 1);
  const quelle = fs.readFileSync(new URL('../prototypes/welt/welt-speicher.js', import.meta.url), 'utf8');
  assert.equal([...quelle.matchAll(/indexedDB\.open\(/g)].length, 1, 'genau ein Datenbankzugriff');
  assert.match(quelle, /indexedDB\.open\(DATENBANK, 1\)/);
  assert.doesNotMatch(quelle, /deleteDatabase|\.clear\(\)|\.delete\(/, 'keine Löschoperation im Speichercode');
  assert.doesNotMatch(quelle, /localStorage|sessionStorage|fetch\(|XMLHttpRequest/, 'keine Synchronisierung, kein Netz');
  for (const alt of ['../prototypes/w5ag/storage.js', '../versionen/main-pre-w5-20261110/index.html'])
    assert.ok(!fs.readFileSync(new URL(alt, import.meta.url), 'utf8').includes(Speicher.DATENBANK));
});

test('Speicher: neue Welt, Autosave-Ring, manueller Platz und bitgleiches Weiterspielen', async () => {
  const h = hülle(), ablage = Speicher.speicherAblage(), sp = await h.oeffnen(ablage);
  const { w, s } = spiel(90); // Miner im Feld oder Flug, offene Treuhand
  const u1 = await sp.neueWelt(w.save(s));
  assert.equal(u1.revision, 1); assert.equal(u1.regel, 199); assert.equal(u1.modell, 1); assert.equal(u1.schema, 8);
  assert.equal(u1.hash, w.hash(s)); assert.equal(u1.tick, 90); assert.match(u1.weltId, /^w-[0-9a-f]{16}$/);
  assert.equal(sp.aktiv, u1.weltId);
  const staende = [];
  for (let i = 0; i < 5; i++) { w.advance(s, 37); staende.push((await sp.autosave(w.save(s))).revision); }
  assert.deepEqual(staende, [2, 3, 4, 5, 6]);
  assert.equal((await sp.autosave(w.save(s))).revision, 6, 'unveränderter Stand erzeugt keine neue Revision');
  const ü = sp.uebersicht().welten[0];
  assert.equal(ü.auto.length, Speicher.AUTO_RING); assert.deepEqual(ü.auto.map((x) => x.revision), [4, 5, 6]);
  await sp.manuell('Vor dem Ausbau', w.save(s));
  const hash = w.hash(s);
  w.advance(s, 400);
  await sp.autosave(w.save(s));
  // Laden des manuellen Platzes: exakt der damalige Zustand; beide Welten laufen identisch weiter.
  const geladen = sp.laden(u1.weltId, 'Vor dem Ausbau');
  assert.equal(geladen.welt.hash(geladen.state), hash);
  const zweit = sp.laden(u1.weltId, 'Vor dem Ausbau');
  geladen.welt.advance(geladen.state, 400); zweit.welt.advance(zweit.state, 400);
  assert.equal(geladen.welt.hash(geladen.state), zweit.welt.hash(zweit.state));
  assert.equal(geladen.welt.hash(geladen.state), w.hash(s), 'gleiche Befehle → gleicher Verlauf wie das Original');
  // Neues Öffnen derselben Ablage liest alles geprüft wieder ein.
  const wieder = await h.oeffnen(ablage);
  assert.equal(wieder.gesperrt, null); assert.equal(wieder.aktiv, u1.weltId);
  assert.equal(wieder.laden(u1.weltId, 'auto-3').state.tick, s.tick);
});

test('Speicher: kein stilles Überschreiben – belegter Platz braucht Bestätigung und wird vorher gesichert', async () => {
  const sp = await hülle().oeffnen(Speicher.speicherAblage());
  const { w, s } = spiel(30);
  const u = await sp.neueWelt(w.save(s));
  await sp.manuell('Platz A', w.save(s));
  const alt = sp.exportieren(u.weltId, 'Platz A');
  w.advance(s, 100);
  await assert.rejects(() => sp.manuell('Platz A', w.save(s)), /ausdrücklich bestätigen/);
  assert.equal(sp.exportieren(u.weltId, 'Platz A'), alt, 'abgelehntes Speichern ändert nichts');
  await sp.manuell('Platz A', w.save(s), true);
  const sicherungen = sp.uebersicht().sicherungen;
  assert.equal(sicherungen.length, 1); assert.match(sicherungen[0].grund, /vor Überschreiben von Platz A/);
  assert.equal(sp.sicherungExportieren(sicherungen[0].id), alt, 'der ersetzte Stand ist unverändert erhalten');
  for (const name of ['', 'auto-1', '../x', 'a'.repeat(41), 'Zeile\n2']) await assert.rejects(() => sp.manuell(name, w.save(s)), /Platzname/);
  // Eine zweite Welt ersetzt die erste nicht.
  const zweite = spiel(5);
  const u2 = await sp.neueWelt(zweite.w.save(zweite.s));
  assert.notEqual(u2.weltId, u.weltId); assert.equal(sp.uebersicht().welten.length, 2);
  assert.equal(sp.laden(u.weltId, 'Platz A').state.tick, 130);
});

test('Speicher: ungültige Zustände werden nie gespeichert', async () => {
  const sp = await hülle().oeffnen(Speicher.speicherAblage());
  const { w, s } = spiel(60);
  const u = await sp.neueWelt(w.save(s));
  const vorher = sp.rohAbzug();
  const roh = JSON.parse(w.save(s));
  roh.owners.house.cash += 1;
  await assert.rejects(() => sp.autosave(JSON.stringify(roh)));
  await assert.rejects(() => sp.manuell('Betrug', JSON.stringify(roh)));
  await assert.rejects(() => sp.neueWelt('{"schema":8,"rulesVersion":199}'));
  await assert.rejects(() => sp.autosave(' '.repeat(5 * 1024 * 1024 + 1)), /JSON-Größe/);
  assert.equal(sp.rohAbzug(), vorher, 'Ablage unverändert');
  assert.equal(sp.laden(u.weltId, 'auto-1').state.tick, 60);
});

test('Speicher: zweiter Tab führt zu Konflikt und Sperre statt zu verlorenen Ständen', async () => {
  const h = hülle(), ablage = Speicher.speicherAblage();
  const tabA = await h.oeffnen(ablage);
  const { w, s } = spiel(20);
  const u = await tabA.neueWelt(w.save(s));
  const tabB = await h.oeffnen(ablage);
  w.advance(s, 10);
  await tabA.autosave(w.save(s));
  const andere = spiel(77);
  await assert.rejects(() => tabB.autosave(andere.w.save(andere.s)), /Anderer Tab/);
  assert.match(tabB.gesperrt, /Anderer Tab/);
  await assert.rejects(() => tabB.manuell('X', andere.w.save(andere.s)), /gesperrt/);
  assert.equal(tabA.laden(u.weltId, 'auto-2').state.tick, 30, 'Stand von Tab A bleibt erhalten');
  assert.equal((await h.oeffnen(ablage)).laden(u.weltId, 'auto-2').state.tick, 30);
});

test('Speicher: vollständiger JSON-Export und validierter Import in einen anderen Ursprung', async () => {
  const h = hülle(), quelle = await h.oeffnen(Speicher.speicherAblage());
  const { w, s } = spiel(333);
  const u = await quelle.neueWelt(w.save(s));
  const datei = quelle.exportieren(u.weltId, 'auto-1');
  // Anderer Browser/Ursprung = leere, unabhängige Ablage; nichts wird automatisch synchronisiert.
  const ziel = await hülle().oeffnen(Speicher.speicherAblage());
  assert.equal(ziel.uebersicht().welten.length, 0);
  const r = await ziel.importieren(datei);
  assert.equal(r.weltId, u.weltId); assert.equal(r.platz, 'Import 1');
  const geladen = ziel.laden(u.weltId, 'Import 1');
  assert.equal(geladen.welt.hash(geladen.state), w.hash(s));
  assert.equal((await ziel.importieren(datei)).bereitsVorhanden, true, 'gleicher Stand wird nicht doppelt angelegt');
  // Roher K1-Zustand ohne Umschlag ist ebenfalls importierbar und erhält eine neue Weltkennung.
  const roh = await ziel.importieren(w.save(s));
  assert.notEqual(roh.weltId, u.weltId);
  // Manipulierte Dateien werden abgewiesen, ohne die Ablage zu verändern.
  const vorher = ziel.rohAbzug();
  const faelschungen = [
    (x) => { x.pruefsumme = '00000000'; }, (x) => { x.hash = '0'.repeat(16); }, (x) => { x.tick += 1; },
    (x) => { x.weltId = 'w-xyz'; }, (x) => { x.revision = 0; }, (x) => { x.extra = true; }, (x) => { delete x.modell; },
    (x) => { const z = JSON.parse(x.zustand); z.owners.house.cash += 1; x.zustand = JSON.stringify(z); x.pruefsumme = Speicher.pruefsumme(x.zustand); },
  ];
  for (const f of faelschungen) { const x = JSON.parse(datei); f(x); await assert.rejects(() => ziel.importieren(JSON.stringify(x))); }
  const neuer = JSON.parse(datei); neuer.speicherformat = 2;
  await assert.rejects(() => ziel.importieren(JSON.stringify(neuer)), (e) => e.name === 'Inkompatibel' && /Speicherformat 2/.test(e.message));
  for (const text of ['', '{', 'null', '[]', '42']) await assert.rejects(() => ziel.importieren(text));
  assert.equal(ziel.rohAbzug(), vorher);
});

test('Speicher: frühere und fremde Stände werden nie umgedeutet, sondern unverändert aufbewahrt', async () => {
  const sp = await hülle().oeffnen(Speicher.speicherAblage());
  const alt195 = regel195(15);
  const faelle = [
    ['regel14-familie', JSON.stringify({ schema: 8, rulesVersion: 14, tick: 5, owners: {} })],
    ['regel14-familie', JSON.stringify({ schema: 7, rulesVersion: 9, tick: 1 })],
    ['wirtschaftsforschung', JSON.stringify({ schema: 8, rulesVersion: 192, tick: 1 })],
    ['regel195', alt195.json],
    ['flugforschung', JSON.stringify({ schema: 8, rulesVersion: 196, flug: { schritt: 0 } })],
    ['flugforschung', JSON.stringify({ schema: 8, rulesVersion: 198, f2a: { missionen: {} } })],
    ['unbekannt', JSON.stringify({ schema: 8, rulesVersion: 250 })],
    ['fremd', JSON.stringify({ S: { credits: 100, schiff: 'ux08' }, version: 've11' })],
  ];
  for (const [art, text] of faelle) {
    assert.equal(Speicher.einordnen(text).art, art);
    let fehler = null;
    try { await sp.importieren(text); } catch (e) { fehler = e; }
    assert.equal(fehler?.name, 'Inkompatibel', art); assert.equal(fehler.art, art);
    assert.ok(fehler.message.length > 40, 'klare Meldung: ' + fehler.message);
    assert.equal(sp.sicherungExportieren(fehler.sicherung), text, 'Original byte-identisch aufbewahrt: ' + art);
  }
  assert.equal(sp.uebersicht().welten.length, 0, 'keine Welt aus fremden Daten');
  assert.equal(sp.uebersicht().sicherungen.length, faelle.length);
  // Ohne Aufbewahrungswunsch bleibt die Ablage völlig unverändert.
  const vorher = sp.rohAbzug();
  await assert.rejects(() => sp.importieren(faelle[0][1].replace('"tick":5', '"tick":6'), false), (e) => e.name === 'Inkompatibel' && e.sicherung === null);
  assert.equal(sp.rohAbzug(), vorher);
  // Sicherungen werden nie automatisch verdrängt: bei voller Ablage wird der Import abgewiesen.
  for (let i = faelle.length; i < Speicher.MAX_SICHERUNGEN; i++)
    await assert.rejects(() => sp.importieren(JSON.stringify({ schema: 8, rulesVersion: 14, lauf: i })), (e) => e.name === 'Inkompatibel');
  await assert.rejects(() => sp.importieren(JSON.stringify({ schema: 8, rulesVersion: 14, lauf: 'zu viel' })), /nie automatisch gelöscht/);
  assert.equal(sp.sicherungExportieren(sp.uebersicht().sicherungen[3].id), alt195.json);
});

test('Speicher: ausdrückliche Übernahme Regel195 → K1 mit Erhaltungsnachweis und Rückweg', async () => {
  const sp = await hülle().oeffnen(Speicher.speicherAblage());
  for (const minuten of [0, 15, 47]) { // 0/15: Eisfracht im Rückflug bzw. Wasserwerk; 47: Fracht beendet
    const alt = regel195(minuten);
    const r = await sp.regel195Uebernehmen(alt.json);
    const n = r.nachweis;
    assert.equal(n.quellHash, alt.hash); assert.equal(n.weltgeld, 33000);
    for (const feld of ['geldGleich', 'warenGleich', 'schiffeGleich', 'vertraegeGleich', 'loehneGleich', 'zufallGleich']) assert.equal(n[feld], true, feld);
    // Rückweg: die unveränderte Originaldatei liegt in den Sicherungen und lädt im Regel195-Kern.
    const original = sp.sicherungExportieren(r.sicherung);
    assert.equal(original, alt.json);
    const zurueck = alt.engine.core.loadW5(original);
    assert.equal(alt.engine.core.hash(zurueck), alt.hash);
    // Die übernommene Welt ist eine NEUE Welt, vollständig geprüft und spielbar.
    const g = sp.laden(r.weltId, 'auto-1');
    assert.equal(g.umschlag.herkunft.von, 195); assert.equal(g.umschlag.herkunft.quellHash, alt.hash);
    assert.equal(g.state.rulesVersion, 199); assert.equal(g.state.tick, JSON.parse(alt.json).tick);
    g.welt.advance(g.state, 600);
    assert.equal(g.welt.audit(g.state).ok, true);
    assert.equal(Object.values(g.state.owners).reduce((x, o) => x + o.cash, 0), 33000);
  }
  assert.equal(sp.uebersicht().welten.length, 3); assert.equal(sp.uebersicht().sicherungen.length, 3);
  // Kein Regel195-Stand → keine Übernahme; manipulierte Regel195-Stände scheitern am Originalkern.
  await assert.rejects(() => sp.regel195Uebernehmen(JSON.stringify({ schema: 8, rulesVersion: 14 })), (e) => e.name === 'Inkompatibel');
  const falsch = JSON.parse(regel195(3).json); falsch.owners.house.cash += 10;
  const vorher = sp.rohAbzug();
  await assert.rejects(() => sp.regel195Uebernehmen(JSON.stringify(falsch)));
  assert.equal(sp.rohAbzug(), vorher, 'gescheiterte Übernahme hinterlässt nichts');
});

test('Speicher: beschädigte Ablage wird gesperrt, nicht repariert oder überschrieben', async () => {
  const h = hülle(), ablage = Speicher.speicherAblage(), sp = await h.oeffnen(ablage);
  const { w, s } = spiel(40);
  const u = await sp.neueWelt(w.save(s));
  const roh = await ablage.lesen();
  roh.welten[u.weltId].auto[0].zustand = roh.welten[u.weltId].auto[0].zustand.replace('"tick":40', '"tick":41');
  await ablage.tauschen(roh.revision, { ...roh, revision: roh.revision + 1 });
  const defekt = await h.oeffnen(ablage);
  assert.match(defekt.gesperrt, /Prüfsumme|Beschädigt/i);
  await assert.rejects(() => defekt.autosave(w.save(s)), /gesperrt/);
  await assert.rejects(() => defekt.neueWelt(w.save(s)), /gesperrt/);
  assert.throws(() => defekt.laden(u.weltId, 'auto-1'), /gesperrt/);
  assert.ok(defekt.rohAbzug().includes(u.weltId), 'Rettungsabzug bleibt möglich');
  assert.equal((await ablage.lesen()).revision, roh.revision + 1, 'Ablage wurde nicht angerührt');
});
