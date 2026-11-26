'use strict';
const assert = require('node:assert/strict');
const {abnahme} = require('./w6-gesamtpaket.cjs');
const {pruefen} = require('./w6-szenarien.cjs');

function haushaltsbudgets(welt, s, bericht) {
  const {bedarfJeTag, sparquote, sparquoteStandard} = s.kanon.politik;
  return Object.entries(bericht.haushalte).map(([id, konto]) => {
    const wohnort = welt.daten.haushalte[id];
    const preis = wohnort === 'st_nadir' ? welt.rules.w5n.wasserPreis : welt.daten.wasser.preisAldera;
    const frei = welt.haushaltVerfuegbar(s, id);
    const h = s.kanon.haushalte[id];
    const heute = h?.tag === bericht.tag ? h.heute : 0;
    const tagesrest = bedarfJeTag > 0 ? Math.max(0, bedarfJeTag - heute) : null;
    return {id, wohnort, ...konto, sparquote: sparquote[id] ?? sparquoteStandard, frei, tagesrest,
      ausEigenemGeld: Math.floor(konto.kasse / preis),
      automatikObergrenze: s.kanon.politik.automatik
        ? Math.min(Math.floor(frei / preis), tagesrest ?? Infinity) : 0};
  });
}

function wasserlogistik(welt, s, haushalte, firmen) {
  const {rules, daten} = welt;
  const quelle = rules.w5n.zielStation, ziel = rules.w5n.quellStation;
  const einkauf = rules.w5n.wasserPreis, verkauf = daten.wasser.preisAldera;
  const rueckfrachtTarif = daten.wasser.rueckfrachtJeEinheit;
  const rueck = welt.kern.route(rules.world, 'nadir', 'aldera').zeit;
  const hin = welt.kern.route(rules.world, 'aldera', 'nadir').zeit;
  const finanzierung = s.owners[ziel].cash;
  const lager = s.stations[ziel].lager.wasser;
  const bestand = s.stations[quelle].lager.wasser;
  const kapazitaet = Math.max(0, Math.min(rules.economy.cargo, bestand,
    daten.wasser.lagerAldera - lager, s.kanon.politik.wasserZielAldera - lager));
  const automatikAldera = haushalte.filter(h => h.wohnort === ziel)
    .reduce((summe, h) => summe + h.automatikObergrenze, 0);
  const zusatzabsatz = Math.max(0, automatikAldera - lager);
  const margenJeEinheit = verkauf - einkauf;
  const fahrten = [hin + rueck, rueck].map(minuten => {
    const lohn = minuten * rules.w5n.fliegerLohn;
    const wertverzehr = minuten * daten.verschleiss.milliJeMinute.frachter / 1000;
    const mindestfracht = Math.ceil(lohn + wertverzehr);
    const kostendeckendeMenge = margenJeEinheit > 0 ? Math.ceil(mindestfracht / margenJeEinheit) : null;
    const mitBestehendemTarif = Math.min(kapazitaet, Math.floor(finanzierung / (einkauf + rueckfrachtTarif)));
    const ohneFracht = Math.min(kapazitaet, Math.floor(finanzierung / einkauf));
    const mitVollerKostendeckung = Math.min(kapazitaet, Math.max(0, Math.floor((finanzierung - mindestfracht) / einkauf)));
    const absatzgestuetzteMenge = Math.min(kapazitaet, zusatzabsatz);
    return {minuten, lohn, wertverzehr, mindestfracht, kostendeckendeMenge,
      mitBestehendemTarif, ohneFracht, mitVollerKostendeckung,
      ergebnisSpeditionBestehenderTarif: mitBestehendemTarif * rueckfrachtTarif - mindestfracht,
      ergebnisGesamtBeiVollabsatzBestehendeVorfinanzierung: mitBestehendemTarif * margenJeEinheit - mindestfracht,
      ergebnisGesamtBeiVollabsatzKapazitaet: kapazitaet * margenJeEinheit - mindestfracht,
      absatzgestuetzteMenge,
      ergebnisGesamtBeiAktuellerAbsatzobergrenze: absatzgestuetzteMenge * margenJeEinheit - mindestfracht,
      kapitalszenarien: [...new Set([kostendeckendeMenge, kapazitaet])]
        .filter(menge => menge > 0 && menge <= kapazitaet).map(menge => ({
          menge, warenkapital: menge * einkauf, mitLohn: menge * einkauf + lohn,
          mitVollkosten: menge * einkauf + mindestfracht,
          alderaFehlbetrag: Math.max(0, menge * einkauf + mindestfracht - finanzierung),
          erloesNurBeiVollabsatz: menge * verkauf,
          erforderlicherAbsatz: Math.ceil((menge * einkauf + mindestfracht) / verkauf),
          maximalerVerlustOhneAbsatzVorRestwert: menge * einkauf + mindestfracht,
        }))};
  });
  const flotte = Object.values(s.ships)
    .filter(sh => ['house', 'transport'].includes(sh.owner) && sh.klasse === 'frachter' && !welt.stillgelegt(s, sh.id))
    .map(sh => {
      const station = sh.system === 'aldera' ? ziel : quelle;
      const minuten = sh.system === 'aldera' ? hin + rueck : rueck;
      const routeVorhanden = ['aldera', 'nadir'].includes(sh.system);
      const restminuten = welt.restAktivminuten(s, sh.id);
      const dockFrei = sh.phase === 'dock' && sh.auftrag === 'halten'
        && welt.flugKern.angedocktAn(sh, station) && Object.values(sh.ladung).every(menge => menge === 0);
      return {id:sh.id, eigentuemer:sh.owner, system:sh.system, dockFrei, restminuten,
        zeitlichEinsatzbereit: routeVorhanden && dockFrei && (restminuten === null || restminuten >= minuten)};
    });
  const moeglicheVorfinanzierer = ['house', 'transport'].map(id => {
    const {kasse, ruecklage} = firmen[id];
    const betriebsreserve = s.kanon.politik.betriebsreserve[id] ?? 0;
    return {id, kasse, ruecklage, betriebsreserve,
      ueberschussVorKreditausfallrisiko: Math.max(0, kasse - ruecklage - betriebsreserve)};
  });
  return {bestand, lager, kapazitaet, finanzierung, einkauf, verkauf, rueckfrachtTarif,
    moeglicheVorfinanzierer,
    alderaAutomatikObergrenze: automatikAldera, bestaetigteBestellmenge: 0, fahrten, flotte,
    aktiverF4: Boolean(s.w5n.frachtauftrag), aktiverW3: Boolean(s.w3.auftrag)};
}

function originalproben(welt, original, bericht) {
  const save = welt.save(original);
  const probe = (befehl, folge) => {
    const s = welt.load(save);
    const ergebnis = welt.execute(s, befehl);
    if (!ergebnis.ok) {
      assert.equal(welt.save(s), save);
      return {befehl, ...ergebnis};
    }
    assert.deepEqual(pruefen(welt, s), []);
    const danach = welt.save(s);
    assert.equal(welt.save(welt.load(danach)), danach);
    const kassenbewegung = Object.fromEntries(Object.entries(s.owners)
      .filter(([id, o]) => o.cash !== original.owners[id]?.cash)
      .map(([id, o]) => [id, o.cash - (original.owners[id]?.cash ?? 0)]));
    return {befehl, ...ergebnis, kassenbewegung, hash:welt.hash(s), ...(folge ? folge(s) : {})};
  };
  const kaeufer = 'house';
  const ausschuettbar = bericht.firmen[kaeufer].ausschuettbar;
  const investitionen = [
    ['st_nadir', 'jaeger'], ['st_nadir', 'frachter'], ['st_aldera', 'miner'],
  ].map(([station, klasse]) => probe({type:'shipBuy', owner:kaeufer, station, klasse}, s => {
    const schiff = Object.values(s.ships).find(sh => sh.owner === kaeufer && !original.ships[sh.id]);
    assert.ok(schiff);
    const folgebefehl = klasse === 'frachter'
      ? {type:'shipReposition', owner:kaeufer, schiff:schiff.id}
      : {type:'shipShuttle', owner:kaeufer, schiff:schiff.id, ware:'erz'};
    const vor = welt.save(s);
    const folgeversuch = klasse === 'jaeger' ? null : welt.execute(s, folgebefehl);
    if (folgeversuch?.ok) {
      assert.deepEqual(pruefen(welt, s), []);
      if (klasse === 'frachter') {
        const {zeit} = welt.kern.route(welt.rules.world, 'nadir', 'aldera');
        welt.advance(s, zeit);
        assert.deepEqual(pruefen(welt, s), []);
        assert.equal(s.ships[schiff.id].system, 'aldera');
        const amDock = welt.save(s);
        const fracht = welt.execute(s, {type:'shipFreightIce', owner:kaeufer, schiff:schiff.id});
        if (!fracht.ok) assert.equal(welt.save(s), amDock);
        else assert.deepEqual(pruefen(welt, s), []);
        return {schiff:schiff.id, folgeversuch, fracht};
      }
    } else assert.equal(welt.save(s), vor);
    return {schiff:schiff.id, folgeversuch};
  }));
  const ausgabe = {
    konsum: probe({type:'householdBuy', owner:'pilot_house', menge:1}),
    dividende: ausschuettbar === 0 ? null : probe({type:'dividendPay', owner:kaeufer, betrag:ausschuettbar},
      s => ({neuesAutomatikbudget:welt.haushaltVerfuegbar(s, welt.daten.anteile[kaeufer])})),
    investitionen,
  };
  assert.equal(welt.save(original), save);
  return ausgabe;
}

function geldumlauf(welt, s) {
  const bericht = welt.bericht(s);
  const haushalte = haushaltsbudgets(welt, s, bericht);
  const kassen = Object.fromEntries(Object.entries(s.owners).filter(([, o]) => o.cash).map(([id, o]) => [id, o.cash]));
  const {house, pilot_house, eigner_house} = kassen;
  return {kassen, anteilHausUndPilot: ((house ?? 0) + (pilot_house ?? 0)) / bericht.weltgeld,
    privateHauskasse: (pilot_house ?? 0) + (eigner_house ?? 0),
    haushalte, firmen:bericht.firmen, loehne:bericht.loehne, verkaeufe:bericht.verkaeufe,
    dividenden:bericht.dividenden, ersatzkaeufe:bericht.ersatzkaeufe,
    wasser:wasserlogistik(welt, s, haushalte, bericht.firmen),
    originalproben:originalproben(welt, s, bericht)};
}

function forschung(id, tage, seed) {
  return abnahme(id, tage, seed, 'gesamt', true, geldumlauf);
}

module.exports = {forschung, geldumlauf};
if (require.main === module) {
  const [id, tage, seed] = process.argv.slice(2);
  console.log(JSON.stringify(forschung(id, Number(tage), Number(seed))));
}
