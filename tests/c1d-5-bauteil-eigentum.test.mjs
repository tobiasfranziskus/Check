import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,TITLE_PROFILE,FINANCED_PROFILE,BUNDLE_PROFILE,EXPORT_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

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

test('C1d-5: isolated rule3310, old 3309 and 3308 retain their own invoices',()=>{
 const s=c.create();audit(s);
 assert.equal(c.rules.rulesVersion,3310);
 assert.equal(c.rules.w5b.directPartsCustody,true);
 assert.equal(c.rules.c1d.quantity,4);
 assert.equal(prior.rules.rulesVersion,3309);
 assert.equal(prior.rules.w5b.directPartsCustody,undefined);
 assert.equal(three.rules.rulesVersion,3308);
 assert.equal(minted.rules.rulesVersion,3307);
 assert.throws(()=>c.load(prior.save(prior.create())),/Profil/);
 assert.throws(()=>prior.load(c.save(s)),/Profil/);
});
test('C1d-5: fourth module costs only real assembly labour, not owned parts again',()=>{
 let s=ready();
 const producer=s.owners.house.cash,station=s.owners.st_nadir.cash;
 assert.equal(producer,1332);
 assert.equal(s.stations.st_nadir.lager.bauteil,2);
 const lot=s.w5b.bauteilTitel.find(x=>x.usedUnits===0);
 assert.equal(lot.owner,'house');
 assert.equal(lot.custodian,'st_nadir');
 command(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
 assert.equal(s.owners.house.cash,producer-12);
 assert.equal(s.owners.st_nadir.cash,station);
 step(s,12);
 assert.equal(s.w5b.lagerFertig,4);
 assert.equal(s.w5b.bauteilTitel.filter(x=>x.usedUnits===2).length,4);
 assert.equal(s.w5b.vorproduktKauf,4*240);
 reject(s,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'});
 audit(s);
});
test('C1d-5: four real component title lots with paid origin on seeds 42 and 7',()=>{
 for(const seed of [42,7]){
  let s=funded(seed);
  assert.equal(s.tick,352);
  assert.equal(s.ledger.bauteil.produced,8);
  assert.equal(s.ledger.bauteil.consumed,8);
  assert.equal(s.w5b.bauteilTitel.length,4);
  assert.equal(s.w5b.bauteilTitel.filter(x=>x.owner==='house'&&x.usedUnits===2).length,4);
  assert.equal(s.w5b.vorproduktKauf,960);
  assert.equal(s.w5b.fabrikLohnBezahlt,112);
  assert.equal(s.w5b.siliziumLohnBezahlt,80);
  assert.equal(s.ledger.lager.produced,4);
  assert.equal(s.owners.c1f_kaufrest_escrow.cash,1380);
  assert.equal(s.minted,0);
  audit(s);
  console.log('C1D5_PRODUCED '+JSON.stringify({seed,tick:s.tick,hash:c.hash(s),
   custody:s.w5b.bauteilTitel.length,partsPayments:s.w5b.vorproduktKauf,
   houseCash:s.owners.house.cash}));
 }
});
test('C1d-5: one paid four-unit delivery, fully financed return and real final settlement',()=>{
 for(const seed of [42,7]){
  let s=delivered(seed);
  assert.equal(s.owners.house.cash,1360);
  assert.equal(s.c1d.pilotPaid,240);
  assert.equal(s.c1d.feePaid,300);
  assert.equal(s.stations.st_meridian.lager.lager,4);
  command(s,{type:'stationAcceptStorage',owner:'export'});
  assert.equal(s.owners.house.cash,2740);
  assert.equal(s.c1f.accepted,4);
  assert.equal(s.c1f.settled,1380);
  assert.equal(s.owners.c1f_kaufrest_escrow.cash,0);
  assert.equal(s.ledger.lager.exported,4);
  assert.equal(s.minted,0);audit(s);
  reject(s,{type:'stationAcceptStorage',owner:'export'});
  console.log('C1D5_SETTLED '+JSON.stringify({seed,tick:s.tick,hash:c.hash(s),
   units:4,cash:s.owners.house.cash,freight:s.c1d.feePaid,
   work:s.c1d.pilotPaid,minted:s.minted}));
 }
});
test('C1d-5: title receipts, sale and subsequent ticks reproduce after Save/Load',()=>{
 let a=delivered(42),b=save(a);
 for(const s of [a,b])command(s,{type:'stationAcceptStorage',owner:'export'});
 assert.equal(c.hash(a),c.hash(b));
 for(let i=0;i<10;i++){
  c.step(a);c.step(b);audit(a);audit(b);
  if(i===4){a=save(a);b=save(b);}
  assert.equal(c.hash(a),c.hash(b));
 }
 assert.equal(a.w5b.bauteilTitel.length,4);
 assert.equal(a.c1f.accepted,4);
});
test('C1d-5: forged owners, changed custody, lot IDs, ticks, goods and money rejected',()=>{
 const a=delivered();
 const changes=[
  x=>x.w5b.bauteilTitel[0].owner='st_nadir',
  x=>x.w5b.bauteilTitel[0].custodian='st_meridian',
  x=>x.w5b.bauteilTitel[0].usedUnits=0,
  x=>x.w5b.bauteilTitel[1].id='C1D5-BT-0001',
  x=>x.w5b.bauteilTitel[2].createdTick=999999,
  x=>x.w5b.bauteilTitel[3].usedBy='C1D5-LAGER-0003',
  x=>x.w5b.bauteilTitel[0].usedTick=-1,
  x=>x.w5b.vorproduktKauf++,
  x=>x.c1f.order.buyerBefore++,
  x=>x.ledger.bauteil.consumed++,
  x=>{x.minted++;x.owners.house.cash++;}
 ];
 for(const mutate of changes){
  const bad=structuredClone(a);mutate(bad);
  assert.throws(()=>c.load(JSON.stringify(bad)));
 }
 let s=save(a);
 command(s,{type:'stationAcceptStorage',owner:'export'});
 reject(s,{type:'stationAcceptStorage',owner:'export'});
 audit(s);
});
