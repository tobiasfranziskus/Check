import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,FOLLOWUP_PROFILE,TITLE_PROFILE,FINANCED_PROFILE,BUNDLE_PROFILE,EXPORT_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

const c=createResearchCore({profile:FOLLOWUP_PROFILE});
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
 const s=delivered(seed);
 command(s,{type:'stationAcceptStorage',owner:'export'});
 audit(s);
 return save(s);
}

test('C1d-7: isolate 3311, unchanged 3310, no compatibility loophole',()=>{
 const s=c.create();
 assert.equal(c.rules.rulesVersion,3311);
 assert.equal(c.rules.c1f.postSettlementJournal,true);
 assert.equal(c.rules.c1d.postSettlementJournal,true);
 assert.equal(c.rules.w5b.directPartsCustody,true);
 assert.equal(prior.rules.rulesVersion,3309);
 assert.equal(three.rules.rulesVersion,3308);
 const old=createResearchCore({profile:TITLE_PROFILE});
 assert.equal(old.rules.rulesVersion,3310);
 assert.equal(old.rules.c1f.postSettlementJournal,undefined);
 assert.throws(()=>c.load(old.save(old.create())),/Profil/);
 assert.throws(()=>old.load(c.save(s)),/Profil/);
});
test('C1d-7: completed buyer and carrier contracts survive 200 honest idle ticks',()=>{
 for(const seed of [42,7]){
  let s=finished(seed);
  const before=s.c1d.job.sellerBefore,contract=s.c1f.order.buyerBefore;
  assert.equal(before,1660);
  assert.equal(contract,19900);
  assert.equal(s.owners.house.cash,2740);
  step(s,200);
  assert.equal(s.c1f.order.status,'accepted');
  assert.equal(s.c1d.job.phase,'finished');
  assert.equal(s.ledger.lager.exported,4);
  assert.equal(s.minted,0);
  audit(s);
  s=save(s);
  console.log('C1D7_CONTINUED '+JSON.stringify({seed,tick:s.tick,hash:c.hash(s),buyerCash:s.owners.export.cash,
    houseCash:s.owners.house.cash}));
 }
});
test('C1d-7: buyer has existing capital for a second order, but one-time order genuinely rejected',()=>{
 const s=finished();
 assert.ok(s.owners.export.cash>=1720);
 assert.equal(s.owners.export.cash,18180);
 assert.equal(s.owners.house.cash,2740);
 assert.equal(s.owners.transport.cash,1430);
 reject(s,{type:'stationPrepayStorage',owner:'export'},/Vorauftrag|vierfach/);
 reject(s,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'},/Erstauftrag|Forschungsprofil/);
 reject(s,{type:'stationAcceptStorage',owner:'export'},/Lieferung|Kaufrest/);
 reject(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'},/Bauteilchargen/);
 reject(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'},/Lagerauftrag/);
 reject(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'},/Siliziumvorkommen/);
 audit(s);
});
test('C1d-7: one genuine paid post-settlement refinery charge from retained physical ore',()=>{
 let s=finished(42);
 const cash=s.owners.st_nadir.cash;
 assert.equal(s.stations.st_nadir.lager.erz,10);
 command(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 step(s,10);
 assert.equal(s.stations.st_nadir.lager.erz,0);
 assert.equal(s.stations.st_nadir.lager.material,4);
 assert.equal(s.owners.st_nadir.cash,cash-10);
 assert.equal(s.w4.abgeschlossen,5);
 assert.equal(s.w4.gezahlt,50);
 assert.equal(s.minted,0);
 audit(save(s));
});
test('C1d-7: genuine resumed ore mining and second paid transport attempt, no fake warehouse transfer',()=>{
 let s=finished(42);
 assert.equal(s.stations.st_aldera.lager.erz,10);
 assert.equal(s.stations.st_nadir.lager.erz,10);
 // Free a full 50-ore receiving slot with an actually paid 10-ore recipe.
 command(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 step(s,10);
 assert.equal(s.stations.st_nadir.lager.erz,0);
 assert.equal(s.stations.st_nadir.lager.material,4);
 command(s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 step(s,65);
 command(s,{type:'shipWait',owner:'house',schiff:'sh003'});
 assert.ok(s.stations.st_aldera.lager.erz>=50);
 assert.equal(s.ledger.erz.mined,124); // first resumed tick opens the fully funded ore contract
 console.log('C1D7_UPSTREAM_GATE '+JSON.stringify({tick:s.tick,ore:s.stations.st_aldera.lager.erz,wholesale:s.w5h,shipOre:s.ships.sh003.ladung.erz,station:s.owners.st_aldera.cash,buyer:s.owners.export.cash,nadir:s.stations.st_nadir.lager.erz}));
 const before=s.owners.st_nadir.cash;
 command(s,{type:'shipFreight',owner:'transport',schiff:'sh002'});
 assert.equal(s.w3.beauftragt,2);
 assert.equal(s.owners.st_nadir.cash,before-740);
 step(s,120);
 assert.equal(s.w3.abgeschlossen,2);
 assert.equal(s.w3.geliefert,100);
 assert.equal(s.stations.st_nadir.lager.erz,50);
 assert.equal(s.minted,0);
 audit(s);
 console.log('C1D7_SECOND_ORE '+JSON.stringify({tick:s.tick,hash:c.hash(s),stationCash:s.owners.st_nadir.cash,
    buyerCash:s.owners.export.cash}));
});
test('C1d-7: journal tamper, unbooked transfers, double claims are rejected on reload',()=>{
 const s=finished(7);
 const changed=[
  x=>x.c1d.job.sellerJournal.revenue++,
  x=>x.c1d.job.carrierJournal.costs++,
  x=>x.c1f.order.buyerJournal.costs++,
  x=>x.c1f.order.buyerBefore++,
  x=>x.owners.export.cash++,
  x=>x.owners.house.cash++,
  x=>x.owners.transport.cash++,
  x=>x.c1d.pilotPaid--,
  x=>x.ledger.lager.exported++
 ];
 for(const change of changed){
  const x=structuredClone(s);change(x);
  assert.throws(()=>c.load(JSON.stringify(x)));
 }
 let copied=save(s);step(copied,5);
 assert.throws(()=>prior.load(c.save(copied)),/Profil/);
 audit(copied);
});
