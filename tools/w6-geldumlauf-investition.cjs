'use strict';
const assert = require('node:assert/strict');
const {lauf} = require('./m4-management-szenarien.cjs');
const {SZENARIEN, pruefen} = require('./w6-szenarien.cjs');

function stand(welt, s) {
  assert.deepEqual(pruefen(welt, s), []);
  const save = welt.save(s);
  assert.equal(welt.save(welt.load(save)), save);
  const b = welt.bericht(s);
  return {
    tag:b.tag, hash:welt.hash(s), weltgeld:b.weltgeld, mint:b.minted, burn:b.burned, treuhand:b.gebunden,
    kassen:Object.fromEntries(Object.entries(s.owners).filter(([, o]) => o.cash).map(([id, o]) => [id, o.cash])),
    lager:Object.fromEntries(Object.entries(s.stations).map(([id, station]) => [id, {...station.lager}])),
    produktion:b.produktion, auftraege:b.auftraege, verkaeufe:b.verkaeufe, dividenden:b.dividenden,
  };
}

function folgelauf(welt, quelle, variante, tage) {
  const original = welt.save(quelle);
  const s = welt.load(original);
  let kauf = null;
  let ueberfuehrung = null;
  if (variante !== 'kontrolle') {
    const station = variante === 'frachter' ? 'st_nadir' : 'st_aldera';
    const vor = s.owners.house.cash;
    const werftVor = s.owners.werft_extern.cash;
    const ergebnis = welt.execute(s, {type:'shipBuy', owner:'house', station, klasse:variante});
    assert.ok(ergebnis.ok, ergebnis.reason);
    const schiff = Object.values(s.ships).find(sh => !quelle.ships[sh.id]);
    assert.ok(schiff && schiff.owner === 'house' && schiff.klasse === variante);
    const preis = vor - s.owners.house.cash;
    assert.equal(preis, welt.rules.economy.waren[variante].basis);
    assert.equal(s.owners.werft_extern.cash - werftVor, preis);
    kauf = {station, preis, schiff:schiff.id};
    if (variante === 'frachter') {
      const start = s.tick;
      const auftrag = welt.execute(s, {type:'shipReposition', owner:'house', schiff:schiff.id});
      assert.ok(auftrag.ok, auftrag.reason);
      const {zeit} = welt.kern.route(welt.rules.world, 'nadir', 'aldera');
      welt.advance(s, zeit);
      const beleg = s.w5ac.completed.find(f => f.id === schiff.id && f.start === start);
      assert.ok(beleg && s.ships[schiff.id].system === 'aldera');
      ueberfuehrung = {...beleg};
    }
  }
  assert.deepEqual(pruefen(welt, s), []);
  const verlauf = [];
  for (let tag = 1; tag <= tage; tag++) {
    const ziel = quelle.tick + tag * 1440;
    welt.advance(s, ziel - s.tick);
    assert.deepEqual(pruefen(welt, s), []);
    if ([7, 30, 90, 240, 605, tage].includes(tag)) verlauf.push(stand(welt, s));
  }
  assert.equal(welt.save(quelle), original);
  return {variante, kauf, ueberfuehrung, verlauf};
}

function investitionsprobe(seed, tage, auswahl = 'alle') {
  assert.ok(Number.isSafeInteger(seed) && [7, 30, 90, 240, 605].includes(tage));
  assert.ok(['alle', 'kontrolle', 'frachter', 'miner'].includes(auswahl));
  const szenario = SZENARIEN.find(s => s.id === 'S02');
  const profil = {...szenario, politik:{...szenario.politik, ersatzVorlaufProzent:60}};
  const varianten = auswahl === 'alle' ? ['kontrolle', 'frachter', 'miner'] : [auswahl];
  let auswertung;
  lauf(profil, 125, seed, 'gesamt', 'konzerne', null, true, null, (welt, quelle) => {
    const ausgang = stand(welt, quelle);
    assert.equal(ausgang.auftraege.eisfrachten, 1100);
    assert.equal(ausgang.auftraege.erzfrachten, 22);
    assert.equal(ausgang.treuhand, 0);
    assert.equal(ausgang.lager.st_aldera.wasser, 0);
    const arme = varianten.map(variante => {
      const arm = folgelauf(welt, quelle, variante, tage);
      assert.deepEqual(folgelauf(welt, quelle, variante, tage), arm);
      return arm;
    });
    auswertung = {szenario:szenario.id, seed, tage, ausgang, arme};
  });
  return auswertung;
}

module.exports = {investitionsprobe};
if (require.main === module) {
  const [seed, tage, auswahl] = process.argv.slice(2);
  console.log(JSON.stringify(investitionsprobe(Number(seed), Number(tage), auswahl)));
}
