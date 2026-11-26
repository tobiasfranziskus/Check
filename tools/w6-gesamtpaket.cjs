'use strict';
const assert = require('node:assert/strict');
const {lauf} = require('./m4-management-szenarien.cjs');
const {SZENARIEN, pruefen} = require('./w6-szenarien.cjs');

const referenzS02 = {
  7: '19f89c50daadc124', 30: '6091f983a74a53af', 90: '452d5222e5b38709',
  365: '45aef2492bd627cb', 730: '2d68de45bc6a53b8',
};

function freiwilligeJaegerKaufprobe(welt,s) {
  const original = welt.save(s), q = welt.load(original);
  const station = welt.rules.j4.station, preis = welt.rules.j4.verkaufspreis;
  const vorher = s.owners.house.cash;
  const lager = s.stations[station].lager.jaeger;
  const kauf = welt.execute(q,{type:'shipBuy',owner:'house',station,klasse:'jaeger'});
  assert.equal(welt.save(s),original);
  if (!kauf.ok) {
    assert.equal(welt.save(q),original);
    return {ok:false,vorher,lager,preis,grund:kauf.reason};
  }
  assert.equal(q.owners.house.cash,vorher-preis);
  assert.equal(q.owners[station].cash,s.owners[station].cash+preis);
  assert.equal(q.stations[station].lager.jaeger,lager-1);
  const beleg = q.kanon.jaeger.kaeufe.at(-1);
  assert.equal(q.ships[beleg.id].owner,'house');
  assert.equal(q.ships[beleg.id].system,'nadir');
  assert.deepEqual(pruefen(welt,q),[]);
  const save = welt.save(q);
  assert.equal(welt.save(welt.load(save)),save);
  return {ok:true,vorher,lager,preis,beleg,hash:welt.hash(q)};
}

function abnahme(id, tage, seed, profil, replay = true) {
  const szenario = SZENARIEN.find(s => s.id === id);
  assert.ok(szenario && Number.isSafeInteger(seed) && [90,365,730].includes(tage));
  assert.ok(['204','u8','60','gesamt'].includes(profil));
  const vorlauf60 = ['60','gesamt'].includes(profil) && id !== 'S11';
  const sz = vorlauf60 ? {...szenario, politik:{...szenario.politik, ersatzVorlaufProzent:60}} : szenario;
  const run = () => {
    let kaufprobe;
    const simulation = lauf(sz,tage,seed,profil === 'gesamt' ? 'gesamt' : profil !== '204',
      'konzerne',null,true,null,(w,s)=>{ kaufprobe = freiwilligeJaegerKaufprobe(w,s); });
    return {...simulation,kaufprobe};
  };
  const ergebnis = run();
  if (profil === '60' && id === 'S02' && seed === 42)
    for (const v of ergebnis.verlauf.filter(v=>Object.hasOwn(referenzS02,v.tag)))
      assert.equal(v.hash,referenzS02[v.tag]);
  if (replay) assert.deepEqual(run(),ergebnis);
  const verlauf = ergebnis.verlauf.map(v => ({
    tag:v.tag, hash:v.hash, weltgeld:v.weltgeld, mint:v.mint, burn:v.burn, gebunden:v.gebunden,
    ...v.produktion, eisfrachten:v.auftraege.eisfrachten, w3:v.auftraege.erzfrachten,
    ersatz:v.ersatzkaeufe, verbrauch:v.stationsrechnung.verbrauchWasser,
    letzteW3:v.fracht.erz.at(-1)?.end ?? null,
    letzteHausEis:v.fracht.eisHaus.findLast(a=>a.end !== null)?.end ?? null,
  }));
  const v = ergebnis.verlauf.at(-1);
  const endfenster = [30,7].map(tageFenster => {
    const end = verlauf.at(-1), start = verlauf.find(x=>x.tag === tage-tageFenster);
    return {tage:tageFenster,...Object.fromEntries(
      ['eisfrachten','w3','wasserProduziert','materialErzeugt','frachterGebaut','minerGeliefert','jaegerVerkauft','ersatz']
        .map(key=>[key,end[key]-start[key]]))};
  });
  return {id,tage,seed,profil,replay,quellhash:ergebnis.quellhash,starthash:ergebnis.starthash,kaufprobe:ergebnis.kaufprobe,verlauf,endfenster,
    ende:{letzterVertrag:v.aktiveAuftraege.k7,w3:v.aktiveAuftraege.w3,
      schiffe:v.huellen.filter(h=>!h.stillgelegt), lager:v.lager, kassen:v.kassen,
      entscheidungen:v.entscheidungen, ersterStillstand:v.ersterStillstand}};
}
module.exports = {abnahme, freiwilligeJaegerKaufprobe};
if (require.main === module) {
  const [id,tage,seed,profil,replay='1'] = process.argv.slice(2);
  console.log(JSON.stringify(abnahme(id,Number(tage),Number(seed),profil,replay === '1')));
}
