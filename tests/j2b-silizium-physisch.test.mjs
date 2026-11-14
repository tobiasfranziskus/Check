import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {versuch} from '../tools/j2-silizium-gate.mjs';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');

const gut=(w,s,was)=>assert.equal(w.audit(s).ok,true,was+': '+JSON.stringify(w.audit(s).fehler));
const geld=s=>Object.values(s.owners).reduce((n,x)=>n+x.cash,0);
const cmd=(type,sh,other={})=>({type,owner:'house',schiff:sh,...other});
const ablehnen=(w,s,c)=>{
  const vor=w.canonical(s),r=w.execute(s,c);
  assert.equal(r.ok,false,JSON.stringify(c)+' unerwartet erlaubt: '+JSON.stringify(r));
  assert.equal(w.canonical(s),vor,'Ablehnung ohne Mutation');
};
async function vorbereitet(seed){
  const {w,s,report}=await versuch(seed);
  assert.equal(report.final.hash,seed===42?'c5d9d3becc36c4a4':'d7fbd58bc707e2ae');
  assert.equal(w.execute(s,{type:'stationClaimMinerLocal',owner:'house',station:'st_nadir'}).ok,true);
  gut(w,s,'Regel200 nach lokalem K2-Kauf');
  const quellHash=w.hash(s),exportJson=w.save(s);
  const z=Welt.ausRegel200J2b(exportJson);
  assert.equal(w.hash(s),quellHash,'Quellwelt bei expliziter Forschung unverändert');
  assert.equal(z.quellHash,quellHash);
  assert.equal(z.welt.regel,201);
  assert.equal(z.zustand.ledger.silizium.initial,0);
  assert.equal(z.zustand.stations.st_nadir.lager.silizium,0);
  assert.equal(z.zustand.kanon.silizium.vorrat,16);
  assert.equal(geld(z.zustand),33000);
  assert.equal(z.zustand.minted,0);assert.equal(z.zustand.burned,0);
  gut(z.welt,z.zustand,'nach expliziter 200→201-Übernahme');
  return {...z,source:w,sourceState:s,sourceHash:quellHash,
    miner:s.kanon.minerWerft.lokaleKaeufe[0].id};
}
async function einmal(seed){
  const {welt:w,zustand:s,miner,source,sourceState,sourceHash}=await vorbereitet(seed);
  const C=w.rules.j2b,oldCash=s.owners.house.cash,oldBuyer=s.owners.st_nadir.cash;
  ablehnen(w,s,cmd('siliconSell',miner));
  ablehnen(w,s,cmd('siliconMineStart','sh001'));
  ablehnen(w,s,{...cmd('siliconMineStart',miner),betrag:0});
  const r=w.execute(s,cmd('siliconMineStart',miner));
  assert.equal(r.ok,true,JSON.stringify(r));
  assert.equal(s.owners.house.cash,oldCash-128);
  assert.equal(s.owners.st_nadir.cash,oldBuyer-192);
  assert.equal(s.owners.k1_silizium_arbeit.cash,128);
  assert.equal(s.owners.k1_silizium_kauf.cash,192);
  gut(w,s,'zwei voll finanzierte Treuhandverträge');
  ablehnen(w,s,cmd('siliconMineStart',miner));
  let before=s.kanon.silizium.gefoerdert;
  w.minute(s);
  assert.equal(s.kanon.silizium.gefoerdert,before,'am Dock kann nicht gefördert werden');
  assert.equal(w.execute(s,cmd('shipUndock',miner)).ok,true);
  const startTick=s.tick;
  w.minute(s);
  assert.equal(w.execute(s,cmd('shipFlyTo',miner,{x:C.feld.x,y:C.feld.y})).ok,true);
  let flown=0;
  while(s.kanon.silizium.gefoerdert<8&&flown<500){
    w.minute(s);flown++;
    gut(w,s,'Fördertick '+flown);
  }
  assert.equal(s.kanon.silizium.gefoerdert,8,'8 physisch geförderte, bezahlte Einheiten');
  assert.equal(s.ships[miner].ladung.silizium,8);
  assert.equal(s.ledger.silizium.mined,8);
  assert.equal(s.kanon.silizium.vorrat,8);
  assert.equal(s.kanon.silizium.arbeitsMinuten,64);
  assert.equal(s.owners.k1_silizium_arbeit.cash,0);
  assert.equal(s.owners.pilot_house.cash>=128,true);
  const fieldInfo={x:C.feld.x,y:C.feld.y,life:s.kanon.silizium.vorrat,
    flown,seconds:(s.tick-startTick)*60};
  const inFlight=w.save(s);assert.equal(w.hash(w.load(inFlight)),w.hash(s));
  ablehnen(w,s,cmd('siliconSell',miner));
  assert.equal(w.execute(s,cmd('shipDock',miner,{station:'st_nadir'})).ok,true);
  for(let n=0;n<500&&s.ships[miner].flug.lage!=='angedockt';n++){
    w.minute(s);if(n%5===0)gut(w,s,'Rückflug '+n);
  }
  assert.equal(s.ships[miner].flug.lage,'angedockt');
  const cashBeforeSale=s.owners.house.cash,buyerBeforeSale=s.owners.st_nadir.cash;
  assert.equal(w.execute(s,cmd('siliconSell',miner)).ok,true);
  assert.equal(s.owners.house.cash,cashBeforeSale+192);
  assert.equal(s.owners.st_nadir.cash,buyerBeforeSale,'Käuferbudget vorab gesperrt');
  assert.equal(s.owners.k1_silizium_kauf.cash,0);
  assert.equal(s.stations.st_nadir.lager.silizium,8);
  assert.equal(s.ships[miner].ladung.silizium,undefined);
  assert.equal(s.kanon.silizium.verkauft,8);
  assert.equal(s.kanon.silizium.belege.length,1);
  assert.equal(geld(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
  gut(w,s,'vollständig bezahlte Lieferung im Nadir-Lager');
  ablehnen(w,s,cmd('siliconSell',miner));
  const saved=w.save(s),loaded=w.load(saved);
  assert.equal(w.hash(loaded),w.hash(s));
  assert.deepEqual(loaded,s);
  assert.equal(source.hash(sourceState),sourceHash,'Regel200-Quellstand nach J2b unangetastet');
  return {w,s,miner,fieldInfo,hash:w.hash(s),quellHash:sourceHash};
}
for(const seed of [42,7])test('J2b seed '+seed+': 8 wirklich bezahlte Silizium mit F6-Anflug und Lagerkauf',async()=>{
  const a=await einmal(seed);
  assert.equal(a.s.rulesVersion,201);
  assert.equal(a.s.kanon.silizium.verkauft,8);
  assert.equal(a.s.kanon.silizium.vorrat,8);
  assert.equal(a.s.kanon.silizium.belege[0].preis,192);
  assert.equal(a.s.kanon.silizium.belege[0].arbeit,128);
  console.log('J2B_PAID_SILICON',JSON.stringify({seed,...a.fieldInfo,hash:a.hash}));
});
test('J2b: Unterfinanzierung, Besitzerfehler und fehlendes Feld bleiben atomar',async()=>{
  const {welt:w,zustand:s,miner}=await vorbereitet(42);
  const save=w.save(s);
  for(const mut of [
    x=>{x.owners.house.cash=127},
    x=>{x.owners.st_nadir.cash=191},
    x=>{x.kanon.silizium.vorrat=7},
    x=>{x.ships[miner].owner='npc3'},
    x=>{x.ships[miner].system='aldera'},
  ]){
    const invalid=w.load(save);mut(invalid);
    ablehnen(w,invalid,cmd('siliconMineStart',miner));
  }
  ablehnen(w,s,{type:'siliconMineStart',owner:'npc3',schiff:miner});
  ablehnen(w,s,{type:'siliconMineStart',owner:'house',schiff:miner,menge:8});
  const old=w.canonical(s);
  assert.equal(w.execute(s,cmd('siliconMineStart',miner)).ok,true);
  assert.notEqual(w.canonical(s),old);
  const active=w.save(s);
  for(const mut of [
    z=>{z.ledger.silizium.mined=1},
    z=>{z.kanon.silizium.vorrat++},
    z=>{z.kanon.silizium.arbeitsMinuten=1},
    z=>{z.owners.k1_silizium_kauf.cash=191},
    z=>{z.kanon.silizium.auftrag.gefoerdert++},
  ]){
    const x=JSON.parse(active);mut(x);
    assert.equal(w.audit(x).ok,false,'Manipulation muss vom Audit erkannt werden');
    assert.throws(()=>w.load(JSON.stringify(x)),'Import-Schutz');
  }
});
