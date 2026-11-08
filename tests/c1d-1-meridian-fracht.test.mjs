import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,DELIVERY_PROFILE,STORAGE_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

const c=createResearchCore({profile:DELIVERY_PROFILE});
const prior=createResearchCore({profile:STORAGE_PROFILE});
function cmd(core,s,v){const p=core.execute(s,v);assert.equal(p.ok,true,p.reason);}
function good(s){
 const x=c.audit(s);assert.equal(x.ok,true,JSON.stringify(x));
 assert.equal(s.initialSupply,33000);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.ledger.lager.initial,0);
 assert.equal(s.ledger.lager.exported,0);
 assert.equal(s.w5q.minted,0);assert.equal(s.w5q.exported,0);
}
function step(s,n){for(let i=0;i<n;i++){c.step(s);good(s);}return s;}
function saved(s){const before=c.hash(s);const loaded=c.load(c.save(s));assert.equal(c.hash(loaded),before);return loaded;}
function manufactured(seed=42){
 let s=c.create(seed);good(s);
 cmd(c,s,{type:'shipWait',owner:'npc3',schiff:'sh001'});
 cmd(c,s,{type:'shipBuy',owner:'house',station:'st_aldera',klasse:'miner'});
 cmd(c,s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 step(s,60);
 cmd(c,s,{type:'shipWait',owner:'house',schiff:'sh003'});
 cmd(c,s,{type:'shipFreight',owner:'transport',schiff:'sh002'});
 step(s,60);
 cmd(c,s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 step(s,60);
 cmd(c,s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'});
 cmd(c,s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
 step(s,20);
 cmd(c,s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 step(s,16);
 cmd(c,s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
 step(s,12);
 assert.equal(s.tick,228);
 assert.equal(s.w5b.lagerFertig,1);
 assert.equal(s.stations.st_nadir.lager.lager,1);
 assert.equal(s.stations.st_meridian.lager.lager,0);
 assert.equal(s.ledger.lager.initial,0);
 return saved(s);
}
function delivery(s){
 const sellerBefore=s.owners.house.cash,carrierBefore=s.owners.transport.cash;
 const start=s.tick;
 cmd(c,s,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'});
 assert.equal(s.owners.house.cash,sellerBefore-300);
 assert.equal(s.owners.transport.cash,carrierBefore-240);
 assert.equal(s.owners.c1d_freight_escrow.cash,300);
 assert.equal(s.owners.c1d_pilot_escrow.cash,240);
 good(s);
 step(s,59);
 assert.equal(s.tick,start+59);
 assert.equal(s.stations.st_nadir.lager.lager,1);
 assert.equal(s.stations.st_meridian.lager.lager,0);
 assert.equal(s.owners.c1d_pilot.cash,59);
 s=saved(s);
 step(s,1);
 assert.equal(s.c1d.job.phase,'delivery');
 assert.equal(s.stations.st_nadir.lager.lager,0);
 assert.equal(s.ships.sh002.ladung.lager,1);
 assert.equal(s.owners.c1d_pilot.cash,60);
 s=saved(s);
 step(s,59);
 assert.equal(s.ships.sh002.ladung.lager,1);
 assert.equal(s.stations.st_meridian.lager.lager,0);
 step(s,1);
 assert.equal(s.c1d.job.phase,'return');
 assert.equal(s.c1d.delivered,1);
 assert.equal(s.stations.st_meridian.lager.lager,1);
 assert.equal(s.ships.sh002.ladung.lager||0,0);
 assert.equal(s.ledger.lager.exported,0);
 assert.equal(s.minted,0);
 assert.equal(s.owners.c1d_pilot.cash,120);
 assert.equal(s.owners.c1d_freight_escrow.cash,300);
 s=saved(s);
 step(s,119);
 assert.equal(s.c1d.completed,0);
 assert.equal(s.owners.c1d_pilot.cash,239);
 step(s,1);
 assert.equal(s.tick,start+240);
 assert.equal(s.c1d.job.phase,'finished');
 assert.equal(s.c1d.completed,1);
 assert.equal(s.c1d.feePaid,300);
 assert.equal(s.c1d.pilotPaid,240);
 assert.equal(s.owners.house.cash,sellerBefore-300);
 assert.equal(s.owners.transport.cash,carrierBefore-240+300);
 assert.equal(s.owners.c1d_pilot.cash,240);
 assert.equal(s.owners.c1d_freight_escrow.cash,0);
 assert.equal(s.owners.c1d_pilot_escrow.cash,0);
 assert.equal(s.ships.sh002.system,'aldera');
 assert.equal(s.ships.sh002.phase,'dock');
 assert.equal(s.ships.sh002.auftrag,'halten');
 assert.equal(s.stations.st_meridian.lager.lager,1);
 return saved(s);
}
test('C1d-1: research-only Meridian geography, immutable profile, zero initial cargo',()=>{
 const s=c.create();good(s);
 assert.equal(c.rules.rulesVersion,3306);
 assert.equal(c.rules.c1d.freightFee,300);
 assert.equal(c.rules.c1d.wagePerMinute,1);
 assert.equal(s.stations.st_meridian.lager.lager,0);
 assert.equal(s.ledger.lager.initial,0);
 assert.equal(s.owners.c1d_pilot.cash,0);
 assert.equal(s.owners.c1d_freight_escrow.cash,0);
 assert.ok(Object.isFrozen(c.rules.c1d));
 assert.equal(prior.rules.c1d,undefined);
 assert.throws(()=>prior.load(c.save(s)),/Profil/);
 assert.throws(()=>c.load(prior.save(prior.create())),/Profil/);
 assert.equal(c.execute(s,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'}).ok,false);
});
test('C1d-1: real paid Aldera-Nadir-Meridian-Aldera freight and warehouse, two seeds',()=>{
 for(const seed of [42,7]){
  const s=delivery(manufactured(seed));
  assert.equal(s.tick,468);
  assert.equal(s.c1d.delivered,1);
  assert.equal(s.c1d.completed,1);
  assert.equal(s.w5b.lagerFertig,1);
  assert.equal(s.stations.st_nadir.lager.lager,0);
  assert.equal(s.stations.st_meridian.lager.lager,1);
  assert.equal(s.ledger.lager.produced,1);
  assert.equal(s.ledger.lager.exported,0);
  assert.equal(s.minted,0);
  good(s);
  console.log('C1D1_DELIVERY '+JSON.stringify({seed,tick:s.tick,hash:c.hash(s),
   delivered:s.c1d.delivered,paidPilotMinutes:s.c1d.pilotPaid,
   feePaid:s.c1d.feePaid,warehouse:s.stations.st_meridian.lager.lager,mint:s.minted}));
 }
});
test('C1d-1: unproduced product, wrong owner and double contract reject without mutation',()=>{
 const s=c.create();
 const before=c.hash(s);
 assert.equal(c.execute(s,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'}).ok,false);
 assert.equal(c.hash(s),before);
 const full=manufactured();
 const h=c.hash(full);
 assert.equal(c.execute(full,{type:'shipCapitalFreight',owner:'house',schiff:'sh002'}).ok,false);
 assert.equal(c.hash(full),h);
 cmd(c,full,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'});
 const started=c.hash(full);
 assert.equal(c.execute(full,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'}).ok,false);
 assert.equal(c.hash(full),started);
 good(full);
});
test('C1d-1: deterministic replay through 240 paid flight minutes and saves',()=>{
 let a=manufactured(42),b=saved(a);
 for(const s of [a,b])cmd(c,s,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'});
 assert.equal(c.hash(a),c.hash(b));
 for(let i=1;i<=240;i++){
  c.step(a);c.step(b);good(a);
  if(i===30||i===60||i===119||i===120||i===200){a=saved(a);b=saved(b);}
  assert.equal(c.hash(a),c.hash(b));
 }
 assert.equal(a.stations.st_meridian.lager.lager,1);
 assert.equal(a.c1d.completed,1);
 assert.equal(a.minted,0);
});
test('C1d-1: forged cash, warehouse, transfer, pilot work, ownership and mint rejected',()=>{
 const mid=manufactured(),finished=delivery(manufactured());
 cmd(c,mid,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'});
 step(mid,61);
 for(const modify of [
  x=>x.c1d.pilotPaid++,
  x=>x.c1d.feeAllocated++,
  x=>x.c1d.job.phase='return',
  x=>x.c1d.job.ship='sh003',
  x=>x.ships.sh002.owner='house',
  x=>x.ships.sh002.ladung.lager=0,
  x=>x.owners.c1d_pilot_escrow.cash++,
  x=>x.owners.c1d_pilot.cash++,
  x=>x.owners.house.cash++,
  x=>x.stations.st_meridian.lager.lager++,
  x=>{x.minted++;x.owners.house.cash++;}
 ]){
  const x=structuredClone(mid);modify(x);assert.throws(()=>c.load(JSON.stringify(x)));
 }
 for(const modify of [
  x=>x.ledger.lager.exported++,
  x=>x.c1d.feePaid++,
  x=>x.c1d.delivered=0,
  x=>x.stations.st_nadir.lager.lager++,
  x=>x.stations.st_meridian.lager.lager=0,
  x=>x.owners.transport.cash++
 ]){
  const x=structuredClone(finished);modify(x);assert.throws(()=>c.load(JSON.stringify(x)));
 }
});
