import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,INTERNAL_DEMAND_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

const c = createResearchCore({profile:INTERNAL_DEMAND_PROFILE});
function audit(s) {
 const a=c.audit(s);
 assert.equal(a.ok,true,JSON.stringify(a));
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);
 assert.equal(s.burned,0);
}
function action(s,cmd) {
 const r=c.execute(s,cmd);
 assert.equal(r.ok,true,r.reason);
 audit(s);
}
function reject(s,cmd) {
 const original=c.hash(s);
 const r=c.execute(s,cmd);
 assert.equal(r.ok,false,'an already settled contract must reject '+cmd.type);
 assert.equal(c.hash(s),original);
}
function step(s,n) {for(let i=0;i<n;i++){c.step(s);audit(s);}return s;}
function clone(s) {
 const h=c.hash(s);
 const copy=c.load(c.save(s));
 assert.equal(c.hash(copy),h);
 return copy;
}
function produce(seed) {
 const s=c.create(seed);
 const initial=clone(s);
 action(s,{type:'shipWait',owner:'npc3',schiff:'sh001'});
 action(s,{type:'shipBuy',owner:'house',station:'st_aldera',klasse:'miner'});
 action(s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 step(s,60);
 action(s,{type:'shipWait',owner:'house',schiff:'sh003'});
 action(s,{type:'shipFreight',owner:'transport',schiff:'sh002'});
 step(s,60);
 for(let i=1;i<=4;i++) {
  action(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
  step(s,10);
  if(i===1)action(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'});
  action(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
  step(s,20);
  action(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
  step(s,16);
  if(i===4)action(s,{type:'stationPrepayStorage',owner:'export'});
  action(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
  step(s,12);
 }
 action(s,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'});
 step(s,240);
 action(s,{type:'stationAcceptStorage',owner:'export'});
 assert.equal(s.tick,592);
 const first=clone(s);
 action(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 step(s,10);
 action(s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 step(s,65);
 action(s,{type:'shipWait',owner:'house',schiff:'sh003'});
 let waiting=0;
 while(s.w5h.bestand<50&&waiting<180){step(s,1);waiting++;}
 assert.equal(s.w5h.bestand,50,'second wholesale ore title');
 action(s,{type:'shipFreight',owner:'transport',schiff:'sh002'});
 step(s,120);
 for(let i=0;i<3;i++){
  action(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
  step(s,10);
 }
 assert.equal(s.tick,870);
 for(let i=5;i<=8;i++){
  action(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
  step(s,20);
  action(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
  step(s,16);
  action(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
  step(s,12);
 }
 assert.equal(s.tick,1062);
 action(s,{type:'stationPrepayStorageSecond',owner:'export'});
 action(s,{type:'shipCapitalFreightSecond',owner:'transport',schiff:'sh002'});
 step(s,240);
 action(s,{type:'stationAcceptStorageSecond',owner:'export'});
 assert.equal(s.tick,1302);
 const second=clone(s);
 return {initial,first,second};
}

const scenarios=new Map([[42,produce(42)],[7,produce(7)]]);
function makeNinth(seed){
 const s=clone(scenarios.get(seed).second);
 assert.equal(s.c1f.secondOrder.status,'accepted');
 assert.equal(s.ledger.lager.produced,8);
 assert.equal(s.ledger.lager.exported,8);
 assert.equal(s.stations.st_nadir.lager.erz,20);
 const stationBefore=s.owners.st_nadir.cash;
 action(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 step(s,10);
 assert.equal(s.stations.st_nadir.lager.erz,10);
 assert.equal(s.stations.st_nadir.lager.material,4);
 action(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
 step(s,20);
 action(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 step(s,16);
 assert.equal(s.w5b.bauteilTitel[8].id,'C1D5-BT-0009');
 assert.equal(s.w5b.bauteilTitel[8].owner,'house');
 action(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
 step(s,12);
 assert.equal(s.tick,1360);
 assert.equal(s.stations.st_nadir.lager.lager,1);
 assert.equal(s.ledger.lager.produced,9);
 assert.equal(s.ledger.lager.exported,8);
 assert.equal(s.ledger.lager.consumed,0);
 assert.equal(s.c1g.installed,0);
 return {s:clone(s),stationBefore};
}
function installed(seed){
 const {s,stationBefore}=makeNinth(seed);
 const before={buyer:s.owners.st_nadir.cash,seller:s.owners.house.cash,
  module:s.stations.st_nadir.module.lager};
 action(s,{type:'stationInstallPaidStorage',owner:'st_nadir',station:'st_nadir'});
 assert.equal(s.owners.st_nadir.cash,before.buyer-430);
 assert.equal(s.owners.house.cash,before.seller+430);
 assert.equal(s.stations.st_nadir.module.lager,before.module+1);
 assert.equal(s.c1g.installed,1);
 assert.equal(s.ledger.lager.consumed,1);
 assert.equal(s.stations.st_nadir.lager.lager,0);
 return {s:clone(s),before,stationBefore};
}
test('C1d-10: 3314 separate isolated profile; old 3313 save cannot silently migrate',()=>{
 const old=createResearchCore({profile:'aphros-research:C1d-8b:second-paid-delivery-v1'});
 assert.equal(c.rules.rulesVersion,3314);
 assert.equal(c.rules.c1g.enabled,true);
 assert.equal(c.rules.w5b.maxStorageLots,9);
 assert.equal(old.rules.rulesVersion,3313);
 assert.equal(old.rules.c1g,undefined);
 assert.throws(()=>old.load(c.save(c.create())),/Profil/);
 assert.throws(()=>c.load(old.save(old.create())),/Profil/);
 audit(c.create());
});
test('C1d-10: ninth original module from ten residual ore and paid silicon/parts/fabrication',()=>{
 for(const seed of [42,7]){
  const {s}=makeNinth(seed);
  assert.equal(s.w4.materialErzeugt,36);
  assert.equal(s.w4.erzVerbraucht,90);
  assert.equal(s.w5b.siliziumAbgebaut,18);
  assert.equal(s.w5b.siliziumVerbraucht,18);
  assert.equal(s.w5b.bauteilFertig,9);
  assert.equal(s.w5b.lagerFertig,9);
  assert.equal(s.w5b.bauteilTitel[8].usedBy,'C1D5-LAGER-0009');
  assert.equal(s.ledger.lager.exported,8);
  assert.equal(s.minted,0);
  audit(s);
 }
});
test('C1d-10: Nadir buys ninth real good from its own cash; warehouse capacity rises',()=>{
 for(const seed of [42,7]){
  const {s,before}=installed(seed);
  const o=s.c1g.order;
  assert.equal(o.id,'C1D10-NADIR-0001');
  assert.equal(o.title,'C1D5-LAGER-0009');
  assert.equal(o.price,430);
  assert.equal(o.buyer,'st_nadir');
  assert.equal(o.seller,'house');
  assert.equal(o.capacityAfter>o.capacityBefore,true);
  assert.equal(s.owners.house.cash,before.seller+430);
  assert.equal(s.owners.st_nadir.cash,before.buyer-430);
  assert.equal(s.ledger.lager.produced,9);
  assert.equal(s.ledger.lager.exported,8);
  assert.equal(s.ledger.lager.consumed,1);
  assert.equal(Object.values(s.owners).reduce((a,x)=>a+x.cash,0),33000);
  assert.equal(s.minted,0);
  console.log('C1D10_INSTALLED '+JSON.stringify({seed,tick:s.tick,hash:c.hash(s),
   buyer:s.owners.st_nadir.cash,seller:s.owners.house.cash,
   oldCapacity:o.capacityBefore,newCapacity:o.capacityAfter,ledger:s.ledger.lager}));
 }
});
test('C1d-10: station must have original money, title and local goods; never double-buy',()=>{
 for(const seed of [42,7]){
  const {s}=makeNinth(seed);
  const foreign=clone(s);
  reject(foreign,{type:'stationInstallPaidStorage',owner:'house',station:'st_nadir'});
  reject(foreign,{type:'stationInstallPaidStorage',owner:'st_nadir',station:'st_aldera'});
  const short=structuredClone(s);
  const delta=short.owners.st_nadir.cash-429;
  short.owners.st_nadir.cash=429;
  short.owners.house.cash+=delta; // a payment without journal is NOT a funded order
  assert.equal(c.audit(short).ok,false);
  const done=installed(seed).s;
  reject(done,{type:'stationInstallPaidStorage',owner:'st_nadir',station:'st_nadir'});
  assert.equal(done.c1g.installed,1);
 }
});
test('C1d-10: forged buyer budget, unit title, price, capacity, journals and goods rejected',()=>{
 const {s}=installed(42);
 const tamper=[
  x=>x.owners.st_nadir.cash++,
  x=>x.owners.house.cash++,
  x=>x.c1g.order.price++,
  x=>x.c1g.order.title='C1D5-LAGER-0008',
  x=>x.c1g.order.buyer='export',
  x=>x.c1g.order.buyerBefore++,
  x=>x.c1g.order.sellerJournal.revenue++,
  x=>x.c1g.order.capacityAfter++,
  x=>x.c1g.installed=0,
  x=>x.stations.st_nadir.module.lager++,
  x=>x.ledger.lager.consumed=0,
  x=>x.ledger.lager.produced=10,
  x=>x.w5b.bauteilTitel[8].owner='st_nadir',
  x=>x.minted++
 ];
 for(let i=0;i<tamper.length;i++){
  const bad=structuredClone(s);tamper[i](bad);
  assert.throws(()=>c.load(JSON.stringify(bad)),'forgery '+i);
 }
});
test('C1d-10: deterministic replay, saves, both seeds and 200-tick post-install world audit',()=>{
 for(const seed of [42,7]){
  const initial=installed(seed).s;
  let a=clone(initial),b=clone(initial);
  assert.equal(c.hash(a),c.hash(b));
  for(let i=0;i<200;i++){
   c.step(a);c.step(b);audit(a);audit(b);
   assert.equal(c.hash(a),c.hash(b));
   if(i===99){a=clone(a);b=clone(b);}
  }
  assert.equal(a.c1g.installed,1);
  assert.equal(a.ledger.lager.exported,8);
  assert.equal(a.ledger.lager.consumed,1);
  assert.equal(a.minted,0);
 }
});
