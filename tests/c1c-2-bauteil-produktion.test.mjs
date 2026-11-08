import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,PARTS_PROFILE,WAGES_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

const c=createResearchCore({profile:PARTS_PROFILE});
const old=createResearchCore({profile:WAGES_PROFILE});
function doCmd(core,s,cmd){
 const r=core.execute(s,cmd);assert.equal(r.ok,true,r.reason);
}
function audit(s){
 const proof=c.audit(s);assert.equal(proof.ok,true,JSON.stringify(proof));
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.w5q.exported,0);
}
function tick(s,n){
 for(let i=0;i<n;i++){c.step(s);audit(s);}
 return s;
}
function load(s){const h=c.hash(s),copy=c.load(c.save(s));assert.equal(c.hash(copy),h);return copy;}
function prepare(seed=42){
 let s=c.create(seed);audit(s);
 doCmd(c,s,{type:'shipWait',owner:'npc3',schiff:'sh001'});
 doCmd(c,s,{type:'shipBuy',owner:'house',station:'st_aldera',klasse:'miner'});
 doCmd(c,s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 tick(s,60);
 doCmd(c,s,{type:'shipWait',owner:'house',schiff:'sh003'});
 doCmd(c,s,{type:'shipFreight',owner:'transport',schiff:'sh002'});
 tick(s,60);
 doCmd(c,s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 tick(s,60);
 s=load(s);
 assert.equal(s.tick,180);
 assert.equal(s.w4.materialErzeugt,4);
 assert.equal(s.stations.st_nadir.lager.material,4);
 assert.equal(s.ledger.material.initial,0);
 assert.equal(s.ledger.silizium.initial,0);
 assert.equal(s.ledger.bauteil.initial,0);
 return s;
}
function makeParts(s){
 doCmd(c,s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'});
 const siliconMiner=s.w5b.minerId;
 assert.ok(siliconMiner);
 doCmd(c,s,{type:'shipMine',owner:'house',schiff:siliconMiner,ware:'silizium'});
 tick(s,1);
 assert.equal(s.w5b.siliziumAbgebaut,1);
 assert.equal(s.w5b.siliziumLohnBezahlt,10);
 assert.equal(s.w5b.siliziumAbnahme,24);
 assert.equal(s.ledger.silizium.mined,1);
 assert.equal(s.stations.st_nadir.lager.silizium,1);
 doCmd(c,s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 assert.equal(s.w5b.fabrikLohnGebunden,8);
 assert.equal(s.owners.w5b_fabrik_arbeit.cash,8);
 assert.equal(s.w5b.materialVerbraucht,2);
 assert.equal(s.w5b.siliziumVerbraucht,1);
 assert.equal(s.w5b.vorproduktKauf,120);
 assert.equal(s.stations.st_nadir.lager.material,2);
 assert.equal(s.stations.st_nadir.lager.silizium,0);
 assert.equal(s.ledger.bauteil.produced,0);
 s=load(s);
 tick(s,7);
 assert.equal(s.ledger.bauteil.produced,0);
 assert.equal(s.owners.w5b_fabrik_arbeit.cash,1);
 s=load(s);
 tick(s,1);
 assert.equal(s.ledger.bauteil.produced,1);
 assert.equal(s.stations.st_nadir.lager.bauteil,1);
 assert.equal(s.w5b.bauteilFertig,1);
 assert.equal(s.w5b.fabrikLohnBezahlt,8);
 assert.equal(s.owners.arbeiter_w5b_nadir.cash,8);
 assert.equal(s.owners.w5b_fabrik_arbeit.cash,0);
 return load(s);
}
test('C1c-2: isolated exact C component recipe and separate prior saves',()=>{
 assert.equal(c.rules.rulesVersion,3304);
 assert.equal(c.profile,PARTS_PROFILE);
 assert.equal(c.rules.w5b.silikonMenge,1);
 assert.equal(c.rules.w5b.silikonLohn,10);
 assert.equal(c.rules.w5b.materialPreis,48);
 assert.equal(c.rules.economy.waren.silizium.basis,24);
 assert.deepEqual(c.rules.economy.rezepte.r_bauteil.ein,{material:2,silizium:1});
 assert.deepEqual(c.rules.economy.rezepte.r_bauteil.aus,{bauteil:1});
 assert.equal(c.rules.economy.rezepte.r_bauteil.dauer,8);
 assert.ok(Object.isFrozen(c.rules.w5b));
 assert.equal(old.rules.rulesVersion,3303);
 assert.notEqual(c.fingerprint,old.fingerprint);
 assert.throws(()=>old.load(c.save(c.create())),/Profil/);
 assert.throws(()=>c.load(old.save(old.create())),/Profil/);
 audit(c.create());
});
test('C1c-2: two seeds physically produce 2 material + 1 paid silicon into 1 paid component',()=>{
 for(const seed of [42,7]){
  const start=prepare(seed),done=makeParts(start);
  assert.equal(done.tick,189);
  assert.equal(done.ledger.bauteil.produced,1);
  assert.equal(done.ledger.material.produced,4);
  assert.equal(done.ledger.material.consumed,2);
  assert.equal(done.ledger.silizium.mined,1);
  assert.equal(done.ledger.silizium.consumed,1);
  assert.equal(done.ledger.bauteil.initial,0);
  assert.equal(done.stations.st_nadir.lager.bauteil,1);
  assert.equal(done.w5b.bauteilBegonnen,1);
  assert.equal(done.w5b.bauteilFertig,1);
  assert.equal(done.w5b.fabrikLohnBezahlt,8);
  assert.equal(done.minted,0);
  audit(done);
  console.log('C1C2_RESULT '+JSON.stringify({seed,tick:done.tick,hash:c.hash(done),
   material:done.w4.materialErzeugt,silicon:done.w5b.siliziumAbgebaut,
   siliconWorkISK:done.w5b.siliziumLohnBezahlt,component:done.w5b.bauteilFertig,
   fabricationWorkISK:done.w5b.fabrikLohnBezahlt,minted:done.minted}));
 }
});
test('C1c-2: unavailable raw goods, duplicate job and wrong owner never create paid component',()=>{
 let s=c.create();
 const h=c.hash(s);
 assert.equal(c.execute(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'}).ok,false);
 assert.equal(c.hash(s),h);
 s=prepare();
 const wrong=c.hash(s);
 assert.equal(c.execute(s,{type:'stationBuildParts',owner:'npc3',station:'st_nadir'}).ok,false);
 assert.equal(c.hash(s),wrong);
 doCmd(c,s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'});
 doCmd(c,s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
 tick(s,1);
 doCmd(c,s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 const started=c.hash(s);
 assert.equal(c.execute(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'}).ok,false);
 assert.equal(c.hash(s),started);
 audit(s);
});
test('C1c-2: replay, lossless save/load and adversarial wage, provenance, cash and profile tests',()=>{
 let s=prepare(),replay=load(s);
 s=makeParts(s);replay=makeParts(replay);
 assert.equal(c.hash(s),c.hash(replay));
 const saved=load(s),h=c.hash(saved);
 for(const change of [
  x=>x.w5b.bauteilFertig++,
  x=>x.w5b.fabrikLohnBezahlt++,
  x=>x.w5b.siliziumLohnBezahlt++,
  x=>x.w5b.vorproduktKauf++,
  x=>x.ledger.bauteil.produced++,
  x=>x.stations.st_nadir.lager.bauteil++,
  x=>x.owners.w5b_fabrik_arbeit.cash++,
  x=>x.owners.arbeiter_w5b_nadir.cash++,
  x=>{x.minted++;x.owners.house.cash++;},
  x=>x.c1b.profile=WAGES_PROFILE
 ]){
  const bad=structuredClone(saved);change(bad);assert.throws(()=>c.load(JSON.stringify(bad)));
 }
 assert.equal(c.hash(saved),h);
});
test('C1c-2: reject unpaid silicon and labor without fictitious exports or mint',()=>{
 let s=prepare();
 const h=c.hash(s);
 assert.equal(s.stations.st_nadir.lager.silizium,0);
 assert.equal(c.execute(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'}).ok,false);
 assert.equal(c.hash(s),h);
 assert.equal(s.ledger.bauteil.produced,0);
 assert.equal(s.w5q.minted,0);assert.equal(s.w5q.exported,0);
 assert.equal(c.rules.world.systems.meridian,undefined);
});
