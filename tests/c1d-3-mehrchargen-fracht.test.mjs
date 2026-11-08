import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,BUNDLE_PROFILE,EXPORT_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

const c=createResearchCore({profile:BUNDLE_PROFILE});
const one=createResearchCore({profile:EXPORT_PROFILE});
function command(s,v){const r=c.execute(s,v);assert.equal(r.ok,true,r.reason);}
function check(s){
 const x=c.audit(s);assert.equal(x.ok,true,JSON.stringify(x));
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.w5q.minted,0);assert.equal(s.w5q.exported,0);
 assert.equal(s.ledger.lager.initial,0);assert.equal(s.ledger.lager.exported,0);
 assert.equal(s.c1d.feeAllocated,s.c1d.ordered*300);
 assert.equal(s.c1d.pilotAllocated,s.c1d.ordered*240);
}
function ticks(s,n){
 for(let i=0;i<n;i++){c.step(s);check(s)}
 return s;
}
function saved(s){
 const before=c.hash(s),copy=c.load(c.save(s));
 assert.equal(c.hash(copy),before);
 return copy;
}
function oreStart(seed=42){
 let s=c.create(seed);check(s);
 command(s,{type:'shipWait',owner:'npc3',schiff:'sh001'});
 command(s,{type:'shipBuy',owner:'house',station:'st_aldera',klasse:'miner'});
 command(s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 ticks(s,60);
 command(s,{type:'shipWait',owner:'house',schiff:'sh003'});
 command(s,{type:'shipFreight',owner:'transport',schiff:'sh002'});
 ticks(s,60);
 assert.equal(s.w3.geliefert,50);
 assert.equal(s.w3.abgeschlossen,0); // The fully paid return journey remains in progress.
 return saved(s);
}
function oneLot(s,lot){
 command(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 ticks(s,10);
 if(lot===1)command(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'});
 command(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
 ticks(s,20);
 command(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 ticks(s,16);
 command(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
 ticks(s,12);
 assert.equal(s.w5b.lagerFertig,lot);
 assert.equal(s.stations.st_nadir.lager.lager,lot);
 assert.equal(s.w4.abgeschlossen,lot);
 return saved(s);
}
function made(seed=42){
 let s=oreStart(seed);
 for(let i=1;i<=3;i++)s=oneLot(s,i);
 assert.equal(s.tick,294);
 assert.equal(s.owners.house.cash,540);
 assert.equal(s.ledger.erz.consumed,30);
 assert.equal(s.stations.st_nadir.lager.erz,20);
 assert.equal(s.w4.materialErzeugt,12);
 assert.equal(s.w5b.siliziumAbgebaut,6);
 assert.equal(s.w5b.siliziumLohnBezahlt,60);
 assert.equal(s.ledger.bauteil.produced,6);
 assert.equal(s.ledger.bauteil.consumed,6);
 assert.equal(s.w5b.fabrikLohnBezahlt,84);
 assert.equal(s.ledger.lager.produced,3);
 return saved(s);
}
function bundled(seed=42){
 let s=made(seed);const madeCash=s.owners.house.cash;
 assert.throws(()=>c.execute(s,{type:'stationExportReserve',owner:'house',station:'st_meridian'}),/Befehl/);
 for(let i=0;i<240;i++){
  const sh=s.ships.sh002;
  if(sh.phase==='dock'&&sh.system==='aldera'
    &&sh.auftrag==='halten'&&!s.w3.auftrag&&!s.w5n.frachtauftrag)break;
  ticks(s,1);
 }
 assert.equal(s.tick,294);
 command(s,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'});
 assert.equal(s.owners.house.cash,madeCash-300);
 assert.equal(s.owners.c1d_freight_escrow.cash,300);
 assert.equal(s.owners.c1d_pilot_escrow.cash,240);
 ticks(s,59);
 assert.equal(s.stations.st_nadir.lager.lager,3);
 assert.equal(s.stations.st_meridian.lager.lager,0);
 s=saved(s);
 ticks(s,1);
 assert.equal(s.ships.sh002.ladung.lager,3);
 assert.equal(s.stations.st_nadir.lager.lager,0);
 ticks(s,59);
 assert.equal(s.stations.st_meridian.lager.lager,0);
 assert.equal(s.ships.sh002.ladung.lager,3);
 ticks(s,1);
 assert.equal(s.tick,414);
 assert.equal(s.stations.st_meridian.lager.lager,3);
 assert.equal(s.ships.sh002.ladung.lager||0,0);
 assert.equal(s.c1d.delivered,1);
 s=saved(s);
 ticks(s,120);
 assert.equal(s.tick,534);
 assert.equal(s.c1d.completed,1);
 assert.equal(s.c1d.pilotPaid,240);
 assert.equal(s.c1d.feePaid,300);
 assert.equal(s.owners.c1d_freight_escrow.cash,0);
 assert.equal(s.owners.c1d_pilot_escrow.cash,0);
 assert.equal(s.ships.sh002.system,'aldera');
 assert.equal(s.ships.sh002.phase,'dock');
 assert.equal(s.owners.house.cash,240);
 assert.equal(s.ledger.lager.exported,0);
 assert.equal(s.minted,0);
 return saved(s);
}
test('C1d-3: old 3307 export profile unchanged, isolated 3308 multi-lot rules',()=>{
 const s=c.create();check(s);
 assert.equal(c.rules.rulesVersion,3308);
 assert.equal(c.rules.c1d.quantity,3);
 assert.equal(c.rules.w5b.maxSiliconLots,4);
 assert.equal(c.rules.w5b.maxPartsLots,4);
 assert.equal(c.rules.w5b.maxStorageLots,4);
 assert.ok(Object.isFrozen(c.rules.w5b));
 assert.equal(c.rules.c1e,undefined);
 assert.equal(one.rules.rulesVersion,3307);
 assert.equal(one.rules.c1d.quantity,undefined);
 assert.equal(one.rules.w5b.maxStorageLots,undefined);
 assert.throws(()=>c.load(one.save(one.create())),/Profil/);
 assert.throws(()=>one.load(c.save(s)),/Profil/);
});
test('C1d-3: three separately financed production lots, two verified seeds',()=>{
 for(const seed of [42,7]){
  const s=made(seed);
  assert.equal(s.stations.st_nadir.lager.lager,3);
  assert.equal(s.ledger.lager.produced,3);
  assert.equal(s.ledger.lager.exported,0);
  check(s);
  console.log('C1D3_MADE '+JSON.stringify({seed,tick:s.tick,
   hash:c.hash(s),storage:s.w5b.lagerFertig,house:s.owners.house.cash,
   siliconMinutes:s.w5b.siliziumLohnBezahlt,industryMinutes:s.w5b.fabrikLohnBezahlt}));
 }
});
test('C1d-3: physical three-unit combined shipment and paid return',()=>{
 for(const seed of [42,7]){
  const s=bundled(seed);
  check(s);
  console.log('C1D3_DELIVERY '+JSON.stringify({seed,tick:s.tick,
   hash:c.hash(s),storage:s.stations.st_meridian.lager.lager,
   pilotMinutes:s.c1d.pilotPaid,freightCash:s.c1d.feePaid,minted:s.minted}));
 }
});
test('C1d-3: fourth lot is stopped by 40 real ISK shortfall, not a fake mining quota',()=>{
 let s=made(42);
 command(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 ticks(s,10);
 command(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
 ticks(s,20);
 command(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 ticks(s,16);
 assert.equal(s.w4.abgeschlossen,4);
 assert.equal(s.w5b.siliziumAbgeschlossen,4);
 assert.equal(s.w5b.bauteilFertig,4);
 assert.equal(s.w5b.lagerFertig,3);
 assert.equal(s.owners.house.cash,312);
 assert.equal(c.rules.w5b.maxStorageLots,4);
 assert.equal(s.stations.st_nadir.lager.lager,3);
 const h=c.hash(s),cash=s.owners.house.cash;
 const result=c.execute(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
 assert.equal(result.ok,false);
 assert.match(result.reason,/bezahlen/);
 assert.equal(c.hash(s),h);
 assert.equal(s.owners.house.cash,cash);
 assert.equal(s.ledger.lager.produced,3);
 assert.equal(s.ledger.bauteil.produced,8);
 assert.equal(s.minted,0);
 check(s);
});
test('C1d-3: saved goods and money remain deterministic during factory and combined freight',()=>{
 let a=made(42),b=saved(a);
 for(const ss of [a,b])command(ss,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'});
 assert.equal(c.hash(a),c.hash(b));
 for(let i=0;i<240;i++){
  c.step(a);c.step(b);check(a);
  if([29,59,119,197,239].includes(i)){a=saved(a);b=saved(b)}
  assert.equal(c.hash(a),c.hash(b));
 }
 assert.equal(a.c1d.completed,1);
 assert.equal(a.stations.st_meridian.lager.lager,3);
 for(let i=0;i<120;i++){c.step(a);check(a);}
 assert.equal(a.minted,0);
 assert.equal(a.ledger.lager.exported,0);
});
test('C1d-3: no premature freight, fake cargo, forged work, money or export',()=>{
 let a=oreStart();const h=c.hash(a);
 assert.equal(c.execute(a,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'}).ok,false);
 assert.equal(c.hash(a),h);
 const paid=bundled();
 for(const modify of [
  x=>x.ledger.lager.produced++,
  x=>x.ledger.lager.exported++,
  x=>x.stations.st_meridian.lager.lager++,
  x=>x.stations.st_nadir.lager.lager++,
  x=>x.w5b.siliziumLohnBezahlt++,
  x=>x.w5b.lagerFertig++,
  x=>x.c1d.pilotPaid++,
  x=>x.c1d.feePaid++,
  x=>x.owners.house.cash++,
  x=>{x.minted++;x.owners.house.cash++;}
 ]){
  const bad=structuredClone(paid);modify(bad);
  assert.throws(()=>c.load(JSON.stringify(bad)));
 }
});
