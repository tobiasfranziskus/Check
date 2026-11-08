import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,STORAGE_PROFILE,PARTS_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

const c=createResearchCore({profile:STORAGE_PROFILE});
const old=createResearchCore({profile:PARTS_PROFILE});
function execute(core,s,cmd){const r=core.execute(s,cmd);assert.equal(r.ok,true,r.reason);}
function good(s){
 const a=c.audit(s);assert.equal(a.ok,true,JSON.stringify(a));
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);assert.equal(s.w5q.exported,0);
}
function advance(s,n){
 for(let i=0;i<n;i++){c.step(s);good(s);}
 return s;
}
function loaded(s){
 const h=c.hash(s),raw=c.save(s),copy=c.load(raw);
 assert.equal(c.hash(copy),h);return copy;
}
function prepare(seed=42){
 let s=c.create(seed);good(s);
 execute(c,s,{type:'shipWait',owner:'npc3',schiff:'sh001'});
 execute(c,s,{type:'shipBuy',owner:'house',station:'st_aldera',klasse:'miner'});
 execute(c,s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 advance(s,60);
 execute(c,s,{type:'shipWait',owner:'house',schiff:'sh003'});
 execute(c,s,{type:'shipFreight',owner:'transport',schiff:'sh002'});
 advance(s,60);
 execute(c,s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 advance(s,60);
 s=loaded(s);
 assert.equal(s.tick,180);
 assert.equal(s.stations.st_nadir.lager.material,4);
 assert.equal(s.ledger.material.initial,0);
 assert.equal(s.ledger.silizium.initial,0);
 assert.equal(s.ledger.bauteil.initial,0);
 assert.equal(s.ledger.lager.initial,0);
 assert.equal(s.stations.st_nadir.lager.lager,0);
 return s;
}
function silicon(s){
 execute(c,s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'});
 const ship=s.w5b.minerId;assert.equal(s.ships[ship].owner,'house');
 execute(c,s,{type:'shipMine',owner:'house',schiff:ship,ware:'silizium'});
 assert.equal(s.w5b.siliziumAuftrag,null);
 advance(s,1);
 assert.equal(s.w5b.siliziumAuftrag.menge,2);
 assert.equal(s.w5b.siliziumAuftrag.arbeit,20);
 assert.equal(s.owners.w5b_silizium_arbeit.cash,19);
 assert.equal(s.w5b.siliziumAbgebaut,0);
 assert.equal(s.w5b.siliziumLohnBezahlt,1);
 advance(s,8);
 assert.equal(s.w5b.siliziumLohnBezahlt,9);
 assert.equal(s.w5b.siliziumAbgebaut,0);
 assert.equal(s.ships[ship].ladung.silizium||0,0);
 s=loaded(s);
 advance(s,1);
 assert.equal(s.tick,190);
 assert.equal(s.w5b.siliziumAbgebaut,1);
 assert.equal(s.ships[ship].ladung.silizium,1);
 assert.equal(s.owners.w5b_silizium_arbeit.cash,10);
 s=loaded(s);
 advance(s,9);
 assert.equal(s.w5b.siliziumAbgebaut,1);
 assert.equal(s.owners.w5b_silizium_arbeit.cash,1);
 advance(s,1);
 assert.equal(s.tick,200);
 assert.equal(s.w5b.siliziumAbgebaut,2);
 assert.equal(s.w5b.siliziumAbgeschlossen,1);
 assert.equal(s.w5b.siliziumLohnBezahlt,20);
 assert.equal(s.w5b.siliziumAuftrag,null);
 assert.equal(s.stations.st_nadir.lager.silizium,2);
 assert.equal(s.ledger.silizium.mined,2);
 assert.equal(s.owners.w5b_silizium_kauf.cash,0);
 assert.equal(s.owners.w5b_silizium_arbeit.cash,0);
 return loaded(s);
}
function twoParts(s){
 execute(c,s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 assert.equal(s.w5b.bauteilBegonnen,1);
 assert.equal(s.w5b.vorproduktKauf,240);
 assert.equal(s.w5b.materialVerbraucht,4);
 assert.equal(s.w5b.siliziumVerbraucht,2);
 assert.equal(s.owners.w5b_fabrik_arbeit.cash,16);
 assert.equal(s.stations.st_nadir.lager.material,0);
 assert.equal(s.stations.st_nadir.lager.silizium,0);
 s=loaded(s);
 advance(s,15);
 assert.equal(s.ledger.bauteil.produced,0);
 assert.equal(s.owners.w5b_fabrik_arbeit.cash,1);
 s=loaded(s);
 advance(s,1);
 assert.equal(s.tick,216);
 assert.equal(s.ledger.bauteil.produced,2);
 assert.equal(s.w5b.bauteilFertig,1);
 assert.equal(s.stations.st_nadir.lager.bauteil,2);
 assert.equal(s.w5b.fabrikLohnBezahlt,16);
 return loaded(s);
}
function storage(s){
 execute(c,s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
 assert.equal(s.w5b.lagerBegonnen,1);
 assert.equal(s.w5b.bauteilVerbraucht,2);
 assert.equal(s.stations.st_nadir.lager.bauteil,0);
 assert.equal(s.w5b.vorproduktKauf,240+340);
 assert.equal(s.owners.w5b_fabrik_arbeit.cash,12);
 s=loaded(s);
 advance(s,11);
 assert.equal(s.ledger.lager.produced,0);
 assert.equal(s.owners.w5b_fabrik_arbeit.cash,1);
 advance(s,1);
 assert.equal(s.tick,228);
 assert.equal(s.w5b.lagerFertig,1);
 assert.equal(s.w5b.fabrikLohnBezahlt,28);
 assert.equal(s.ledger.bauteil.consumed,2);
 assert.equal(s.ledger.lager.produced,1);
 assert.equal(s.stations.st_nadir.lager.lager,1);
 assert.equal(s.owners.w5b_fabrik_arbeit.cash,0);
 return loaded(s);
}
test('C1c-3: isolated registered C profile, priced inputs and no free starting storage',()=>{
 const s=c.create();good(s);
 assert.equal(c.rules.rulesVersion,3305);
 assert.equal(c.rules.w5b.silikonMenge,2);
 assert.equal(c.rules.w5b.silikonLohn,1);
 assert.equal(c.rules.w5b.silikonMinutenJeEinheit,10);
 assert.equal(c.rules.economy.waren.bauteil.basis,170);
 assert.equal(c.rules.economy.waren.lager.basis,430);
 assert.deepEqual(c.rules.economy.rezepte.r_lager.ein,{bauteil:2});
 assert.deepEqual(c.rules.economy.rezepte.r_lager.aus,{lager:1});
 assert.equal(c.rules.economy.rezepte.r_lager.dauer,12);
 assert.equal(s.stations.st_nadir.lager.lager,0);
 assert.equal(s.ledger.lager.initial,0);
 assert.equal(old.rules.rulesVersion,3304);
 assert.equal(old.rules.w5b.silikonMinutenJeEinheit,undefined);
 assert.throws(()=>old.load(c.save(s)),/Profil/);
 assert.throws(()=>c.load(old.save(old.create())),/Profil/);
 assert.equal(c.execute(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'}).ok,false);
});
test('C1c-3: 10 paid work minutes per silicon, two physical parts and one paid storage module',()=>{
 for(const seed of [42,7]){
  const s=storage(twoParts(silicon(prepare(seed))));
  assert.equal(s.tick,228);
  assert.equal(s.w5b.siliziumAbgebaut,2);
  assert.equal(s.w5b.siliziumLohnBezahlt,20);
  assert.equal(s.w5b.bauteilFertig,1);
  assert.equal(s.ledger.bauteil.produced,2);
  assert.equal(s.ledger.lager.produced,1);
  assert.equal(s.w5b.fabrikLohnBezahlt,28);
  good(s);
  console.log('C1C3_RESULT '+JSON.stringify({seed,tick:s.tick,hash:c.hash(s),
   siliconUnits:s.w5b.siliziumAbgebaut,siliconPaidMinutes:s.w5b.siliziumLohnBezahlt,
   componentUnits:s.ledger.bauteil.produced,storageUnits:s.ledger.lager.produced,
   labourPaid:s.w5b.fabrikLohnBezahlt,minted:s.minted}));
 }
});
test('C1c-3: incomplete silicon work and unfinanced input never produce storage or components',()=>{
 let s=prepare(),before=c.hash(s);
 assert.equal(c.execute(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'}).ok,false);
 assert.equal(c.execute(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'}).ok,false);
 assert.equal(c.hash(s),before);
 execute(c,s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'});
 execute(c,s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
 advance(s,19);
 assert.equal(s.ledger.silizium.mined,1);
 assert.equal(s.stations.st_nadir.lager.silizium,0);
 assert.equal(s.ledger.bauteil.produced,0);
 assert.equal(s.ledger.lager.produced,0);
 before=c.hash(s);
 assert.equal(c.execute(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'}).ok,false);
 assert.equal(c.hash(s),before);
 s=loaded(s);advance(s,1);
 assert.equal(s.stations.st_nadir.lager.silizium,2);
 execute(c,s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 before=c.hash(s);
 assert.equal(c.execute(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'}).ok,false);
 assert.equal(c.hash(s),before);
});
test('C1c-3: forged work progress, material, component, cash, stored goods and mint rejected',()=>{
 const active=prepare();execute(c,active,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'});
 execute(c,active,{type:'shipMine',owner:'house',schiff:active.w5b.minerId,ware:'silizium'});
 advance(active,7);const s=storage(twoParts(silicon(prepare())));
 for(const change of [
  x=>x.w5b.siliziumLohnBezahlt++,
  x=>x.w5b.fabrikLohnBezahlt++,
  x=>x.w5b.lagerFertig++,
  x=>x.ledger.bauteil.produced++,
  x=>x.ledger.lager.produced++,
  x=>x.stations.st_nadir.lager.lager++,
  x=>x.owners.w5b_fabrik_arbeit.cash++,
  x=>{x.minted++;x.owners.house.cash++;},
  x=>x.c1b.profile=PARTS_PROFILE
 ]){
  const bad=structuredClone(s);change(bad);assert.throws(()=>c.load(JSON.stringify(bad)));
 }
 for(const change of [
  x=>x.w5b.siliziumAuftrag.gearbeitet++,
  x=>x.w5b.siliziumLohnBezahlt++,
  x=>x.ledger.silizium.mined++,
  x=>x.owners.w5b_silizium_arbeit.cash++,
 ]){
  const bad=structuredClone(active);change(bad);assert.throws(()=>c.load(JSON.stringify(bad)));
 }
});
test('C1c-3: deterministic replay across partial work, product transfer and all paid minutes',()=>{
 let s=prepare(42),replay=loaded(s);
 const steps=[
  ss=>execute(c,ss,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'}),
  ss=>execute(c,ss,{type:'shipMine',owner:'house',schiff:ss.w5b.minerId,ware:'silizium'})
 ];
 for(const action of steps){action(s);action(replay);}
 for(let i=0;i<20;i++){c.step(s);c.step(replay);good(s);if(i===6)s=loaded(s);assert.equal(c.hash(s),c.hash(replay));}
 for(const ss of [s,replay])execute(c,ss,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 for(let i=0;i<16;i++){c.step(s);c.step(replay);good(s);if(i===7)replay=loaded(replay);assert.equal(c.hash(s),c.hash(replay));}
 for(const ss of [s,replay])execute(c,ss,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
 for(let i=0;i<12;i++){c.step(s);c.step(replay);good(s);if(i===5)s=loaded(s);assert.equal(c.hash(s),c.hash(replay));}
 assert.equal(s.tick,228);assert.equal(s.ledger.lager.produced,1);assert.equal(c.hash(s),c.hash(replay));
});
