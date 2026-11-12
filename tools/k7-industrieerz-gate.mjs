// K7 [DRAFT/ANALYSE] – tatsächlich gedeckte industrielle Erz-Vorbestellung?
// Rein lesendes Gate über EINEN Original-K1/K6-Weltzustand. Es erzeugt weder
// einen Auftrag noch Waren, ISK, Eigentümer, neue Regeln oder eine zweite Weltuhr.
// Der industrialisierte Abnehmer ist ausdrücklich eine UNFREIGEGEBENE OPTION.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { k6Start } from './k6-eisdisposition.mjs';
import { pruefen } from './k5-terminal-diagnose.mjs';

const geld = s => Object.values(s.owners).reduce((n, o) => n + o.cash, 0);
const bar = (s, id) => s.owners[id]?.cash ?? 0;
const bestand = (s, st, ware) => s.stations[st]?.lager[ware] || 0;
const sum = xs => xs.reduce((a, b) => a + b, 0);
export const K7_OPTION = 'INDUSTRIE_ERZ_VORAUFTRAG_NICHT_FREIGEGEBEN';

// Prüft ausschließlich eine *potentielle* bereits vorhandene Finanzdeckung.
// Wichtig: das Zurücklegen der Kassenbeträge ist derzeit kein Originalbefehl.
// Die 500 ISK Käuferdeckung dürfen nicht zweimal als Preorder und W3-Kauf
// gezählt werden: eine künftige Core-Implementierung muss DIESELBE Treuhand
// in den W3-Kauf übernehmen und den Rückweg/Abbruch korrekt bilanzieren.
export function finanzierungsGate(w, s, {
  anzahlErz = 50, frachterId = 'sh020', minerId = 'sh004',
} = {}) {
  if (anzahlErz !== 50) throw RangeError('K7: nur die vorhandene W3-Originalcharge von 50 Erz');
  const vor = w.canonical(s);
  const r = w.rules;
  const cfg = r.erzpilot, t = r.w3, raf = r.w4, yard = r.w5;
  const miner = s.ships[minerId], carrier = s.ships[frachterId];
  const eigentuemerOk = !!miner && miner.owner === cfg.npcInvestor && miner.klasse === 'miner'
    && w.buchwert(s, minerId) > 0 && !!carrier && carrier.owner === t.spedition
    && carrier.klasse === 'frachter' && w.buchwert(s, frachterId) > 0;
  const quoteFracht = w.kern.pilotW3Kalkulation(s, frachterId);
  const quoteRaffinerie = w.kern.pilotW4Kalkulation(s);
  const quoteWerft = w.kern.pilotW5Kalkulation(s);

  const wertErz = anzahlErz * cfg.preis;
  const bergbau = anzahlErz * cfg.minerJeMinute;
  const flugMinuten = r.w5n.flugMinuten; // bestehende 60-Minuten-Route Aldera–Nadir
  const kaufTransport = wertErz + 2 * flugMinuten * t.frachtgebuehrJeMinute;
  const crewTransport = 2 * flugMinuten * t.arbeitJeMinute;
  const raffinierChargen = anzahlErz / raf.erzJeCharge;
  const materialAusCharge = raffinierChargen * raf.materialJeCharge;
  const raffinerieLohn = raffinierChargen * raf.dauer * raf.lohnJeMinute;
  const werftMaterial = yard.material * yard.materialPreis;
  const werftLohn = yard.dauer * yard.lohnJeMinute;
  const hullenPreis = yard.verkaufsPreis;
  const ueberfuehrung = flugMinuten * r.w5Transfer.lohnJeMinute;
  const kassen = Object.fromEntries([cfg.npcInvestor, cfg.station, t.kunde, t.spedition, yard.werft, cfg.exportOwner]
    .map(id => [id, bar(s, id)]));
  const budgets = [
    { id: 'W1-Förderarbeit', konto: cfg.npcInvestor, betrag: bergbau },
    { id: 'W1-Dockankauf', konto: cfg.station, betrag: wertErz },
    { id: 'W3-Kauf-und-Tarif', konto: t.kunde, betrag: kaufTransport },
    { id: 'W3-Frachtarbeit', konto: t.spedition, betrag: crewTransport },
    { id: 'W4-Raffineriearbeit', konto: raf.station, betrag: raffinerieLohn },
    { id: 'W5-Materialkauf-und-Werftarbeit', konto: yard.werft, betrag: werftMaterial + werftLohn },
    { id: 'W5-Frachterkauf-und-Überführung', konto: yard.kaeufer, betrag: hullenPreis + ueberfuehrung },
  ];
  // Gleichzeitige Vorfinanzierung summiert tatsächliche Verpflichtungen PRO KONTO.
  // Bestehende Zahlungen zwischen Firmen werden NICHT künstlich vorweg verrechnet.
  const gebundenProKonto = {};
  for (const x of budgets) gebundenProKonto[x.konto] = (gebundenProKonto[x.konto] || 0) + x.betrag;
  const finanzierung = Object.fromEntries(Object.entries(gebundenProKonto)
    .map(([id, betrag]) => [id, { vorhanden: bar(s, id), gebunden: betrag,
      gedeckt: bar(s, id) >= betrag, luecke: Math.max(0, betrag - bar(s, id)) }]));
  const ausreichend = Object.values(finanzierung).every(x => x.gedeckt);
  const originalExportLuecke = Math.max(0, wertErz - bar(s, cfg.exportOwner));
  const originalEndnachfrage = w.kern.pilotNpcKrisenLage(s);
  const vorhandenePhysik = {
    quelleErz: bestand(s, cfg.station, 'erz'),
    zielErz: bestand(s, t.zielStation, 'erz'),
    zielMaterial: bestand(s, yard.station, 'material'),
    frachterAktiv: eigentuemerOk && carrier.phase === 'dock' && carrier.system === 'aldera'
      && carrier.auftrag === 'halten' && Object.values(carrier.ladung).every(x => x === 0),
    minerEinsatzfaehig: !!miner && miner.flug?.lage === 'angedockt',
    neueMinerVorhanden: bestand(s, cfg.station, 'miner'),
    neueFrachterVorhanden: bestand(s, yard.station, 'frachter'),
  };
  const result = {
    option: K7_OPTION, tick: s.tick, hash: w.hash(s), weltgeld: geld(s),
    minted: s.minted, burned: s.burned,
    anzahlErz, wertErz, bergbau, flugMinuten, kaufTransport,
    crewTransport, raffinierChargen, materialAusCharge, raffinerieLohn,
    werftMaterial, werftLohn, hullenPreis, ueberfuehrung,
    kassen, budgets, finanzierung, ausreichend, eigentuemerOk,
    originalExportLuecke, originalEndnachfrage,
    vorhandenePhysik,
    originalQuotes: {
      fracht: { ok: quoteFracht.ok, grund: quoteFracht.grund },
      raffinieren: { ok: quoteRaffinerie.ok, grund: quoteRaffinerie.grund },
      werft: { ok: quoteWerft.ok, grund: quoteWerft.grund },
    },
    // Noch kein echtes Recht, den NPC-Erzauftrag an Industrie statt Export zu vergeben!
    strukturFehlt: [
      'W1/W2-Endnachfrage ausschließlich mit erschöpftem Exportkonto geprüft',
      'Industriebestellung und Käufer-Treuhand nicht im Original-Vertragsbuch vorhanden',
      'W3-Kaufreserve müsste dieselbe vorfinanzierte Industrie-Bestellung übernehmen, nicht doppelt belasten',
      'Original W3 akzeptiert nur 50 REAL geförderte Erz im Aldera-Lager',
      'Vorzeitiger Frachterverschleiß, Abbruch, Eigentumsrechte und Rückzahlung benötigen atomare Regeln',
    ],
    produktivAusfuehrbar: false,
  };
  assert.equal(w.canonical(s), vor, 'K7-Gate darf keinerlei Weltmutation auslösen');
  return result;
}

// Negativtest: jeder existierende Core-Befehl muss bei fehlender realer Ware
// atomar ablehnen. Das ist keine hypothetische Rechtmäßigkeitsübertragung.
export function originalSperren(w, s, frachterId = 'sh020') {
  const list = [
    { type: 'shipFreight', owner: 'transport', schiff: frachterId },
    { type: 'stationRefine', owner: 'st_nadir', station: 'st_nadir' },
    { type: 'stationBuildShip', owner: 'werft_extern', station: 'st_nadir' },
    { type: 'stationBuildMiner', owner: 'werft_extern', station: 'st_nadir', besteller: 'npc3' },
    { type: 'shipBuy', owner: 'transport', klasse: 'frachter', station: 'st_nadir' },
  ];
  return list.map(cmd => {
    const before = w.canonical(s), response = w.execute(s, cmd);
    assert.equal(response.ok, false, 'K7: nicht gedeckte Originalaktion muss abgelehnt werden');
    assert.equal(w.canonical(s), before, 'K7: Original-Ablehnung muss atomar sein');
    return { cmd, grund: response.reason };
  });
}

export function k7Analyse(seed = 42) {
  const quelle = k6Start(seed), s = quelle.w.load(quelle.terminalSave);
  const base = finanzierungsGate(quelle.w, s);
  const ablehnungen = originalSperren(quelle.w, s);
  const audit = pruefen(quelle.w, s);
  assert.equal(base.weltgeld, 33000); assert.equal(base.minted, 0); assert.equal(base.burned, 0);
  assert.equal(quelle.w.hash(s), quelle.startHash, 'K7: Ausgangs-Hash nach reinen Quotes stabil');
  return { seed, basis: quelle.startHash, gate: base, ablehnungen,
    audit: { weltgeld: audit.weltgeld, nullsaldo: audit.nullsaldo } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const seed = Number(process.argv[2] || 42);
  const r = k7Analyse(seed);
  console.log('K7_RESULT ' + JSON.stringify(r));
}
