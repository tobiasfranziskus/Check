import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,TITLE_PROFILE,FINANCED_PROFILE,BUNDLE_PROFILE,EXPORT_PROFILE} from '../tools/research/c1b-1-wasser.mjs';
import {analyzeC1d6} from '../tools/research/c1d-6-vollkosten.mjs';

const c=createResearchCore({profile:TITLE_PROFILE});
const prior=createResearchCore({profile:FINANCED_PROFILE});
const three=createResearchCore({profile:BUNDLE_PROFILE});
const minted=createResearchCore({profile:EXPORT_PROFILE});
function command(s,cmd){const x=c.execute(s,cmd);assert.equal(x.ok,true,x.reason);}
function reject(s,cmd,pattern){
 const hash=c.hash(s),r=c.execute(s,cmd);
 assert.equal(r.ok,false);
 if(pattern)assert.match(r.reason,pattern);
 assert.equal(c.hash(s),hash);
}
function audit(s){
 const a=c.audit(s);assert.equal(a.ok,true,JSON.stringify(a));
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.w5q.minted,0);assert.equal(s.c1e,undefined);
 assert.equal(s.ledger.lager.initial,0);
}
function step(s,n){for(let i=0;i<n;i++){c.step(s);audit(s)}return s;}
function save(s){let h=c.hash(s),copy=c.load(c.save(s));assert.equal(c.hash(copy),h);return copy;}
function start(seed=42){
 let s=c.create(seed);audit(s);
 command(s,{type:'shipWait',owner:'npc3',schiff:'sh001'});
 command(s,{type:'shipBuy',owner:'house',station:'st_aldera',klasse:'miner'});
 command(s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 step(s,60);
 command(s,{type:'shipWait',owner:'house',schiff:'sh003'});
 command(s,{type:'shipFreight',owner:'transport',schiff:'sh002'});
 step(s,60);
 assert.equal(s.w3.geliefert,50);
 return save(s);
}
function lot(s,i,storage=true){
 command(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 step(s,10);
 if(i===1)command(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'});
 command(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
 step(s,20);
 command(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 step(s,16);
 if(storage){
  command(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
  step(s,12);
 }
 return save(s);
}
function ready(seed=42){
 let s=start(seed);
 for(let i=1;i<=3;i++)s=lot(s,i);
 assert.equal(s.tick,294);
 assert.equal(s.w5b.lagerFertig,3);
 assert.equal(s.owners.house.cash,1560);
 s=lot(s,4,false);
 assert.equal(s.tick,340);
 assert.equal(s.owners.house.cash,1332);
 assert.equal(s.w5b.bauteilFertig,4);
 assert.equal(s.stations.st_nadir.lager.bauteil,2);
 return save(s);
}
function funded(seed=42){
 let s=ready(seed);
 const before=s.owners.export.cash;
 command(s,{type:'stationPrepayStorage',owner:'export'});
 assert.equal(s.c1f.advanced,340);
 assert.equal(s.owners.c1f_kaufrest_escrow.cash,1380);
 assert.equal(s.owners.export.cash,before-1720);
 assert.equal(s.owners.house.cash,1672);
 reject(s,{type:'stationPrepayStorage',owner:'export'});
 s=save(s);
 command(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
 step(s,12);
 assert.equal(s.tick,352);
 assert.equal(s.w5b.lagerFertig,4);
 assert.equal(s.owners.house.cash,1660);
 assert.equal(s.stations.st_nadir.lager.lager,4);
 return save(s);
}
function delivered(seed=42){
 let s=funded(seed);
 reject(s,{type:'stationAcceptStorage',owner:'export'},/Lieferung/);
 command(s,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'});
 assert.equal(s.owners.house.cash,1360);
 assert.equal(s.owners.c1d_freight_escrow.cash,300);
 assert.equal(s.owners.c1d_pilot_escrow.cash,240);
 step(s,60);
 assert.equal(s.ships.sh002.ladung.lager,4);
 s=save(s);
 step(s,60);
 assert.equal(s.stations.st_meridian.lager.lager,4);
 assert.equal(s.c1d.delivered,1);
 reject(s,{type:'stationAcceptStorage',owner:'export'},/Rückflug/);
 step(s,120);
 assert.equal(s.tick,592);
 assert.equal(s.c1d.completed,1);
 assert.equal(s.c1d.pilotPaid,240);
 assert.equal(s.c1d.feePaid,300);
 assert.equal(s.owners.c1d_pilot_escrow.cash,0);
 assert.equal(s.ships.sh002.system,'aldera');
 assert.equal(s.ships.sh002.phase,'dock');
 return save(s);
}


function finished(seed=42){
 const initial=c.create(seed);
 const final=delivered(seed);
 command(final,{type:'stationAcceptStorage',owner:'export'});
 audit(final);
 const report=analyzeC1d6(initial,final,c.rules);
 assert.equal(report.ok,true,JSON.stringify(report.issues));
 return {initial,final,report};
}
test('C1d-6: seed42 and seed7 conserve every ISK and validate paid cross-company cash bridges',()=>{
 for(const seed of [42,7]){
  const {initial,final,report}=finished(seed);
  assert.equal(report.tick,592);
  assert.equal(report.supply.start,33000);
  assert.equal(report.supply.end,33000);
  assert.equal(Object.values(report.balances).reduce((n,row)=>n+row.delta,0),0);
  assert.equal(final.minted,0);
  assert.equal(final.burned,0);
  assert.equal(report.cashBridge.house.expected,2740);
  assert.equal(report.cashBridge.export.expected,18180);
  assert.equal(report.cashBridge.st_nadir.expected,1688);
  assert.equal(report.cashBridge.transport.expected,1430);
  assert.equal(report.cashBridge.werft_extern.expected,2550);
  console.log('C1D6_OWNER_BALANCE '+JSON.stringify({seed,hash:c.hash(final),
   ownerCash:Object.fromEntries(Object.entries(report.cashBridge).map(([k,v])=>[k,v.actual])),
   supply:report.supply,treasuries:report.treasuries}));
 }
});
test('C1d-6: manufacturer operating margin is distinct from acquired miner capital',()=>{
 const {final,report:r}=finished();
 assert.equal(r.costView.contractRevenue,1720);
 assert.equal(r.costView.manufacturerDirectContractCash,1452);
 assert.equal(r.costView.manufacturerGrossModuleCashSurplus,268);
 assert.equal(r.costView.manufacturerAllOperatingCashSurplus,940);
 assert.equal(r.costView.manufacturerMinersCapital,1200);
 assert.equal(r.costView.manufacturerNetCashChange,-260);
 assert.equal(r.cashBridge.house.initial,3000);
 assert.equal(r.cashBridge.house.actual,2740);
 assert.equal(final.ships.sh003.owner,'house');
 assert.equal(final.ships.sh004.owner,'house');
});
test('C1d-6: station books cash minus 12 but retains TEN paid ore with historic carrying cost 148',()=>{
 const {report:r}=finished();
 assert.equal(r.quantities.oreMade,60);
 assert.equal(r.quantities.oreDelivered,50);
 assert.equal(r.quantities.oreUsed,40);
 assert.equal(r.quantities.unusedOre,20);
 assert.equal(r.costView.stationCashChange,-12);
 assert.equal(r.costView.stationUnconsumedOrePaidCost,148);
 assert.equal(r.statBridges.st_nadir.revenue,960);
 assert.equal(r.statBridges.st_nadir.costs,972);
 assert.equal(r.realLabour.refinery,40);
 assert.equal(r.realLabour.silicon,80);
 assert.equal(r.realLabour.partsAndStorage,112);
});
test('C1d-6: both transport cycles pay real workers and carrier earns 180 cash',()=>{
 const {report:r}=finished();
 assert.equal(r.realLabour.oreTransport,120);
 assert.equal(r.realLabour.storageTransport,240);
 assert.equal(r.cashBridge.transport.deltaOperating,180);
 assert.equal(r.statBridges.transport.revenue,540);
 assert.equal(r.statBridges.transport.costs,360);
 assert.equal(r.costView.transporterCashChange,180);
});
test('C1d-6: exporter has finite cash; no household water demand despite wages',()=>{
 const {final,report:r}=finished();
 assert.equal(r.costView.buyerCashChange,-1820);
 assert.equal(r.cashBridge.export.initial,20000);
 assert.equal(r.cashBridge.export.actual,18180);
 assert.equal(r.treasuries.wageHousehold,2060);
 assert.equal(r.costView.undistributedWaterDemand,0);
 assert.equal(final.w5o.ausgezahlt,500);
 assert.equal(final.c1f.accepted,4);
 assert.equal(final.c1f.order.status,'accepted');
});
test('C1d-6: independent reader rejects counterfeit cash, output, cargo, title, invoice and wage',()=>{
 const {initial,final}=finished();
 const tamper=[
  s=>s.owners.house.cash++,
  s=>s.owners.st_nadir.cash++,
  s=>s.w5b.vorproduktKauf++,
  s=>s.w4.gezahlt++,
  s=>s.w3.frachtUmsatz++,
  s=>s.c1d.pilotPaid++,
  s=>s.ledger.erz.mined++,
  s=>s.ships.sh004.owner='pirates',
  s=>s.c1f.order.buyerBefore++,
  s=>s.owners.c1f_kaufrest_escrow.cash++,
  s=>s.w5n.wasserVerbraucht=1,
  s=>s.w5b.bauteilTitel[2].owner='st_nadir',
  s=>s.stats.konto.transport.erloes++
 ];
 for(let i=0;i<tamper.length;i++){
  const clone=structuredClone(final);tamper[i](clone);
  const rep=analyzeC1d6(initial,clone,c.rules);
  assert.equal(rep.ok,false,'falsification '+i);
  assert.ok(rep.issues.length>0);
 }
});
test('C1d-6: independently reconstructs same figures after Save/Load without writing snapshot',()=>{
 const {initial,final,report:r}=finished(7);
 const originalHash=c.hash(final);
 const before=c.save(final),second=c.load(before);
 assert.equal(c.hash(second),originalHash);
 const reread=analyzeC1d6(c.load(c.save(initial)),second,c.rules);
 assert.equal(reread.ok,true,JSON.stringify(reread.issues));
 assert.deepEqual(reread.costView,r.costView);
 assert.deepEqual(reread.balances,r.balances);
 assert.equal(c.save(second),before);
 assert.equal(c.hash(final),originalHash);
});
