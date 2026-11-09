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
 assert.equal(s.stations.st_nadir.module.lager,(before.module||0)+1);
 assert.equal(s.c1g.installed,1);
 assert.equal(s.ledger.lager.consumed,1);
 assert.equal(s.stations.st_nadir.lager.lager,0);
 return {s:clone(s),before,stationBefore};
}

function fundingCase(seed){
 const s=makeNinth(seed).s;
 const thirdStart={tick:s.tick,stationCash:s.owners.st_nadir.cash,
   ore:s.stations.st_nadir.lager.erz};
 action(s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 let waited=0;
 while(s.w5h.bestand<50&&waited<200){step(s,1);waited++;}
 assert.equal(waited,80);
 assert.equal(s.w5h.bestand,50);
 action(s,{type:'shipWait',owner:'house',schiff:'sh003'});
 const thirdQuote=c.stationInvestmentQuote(s);
 assert.equal(thirdQuote.originalW3Available,true);
 action(s,{type:'shipFreight',owner:'transport',schiff:'sh002'});
 const inFlight=clone(s);
 assert.equal(inFlight.w3.auftrag.phase,'hin');
 step(s,120);
 assert.equal(s.w3.geliefert,150);
 assert.equal(s.stations.st_nadir.lager.erz,60);
 assert.equal(s.owners.st_nadir.cash,1118);
 action(s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 waited=0;
 while(s.w5h.bestand<50&&waited<200){step(s,1);waited++;}
 assert.equal(waited,120);
 action(s,{type:'shipWait',owner:'house',schiff:'sh003'});
 assert.equal(s.tick,1680);
 assert.equal(s.w5h.bestand,50);
 assert.equal(s.owners.st_nadir.cash,1118);
 assert.equal(s.stations.st_nadir.lager.erz,60);
 const common=clone(s);
 return {common,inFlight,thirdStart,thirdQuote};
}
const cases=new Map([[42,fundingCase(42)],[7,fundingCase(7)]]);
function fork(seed){
 const {common}=cases.get(seed);
 const noUpgrade=clone(common),upgraded=clone(common);
 const quote=c.stationInvestmentQuote(noUpgrade);
 action(upgraded,{type:'stationInstallPaidStorage',owner:'st_nadir',station:'st_nadir'});
 const quoteAfter=c.stationInvestmentQuote(upgraded);
 return {noUpgrade,upgraded,quote,quoteAfter};
}

test('C1d-11: original second C1d freight proof stays valid throughout a later funded W3 roundtrip',()=>{
 for(const seed of [42,7]){
  const {inFlight,thirdQuote}=cases.get(seed);
  assert.equal(inFlight.w3.auftrag.phase,'hin');
  assert.equal(inFlight.c1d.second.job.phase,'finished');
  assert.equal(inFlight.c1d.second.completed,1);
  assert.equal(inFlight.c1f.secondAccepted,4);
  assert.equal(inFlight.ships.sh002.auftrag,'fracht');
  assert.equal(inFlight.owners.c1d_freight_escrow.cash,0);
  assert.equal(inFlight.owners.c1d_pilot_escrow.cash,0);
  assert.equal(thirdQuote.w3ContractCost,740);
  let a=clone(inFlight),b=clone(inFlight);
  for(let i=0;i<120;i++){
   c.step(a);c.step(b);audit(a);audit(b);
   assert.equal(c.hash(a),c.hash(b));
   if(i===59){a=clone(a);b=clone(b);}
  }
  assert.equal(a.w3.geliefert,150);
  assert.equal(a.c1d.second.completed,1);
  assert.equal(a.ledger.lager.exported,8);
  assert.equal(a.minted,0);
 }
});

test('C1d-11: read-only original Core quote exposes zero congestion and actual W3 financial cost',()=>{
 for(const seed of [42,7]){
  const {common,thirdQuote}=cases.get(seed);
  const h=c.hash(common);
  const q=c.stationInvestmentQuote(common);
  assert.equal(c.hash(common),h,'quote must leave all authoritative state untouched');
  assert.equal(Object.isFrozen(q),true);
  assert.equal(q.tick,1680);
  assert.equal(q.capacity,625);
  assert.equal(q.stock,60);
  assert.equal(q.remainingCapacity,565);
  assert.equal(q.upcomingUnits,50);
  assert.equal(q.capacityBottleneck,false);
  assert.equal(q.cash,1118);
  assert.equal(q.unitPrice,430);
  assert.equal(q.w3ContractCost,740);
  assert.equal(q.cashAfterInvestment,688);
  assert.equal(q.fundsForW3Before,true);
  assert.equal(q.fundsForW3After,false);
  assert.equal(q.originalW3Available,true);
  assert.equal(q.ownedOre,50);
  assert.equal(q.justifiedAutomaticPurchase,false);
  assert.equal(thirdQuote.capacityBottleneck,false);
  assert.equal(thirdQuote.originalW3Available,true);
  assert.equal(thirdQuote.justifiedAutomaticPurchase,false);
 }
});

test('C1d-11: genuine fourth W3 cargo succeeds without 430-ISK investment; fails solely buyer-cash after it',()=>{
 for(const seed of [42,7]){
  const {noUpgrade,upgraded,quote,quoteAfter}=fork(seed);
  assert.equal(quote.cash,1118);
  assert.equal(quoteAfter.cash,688);
  assert.equal(quoteAfter.capacity,937);
  assert.equal(quoteAfter.capacityBottleneck,false);
  assert.equal(quoteAfter.ownedOre,50);
  assert.equal(quoteAfter.w3ContractCost,740);
  assert.equal(quoteAfter.originalW3Available,false);
  assert.match(quoteAfter.w3BlockReason,/Kaeufer kann Ware/);
  reject(upgraded,{type:'shipFreight',owner:'transport',schiff:'sh002'});
  assert.equal(upgraded.owners.st_nadir.cash,688);
  assert.equal(upgraded.w3.geliefert,150);
  assert.equal(upgraded.w5h.bestand,50);
  action(noUpgrade,{type:'shipFreight',owner:'transport',schiff:'sh002'});
  step(noUpgrade,120);
  assert.equal(noUpgrade.w3.abgeschlossen,4);
  assert.equal(noUpgrade.w3.geliefert,200);
  assert.equal(noUpgrade.owners.st_nadir.cash,378);
  assert.equal(noUpgrade.stations.st_nadir.lager.erz,110);
  assert.equal(noUpgrade.ships.sh002.auftrag,'halten');
  assert.equal(noUpgrade.ledger.lager.consumed,0);
  assert.equal(upgraded.ledger.lager.consumed,1);
  assert.equal(noUpgrade.minted,0);
  assert.equal(upgraded.minted,0);
  console.log('C1D11_TRADEOFF '+JSON.stringify({seed,
   tickBefore:quote.tick,stationCashBefore:quote.cash,stationCashAfterUpgrade:quoteAfter.cash,
   oldCapacity:quote.capacity,newCapacity:quoteAfter.capacity,
   freightCost:quote.w3ContractCost,oldStored:quote.stock,
   deliveryUnits:quote.upcomingUnits,
   deliveryWithoutUpgrade:noUpgrade.w3.geliefert,
   deliveryWithUpgrade:upgraded.w3.geliefert,
   withoutUpgradeCash:noUpgrade.owners.st_nadir.cash,
   withUpgradeCash:upgraded.owners.st_nadir.cash,
   noUpgradeHash:c.hash(noUpgrade),upgradeHash:c.hash(upgraded)
  }));
 }
});

test('C1d-11: false historical W3 reuse, forged freight financing and fake cargo rejected',()=>{
 for(const seed of [42,7]){
  const state=cases.get(seed).inFlight;
  const mutations=[
   s=>s.w3.auftrag=null,
   s=>s.w3.auftrag.schiff='sh003',
   s=>s.w3.auftrag.gesamt+=1,
   s=>s.owners.w3_kauf_treuhand.cash-=1,
   s=>s.c1d.second.job.ship='sh003',
   s=>s.c1d.second.job.paidMinutes--,
   s=>s.c1f.secondOrder.status='prepaid',
   s=>s.ships.sh002.owner='house',
   s=>s.ledger.erz.mined++,
  ];
  for(let i=0;i<mutations.length;i++){
   const bad=structuredClone(state);mutations[i](bad);
   assert.equal(c.audit(bad).ok,false,'undetected tampering '+i);
   assert.throws(()=>c.load(JSON.stringify(bad)),undefined,'load forgery '+i);
  }
 }
});

test('C1d-11: same source, price, cargo and company balances at investment fork; strict save isolation',()=>{
 for(const seed of [42,7]){
  const {noUpgrade,upgraded,quote}=fork(seed);
  const before=clone(cases.get(seed).common);
  for(const field of ['haus','station']){
   assert.equal(Object.values(noUpgrade.owners).reduce((n,o)=>n+o.cash,0),33000);
   assert.equal(Object.values(upgraded.owners).reduce((n,o)=>n+o.cash,0),33000);
  }
  assert.equal(noUpgrade.w5h.bestand,50);
  assert.equal(upgraded.w5h.bestand,50);
  assert.equal(noUpgrade.stations.st_nadir.lager.erz,60);
  assert.equal(upgraded.stations.st_nadir.lager.erz,60);
  assert.equal(noUpgrade.ships.sh002.auftrag,upgraded.ships.sh002.auftrag);
  assert.equal(upgraded.owners.st_nadir.cash+430,noUpgrade.owners.st_nadir.cash);
  assert.equal(upgraded.owners.house.cash-430,noUpgrade.owners.house.cash);
  assert.equal(upgraded.ledger.lager.consumed-noUpgrade.ledger.lager.consumed,1);
  assert.equal(c.hash(c.load(c.save(noUpgrade))),c.hash(noUpgrade));
  assert.equal(c.hash(c.load(c.save(upgraded))),c.hash(upgraded));
  assert.equal(c.hash(before),c.hash(cases.get(seed).common));
 }
});

test('C1d-11: manual loss-making purchase remains possible, only NPC advice refuses it',()=>{
 const {noUpgrade,upgraded,quote}=fork(42);
 assert.equal(quote.justifiedAutomaticPurchase,false);
 assert.equal(noUpgrade.c1g.installed,0);
 assert.equal(upgraded.c1g.installed,1);
 assert.equal(upgraded.c1g.order.status,'installed');
 assert.equal(noUpgrade.rulesVersion,3314);
 assert.equal(upgraded.rulesVersion,3314);
 assert.equal(noUpgrade.c1b.profile,upgraded.c1b.profile);
 audit(noUpgrade);audit(upgraded);
});
