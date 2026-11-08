import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,SECOND_EXPORT_PROFILE} from '../tools/research/c1b-1-wasser.mjs';
import {analyzeC1d9} from '../tools/research/c1d-9-kapitalreichweite.mjs';

const c = createResearchCore({profile:SECOND_EXPORT_PROFILE});
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
const scenarios = new Map([[42,produce(42)],[7,produce(7)]]);
function report(seed) {
 const x=scenarios.get(seed);
 return analyzeC1d9(x.initial,x.first,x.second,c.rules);
}

test('C1d-9: independent two-period cash bridges, every owner and both seeds',()=>{
 for(const seed of [42,7]) {
  const r=report(seed);
  assert.equal(r.ok,true,JSON.stringify(r.issues));
  assert.deepEqual(r.ticks,[0,592,1302]);
  assert.deepEqual(r.supply,[33000,33000,33000]);
  assert.equal(Object.values(r.balances).reduce((n,x)=>n+x.totalDelta,0),0);
  assert.deepEqual([r.balances.house.start,r.balances.house.first,r.balances.house.second],
   [3000,2740,3572]);
  assert.deepEqual([r.balances.export.start,r.balances.export.first,r.balances.export.second],
   [20000,18180,16460]);
  assert.deepEqual([r.balances.transport.start,r.balances.transport.first,r.balances.transport.second],
   [1250,1430,1610]);
  assert.equal(r.balances.st_nadir.totalDelta,-24);
  assert.equal(r.balances.werft_extern.totalDelta,1200);
  console.log('C1D9_CAPITAL_BRIDGE '+JSON.stringify({
   seed,hash:c.hash(scenarios.get(seed).second),
   balances:r.balances,supply:r.supply,demand:r.demand,capital:r.capital
  }));
 }
});

test('C1d-9: distinguish 1200 ISK hull capex, 536 direct module contribution and full cash',()=>{
 for(const seed of [42,7]) {
  const r=report(seed);
  assert.equal(r.ok,true,JSON.stringify(r.issues));
  assert.equal(r.capital.paidMiners,1200);
  assert.equal(r.capital.retainedMiners,2);
  assert.equal(r.capital.cashChange,572);
  assert.equal(r.capital.operatingCashBeforeCapital,1772);
  assert.equal(r.cost.buyerPayments,3440);
  assert.equal(r.cost.manufacturerDirectOutlay,2904);
  assert.equal(r.cost.manufacturerContributionBeforeOtherCosts,536);
  assert.equal(r.cost.carrierCashChange,360);
  assert.equal(r.cost.retainedOreWithoutFairValue,44);
  assert.equal(r.cost.directlyPaid.modulePilotLabor,480);
  assert.equal(r.cost.directlyPaid.oreTransportLabor,240);
  assert.equal(r.cost.directlyPaid.refineryLabor,80);
  assert.equal(r.quantities.storageSold,8);
 }
});

test('C1d-9: buyer still has ISK, but no third legitimate order or freighter contract',()=>{
 for(const seed of [42,7]) {
  const r=report(seed),s=clone(scenarios.get(seed).second);
  assert.equal(r.demand.salesPaid,3440);
  assert.equal(r.demand.otherBuyerCashNet,-100);
  assert.equal(r.demand.buyerAfterSecond,16460);
  assert.equal(r.demand.buyerCashOnlyFourUnitLots,9);
  assert.equal(r.demand.remainingAuthorizedLots,0);
  for(const cmd of [
   {type:'stationPrepayStorage',owner:'export'},
   {type:'stationPrepayStorageSecond',owner:'export'},
   {type:'shipCapitalFreight',owner:'transport',schiff:'sh002'},
   {type:'shipCapitalFreightSecond',owner:'transport',schiff:'sh002'},
   {type:'stationAcceptStorageSecond',owner:'export'}
  ])reject(s,cmd);
  audit(s);
 }
});

test('C1d-9: all original title, labor and money audits survive 200 further ticks',()=>{
 for(const seed of [42,7]){
  const s=clone(scenarios.get(seed).second);
  const h=c.hash(s),copy=clone(s);
  assert.equal(c.hash(copy),h);
  for(let i=0;i<200;i++){
   c.step(s);c.step(copy);audit(s);audit(copy);
   assert.equal(c.hash(s),c.hash(copy));
  }
  assert.equal(s.ledger.lager.exported,8);
  assert.equal(s.c1f.secondAccepted,4);
  assert.equal(s.minted,0);
  reject(s,{type:'stationPrepayStorageSecond',owner:'export'});
 }
});

test('C1d-9: historical snapshots read-only and tampered multi-owner reports rejected',()=>{
 for(const seed of [42,7]) {
  const x=scenarios.get(seed);
  const previous=[x.initial,x.first,x.second].map(s=>JSON.stringify(s));
  assert.equal(report(seed).ok,true);
  assert.deepEqual([x.initial,x.first,x.second].map(s=>JSON.stringify(s)),previous);
  const changes=[
   s=>s.owners.house.cash++,
   s=>s.owners.export.cash++,
   s=>s.owners.st_nadir.cash++,
   s=>s.owners.transport.cash++,
   s=>s.stats.konto.house.erloes++,
   s=>s.c1f.secondSettled--,
   s=>s.c1d.second.pilotPaid--,
   s=>s.owners.c1d_freight_escrow.cash++,
   s=>s.w5b.bauteilTitel[5].owner='export',
   s=>s.ledger.erz.mined++,
   s=>s.minted++
  ];
  for(const alter of changes){
   const bad=structuredClone(x.second);
   alter(bad);
   const r=analyzeC1d9(x.initial,x.first,bad,c.rules);
   assert.equal(r.ok,false,'missing independent detection: '+alter.toString());
  }
 }
});

test('C1d-9: separate opt-in saves and exact final seed hashes unchanged',()=>{
 const expected=new Map([[42,'71c6e1551d7beeda'],[7,'e8f25c091fcecf04']]);
 for(const seed of [42,7]) {
  const s=scenarios.get(seed).second;
  assert.equal(c.hash(s),expected.get(seed));
  assert.equal(c.hash(c.load(c.save(s))),expected.get(seed));
  const r=report(seed);
  assert.equal(r.ok,true,JSON.stringify(r.issues));
 }
});
