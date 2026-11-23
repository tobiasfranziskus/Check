/* M4 #575. Regel204-U7/U8 und Standardkontrolle mit gleichen Spielerentscheidungen.
 * node tools/m4-management-szenarien.cjs S02 730 42
 * node tools/m4-management-szenarien.cjs alle 90 42 u7 konzerne
 */
'use strict';
const assert = require('node:assert/strict');
const J8 = require('../prototypes/verbund/konzern-session.js');
const W5 = require('../prototypes/w5ac/session.js');
const {SZENARIEN, pruefen} = require('./w6-szenarien.cjs');
const MINUTEN_PRO_TAG = 1440;

function stand(welt, s) {
  const b = welt.bericht(s);
  const kassen = Object.fromEntries(Object.entries(s.owners).map(([id, o]) => [id, o.cash]));
  return structuredClone({
    tick: s.tick, hash: welt.hash(s), weltgeld: b.weltgeld, gebunden: b.gebunden, kassen,
    lager: Object.fromEntries(Object.entries(s.stations).map(([id, x]) => [id, {...x.lager}])),
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

function verwaltung(welt, s, zahlen, wasserErlaubt) {
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
  const frachter = haus.filter(sh => sh.klasse === 'frachter' && !welt.stillgelegt(s, sh.id));
  const nadirFrachter = frachter.find(sh => sh.system === 'nadir' && s.w5.schiffIds.includes(sh.id));
  if (nadirFrachter && versuch('shipReposition', {schiff: nadirFrachter.id})) return;
  // One additional working hull at most. Purchase only from physical stock.
  if (nadir.frachter > 0 && frachter.length < 2 &&
      versuch('shipBuy', {station: 'st_nadir', klasse: 'frachter'})) return;
  if (frachter.length === 0 && alder.frachter > 0 &&
      versuch('shipBuy', {station: 'st_aldera', klasse: 'frachter'})) return;
  const miner = haus.find(sh => sh.klasse === 'miner' && !welt.stillgelegt(s, sh.id));
  if (!miner && alder.miner > 0 && versuch('shipBuy', {station:'st_aldera', klasse:'miner'})) return;
  if (miner && miner.system === 'aldera' && !k.pendel[miner.id] && miner.flug?.lage === 'angedockt')
    versuch('shipShuttle', {schiff: miner.id, ware: 'eis'});
  // Prefer a bought Nadir hull for a genuinely executable follow-up.
  const kandidatin = frachter.filter(sh => sh.system === 'aldera' && sh.flug?.lage === 'angedockt')
    .sort((x, y) => Number(s.w5.schiffIds.includes(y.id)) - Number(s.w5.schiffIds.includes(x.id)))[0];
  if (kandidatin) versuch('shipFreightIce', {schiff: kandidatin.id});
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

function start(szenario, seed, forschung, startpfad) {
  const original = J8.erstellen();
  original.starten195(W5.create(seed, 'private195').export(), true);
  const w = original.weltReferenz(), z = original.zustandReferenz();
  w.politikSetzen(z, szenario.politik);
  if (startpfad === 'konzerne') {
    w.npcAutoSetzen(z, true);
    w.npcSiliziumSetzen(z, true);
  }
  const quelle = original.exportieren(), quellhash = original.ansicht().hash;
  const sitzung = J8.erstellen();
  if (forschung) sitzung.oeffnenU7U8(quelle, true);
  else sitzung.oeffnen204(quelle, true);
  const welt = sitzung.weltReferenz(), s = welt.load(sitzung.exportieren());
  // In the S02 career, leave the first five hour steps to the real NPC market.
  if (startpfad === 'konzerne') welt.advance(s, 300);
  assert.equal(original.exportieren(), quelle);
  return {welt, s, quellhash};
}

function marktS02() {
  return start(SZENARIEN.find(x => x.id === 'S02'), 42, true, 'konzerne');
}

function lauf(szenario, tage, seed, forschung, startpfad = 'konzerne', versuch = null) {
  let {welt, s, quellhash} = start(szenario, seed, forschung, startpfad);
  if(versuch?.weltFabrik){
    const json=welt.save(s),hash=welt.hash(s);
    welt=versuch.weltFabrik(s.w5ad.profile);
    s=welt.load(json);assert.equal(welt.hash(s),hash);
  }
  const entscheidungen = {}, industrieRueckladungen = [];
  const beginn = kontrollstand(welt, s), verlauf = [];
  for (let tag = 1; tag <= tage; tag++) {
    const ende = tag * MINUTEN_PRO_TAG;
    while (s.tick < ende) {
      const naechsterTermin = Math.min(s.tick + 60, ende);
      if (versuch?.vorEntscheidung) {
        const ersatzJson = versuch.vorEntscheidung(welt, s);
        if (ersatzJson !== undefined) {
          // Explicit audited research fork, not a mutation or production import.
          assert.equal(typeof ersatzJson, 'string');
          const probe = welt.load(ersatzJson);
          assert.equal(probe.tick, s.tick);
          assert.deepEqual(pruefen(welt, probe), []);
          s = probe;
        }
      }
      if(versuch?.vorDisposition)versuch.vorDisposition(welt,s);
      verwaltung(welt, s, entscheidungen, szenario.id !== 'S08');
      // Sample each physical W3 return at its arrival tick.
      while (s.tick < naechsterTermin && s.w3.auftrag) {
        if(versuch?.vorMinute)versuch.vorMinute(welt,s);
        welt.advance(s, 1);
        if(versuch?.nachMinute)versuch.nachMinute(welt,s);
        const a = s.w3.auftrag;
        if (a?.phase !== 'rueck' || s.ships[a.schiff].ankunft - a.zeit !== s.tick) continue;
        const rueck = s.kanon.rueckfracht;
        industrieRueckladungen.push({start:a.start, schiff:a.schiff, carrier:a.carrier ?? 'transport',
          ankunftNadir:s.tick, wasser:rueck?.art==='erz' ? rueck.menge : 0,
          tarif:rueck?.art==='erz' ? rueck.gebuehr : 0, zustimmung:a.wasserZustimmung===true});
      }
      welt.advance(s, naechsterTermin - s.tick);
    }
    if ([7, 30, 90, 365, 730, tage].includes(tag))
      verlauf.push({tag, ...kontrollstand(welt, s), entscheidungen: {...entscheidungen},
        industrieRueckladungen: industrieRueckladungen.map(x => ({...x,
          ankunftAldera: s.w5ad.freight.find(y => y.id === x.schiff && y.start === x.start)?.end ?? null}))});
    else if (tag % 7 === 0) assert.deepEqual(pruefen(welt, s), []);
  }
  if (versuch?.amEnde) versuch.amEnde(welt, s);
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
  return {szenario:szenario.id, seed, profil:forschung ? 'U7/U8' : '204', startpfad,
    tage, ergebnis, quellhash, starthash:beginn.hash, folgefahrten, verlauf};
}

module.exports = {lauf, marktS02, verwaltung, kontrollstand};
if (require.main === module) {
  const [wahl = 'S02', dauer = '90', anfang = '42', profil = 'paar', startpfad = 'konzerne'] = process.argv.slice(2);
  const tage = Number(dauer), seed = Number(anfang);
  const szenarien = SZENARIEN.filter(x => wahl === 'alle' || x.id === wahl);
  assert.ok(szenarien.length && Number.isSafeInteger(tage) && tage >= 1 &&
    Number.isSafeInteger(seed) && ['paar', 'u7', 'standard'].includes(profil) && ['konzerne', 'direkt'].includes(startpfad), 'Ungültige Laufparameter');
  for (const sz of szenarien) {
    if (profil !== 'standard') console.log(JSON.stringify(lauf(sz, tage, seed, true, startpfad)));
    if (profil !== 'u7') console.log(JSON.stringify(lauf(sz, tage, seed, false, startpfad)));
  }
}
