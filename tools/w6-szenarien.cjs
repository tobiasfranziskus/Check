/* W6 [DRAFT/ANALYSE]: 13 wirtschaftlich unterschiedliche Regime der EINEN Regel204-Welt.
 * Nur gespeicherte Politikwerte (Verhalten der Akteure) unterscheiden die Läufe; Seed, Regeln,
 * Preise, Rezepte, Startbestände und Geldmenge sind identisch. Kein Lauf erhält Geld oder Ware.
 * Aufruf: node tools/w6-szenarien.cjs [id|alle] [tage]   -> eine JSON-Zeile je Szenario
 */
'use strict';
const path = require('node:path');
const R = path.join(__dirname, '..');
const OLD = require(path.join(R, 'prototypes/w5ac/session.js'));
const J8 = require(path.join(R, 'prototypes/verbund/konzern-session.js'));
const NPC = ['npc3', 'transport', 'st_aldera', 'st_nadir', 'werft_extern'];
const alle = (wert) => Object.fromEntries(NPC.map((f) => [f, wert]));
const ERSATZ = { stilllegung: true, betriebsreserve: { werft_extern: 1060 } };
const SZENARIEN = Object.freeze([
  { id: 'S01', name: 'Konsumkreislauf ohne Stilllegung', politik: {} },
  { id: 'S02', name: 'Verschleiß mit Ersatzwirtschaft (Werft hält Kapital für zwei Bauten)', politik: ERSATZ },
  { id: 'S03', name: 'Verschleiß, Werft hält nur Kapital für einen Bau', politik: { stilllegung: true } },
  { id: 'S04', name: 'Nachfragemangel: Haushalte kaufen höchstens 2 Wasser je Tag', politik: { ...ERSATZ, bedarfJeTag: 2 } },
  { id: 'S05', name: 'Geldhortung der Haushalte: 80 % Sparquote', politik: { ...ERSATZ, sparquoteStandard: 800 } },
  { id: 'S06', name: 'Geldhortung der Firmen: keine Ausschüttung', politik: { ...ERSATZ, ausschuettung: alle(0) } },
  { id: 'S07', name: 'Rohstoffausfall: verschlissene Hüllen werden nicht ersetzt', politik: { stilllegung: true, ersatzkauf: false } },
  { id: 'S08', name: 'Transportengpass: keine Wasser-Rückfracht nach Aldera', politik: { ...ERSATZ, rueckfracht: false } },
  { id: 'S09', name: 'Verarbeitungsausfall: Wasserwerk steht', politik: { ...ERSATZ, wasserwerk: false } },
  { id: 'S10', name: 'Firmen ohne Betriebsreserve (Insolvenzrisiko)', politik: { stilllegung: true, betriebsreserve: alle(0) } },
  { id: 'S11', name: 'Vorratswerft: frühe Vorproduktion bindet Kapital', politik: { ...ERSATZ, werftVorrat: 1, ersatzVorlaufProzent: 80 } },
  { id: 'S12', name: 'Lagerknappheit: kleine Wasser- und Eispuffer', politik: { ...ERSATZ, wasserZielAldera: 20, wasserwerkBis: 30, eisPufferAldera: 10 } },
  { id: 'S13', name: 'Träger Geldumlauf: Wocheneinkauf und Wochendividende', politik: { ...ERSATZ, einkaufMinuten: 10080, dividendeMinuten: 10080 } },
]);
function start(politik) {
  const quelle = OLD.create(42, 'private195').export();
  const sitzung = J8.erstellen();
  sitzung.starten195(quelle, true);
  const welt = sitzung.weltReferenz(), s = welt.load(sitzung.exportieren());
  welt.politikSetzen(s, politik);
  welt.npcAutoSetzen(s, true);
  return { welt, s };
}
// Unabhängige Prüfung neben welt.audit: Geldsumme, Emission und physischer Warenbestand.
function pruefen(welt, s) {
  const a = welt.audit(s), fehler = a.ok ? [] : [...a.fehler];
  const geld = Object.values(s.owners).reduce((n, o) => n + o.cash, 0);
  if (geld !== 33000) fehler.push('Weltgeld ' + geld);
  if (s.minted !== 0 || s.burned !== 0) fehler.push('Mint/Burn');
  if (Object.values(s.owners).some((o) => !Number.isSafeInteger(o.cash) || o.cash < 0)) fehler.push('negative Kasse');
  for (const [ware, e] of Object.entries(s.ledger)) {
    const lager = [...Object.values(s.stations).map((st) => st.lager), ...Object.values(s.ships).map((sh) => sh.ladung)]
      .reduce((n, l) => n + (l[ware] || 0), 0);
    if (lager !== e.initial + e.mined + e.produced + e.imported - e.consumed - e.exported) fehler.push('Ware ' + ware);
  }
  return fehler;
}
function kennzahlen(welt, s) {
  const b = welt.bericht(s), o = s.owners;
  const grenze = Object.keys(o).sort().map((id) => [id, o[id].cash]).sort((x, y) => y[1] - x[1]).slice(0, 4);
  return { eis: b.produktion.eisGefoerdert, erz: b.produktion.erzGefoerdert, wasser: b.produktion.wasserProduziert,
    material: b.produktion.materialErzeugt, frachter: b.produktion.frachterGebaut, miner: b.produktion.minerGebaut,
    ersatz: b.ersatzkaeufe, erzvertraege: s.w3.abgeschlossen, eisfrachten: b.auftraege.eisfrachten,
    wasserErloes: b.verkaeufe.wasserErloes, dividenden: b.dividenden,
    loehne: Object.values(b.loehne).reduce((n, x) => n + x, 0),
    haushalte: b.kaeuferliquiditaet.haushalte, firmen: NPC.reduce((n, f) => n + o[f].cash, 0),
    spieler: o.house.cash, groessteKonten: grenze };
}
function lauf(sz, tage = 90, schritt = 30) {
  if (!Number.isSafeInteger(tage) || tage < 1 || !Number.isSafeInteger(schritt) || schritt < 1)
    throw new RangeError('Tage und Prüfraster müssen positive ganze Zahlen sein');
  const { welt, s } = start(sz.politik), verlauf = [];
  let fehler = [];
  for (let tag = Math.min(schritt, tage); fehler.length === 0; tag = Math.min(tag + schritt, tage)) {
    welt.advance(s, tag * 1440 - s.tick);
    fehler = pruefen(welt, s);
    verlauf.push({ tag, hash: welt.hash(s), ...kennzahlen(welt, s) });
    if (tag === tage) break;
  }
  const ende = verlauf.at(-1), vor = verlauf.at(-2) || ende;
  return { id: sz.id, name: sz.name, tage, ok: fehler.length === 0, fehler, hash: welt.hash(s),
    // "aktiv": im letzten Abschnitt wurde noch real gefördert, verkauft und Lohn gezahlt.
    aktivZuletzt: ende.eis > vor.eis && ende.wasserErloes > vor.wasserErloes && ende.loehne > vor.loehne,
    ersatzZuletzt: ende.ersatz - vor.ersatz, ende, verlauf,
    befehle: s.kanon.npc.befehle, pausen: s.kanon.npc.pausen,
    engpass: s.kanon.engpass ? { erster: s.kanon.engpass.erster,
      haeufigste: Object.entries(s.kanon.engpass.zaehler).sort((x, y) => y[1] - x[1]).slice(0, 3) } : null,
    welt, zustand: s };
}
module.exports = { SZENARIEN, start, pruefen, kennzahlen, lauf };
if (require.main === module) {
  const wahl = process.argv[2] || 'alle', tage = Number(process.argv[3] || 90);
  if (wahl !== 'alle' && !SZENARIEN.some(x => x.id === wahl)) throw new RangeError('Unbekanntes Szenario: ' + wahl);
  for (const sz of SZENARIEN.filter((x) => wahl === 'alle' || x.id === wahl)) {
    const { welt, zustand, verlauf, ...r } = lauf(sz, tage, tage > 90 ? 73 : 30);
    console.log(JSON.stringify({ ...r, verlauf: verlauf.map((v) => ({ tag: v.tag, hash: v.hash, eis: v.eis, wasserErloes: v.wasserErloes, ersatz: v.ersatz })) }));
  }
}
