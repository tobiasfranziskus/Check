// W6/P8g post-day90 deadlock diagnostic. No new prices, policies or core mutations.
// Original automatic NPC dispatch is compared using existing scenario policy knobs only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const policy=W6.SZENARIEN.find(x=>x.id==='S02').politik;
function verify(w,s){
  const a=w.audit(s);
  assert.equal(a.ok,true,a.fehler?.join('; '));
  assert.deepEqual(W6.pruefen(w,s),[]);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
}
function original90(){
  const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
  const s=w.createState(42,{politik:policy});
  w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);w.materialSupplySetzen(s,true);
  let bought=0;
  for(let t=120;t<=90*1440;t+=120){
    w.advance(s,120);
    if(s.stations.st_nadir.lager.jaeger>0&&s.owners.house.cash>=900&&bought<3){
      const r=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
      assert.equal(r.ok,true,r.reason);bought++;
    }
  }
  verify(w,s);
  assert.equal(w.hash(s),'ad0f037be40c32fd','reference S02 opt-in original unchanged');
  return {w,s,save:w.save(s),reference:w.hash(s)};
}
function diagnosis(w,s){
  const p=s.kanon.politik,ships=Object.values(s.ships),frachter=ships.filter(sh=>
    sh.owner==='transport'&&sh.klasse==='frachter');
  const k=s.kanon,stillgelegt=sh=>w.buchwert(s,sh.id)===0;
  const viable=frachter.filter(sh=>!stillgelegt(sh));
  // Same source condition as the original NPC dispatcher; use only actual book values.
  const minerGefahr=p.stilllegung&&p.ersatzkauf&&Object.keys(k.pendel).some(id=>{
    const sh=s.ships[id];
    return sh&&(sh.owner!=='house'||p.spielerErsatz)
      &&w.buchwert(s,id)*100<=w.rules.economy.waren.miner.basis*p.ersatzVorlaufProzent;
  })&&(s.stations.st_aldera.lager.miner||0)===0
    &&!(k.minerWerft?.auftrag||k.minerWerft?.wartetAuf||k.minerWerft?.transport);
  
  return {
    day:s.tick/1440,hash:w.hash(s),flag:{stilllegung:p.stilllegung,ersatzkauf:p.ersatzkauf,
      werftVorrat:p.werftVorrat,ersatzVorlaufProzent:p.ersatzVorlaufProzent,
      automatik:p.automatik,minerGefahr,werftMaterialLager:s.stations.st_nadir.lager.material},
    ware:{nadirOre:s.stations.st_nadir.lager.erz,nadirSilicon:s.stations.st_nadir.lager.silizium,
      nadirMaterial:s.stations.st_nadir.lager.material,nadirFreighters:s.stations.st_nadir.lager.frachter},
    finance:{werft:s.owners.werft_extern.cash,transport:s.owners.transport.cash,
      nadir:s.owners.st_nadir.cash},
    w5BuildQuote:w.kern.pilotW5Kalkulation(s),
    fleet:frachter.map(sh=>({
      id:sh.id,system:sh.system,phase:sh.phase,docked:sh.flug?.lage==='angedockt',
      remainingValue:w.buchwert(s,sh.id),workOrder:sh.auftrag,
      ferryQuote:sh.system==='nadir'&&sh.phase==='dock'&&!stillgelegt(sh)
        ?w.kern.pilotW5TransferKalkulation(s,sh.id):null})),
    viableTotal:viable.length,viableAtAldera:viable.filter(sh=>
      sh.system==='aldera'&&sh.phase==='dock'&&sh.auftrag==='halten').length,
    minerYard:{built:k.minerWerft?.fertig||0,pending:k.minerWerft?.wartetAuf||null,
      active:!!k.minerWerft?.auftrag,transport:!!k.minerWerft?.transport},
    industry:{materialContract:k.industrieErz?.phase,materialOnly:k.industrieErz?.materialOnly===true,
      builtFighters:k.jaeger.fertig,partJobs:k.bauteile.abgeschlossen,w3:s.w3.abgeschlossen}
  };
}

test('S02×90: compute the exact original W5-build / replacement-vs-miner-reserve gates',()=>{
  const {w,s,save,reference}=original90();
  const d=diagnosis(w,s);
  assert.equal(d.viableAtAldera,0);
  assert.equal(d.ware.nadirMaterial,10);
  assert.equal(d.ware.nadirSilicon,8);
  console.log('P8G_AUTOMATIC_REPLACEMENT_GATE',JSON.stringify(d));
  assert.equal(w.hash(w.load(save)),reference);
});

test('S02×90: original documented werftVorrat=1 policy experiment, not a new P8g rule',()=>{
  const {w,s,save,reference}=original90();
  w.politikSetzen(s,{werftVorrat:1});
  verify(w,s);
  const before=diagnosis(w,s);
  w.advance(s,1440*5);
  verify(w,s);
  const after=diagnosis(w,s);
  console.log('P8G_EXISTING_POLICY_COUNTERFACTUAL',JSON.stringify({
    oldHash:reference,variant:'werftVorrat=1',before,after,
    freightDelta:after.industry.w3-before.industry.w3,
    fighterDelta:after.industry.builtFighters-before.industry.builtFighters}));
  assert.equal(w.hash(w.load(save)),reference);
});

test('S02×90: original S11-style werftVorrat+earlyReplacement policy experiment',()=>{
  const {w,s,save,reference}=original90();
  w.politikSetzen(s,{werftVorrat:1,ersatzVorlaufProzent:80});
  verify(w,s);
  const before=diagnosis(w,s);
  w.advance(s,1440*5);
  verify(w,s);
  const after=diagnosis(w,s);
  console.log('P8G_EXISTING_POLICY_COUNTERFACTUAL',JSON.stringify({
    oldHash:reference,variant:'werftVorrat=1,ersatzVorlaufProzent=80',
    before,after,freightDelta:after.industry.w3-before.industry.w3,
    fighterDelta:after.industry.builtFighters-before.industry.builtFighters}));
  assert.equal(w.hash(w.load(save)),reference);
});
