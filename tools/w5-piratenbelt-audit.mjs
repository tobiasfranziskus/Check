// W5-Forschungsaudit C: Ratting in zwei Piratenanomalien, Kopfgeld, Piratenersatz und Pilotenfortschritt.
//
// NICHTPRODUKTIV. Dieses Werkzeug ändert weder index.html noch Core-Module, Speicherformate,
// Roadmap oder Projektstatus. Es lädt den vorhandenen Regel-14-Kern unverändert aus index.html
// und verwendet dessen eigene Funktionen (createState, patrouille, piratenErsatz, betriebskosten,
// kampf, audit, submit/advance). Es gibt keinen zweiten Simulationskern: Eigene Rechnungen sind
// ausschließlich Kontenfortschreibungen (Erwartungswerte, Bilanzidentitäten) auf Basis gemessener
// Kernergebnisse. Alle Schwellen, Boni und Finanzierungsvarianten sind VORSCHLÄGE, nicht beschlossen.
//
// Aufruf:  node tools/w5-piratenbelt-audit.mjs [--proben=4000] [--tage=90] [--seeds=alle|42,7] [--json]
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {SEEDS as B5B_SEEDS} from './b5b-common.mjs';

export const SEEDS = Object.freeze([...B5B_SEEDS]);
export const SHA = (x) => createHash('sha256').update(x).digest('hex');
const STUNDE_TICKS = 60;

// ---------------------------------------------------------------------------------------------
// 1. Kern unverändert laden
// ---------------------------------------------------------------------------------------------
export function ladeKern(htmlUrl = new URL('../index.html', import.meta.url)) {
  const html = fs.readFileSync(htmlUrl, 'utf8');
  const start = html.indexOf('<script>') + 8;
  const ende = html.indexOf('const m_ui_main =');
  if (start < 8 || ende <= start) throw new Error('Core-Abschnitt in index.html nicht gefunden');
  const source = html.slice(start, ende);
  const elemente = new Map();
  const document = { getElementById(id) {
    if (!elemente.has(id)) elemente.set(id, { dataset: {}, innerHTML: '', textContent: '' });
    return elemente.get(id);
  } };
  const k = new Function('document', `${source};return {core:m_core_index,rules:m_data_rules.RULES,`
    + 'zustand:m_core_state,sicherheit:m_core_sicherheit,kampf:m_core_kampf,preis:m_core_preis,handel:m_core_handel};')(document);
  return { ...k, quelleSha256: SHA(source), htmlSha256: SHA(html) };
}

// Regeln für Gegenproben veränderbar kopieren (der Kern friert seine eigenen Regeln ein).
export const regelKopie = (rules) => structuredClone(rules);

// ---------------------------------------------------------------------------------------------
// 2. Referenzwerte ausschließlich aus den vorhandenen Regeln
// ---------------------------------------------------------------------------------------------
export function referenzwerte(kern) {
  const r = kern.rules; const w = r.world; const e = r.economy; const c = r.combat;
  const start = kern.core.createState(r.startSeed, r);
  const werft = w.werft;
  const jaegerMarkt = kern.preis.preis(start, werft, 'jaeger', r);
  const jaegerGebuehr = kern.handel.gebuehr(start, r, werft, jaegerMarkt);
  const owner = (id) => r.owners.find((o) => o.id === id);
  // Piratenanomalien = gesetzlose Systeme mit Piraten-Soll und ohne Staatsjäger (reine Kopfgeldzonen).
  const anomalien = Object.keys(w.piraten.soll).sort()
    .filter((sys) => w.systems[sys].sicherheit === 'gesetzlos' && !w.sicherheit.jaeger.includes(sys))
    .map((sys) => ({ system: sys, station: w.systems[sys].station, fonds: w.systems[sys].fonds,
      piraten: { ...w.piraten.soll[sys] } }));
  return {
    quelle: 'index.html Regel 14 (m_data_economy / m_data_world / m_data_combat)',
    regelVersion: r.rulesVersion, schema: r.schema,
    kopfgeld: { ...e.kopfgeld }, kopfgeldFaktorSpieler: e.kopfgeldFaktor, spielerOwner: e.start.owner,
    kopfgeldKlasse: { ...c.kopfgeldKlasse },
    piratenErsatzpreis: { ...c.ersatzpreis },
    einheiten: structuredClone(c.einheiten),
    jaeger: { basis: e.waren.jaeger.basis, marktpreisStart: jaegerMarkt, gebuehrStart: jaegerGebuehr,
      kaufStart: jaegerMarkt + jaegerGebuehr, werft, rezept: structuredClone(e.rezepte.r_jaeger),
      betriebJeStunde: w.betriebskosten.jaeger },
    patrouilleChance: w.patrouilleChance, ueberfallChance: w.ueberfallChance,
    piratenOwner: w.piraten.owner, piratenMarkt: w.piraten.markt,
    piratenStartkasse: owner(w.piraten.owner).cash,
    sicherheitOwner: w.sicherheit.owner, sicherheitStartkasse: owner(w.sicherheit.owner).cash,
    senkeBesitzer: [...w.senkeBesitzer],
    staatsjaegerSysteme: [...w.sicherheit.jaeger],
    piratenSoll: structuredClone(w.piraten.soll),
    anfangsGeldmenge: start.initialSupply,
    anomalien,
  };
}

// ---------------------------------------------------------------------------------------------
// 3. Kampfstatistik mit der echten Patrouillenfunktion (eine Jagdstunde je Probe)
// ---------------------------------------------------------------------------------------------
// Prüfzustand: echte Startwelt, alle Schiffe entfernt, nur Jäger einer Gruppe und die Piraten
// der Anomalie. Danach EIN Aufruf von m_core_sicherheit.patrouille (inklusive realer Begegnungs-
// wahrscheinlichkeit, Kampf, Kopfgeldbuchung und Schiffsentfernung).
export function pruefZustand(kern, rules, { seed, system, jaeger, owner, piraten }) {
  const s = kern.core.createState(seed, rules);
  s.ships = {}; s.stats.verkaeufe = {};
  const jaegerIds = [];
  for (let i = 0; i < jaeger; i++) jaegerIds.push(kern.zustand.neuesSchiff(s,
    { owner, klasse: 'jaeger', system, heimat: system, auftrag: 'jagd' }).id);
  const piratIds = [];
  for (const klasse of Object.keys(piraten).sort()) for (let i = 0; i < piraten[klasse]; i++)
    piratIds.push(kern.zustand.neuesSchiff(s, { owner: rules.world.piraten.owner, klasse, system, heimat: system, auftrag: 'pirat' }).id);
  return { s, jaegerIds, piratIds };
}

export function kampfStatistik(kern, { system, jaeger = 1, owner = 'house', proben = 2000, startSeed = 1,
  rules = kern.rules, piraten = rules.world.piraten.soll[system] } = {}) {
  const r = rules;
  const summe = { proben, kaempfe: 0, abschuesse: {}, jaegerVerloren: 0, kopfgeld: 0, mindestensEinVerlust: 0, gruppeVernichtet: 0 };
  for (let i = 0; i < proben; i++) {
    const { s, jaegerIds } = pruefZustand(kern, r, { seed: startSeed + i, system, jaeger, owner, piraten });
    const minted0 = s.minted; const cash0 = s.owners[owner].cash;
    kern.sicherheit.patrouille(s, r);
    summe.kaempfe += s.stats.kaempfe;
    for (const [klasse, n] of Object.entries(s.stats.abschuesse)) summe.abschuesse[klasse] = (summe.abschuesse[klasse] || 0) + n;
    const verloren = jaegerIds.filter((id) => !s.ships[id]).length;
    summe.jaegerVerloren += verloren;
    if (verloren > 0) summe.mindestensEinVerlust += 1;
    if (verloren === jaeger) summe.gruppeVernichtet += 1;
    const geld = s.minted - minted0;
    if (s.owners[owner].cash - cash0 !== geld) throw new Error('Kopfgeld nicht genau einmal beim Eigentümer gebucht');
    summe.kopfgeld += geld;
    const a = kern.core.audit(s);
    if (!a.ok) throw new Error(`Kernaudit nach Patrouille fehlgeschlagen (Probe ${i})`);
  }
  const je1000 = (n) => Math.round((n * 1000) / proben);
  const abschuesseGesamt = Object.values(summe.abschuesse).reduce((a, b) => a + b, 0);
  return {
    system, jaeger, owner, proben, piraten: { ...piraten },
    kampfJe1000h: je1000(summe.kaempfe),
    abschuesseJe1000h: je1000(abschuesseGesamt),
    abschuesseNachKlasseJe1000h: Object.fromEntries(Object.entries(summe.abschuesse).sort().map(([k, n]) => [k, je1000(n)])),
    jaegerVerlusteJe1000h: je1000(summe.jaegerVerloren),
    verlustStundenJe1000h: je1000(summe.mindestensEinVerlust),
    gruppeVernichtetJe1000h: je1000(summe.gruppeVernichtet),
    kopfgeldJeStunde: Math.round(summe.kopfgeld / proben),
    kopfgeldSumme: summe.kopfgeld,
    roh: summe,
  };
}

// ---------------------------------------------------------------------------------------------
// 4. Stundenrechnung, Rentabilität, Emission (Kontenfortschreibung, keine Simulation)
// ---------------------------------------------------------------------------------------------
// Alle Werte je Gruppe und 1000 Jagdstunden, ganzzahlig.
export function stundenRechnung(ref, stat, { kopfgeldFaktor = null } = {}) {
  const spieler = stat.owner === ref.spielerOwner;
  const faktor = kopfgeldFaktor ?? (spieler ? ref.kopfgeldFaktorSpieler : 1);
  let kopfgeld = 0;
  for (const [klasse, n] of Object.entries(stat.abschuesseNachKlasseJe1000h))
    kopfgeld += n * ref.kopfgeld[ref.kopfgeldKlasse[klasse]] * faktor;
  // Betrieb: Der Kern belastet Spieler-/Konzernjäger nur in Stunden mit Beute; bei voller Anomalie also jede Stunde.
  const betrieb = 1000 * ref.jaeger.betriebJeStunde * stat.jaeger;
  const huellen = stat.jaegerVerlusteJe1000h * ref.jaeger.kaufStart;
  let piratenErsatz = 0;
  for (const [klasse, n] of Object.entries(stat.abschuesseNachKlasseJe1000h)) piratenErsatz += n * ref.piratenErsatzpreis[klasse];
  const netto = kopfgeld - betrieb - huellen;
  return {
    system: stat.system, jaeger: stat.jaeger, owner: stat.owner, faktor,
    je1000h: { kopfgeldBrutto: kopfgeld, betriebTransferAnFonds: betrieb, huellenErsatzKauf: huellen, nettoBetreiber: netto,
      piratenErsatzbedarf: piratenErsatz, neuGeschoepftBeiEmission: kopfgeld },
    nettoJeStunde: Math.round(netto / 1000),
    einstufungBetreiber: netto > 0 ? 'rentabel' : netto === 0 ? 'kostendeckend' : 'defizitaer',
  };
}

// Break-even-Gitter: Abschüsse und Jägerverluste je 100 Jagdstunden (eine Jägergruppe mit n Jägern).
// kopfgeldJeAbschuss = Klassenprämie × Faktor. Ergebnis in ISK je 100 Stunden.
export function rentabilitaetsGitter(ref, { klasse, jaeger = 1, faktoren = [1, ref.kopfgeldFaktorSpieler],
  abschuesseJe100h = [0, 5, 10, 15, 20, 30, 40, 60], verlusteJe100h = [0, 1, 2, 5, 10] } = {}) {
  const praemie = ref.kopfgeld[ref.kopfgeldKlasse[klasse]];
  const zeilen = [];
  for (const f of faktoren) for (const v of verlusteJe100h) for (const a of abschuesseJe100h) {
    const kopfgeld = a * praemie * f; const betrieb = 100 * ref.jaeger.betriebJeStunde * jaeger;
    const huelle = v * ref.jaeger.kaufStart; const netto = kopfgeld - betrieb - huelle;
    // Geldmenge: Betrieb (an Fonds) und Hüllenkauf (an Werft) sind Transfers, keine Senken. Unter KG0
    // erhöht daher JEDER bezahlte Abschuss die Geldmenge um die volle Prämie; unter KG1/KG2 ist er neutral.
    zeilen.push({ faktor: f, abschuesse: a, verluste: v, kopfgeld, betrieb, huelle, netto,
      einstufung: netto > 0 ? 'rentabel' : netto === 0 ? 'kostendeckend' : 'defizitaer',
      geldmengeKG0: kopfgeld, geldmengeKG1KG2: 0,
      einstufungGeldmengeKG0: kopfgeld > 0 ? 'inflationaer' : 'neutral' });
  }
  // Mindestabschüsse je 100 h für Kostendeckung je Faktor/Verlustrate (aufgerundet)
  const grenzen = [];
  for (const f of faktoren) for (const v of verlusteJe100h) {
    const kosten = 100 * ref.jaeger.betriebJeStunde * jaeger + v * ref.jaeger.kaufStart;
    grenzen.push({ faktor: f, verlusteJe100h: v, mindestAbschuesseJe100h: Math.ceil(kosten / (praemie * f)) });
  }
  return { klasse, praemie, jaeger, zeilen, grenzen };
}

// ---------------------------------------------------------------------------------------------
// 5. Finanzierungsvarianten für Piratenbestand (PB) und Kopfgeld (KG) – Kontenfortschreibung
// ---------------------------------------------------------------------------------------------
// Jede Variante bucht ausschließlich Transfers zwischen benannten Konten, `neuGeschoepft`
// (minted) oder `vernichtet` (burned). Die Bilanzidentität wird geprüft:
//   Σ Anfangskapital + neuGeschoepft − vernichtet = Σ Endbestände.
export const PB_VARIANTEN = Object.freeze({
  PB0_ist: { name: 'Ist Regel 14: Ersatzpreis als ISK-Transfer an Piratenmarkt, Hülle ohne Ware',
    respawn: 'kasse', huelleAusWare: false, zulaessig: false,
    grund: 'Hülle entsteht ohne Werft-/Materialverbrauch; Geld fließt nur an die Meridian-Station.' },
  PB1_endlich: { name: 'Endlicher Anfangsbestand, kein Ersatz', respawn: 'keiner', huelleAusWare: true, zulaessig: true,
    grund: 'Nur zu Spielbeginn vorhandene (als Anfangsvermögen bilanzierte) Hüllen.' },
  PB2_werftkauf: { name: 'Ersatz nur durch Kauf einer gefertigten Hülle aus Lager (Material verbraucht)',
    respawn: 'kasse+lager', huelleAusWare: true, zulaessig: true,
    grund: 'Preis an Werft-/Marktkonto (Transfer), Hülle als Ware aus Lagerbestand; endet bei leerer Kasse oder leerem Lager.' },
  PB3_einnahmegebunden: { name: 'Ersatz nur aus laufenden Piraten-Einnahmen nach Startbestand',
    respawn: 'einnahmen', huelleAusWare: true, zulaessig: true,
    grund: 'Startkasse bleibt Rücklage; nur echte Einnahmen (Beute/Schutzgeld) finanzieren Ersatz. Ratting-only: 0 Einnahmen.' },
});
export const KG_VARIANTEN = Object.freeze({
  KG0_emission: { name: 'Ist: Kopfgeld neu geschöpft (minted)', quelle: null },
  KG1_staatskasse: { name: 'Transfer aus Sicherheitskasse, endet bei leerer Kasse', quelle: 'security' },
  KG2_systemfonds: { name: 'Transfer aus Systemfonds der Anomalie (gespeist u. a. von Jägerbetriebskosten)', quelle: 'fonds' },
  KG3_deckel: { name: 'Neu geschöpft bis ausdrücklichem Emissionsdeckel, danach 0', quelle: null, deckel: true },
});

// Fortschreibung je Stunde mit ganzzahligem Erwartungswert-Akkumulator (deterministisch).
// nachfrageJe1000h: Abschüsse, die die Jägergruppe bei voll besetzter Anomalie je 1000 h erzielt.
export function finanzierungsLauf(ref, { pb, kg, system, klasse, stunden = 90 * 24, nachfrageJe1000h, verlusteJe1000h,
  jaeger = 1, faktor = 1, betreiberStart = 2000, piratenKasse = ref.piratenStartkasse, piratenStartbestand = 1,
  huellenLager = 0, staatskasse = ref.sicherheitStartkasse, fondsStart = 1000, emissionsDeckel = 0,
  piratenEinnahmenJeStunde = 0, ersatzEmpfaenger = 'piratenmarkt' } = {}) {
  const P = PB_VARIANTEN[pb]; const K = KG_VARIANTEN[kg];
  if (!P || !K) throw new Error('unbekannte Variante');
  const preisPirat = ref.piratenErsatzpreis[klasse];
  const praemie = ref.kopfgeld[ref.kopfgeldKlasse[klasse]] * faktor;
  const kauf = ref.jaeger.kaufStart;
  const konten = { betreiber: betreiberStart, piraten: piratenKasse, [ersatzEmpfaenger]: 0, staat: staatskasse,
    fonds: fondsStart, werft: 0 };
  const anfang = Object.values(konten).reduce((a, b) => a + b, 0);
  const z = { neuGeschoepft: 0, vernichtet: 0, transfers: 0, kopfgeldGezahlt: 0, kopfgeldUnbezahlt: 0,
    abschuesse: 0, piratenRespawns: 0, respawnOhneHuelle: 0, jaegerVerloren: 0, jaegerNachgekauft: 0,
    jagdStunden: 0, stillstandStunden: 0, huellenLager, betriebGezahlt: 0, piratenAktiv: piratenStartbestand,
    ersteLeereStunde: null };
  let accA = 0; let accV = 0; let jaegerAktiv = jaeger;
  const transfer = (von, nach, n) => { if (n <= 0) return; if (konten[von] < n) throw new Error(`${von} ungedeckt`);
    konten[von] -= n; konten[nach] += n; z.transfers += n; };
  for (let h = 0; h < stunden; h++) {
    // Piraten-Einnahmen (nur PB3 nutzbar; bei Ratting-only standardmäßig 0) – Transfer von außen nicht modelliert:
    // eine Einnahme ist hier Transfer aus dem Fonds (Schutzgeld), nicht Geldschöpfung.
    if (piratenEinnahmenJeStunde > 0) { const n = Math.min(piratenEinnahmenJeStunde, konten.fonds); transfer('fonds', 'piraten', n); z.piratenEinnahmen = (z.piratenEinnahmen || 0) + n; }
    // Betrieb vor Jagd (Kernreihenfolge: betriebskosten vor patrouille); fehlendes Budget stoppt die Jagd.
    const betrieb = ref.jaeger.betriebJeStunde * jaegerAktiv;
    const jagt = jaegerAktiv > 0 && z.piratenAktiv > 0 && konten.betreiber >= betrieb;
    if (!jagt) { z.stillstandStunden += 1; if (z.piratenAktiv === 0 && z.ersteLeereStunde === null) z.ersteLeereStunde = h; }
    if (jagt) {
      transfer('betreiber', 'fonds', betrieb); z.betriebGezahlt += betrieb; z.jagdStunden += 1;
      accA += nachfrageJe1000h * Math.min(1, z.piratenAktiv) ; accV += verlusteJe1000h;
      const abschuss = Math.floor(accA / 1000) > 0 ? Math.min(z.piratenAktiv, Math.floor(accA / 1000)) : 0;
      accA -= abschuss * 1000;
      for (let i = 0; i < abschuss; i++) {
        z.abschuesse += 1; z.piratenAktiv -= 1;
        // Kopfgeld genau einmal je belegtem Abschuss
        if (kg === 'KG0_emission') { konten.betreiber += praemie; z.neuGeschoepft += praemie; z.kopfgeldGezahlt += praemie; }
        else if (kg === 'KG3_deckel') {
          const n = Math.min(praemie, Math.max(0, emissionsDeckel - z.neuGeschoepft));
          konten.betreiber += n; z.neuGeschoepft += n; z.kopfgeldGezahlt += n; z.kopfgeldUnbezahlt += praemie - n;
        } else {
          const von = kg === 'KG1_staatskasse' ? 'staat' : 'fonds';
          if (konten[von] >= praemie) { transfer(von, 'betreiber', praemie); z.kopfgeldGezahlt += praemie; }
          else z.kopfgeldUnbezahlt += praemie;
        }
      }
      const verlust = Math.min(jaegerAktiv, Math.floor(accV / 1000)); accV -= verlust * 1000;
      jaegerAktiv -= verlust; z.jaegerVerloren += verlust;
    }
    // Bezahlter Neukauf verlorener Jäger nur aus vorhandener Betreiberkasse (Kaufpreis + eine Stunde Betrieb).
    while (jaegerAktiv < jaeger && konten.betreiber >= kauf + ref.jaeger.betriebJeStunde) {
      transfer('betreiber', 'werft', kauf); jaegerAktiv += 1; z.jaegerNachgekauft += 1;
    }
    // Piratenersatz je Variante (Kernreihenfolge: piratenErsatz nach patrouille)
    const fehlend = piratenStartbestand - z.piratenAktiv;
    for (let i = 0; i < fehlend; i++) {
      if (P.respawn === 'keiner') break;
      if (P.respawn === 'kasse') { if (konten.piraten < preisPirat) break; transfer('piraten', ersatzEmpfaenger, preisPirat); z.respawnOhneHuelle += 1; }
      else if (P.respawn === 'kasse+lager') { if (konten.piraten < preisPirat || z.huellenLager < 1) break;
        transfer('piraten', 'werft', preisPirat); z.huellenLager -= 1; }
      else if (P.respawn === 'einnahmen') { const frei = Math.min(konten.piraten - piratenKasse, z.piratenEinnahmen || 0) ;
        if (frei < preisPirat || z.huellenLager < 1) break; transfer('piraten', 'werft', preisPirat); z.huellenLager -= 1; }
      z.piratenAktiv += 1; z.piratenRespawns += 1;
    }
  }
  const ende = Object.values(konten).reduce((a, b) => a + b, 0);
  const bilanzOk = anfang + z.neuGeschoepft - z.vernichtet === ende;
  return { pb, kg, system, klasse, faktor, stunden, anfangskapital: anfang, konten, ...z, bilanzOk,
    betreiberNetto: konten.betreiber - betreiberStart,
    inflationJe1000Anfangsgeld: Math.round((z.neuGeschoepft * 1000) / ref.anfangsGeldmenge),
    zulaessig: P.zulaessig && z.respawnOhneHuelle === 0 };
}

// ---------------------------------------------------------------------------------------------
// 6. Echter Regel-14-Kern über 90 Tage mit validierten Spielerbefehlen (Kauf, Aktivierung, Flug, Jagd)
// ---------------------------------------------------------------------------------------------
// Szenario-Parameter sind ausschließlich vorhandene Regelzahlen (Überfall-, Kopfgeld-, Ersatzwerte,
// Startkasse). Die Spielerstrategie ist eine feste Befehlsfolge, kein Kerneingriff.
export const KERN_SZENARIEN = Object.freeze({
  ist: { name: 'Regel 14 unverändert, ohne zusätzliche Jäger', jaegerOwner: null },
  ratting_dravos: { name: 'Nur Ratting (Überfälle 0), Spielerjäger in Dravos', ueberfall: 0, jaegerOwner: 'house', system: 'dravos' },
  ratting_meridian: { name: 'Nur Ratting (Überfälle 0), Spielerjäger in Meridian', ueberfall: 0, jaegerOwner: 'house', system: 'meridian' },
  ratting_dravos_f1: { name: 'Wie ratting_dravos, Spielerfaktor 1 (Gleichbehandlung)', ueberfall: 0, jaegerOwner: 'house', system: 'dravos', faktor: 1 },
  null_kopfgeld: { name: 'Wie ratting_dravos, Kopfgeld 0/0/0', ueberfall: 0, jaegerOwner: 'house', system: 'dravos', kopfgeld0: true },
  kein_ersatz: { name: 'Wie ratting_dravos, kein Piratenersatz (PB1)', ueberfall: 0, jaegerOwner: 'house', system: 'dravos', keinErsatz: true },
  null_budget: { name: 'Wie ratting_dravos, Spielerkasse nach Kauf < 1 Betriebsstunde', ueberfall: 0, jaegerOwner: 'house', system: 'dravos', nullBudget: true },
  konzern_meridian: { name: 'Nur Ratting, NPC1-Konzernjäger in Meridian über echten Sollplatz/Ersatzkauf', ueberfall: 0, jaegerOwner: 'npc1', system: 'meridian' },
  konzern_meridian_null_kopfgeld: { name: 'Wie konzern_meridian, Kopfgeld 0/0/0', ueberfall: 0, jaegerOwner: 'npc1', system: 'meridian', kopfgeld0: true },
});

export function kernRegeln(kern, sz) {
  const r = regelKopie(kern.rules);
  if (sz.ueberfall !== undefined) r.world.ueberfallChance = sz.ueberfall;
  if (sz.faktor !== undefined) r.economy.kopfgeldFaktor = sz.faktor;
  if (sz.kopfgeld0) for (const k of Object.keys(r.economy.kopfgeld)) r.economy.kopfgeld[k] = 0;
  if (sz.keinErsatz) for (const k of Object.keys(r.combat.ersatzpreis)) r.combat.ersatzpreis[k] = Number.MAX_SAFE_INTEGER;
  return r;
}

// Spieler: Kauf über shipTrade (Werftmarkt Aldera, echter Preis + Gebühr), shipActivate, shipMove, shipHunt.
// NPC-Konzern: nur ein zusätzlicher Sollplatz {jaeger, heimat, jagd} OHNE Schiff; der vorhandene
// ersatzkauf() kauft die Hülle real aus Werftbestand und Konzernkasse (oder eben nicht).
export function kernLauf(kern, seed, szenarioId, { tage = 90, pilotRegister = null } = {}) {
  const sz = KERN_SZENARIEN[szenarioId]; if (!sz) throw new Error(`unbekanntes Szenario ${szenarioId}`);
  const r = kernRegeln(kern, sz);
  const s = kern.core.createState(seed, r);
  const H = r.economy.start.owner; const O = sz.jaegerOwner; const SYS = sz.system;
  const SEC = r.world.sicherheit.owner; const PIR = r.world.piraten.owner;
  const werft = r.world.werft; const betrieb = r.world.betriebskosten.jaeger;
  const traeger = Object.values(s.ships).find((x) => x.owner === H && x.klasse === 'frachter')?.id;
  if (O && O !== H) {
    const plan = (s.sollflotte[O] ||= []);
    plan.push({ klasse: 'jaeger', heimat: SYS, ware: null, auftrag: 'jagd' });
  }
  const reg = pilotRegister ?? neuesPilotenRegister();
  const pilotId = O ? `pilot_${O}_1` : null;
  if (O) pilotAnlegen(reg, { pilotId, art: O === H ? 'spieler' : 'npc', arbeitgeber: O });
  const z = { kaeufe: 0, abschuesseJaeger: {}, kopfgeldJaeger: 0, staatKopfgeld: 0, jaegerVerloren: 0, autostopps: 0,
    jagdStunden: 0, jagdStundenMitBeute: 0, jagdStundenOhneBeute: 0, befehleAbgelehnt: 0, belege: 0, xpDoppelAbgelehnt: 0, auditFehler: 0,
    staatBetriebSoll: 0, staatBetriebGezahlt: 0, staatKasseLeerAbStunde: null, piratenLeerAbStunde: null };
  const sende = (cmd) => { const e = kern.core.submit(s, cmd, r); if (!e.ok) z.befehleAbgelehnt += 1; return e.ok; };
  const eigeneJaeger = () => Object.values(s.ships).filter((x) => x.owner === O && x.klasse === 'jaeger');
  const bekannte = new Set();
  let kaufStufe = 0; let neuId = null; let nullBudgetGesetzt = false;
  for (let h = 0; h < tage * 24; h++) {
    // --- Pilotenzuordnung und Verlustbuchung (Pilot bleibt, Schiff geht) ---
    if (O) {
      const p = reg.piloten[pilotId];
      if (p.schiff && !s.ships[p.schiff]) { schiffVerloren(reg, pilotId, p.schiff); z.jaegerVerloren += 1; }
      for (const j of eigeneJaeger()) if (!bekannte.has(j.id)) {
        bekannte.add(j.id); if (O !== H) z.kaeufe += 1;
        if (!reg.piloten[pilotId].schiff) pilotZuweisen(reg, pilotId, j.id);
      }
    }
    // --- Spieler-Befehlsfolge (wird im nächsten Tick validiert ausgeführt) ---
    if (O === H && traeger && s.ships[traeger]) {
      const j = eigeneJaeger()[0];
      if (!j && kaufStufe === 0) {
        const preis = kern.preis.preis(s, werft, 'jaeger', r); const kosten = preis + kern.handel.gebuehr(s, r, werft, preis);
        if ((s.stations[werft].lager.jaeger || 0) > 0 && s.owners[H].cash >= kosten + betrieb
          && sende({ type: 'shipTrade', owner: H, schiff: traeger, ware: 'jaeger', menge: 1, kauf: true })) kaufStufe = 1;
      } else if (!j && kaufStufe === 1) {
        if ((s.ships[traeger].ladung.jaeger || 0) > 0) {
          neuId = `sh${String(s.nextShip).padStart(3, '0')}`;
          if (sende({ type: 'shipActivate', owner: H, schiff: traeger, klasse: 'jaeger' })) kaufStufe = 2;
        } else kaufStufe = 0;
      } else if (j && kaufStufe === 2) {
        if (j.id !== neuId) throw new Error('aktivierter Jäger hat unerwartete ID');
        z.kaeufe += 1; kaufStufe = 0;
        if (sz.nullBudget && !nullBudgetGesetzt) {
          // Restkasse REAL an den Aldera-Fonds überweisen (Transfer, kein Verschwinden), damit < 1 Betriebsstunde bleibt.
          const rest = s.owners[H].cash - Math.floor(betrieb / 5); const f = r.world.systems.aldera.fonds;
          if (rest > 0) { s.owners[H].cash -= rest; s.owners[f].cash += rest; }
          nullBudgetGesetzt = true;
        }
        sende({ type: 'shipMove', owner: H, schiff: j.id, ziel: r.world.systems[SYS].station });
      } else if (j && j.phase === 'dock' && j.system === SYS && j.auftrag !== 'jagd') {
        // Befehl wird immer erneut erteilt: der Kern (nicht dieses Skript) muss fehlendes Budget abfangen.
        sende({ type: 'shipHunt', owner: H, schiff: j.id });
      }
    }
    // --- Beobachtung der Stunde ---
    const piratenVor = O ? Object.values(s.ships).filter((x) => x.owner === PIR && x.system === SYS).map((x) => [x.id, x.klasse]) : [];
    const jaeger = O ? eigeneJaeger().filter((x) => x.phase === 'dock' && x.system === SYS && x.auftrag === 'jagd') : [];
    z.staatBetriebSoll += Object.values(s.ships).filter((x) => x.owner === SEC && x.klasse === 'jaeger').length * betrieb;
    const k0 = s.stats.kopfgeld; const sec0 = s.stats.konto[SEC].erloes; const b0 = s.burned;
    kern.core.advance(s, STUNDE_TICKS, r);
    z.staatBetriebGezahlt += s.burned - b0;
    const dSec = s.stats.konto[SEC].erloes - sec0;
    z.staatKopfgeld += dSec; z.kopfgeldJaeger += (s.stats.kopfgeld - k0) - dSec;
    if (O && s.ereignisse.some((e) => e.tick > s.tick - STUNDE_TICKS && e.art === 'kosten' && e.owner === O
      && e.text.includes('automatisch gestoppt'))) z.autostopps += 1;
    if (z.staatKasseLeerAbStunde === null && s.owners[SEC].cash < betrieb) z.staatKasseLeerAbStunde = h;
    if (z.piratenLeerAbStunde === null && s.owners[PIR].cash < Math.min(...Object.values(r.combat.ersatzpreis))) z.piratenLeerAbStunde = h;
    if (jaeger.length > 0) {
      z.jagdStunden += 1; if (piratenVor.length > 0) z.jagdStundenMitBeute += 1;
      if (piratenVor.length === 0) z.jagdStundenOhneBeute += 1;
      for (const [pid, klasse] of piratenVor) if (!s.ships[pid]) {
        z.abschuesseJaeger[klasse] = (z.abschuesseJaeger[klasse] || 0) + 1;
        const beleg = { belegId: `abschuss:${seed}:${pid}`, tick: s.tick, system: SYS, piratKlasse: klasse,
          teilnehmer: [{ pilotId, schiffId: jaeger[0].id }] };
        if (abschussXpVergeben(reg, beleg).vergeben) z.belege += 1;
        if (!abschussXpVergeben(reg, beleg).vergeben) z.xpDoppelAbgelehnt += 1; // Wiederholung muss abgelehnt werden
      }
    }
    if (h % 24 === 23 && !kern.core.audit(s).ok) z.auditFehler += 1;
  }
  const a = kern.core.audit(s);
  const indienst = s.stats.indienst[O]?.jaeger ?? 0;
  return {
    seed, szenario: szenarioId, tage, auditOk: a.ok && z.auditFehler === 0, hash: kern.core.hash(s),
    minted: s.minted, burned: s.burned, nettoEmission: s.minted - s.burned,
    kopfgeldGesamt: s.stats.kopfgeld, abschuesse: { ...s.stats.abschuesse },
    piratenErsatz: s.stats.piratenErsatz, piratenKasseEnde: s.owners[PIR].cash,
    piratenAktivEnde: Object.values(s.ships).filter((x) => x.owner === PIR).length,
    piratenMarktKasseEnde: s.owners[r.world.piraten.markt].cash, staatKasseEnde: s.owners[SEC].cash,
    jaegerOwnerKasseEnde: O ? s.owners[O].cash : null, kernIndienstJaeger: indienst,
    verluste: structuredClone(s.stats.verluste), ...z,
    staatBetriebUnbezahlt: z.staatBetriebSoll - z.staatBetriebGezahlt,
    // Regel 14 belastet NPC-Jäger auch ohne Beute (nur der Spieler ist ausgenommen, index.html reise()).
    betriebOhneBeuteBerechnet: O && O !== H ? z.jagdStundenOhneBeute * betrieb : 0,
    pilot: O ? structuredClone(reg.piloten[pilotId]) : null, register: reg,
  };
}

// ---------------------------------------------------------------------------------------------
// 7. Pilotenfortschritt (VORSCHLAG, nicht beschlossen) – deterministisch, idempotent
// ---------------------------------------------------------------------------------------------
export const XP_VORSCHLAG = Object.freeze({
  status: 'VORSCHLAG – nicht beschlossen',
  // XP je belegtem Abschuss; proportional zur Klassenprämie/12, aber unabhängig von deren künftiger Höhe.
  abschussXp: Object.freeze({ pirat_klein: 10, pirat_mittel: 15, pirat_gross: 20 }),
  raenge: Object.freeze([
    Object.freeze({ rang: 0, name: 'Anwärter', abXp: 0 }),
    Object.freeze({ rang: 1, name: 'Pilot', abXp: 50 }),
    Object.freeze({ rang: 2, name: 'Jagdpilot', abXp: 150 }),
    Object.freeze({ rang: 3, name: 'Veteran', abXp: 400 }),
    Object.freeze({ rang: 4, name: 'Ass', abXp: 1000 }),
  ]),
  // Einziger Kampfbonus: Trefferwert +1 Prozentpunkt-Anteil je Rang (relativ, ganzzahlig), Deckel +4 %.
  trefferBonusProzentJeRang: 1, trefferBonusDeckelProzent: 4,
  // Gehaltszuschlag je Rang als Transfer vom Arbeitgeber (ISK/h); Deckel.
  gehaltZuschlagJeRang: 2, gehaltZuschlagDeckel: 8,
});

export const neuesPilotenRegister = () => ({ version: 1, piloten: {}, belege: {} });
export function pilotAnlegen(reg, { pilotId, art, arbeitgeber }) {
  if (typeof pilotId !== 'string' || !pilotId) throw new TypeError('pilotId fehlt');
  if (reg.piloten[pilotId]) return reg.piloten[pilotId];
  reg.piloten[pilotId] = { pilotId, art, arbeitgeber, xp: 0, abschuesse: {}, schiff: null, schiffsHistorie: [], verloreneSchiffe: 0 };
  return reg.piloten[pilotId];
}
export function pilotZuweisen(reg, pilotId, schiffId) {
  const p = reg.piloten[pilotId]; if (!p) throw new Error('unbekannter Pilot');
  p.schiff = schiffId; if (!p.schiffsHistorie.includes(schiffId)) p.schiffsHistorie.push(schiffId);
}
// Schiffsverlust löscht nur die Zuordnung, nie Erfahrung (Pilot rettet sich – Personenverlust wäre eigene Entscheidung).
export function schiffVerloren(reg, pilotId, schiffId) {
  const p = reg.piloten[pilotId]; if (!p || p.schiff !== schiffId) return false;
  p.schiff = null; p.verloreneSchiffe += 1; return true;
}
export function rangVon(xp) {
  let r = XP_VORSCHLAG.raenge[0];
  for (const x of XP_VORSCHLAG.raenge) if (xp >= x.abXp) r = x;
  return r;
}
// Beleg = ein vom Kern entfernter Pirat (eindeutige Schiff-ID) mit Teilnehmerliste der Jagdgruppe.
// Ganzzahlige Aufteilung; Rest an die nach pilotId sortierten ersten Teilnehmer. Doppelvergabe ausgeschlossen.
export function abschussXpVergeben(reg, beleg) {
  if (!beleg || typeof beleg.belegId !== 'string') throw new TypeError('Beleg ohne ID');
  if (reg.belege[beleg.belegId]) return { vergeben: false, grund: 'bereits vergeben' };
  const xp = XP_VORSCHLAG.abschussXp[beleg.piratKlasse];
  if (!Number.isSafeInteger(xp)) return { vergeben: false, grund: 'keine Piratenklasse' };
  const ids = [...new Set((beleg.teilnehmer || []).map((t) => t.pilotId))].sort();
  if (ids.length === 0 || ids.some((id) => !reg.piloten[id])) return { vergeben: false, grund: 'kein belegter Teilnehmer' };
  const je = Math.floor(xp / ids.length); let rest = xp - je * ids.length;
  const anteile = {};
  for (const id of ids) { anteile[id] = je + (rest > 0 ? 1 : 0); if (rest > 0) rest -= 1; }
  for (const id of ids) { const p = reg.piloten[id]; p.xp += anteile[id]; p.abschuesse[beleg.piratKlasse] = (p.abschuesse[beleg.piratKlasse] || 0) + 1; }
  reg.belege[beleg.belegId] = { tick: beleg.tick, klasse: beleg.piratKlasse, anteile };
  return { vergeben: true, anteile };
}
export function trefferMitBonus(trefferBasis, xp) {
  const p = Math.min(XP_VORSCHLAG.trefferBonusDeckelProzent, rangVon(xp).rang * XP_VORSCHLAG.trefferBonusProzentJeRang);
  return trefferBasis + Math.floor((trefferBasis * p) / 100);
}
// Speicherformat-VORSCHLAG (nicht produktiv): kanonisch, validiert, Rundreise stabil.
export function registerSpeichern(reg) {
  const sort = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
  return JSON.stringify({ version: reg.version, piloten: sort(reg.piloten), belege: sort(reg.belege) });
}
export function registerLaden(text) {
  const d = JSON.parse(text);
  if (!d || d.version !== 1) throw new Error('unbekannte Registerversion');
  const erlaubt = new Set(['version', 'piloten', 'belege']);
  for (const k of Object.keys(d)) if (!erlaubt.has(k)) throw new Error(`unerlaubtes Feld ${k}`);
  const summe = {};
  for (const b of Object.values(d.belege)) for (const [id, n] of Object.entries(b.anteile)) {
    if (!Number.isSafeInteger(n) || n < 0) throw new Error('ungültiger XP-Anteil'); summe[id] = (summe[id] || 0) + n; }
  for (const [id, p] of Object.entries(d.piloten)) {
    if (p.pilotId !== id || !Number.isSafeInteger(p.xp) || p.xp < 0) throw new Error(`ungültiger Pilot ${id}`);
    if ((summe[id] || 0) !== p.xp) throw new Error(`XP von ${id} nicht durch Belege gedeckt`);
  }
  return d;
}

// Bonuswirkung mit der echten Patrouillenfunktion messen (Regelkopie mit erhöhtem Jäger-Trefferwert).
export function bonusWirkung(kern, { system, rang, proben = 2000, jaeger = 1, owner = 'house' }) {
  const xp = XP_VORSCHLAG.raenge[rang].abXp;
  const r = regelKopie(kern.rules);
  r.combat.einheiten.jaeger.treffer = trefferMitBonus(kern.rules.combat.einheiten.jaeger.treffer, xp);
  return { rang, treffer: r.combat.einheiten.jaeger.treffer, stat: kampfStatistik(kern, { system, jaeger, owner, proben, rules: r }) };
}

// Gehalt / Pacht / Kopfgeldbeteiligung als reine Transfers. Fehlende Deckung erzeugt offenen Anspruch, kein Geld.
export function vertragsAbrechnung({ kopfgeld, stunden, betriebJeStunde, konzernKasse, pilotKasse = 0,
  modell, anteilPilotProzent = 0, pachtJeStunde = 0, gehaltJeStunde = 0, rangZuschlag = 0 }) {
  const k = { konzern: konzernKasse, pilot: pilotKasse, fonds: 0 };
  const start = k.konzern + k.pilot + k.fonds;
  const buchungen = []; let offenerAnspruch = 0;
  const tr = (von, nach, n, zweck) => { if (n <= 0) return 0; const m = Math.min(n, k[von]); k[von] -= m; k[nach] += m;
    if (m) buchungen.push({ von, nach, n: m, zweck }); return n - m; };
  let neu = 0;
  if (modell === 'konzernauftrag') {
    // Konzern besitzt Jäger, trägt Betrieb, erhält Kopfgeld (eine Quelle), zahlt Gehalt + Beteiligung.
    k.konzern += kopfgeld; neu += kopfgeld; buchungen.push({ von: 'kopfgeldquelle', nach: 'konzern', n: kopfgeld, zweck: 'kopfgeld' });
    offenerAnspruch += tr('konzern', 'fonds', betriebJeStunde * stunden, 'betrieb');
    offenerAnspruch += tr('konzern', 'pilot', (gehaltJeStunde + rangZuschlag) * stunden, 'gehalt');
    offenerAnspruch += tr('konzern', 'pilot', Math.floor((kopfgeld * anteilPilotProzent) / 100), 'kopfgeldbeteiligung');
  } else if (modell === 'pacht') {
    // Selbständiger Pilot pachtet Konzernschiff: erhält Kopfgeld, zahlt Betrieb und Pacht aus eigener Kasse.
    k.pilot += kopfgeld; neu += kopfgeld; buchungen.push({ von: 'kopfgeldquelle', nach: 'pilot', n: kopfgeld, zweck: 'kopfgeld' });
    offenerAnspruch += tr('pilot', 'fonds', betriebJeStunde * stunden, 'betrieb');
    offenerAnspruch += tr('pilot', 'konzern', pachtJeStunde * stunden, 'pacht');
  } else throw new Error('unbekanntes Vertragsmodell');
  const ende = k.konzern + k.pilot + k.fonds;
  return { modell, konten: k, buchungen, offenerAnspruch, bilanzOk: start + neu === ende,
    pilotNetto: k.pilot - pilotKasse, konzernNetto: k.konzern - konzernKasse };
}

// ---------------------------------------------------------------------------------------------
// 8. Später auszuführende Abnahmetests (ANFORDERUNG, hier NICHT ausgeführt)
// ---------------------------------------------------------------------------------------------
export const ABNAHME_SPEZIFIKATION = Object.freeze([
  { id: 'A1', titel: 'Piratenabschuss und einmaliges Kopfgeld', status: 'ANFORDERUNG' },
  { id: 'A2', titel: 'Finanzierter Piratenersatz (Hülle aus Ware, Preis aus Piratenkasse)', status: 'ANFORDERUNG' },
  { id: 'A3', titel: 'Zerstörter Konzernjäger und bezahlter Neukauf', status: 'ANFORDERUNG' },
  { id: 'A4', titel: 'Keine weitere Jagd bei fehlendem Betriebsbudget (Spieler UND NPC)', status: 'ANFORDERUNG' },
  { id: 'A5', titel: 'XP-/Save-/Load-Stabilität', status: 'ANFORDERUNG' },
  { id: 'A6', titel: '13 Seeds × 90 Tage inkl. 0-Kopfgeld- und Nullbudgetfällen', status: 'ANFORDERUNG' },
]);

// ---------------------------------------------------------------------------------------------
// 9. Gesamtbericht
// ---------------------------------------------------------------------------------------------
export function bericht(kern, { proben = 2000, tage = 90, seeds = SEEDS, szenarien = Object.keys(KERN_SZENARIEN) } = {}) {
  const ref = referenzwerte(kern);
  const kampf = [];
  for (const a of ref.anomalien) for (const n of [1, 2, 3]) for (const owner of [ref.spielerOwner, 'npc1'])
    kampf.push(kampfStatistik(kern, { system: a.system, jaeger: n, owner, proben }));
  const stunden = kampf.map((st) => stundenRechnung(ref, st));
  const gitter = [rentabilitaetsGitter(ref, { klasse: 'pirat_klein' }), rentabilitaetsGitter(ref, { klasse: 'pirat_gross' })];
  // Finanzierungsvarianten für Dravos (1 Jäger, Spielerfaktor und Faktor 1)
  const dr = kampf.find((k) => k.system === 'dravos' && k.jaeger === 1 && k.owner === ref.spielerOwner);
  const finanz = [];
  for (const faktor of [1, ref.kopfgeldFaktorSpieler]) for (const pb of Object.keys(PB_VARIANTEN)) for (const kg of Object.keys(KG_VARIANTEN))
    finanz.push(finanzierungsLauf(ref, { pb, kg, system: 'dravos', klasse: 'pirat_klein', faktor,
      nachfrageJe1000h: dr.abschuesseJe1000h, verlusteJe1000h: dr.jaegerVerlusteJe1000h,
      huellenLager: pb === 'PB2_werftkauf' ? 5 : 0, emissionsDeckel: 2000, stunden: tage * 24 }));
  const bonus = ref.anomalien.flatMap((a) => [0, 2, 4].map((rang) => bonusWirkung(kern, { system: a.system, rang, proben })));
  const kernlaeufe = [];
  for (const sz of szenarien) for (const seed of seeds) { const l = kernLauf(kern, seed, sz, { tage }); delete l.register; kernlaeufe.push(l); }
  // Vertragsbeispiele mit GEMESSENEN Kopfgeldraten (Dravos, 1 Jäger, NPC-Faktor 1) über 100 Jagdstunden,
  // plus leere Anomalie (0 Kopfgeld). Gehalt/Pacht/Anteil sind VORSCHLAGSWERTE, nicht beschlossen.
  const dravosNpc = kampf.find((k) => k.system === 'dravos' && k.jaeger === 1 && k.owner === 'npc1');
  const kg100 = dravosNpc.kopfgeldJeStunde * 100;
  const vertrag = (modell, kopfgeld, extra) => vertragsAbrechnung({ modell, kopfgeld, stunden: 100,
    betriebJeStunde: ref.jaeger.betriebJeStunde, ...extra });
  const vertraege = [
    { fall: 'Konzernauftrag, volle Anomalie', ...vertrag('konzernauftrag', kg100, { konzernKasse: 2000, gehaltJeStunde: 10, anteilPilotProzent: 10 }) },
    { fall: 'Konzernauftrag, leere Anomalie', ...vertrag('konzernauftrag', 0, { konzernKasse: 2000, gehaltJeStunde: 10, anteilPilotProzent: 10 }) },
    { fall: 'Pacht, volle Anomalie', ...vertrag('pacht', kg100, { konzernKasse: 0, pilotKasse: 500, pachtJeStunde: 10 }) },
    { fall: 'Pacht, leere Anomalie', ...vertrag('pacht', 0, { konzernKasse: 0, pilotKasse: 500, pachtJeStunde: 10 }) },
  ];
  return { kern: { htmlSha256: kern.htmlSha256, quelleSha256: kern.quelleSha256 }, ref, kampf, stunden, gitter, finanz, bonus,
    kernlaeufe, kernSumme: kernZusammenfassung(kernlaeufe), vertraege, abnahme: ABNAHME_SPEZIFIKATION, parameter: { proben, tage, seeds: [...seeds], szenarien } };
}

// Aggregation der Kernläufe je Szenario über alle Seeds (Summe, Minimum, Maximum).
export function kernZusammenfassung(kernlaeufe) {
  const felder = ['minted', 'burned', 'nettoEmission', 'kopfgeldGesamt', 'kopfgeldJaeger', 'staatKopfgeld', 'piratenErsatz',
    'piratenKasseEnde', 'piratenAktivEnde', 'kaeufe', 'jaegerVerloren', 'jagdStunden', 'jagdStundenMitBeute', 'autostopps',
    'staatBetriebSoll', 'staatBetriebGezahlt', 'staatBetriebUnbezahlt', 'betriebOhneBeuteBerechnet', 'jaegerOwnerKasseEnde', 'belege'];
  const out = {};
  for (const l of kernlaeufe) {
    const o = (out[l.szenario] ||= { seeds: 0, auditOk: 0, piratenLeerAbStunde: [], felder: {} });
    o.seeds += 1; if (l.auditOk) o.auditOk += 1;
    o.piratenLeerAbStunde.push(l.piratenLeerAbStunde);
    for (const f of felder) {
      const v = l[f] ?? 0; const x = (o.felder[f] ||= { summe: 0, min: v, max: v });
      x.summe += v; x.min = Math.min(x.min, v); x.max = Math.max(x.max, v);
    }
    const xp = l.pilot?.xp ?? 0; const x = (o.felder.pilotXp ||= { summe: 0, min: xp, max: xp });
    x.summe += xp; x.min = Math.min(x.min, xp); x.max = Math.max(x.max, xp);
  }
  return out;
}

function argument(name, standard) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : standard;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const kern = ladeKern();
  const proben = Number(argument('proben', '2000'));
  const tage = Number(argument('tage', '90'));
  const seedsArg = argument('seeds', 'alle');
  const seeds = seedsArg === 'alle' ? SEEDS : seedsArg.split(',').map(Number);
  const szArg = argument('szenarien', 'alle');
  const szenarien = szArg === 'alle' ? Object.keys(KERN_SZENARIEN) : szArg.split(',');
  const b = bericht(kern, { proben, tage, seeds, szenarien });
  const text = JSON.stringify(b, null, 1);
  if (process.argv.includes('--json')) { process.stdout.write(`${text}\n`); }
  else {
    const out = argument('out', '');
    if (out) fs.writeFileSync(out, text);
    console.log(`Kern sha256 ${b.kern.quelleSha256.slice(0, 16)} · Bericht sha256 ${SHA(text).slice(0, 16)}`);
    console.table(b.kampf.map((k) => ({ system: k.system, n: k.jaeger, owner: k.owner, kampf: k.kampfJe1000h, abschuss: k.abschuesseJe1000h,
      verlust: k.jaegerVerlusteJe1000h, kopfgeldH: k.kopfgeldJeStunde })));
    console.table(b.stunden.map((x) => ({ system: x.system, n: x.jaeger, owner: x.owner, f: x.faktor, nettoH: x.nettoJeStunde, x: x.einstufungBetreiber })));
    console.table(b.finanz.map((f) => ({ pb: f.pb, kg: f.kg, f: f.faktor, abschuss: f.abschuesse, respawn: f.piratenRespawns,
      ohneHuelle: f.respawnOhneHuelle, minted: f.neuGeschoepft, unbezahlt: f.kopfgeldUnbezahlt, netto: f.betreiberNetto, bilanz: f.bilanzOk, zul: f.zulaessig })));
    console.table(b.kernlaeufe.map((l) => ({ sz: l.szenario, seed: l.seed, audit: l.auditOk, minted: l.minted, burned: l.burned,
      kopfgeld: l.kopfgeldGesamt, jaegerKG: l.kopfgeldJaeger, staatUnbez: l.staatBetriebUnbezahlt, ersatz: l.piratenErsatz,
      pirKasse: l.piratenKasseEnde, kaeufe: l.kaeufe, verl: l.jaegerVerloren, jagdH: l.jagdStunden, beuteH: l.jagdStundenMitBeute,
      stopp: l.autostopps, xp: l.pilot?.xp ?? '-', kasse: l.jaegerOwnerKasseEnde })));
  }
}
