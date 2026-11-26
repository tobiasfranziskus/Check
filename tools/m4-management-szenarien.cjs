/* M4 #575. Regel204-U7/U8 und Standardkontrolle mit gleichen Spielerentscheidungen.
 * node tools/m4-management-szenarien.cjs S02 730 42
 * node tools/m4-management-szenarien.cjs vergleich 90 42
 */
'use strict';
const assert = require('node:assert/strict');
const J8 = require('../prototypes/verbund/konzern-session.js');
const W5 = require('../prototypes/w5ac/session.js');
const {erstellenW6Gesamtwirtschaft} = require('../prototypes/welt/welt-kern.js');
const {SZENARIEN, pruefen} = require('./w6-szenarien.cjs');
const MINUTEN_PRO_TAG = 1440;

function stand(welt, s) {
  const b = welt.bericht(s);
  const kassen = Object.fromEntries(Object.entries(s.owners).map(([id, o]) => [id, o.cash]));
  return structuredClone({
    tick: s.tick, hash: welt.hash(s), weltgeld: b.weltgeld, gebunden: b.gebunden, kassen,
    lager: Object.fromEntries(Object.entries(s.stations).map(([id, x]) => [id, {...x.lager}])),
    haushalte: b.haushalte, firmen: b.firmen, mint: s.minted, burn: s.burned,
    stationsrechnung: stationsrechnung(welt, s, b),
    ersatzkaeufe: b.ersatzkaeufe, schiffskaufbelege: s.w5ad.purchases,
    produktion: b.produktion, auftraege: b.auftraege, loehne: {...b.loehne,
      raffinerie: s.w4.gezahlt, werft: s.w5.arbeitsGezahlt, ueberfuehrung: s.w5ac.paid},
    fracht: {
      eis: {tarif: s.w5n.frachtUmsatz, lohn: s.w5n.frachtLohn},
      erz: s.w5ad.freight.map(x => ({...x})),
      wasserTarif: Object.fromEntries(Object.entries(s.kanon.buch.summen)
        .filter(([key]) => key.startsWith('rueckfracht|'))),
      eisHaus: s.kanon.spielerFrachten?.auftraege || []
    },
    aktiveAuftraege: {w3: s.w3.auftrag, eis: s.w5n.frachtauftrag, wasser: s.kanon.rueckfracht,
      w1: s.erzpilotVertraege, w4: s.w4.auftrag, w5: s.w5.auftrag, k7: {...s.kanon.industrieErz}, transfer: s.w5ac.active},
    huellen: b.schiffe.map(x => ({...x, system: s.ships[x.id].system, flug: s.ships[x.id].flug.lage, ladung: s.ships[x.id].ladung})),
    ueberfuehrungen: s.w5ac.completed,
    werftkaeufe: s.kanon.spielerFrachterKaeufe?.filter(x => x.station === 'st_nadir') || [],
    kaeuferWerftschiffe: s.w5.schiffIds.map(id => [id, s.ships[id]?.owner]),
    stilllegungen: b.schiffe.filter(x => x.stillgelegt).map(x => x.id)
  });
}

function verwaltung(welt, s, zahlen, wasserErlaubt, eisErlaubt = null) {
  const gesamt = s.kanon.w6Gesamtwirtschaft === true;
  const k = s.kanon, haus = Object.values(s.ships).filter(sh => sh.owner === 'house');
  const i = k.industrieErz, a = s.w3.auftrag;
  const versuch = (type, daten = {}) => {
    const r = welt.execute(s, {type, owner:'house', ...daten});
    const key = r.ok ? type : type + ' · ' + r.reason;
    zahlen[key] = (zahlen[key] || 0) + 1;
    return r.ok;
  };
  if (i.phase === 'angebot' && i.carrier === 'house') {
    if (!i.signFracht && !versuch('industrialOreAcceptFreight')) return;
    welt.advance(s, 1);
    if (wasserErlaubt && s.w3.auftrag?.carrier === 'house') {
      versuch('industrialWaterAcceptBackhaul', {schiff: i.frachter});
    } else if (!s.w3.auftrag) {
      zahlen['Käufer hat nach Zustimmung nicht gebucht'] = (zahlen['Käufer hat nach Zustimmung nicht gebucht'] || 0) + 1;
    }
    return;
  }
  if (welt.industrieAngebotslage && !a) {
    const q = welt.industrieAngebotslage(s);
    const grund = q.grund || 'Angebotsprüfung beim nächsten Tick';
    zahlen[grund] = (zahlen[grund] || 0) + 1;
  }
  if (a?.phase === 'vorbestellt' && a.industrieMiner && welt.stillgelegt(s, a.industrieMiner)) {
    const grund = 'Erzbeschaffung blockiert: gebundener Miner stillgelegt';
    zahlen[grund] = (zahlen[grund] || 0) + 1;
  }
  if (a || s.w5ac.active || s.w5n.frachtauftrag) return;
  const nadir = s.stations.st_nadir.lager, alder = s.stations.st_aldera.lager;
  const rundfahrt = 2 * welt.rules.w5n.flugMinuten;
  const rest = sh => welt.restAktivminuten(s, sh.id) ?? Infinity;
  const frachter = haus.filter(sh => sh.klasse === 'frachter' && !welt.stillgelegt(s, sh.id)
    && (!gesamt || rest(sh) >= rundfahrt + (sh.system === 'nadir' ? welt.rules.w5n.flugMinuten : 0)));
  if (gesamt) frachter.sort((a,b) => rest(b)-rest(a));
  const nadirFrachter = frachter.find(sh => sh.system === 'nadir' && s.w5.schiffIds.includes(sh.id));
  if (nadirFrachter && versuch('shipReposition', {schiff: nadirFrachter.id})) return;
  // Buy a first working hull or replace a failed one, using physical stock.
  // Voluntary house deferral from U9k. The last hull stays on the open market.
  const npc = gesamt && nadir.frachter === 1 ? Object.values(s.ships).filter(sh =>
    sh.owner === 'transport' && sh.klasse === 'frachter' && rest(sh) > 0) : [];
  const r = welt.rules, preis = r.w5.verkaufsPreis;
  const npcBudget = preis + r.w5n.flugMinuten*r.w5Transfer.lohnJeMinute + rundfahrt*r.w3.arbeitJeMinute;
  const npcFaellig = npc.length === 0 || (npc.length === 1 && welt.buchwert(s,npc[0].id)*100 <= preis*s.kanon.politik.ersatzVorlaufProzent);
  const aufschub = gesamt && s.kanon.politik.ersatzkauf && nadir.frachter === 1 &&
    npcFaellig && s.owners.transport.cash >= npcBudget;
  if (aufschub && frachter.length === 0)
    zahlen['Hauskauf freiwillig zurückgestellt'] = (zahlen['Hauskauf freiwillig zurückgestellt'] || 0) + 1;
  if (!aufschub && nadir.frachter > 0 && frachter.length === 0 &&
      versuch('shipBuy', {station: 'st_nadir', klasse: 'frachter'})) return;
  if (frachter.length === 0 && alder.frachter > 0 &&
      versuch('shipBuy', {station: 'st_aldera', klasse: 'frachter'})) return;
  const miner = haus.find(sh => sh.klasse === 'miner' && !welt.stillgelegt(s, sh.id));
  const meridianMinerFaellig = gesamt && s.kanon.politik.ersatzkauf && s.kanon.politik.stilllegung &&
    alder.miner === 1 && !Object.values(s.ships).some(sh=>sh.owner==='npc3' &&
      sh.klasse==='miner' && sh.system==='aldera' && welt.buchwert(s,sh.id)*100 >
        r.economy.waren.miner.basis*s.kanon.politik.ersatzVorlaufProzent);
  if (!miner && !meridianMinerFaellig && alder.miner > 0 &&
      versuch('shipBuy', {station:'st_aldera', klasse:'miner'})) return;
  if (miner && miner.system === 'aldera' && !k.pendel[miner.id] && miner.flug?.lage === 'angedockt')
    versuch('shipShuttle', {schiff: miner.id, ware: 'eis'});
  // Prefer a bought Nadir hull for a genuinely executable follow-up.
  const kandidatin = frachter.filter(sh => sh.system === 'aldera' && sh.flug?.lage === 'angedockt')
    .sort((x, y) => Number(s.w5.schiffIds.includes(y.id)) - Number(s.w5.schiffIds.includes(x.id)))[0];
  if (kandidatin && (!eisErlaubt || eisErlaubt(welt, s, kandidatin)))
    versuch('shipFreightIce', {schiff: kandidatin.id});
}

function kontrollstand(welt, s) {
  assert.deepEqual(pruefen(welt, s), []);
  const text = welt.save(s), probe = welt.load(text);
  assert.equal(welt.save(probe), text);
  const standJetzt = stand(welt, s), a = s.w3.auftrag;
  if (a?.phase === 'vorbestellt' && a.industrieMiner && welt.stillgelegt(s, a.industrieMiner)) {
    // Check existing law on a disposable branch. The manager does not speak for Nadir.
    const r = welt.execute(probe, {type:'industrialOreCancel', owner:'st_nadir'});
    if (r.ok) assert.deepEqual(pruefen(welt, probe), []);
    else assert.equal(welt.save(probe), text);
    standJetzt.stornoProbeNadir = {ok:r.ok, grund:r.reason ?? null};
  }
  return standJetzt;
}

function beobachten(welt, s, ziel, rueckladungen) {
  while (s.tick < ziel && s.w3.auftrag) {
    welt.advance(s, 1);
    ankunftErfassen(s, rueckladungen);
  }
  welt.advance(s, ziel - s.tick);
}

function ankunftErfassen(s, rueckladungen) {
  const a = s.w3.auftrag;
  if (a?.phase !== 'rueck' || s.ships[a.schiff].ankunft - a.zeit !== s.tick) return;
  const rueck = s.kanon.rueckfracht;
  rueckladungen.push({start:a.start, schiff:a.schiff, carrier:a.carrier ?? 'transport',
    ankunftNadir:s.tick, wasser:rueck?.art==='erz' ? rueck.menge : 0,
    tarif:rueck?.art==='erz' ? rueck.gebuehr : 0, zustimmung:a.wasserZustimmung===true});
}

function start(szenario, seed, forschung, startpfad, siliziumAktiv = true) {
  const original = J8.erstellen();
  original.starten195(W5.create(seed, 'private195').export(), true);
  const w = original.weltReferenz(), z = original.zustandReferenz();
  w.politikSetzen(z, szenario.politik);
  if (startpfad === 'k7') assert.ok(w.industrieAutoSetzen(z, true).ok);
  if (startpfad === 'konzerne') {
    w.npcAutoSetzen(z, true);
    assert.equal(w.npcSiliziumSetzen(z, siliziumAktiv).ok,true);
  }
  const quelle = original.exportieren(), quellhash = original.ansicht().hash;
  const sitzung = J8.erstellen();
  if (forschung) sitzung.oeffnenU7U8(quelle, true);
  else sitzung.oeffnen204(quelle, true);
  let welt = sitzung.weltReferenz(), s = welt.load(sitzung.exportieren());
  if (forschung === 'gesamt') {
    const {carrierCash,buyerCash} = s.w5ad.profile;
    welt = erstellenW6Gesamtwirtschaft({carrierCash,buyerCash});
    s.kanon.w6Gesamtwirtschaft = true;
    s = welt.load(JSON.stringify(s));
  }
  // In the S02 career, leave the first five hour steps to the real NPC market.
  const industrieRueckladungen = [];
  if (startpfad === 'konzerne') {
    while (s.tick < 300) {
      welt.advance(s, 1);
      ankunftErfassen(s, industrieRueckladungen);
    }
  }
  assert.equal(original.exportieren(), quelle);
  return {welt, s, quellhash, industrieRueckladungen};
}

function marktS02() {
  return start(SZENARIEN.find(x => x.id === 'S02'), 42, true, 'konzerne');
}

// Cash flow over each actual station process, including cash tied in unsold stock.
function stationsrechnung(welt, s, bericht) {
  const {w5n, w3} = welt.rules;
  const wasser = s.kanon.wasser;
  const einkaufAldera = wasser.rueckGeladen *
    (w5n.wasserPreis + welt.daten.wasser.rueckfrachtJeEinheit);
  const einzelhandelAldera = wasser.verkauftAldera * welt.daten.wasser.preisAldera;
  const wasserUmsatzNadir = (wasser.verkauftNadir + wasser.rueckGeladen) * w5n.wasserPreis;
  const eisEinkauf = s.w5n.eisTransferWert;
  const eisFracht = s.w5n.frachtUmsatz;
  const werkLohn = s.w5n.fabrikBezahlt;
  const erzEinkauf = s.w3.geliefert * welt.rules.erzpilot.preis;
  const erzFracht = s.w3.frachtUmsatz;
  assert.equal(w3.kunde, w5n.zielStation);
  return {
    alderaWasser: {einkauf: einkaufAldera, einzelhandel: einzelhandelAldera,
      kassenbeitrag: einzelhandelAldera - einkaufAldera},
    nadirWasser: {umsatz: wasserUmsatzNadir, eisEinkauf, eisFracht, werkLohn,
      kassenbeitrag: wasserUmsatzNadir - eisEinkauf - eisFracht - werkLohn},
    nadirErzMaterial: {erzEinkauf, erzFracht, raffinierLohn: s.w4.gezahlt,
      materialUmsatz: s.w5.materialUmsatz,
      kassenbeitrag: s.w5.materialUmsatz - erzEinkauf - erzFracht - s.w4.gezahlt},
    verbrauchWasser: s.ledger.wasser.consumed,
    haushaltskaufWasser: Object.values(bericht.haushalte).reduce((n, h) => n + h.gekauft, 0),
  };
}

// Match physical return receipts by ship and departure. Station inventories are fungible,
// so subsequent retail/production revenue cannot be booked to a specific delivery.
function transportBilanz(welt, s, rueckladungen) {
  const {w3, w5n} = welt.rules;
  return s.w5ad.freight.map(fahrt => {
    const wasser = rueckladungen.find(r => r.schiff === fahrt.id && r.start === fahrt.start);
    assert.ok(wasser, 'Für jede abgeschlossene W3-Fahrt muss die Nadir-Ankunft erfasst sein');
    const menge = wasser.wasser;
    const erzKauf = fahrt.amount * welt.rules.erzpilot.preis;
    const wasserKauf = menge * w5n.wasserPreis;
    const wasserFracht = wasser.tarif;
    const hinUndRueckVerschleiss = 2 * w5n.flugMinuten *
      welt.daten.verschleiss.milliJeMinute.frachter / 1000;
    return {
      schiff: fahrt.id, carrier: fahrt.owner ?? w3.spedition, end: fahrt.end,
      erz: fahrt.amount, wasser: menge,
      nadirErzKaeufer: {zahlung: erzKauf + fahrt.fee, erhaltenesErz: fahrt.amount},
      alderaErzVerkaeufer: {erloes: erzKauf, w1Wareneinkauf: erzKauf, handelsmarge: 0},
      alderaWasserKaeufer: {zahlung: wasserKauf + wasserFracht,
        margeBeiVollstaendigemAbsatz: menge * welt.daten.wasser.preisAldera - wasserKauf - wasserFracht},
      nadirWasserVerkaeufer: {warenerloes: wasserKauf},
      spedition: {erzTarif: fahrt.fee, wasserTarif: wasserFracht, lohn: fahrt.work,
        operativerUeberschuss: fahrt.fee + wasserFracht - fahrt.work,
        wertverzehr: hinUndRueckVerschleiss,
        deckungsbeitragNachWertverzehr: fahrt.fee + wasserFracht - fahrt.work - hinUndRueckVerschleiss},
    };
  });
}

const VERGLEICH = [
  [{id:'Standard', politik:{}}, 'direkt'],
  [{id:'K7', politik:{}}, 'k7'],
  [SZENARIEN.find(x => x.id === 'S02'), 'konzerne'],
];

function lauf(szenario, tage, seed, forschung, startpfad = 'konzerne', beobachter = null, siliziumAktiv = true, eisErlaubt = null, abschluss = null) {
  const {welt: originalWelt, s, quellhash, industrieRueckladungen} = start(szenario, seed, forschung, startpfad, siliziumAktiv);
  // Optional offline audit. Default path and manager decisions stay identical.
  const welt = beobachter ? {...originalWelt, advance(state, minuten) {
    if (state !== s) return originalWelt.advance(state, minuten);
    for (let i = 0; i < minuten; i++) {
      originalWelt.advance(state, 1);
      beobachter(originalWelt, state, 'minute');
    }
  }} : originalWelt;
  if (beobachter) beobachter(originalWelt, s, 'start');
  const entscheidungen = {};
  let ersterStillstand = null;
  const beginn = kontrollstand(welt, s), verlauf = [];
  for (let tag = 1; tag <= tage; tag++) {
    const ende = tag * MINUTEN_PRO_TAG;
    while (s.tick < ende) {
      const naechsterTermin = Math.min(s.tick + 60, ende);
      if (beobachter) beobachter(originalWelt, s, 'vorVerwaltung');
      verwaltung(welt, s, entscheidungen, szenario.id !== 'S08', eisErlaubt);
      if (beobachter) beobachter(originalWelt, s, 'nachVerwaltung');
      beobachten(welt, s, naechsterTermin, industrieRueckladungen);
      const a = s.w3.auftrag;
      if (!ersterStillstand && a?.phase === 'vorbestellt' && welt.stillgelegt(s, a.industrieMiner)) {
        const probe = welt.load(welt.save(s));
        const vor = welt.save(probe);
        const storno = welt.execute(probe, {type:'industrialOreCancel', owner:'st_nadir'});
        if (!storno.ok) assert.equal(welt.save(probe), vor);
        ersterStillstand = {
          beobachtet: s.tick, miner: a.industrieMiner, ore: s.ships[a.industrieMiner].ladung.erz || 0,
          treuhand: Object.fromEntries(['w3_kauf_treuhand','w3_arbeit_treuhand','k7_werft_treuhand']
            .map(id => [id, s.owners[id].cash])), storno,
        };
      }
    }
    if ([7, 30, 90, 365, 730, tage, ...(forschung === 'gesamt' ? [tage-30, tage-7] : [])].includes(tag))
      verlauf.push({tag, ...kontrollstand(welt, s), entscheidungen: {...entscheidungen},
        ersterStillstand, rentabilitaet: transportBilanz(welt, s, industrieRueckladungen),
        industrieRueckladungen: industrieRueckladungen.map(x => ({...x,
          ankunftAldera: s.w5ad.freight.find(y => y.id === x.schiff && y.start === x.start)?.end ?? null}))});
    else if (tag % 7 === 0) assert.deepEqual(pruefen(welt, s), []);
  }
  if (abschluss) abschluss(welt,s);
  const ende = verlauf.at(-1);
  const folgefahrten = ende.werftkaeufe.flatMap(kauf => {
    const transfer = ende.ueberfuehrungen.find(x => x.id === kauf.id && x.owner === 'house');
    if (!transfer) return [];
    return [
      ...ende.fracht.eisHaus.filter(x => x.schiff === kauf.id && x.start >= transfer.ankunft && x.end !== null)
        .map(x => ({schiff:kauf.id, ware:'eis', start:x.start, geliefert:x.geliefert, ende:x.end, menge:x.menge,
          tarif:x.fracht, lohn:x.arbeit})),
      ...ende.fracht.erz.filter(x => x.id === kauf.id && x.start >= transfer.ankunft)
        .map(x => ({schiff:kauf.id, ware:'erz', start:x.start, ende:x.end, menge:x.amount, tarif:x.fee, lohn:x.work}))
    ];
  });
  const ergebnis = !forschung ? 'STANDARDKONTROLLE'
    : !s.w3.abgeschlossen ? 'BLOCKED_OHNE_INDUSTRIEFRACHT'
    : !ende.werftkaeufe.length ? 'BLOCKED_OHNE_HAUS_WERFTKAUF'
    : !folgefahrten.length ? 'BLOCKED_OHNE_FOLGEAUFTRAG'
    : 'WERFTKAUF_MIT_FOLGEAUFTRAG';
  return {szenario:szenario.id, seed, profil:forschung === 'gesamt' ? 'W6 Gesamtwirtschaft' : forschung ? 'U7/U8' : '204', startpfad,
    tage, ergebnis, quellhash, starthash:beginn.hash, folgefahrten, verlauf};
}

module.exports = {lauf, start, marktS02, VERGLEICH};
if (require.main === module) {
  const [wahl = 'S02', dauer = '90', anfang = '42', profil = 'paar', startpfad = 'konzerne'] = process.argv.slice(2);
  const tage = Number(dauer), seed = Number(anfang);
  if (wahl === 'vergleich') {
    assert.ok(Number.isSafeInteger(tage) && tage >= 1 && Number.isSafeInteger(seed));
    for (const [szenario, pfad] of VERGLEICH) {
      for (const forschung of [false, true]) {
        const a = lauf(szenario, tage, seed, forschung, pfad);
        assert.deepEqual(lauf(szenario, tage, seed, forschung, pfad), a);
        console.log(JSON.stringify(a));
      }
    }
    process.exit(0);
  }
  const szenarien = SZENARIEN.filter(x => wahl === 'alle' || x.id === wahl);
  assert.ok(szenarien.length && Number.isSafeInteger(tage) && tage >= 1 &&
    Number.isSafeInteger(seed) && ['paar', 'u7', 'standard', 'gesamt'].includes(profil) && ['konzerne', 'direkt'].includes(startpfad), 'Ungültige Laufparameter');
  for (const sz of szenarien) {
    if (profil !== 'standard') console.log(JSON.stringify(lauf(sz, tage, seed, profil === 'gesamt' ? 'gesamt' : true, startpfad)));
    if (['paar','standard'].includes(profil)) console.log(JSON.stringify(lauf(sz, tage, seed, false, startpfad)));
  }
}
