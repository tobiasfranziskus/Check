import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,FINANCED_PROFILE,BUNDLE_PROFILE,EXPORT_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

const c=createResearchCore({profile:FINANCED_PROFILE});
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
 assert.equal(s.owners.house.cash,540);
 s=lot(s,4,false);
 assert.equal(s.tick,340);
 assert.equal(s.owners.house.cash,312);
 assert.equal(s.w5b.bauteilFertig,4);
 assert.equal(s.stations.st_nadir.lager.bauteil,2);
 return save(s);
}
function funded(seed=42){
 let s=ready(seed);
 reject(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'},/bezahlen/);
 const before=s.owners.export.cash;
 command(s,{type:'stationPrepayStorage',owner:'export'});
 assert.equal(s.c1f.advanced,340);
 assert.equal(s.owners.c1f_kaufrest_escrow.cash,1380);
 assert.equal(s.owners.export.cash,before-1720);
 assert.equal(s.owners.house.cash,652);
 reject(s,{type:'stationPrepayStorage',owner:'export'});
 s=save(s);
 command(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
 step(s,12);
 assert.equal(s.tick,352);
 assert.equal(s.w5b.lagerFertig,4);
 assert.equal(s.owners.house.cash,300);
 assert.equal(s.stations.st_nadir.lager.lager,4);
 return save(s);
}
function delivered(seed=42){
 let s=funded(seed);
 reject(s,{type:'stationAcceptStorage',owner:'export'},/Lieferung/);
 command(s,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'});
 assert.equal(s.owners.house.cash,0);
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
test('C1d-4: opt-in 3309 does not alter three-lot 3308 or C1d-2 3307',()=>{
 const a=c.create();audit(a);
 assert.equal(c.rules.rulesVersion,3309);
 assert.equal(c.rules.c1d.quantity,4);
 assert.equal(c.rules.c1f.buyer,'export');
 assert.equal(c.rules.c1f.unitPrice,430);
 assert.equal(c.rules.c1e,undefined);
 assert.equal(three.rules.c1d.quantity,3);
 assert.equal(three.rules.c1f,undefined);
 assert.equal(minted.rules.c1d.quantity,undefined);
 assert.equal(minted.rules.c1e.price,430);
 assert.throws(()=>three.load(c.save(a)),/Profil/);
 assert.throws(()=>c.load(three.save(three.create())),/Profil/);
});
test('C1d-4: fourth manufacturing still fails before funded buyer preorder',()=>{
 const s=ready();
 reject(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'},/bezahlen/);
 reject(s,{type:'stationPrepayStorage',owner:'house'},/vorauftrag/i);
 reject(s,{type:'stationAcceptStorage',owner:'export'},/Lieferung/);
 assert.equal(s.owners.house.cash,312);
 assert.equal(s.ledger.lager.produced,3);
 audit(s);
});
test('C1d-4: finite existing buyer budget funds real 4th production for both seeds',()=>{
 for(const seed of [42,7]){
  const s=funded(seed);
  assert.equal(s.ledger.lager.produced,4);
  assert.equal(s.ledger.bauteil.produced,8);
  assert.equal(s.ledger.bauteil.consumed,8);
  assert.equal(s.w5b.siliziumLohnBezahlt,80);
  assert.equal(s.w5b.fabrikLohnBezahlt,112);
  assert.equal(s.owners.c1f_kaufrest_escrow.cash,1380);
  assert.equal(s.minted,0);audit(s);
  console.log('C1D4_FUNDED '+JSON.stringify({seed,tick:s.tick,hash:c.hash(s),
   paidAdvance:s.c1f.advanced,locked:s.owners.c1f_kaufrest_escrow.cash}));
 }
});
test('C1d-4: 4 physical modules, one paid 300-ISK delivery, 240-minute return and 1380 settlement',()=>{
 for(const seed of [42,7]){
  const s=delivered(seed);
  const before=s.owners.house.cash;
  assert.equal(before,0);
  command(s,{type:'stationAcceptStorage',owner:'export'});
  assert.equal(s.c1f.accepted,4);
  assert.equal(s.c1f.settled,1380);
  assert.equal(s.owners.house.cash,1380);
  assert.equal(s.owners.c1f_kaufrest_escrow.cash,0);
  assert.equal(s.ledger.lager.exported,4);
  assert.equal(s.stations.st_meridian.lager.lager,0);
  assert.equal(s.minted,0);audit(s);
  reject(s,{type:'stationAcceptStorage',owner:'export'});
  reject(s,{type:'stationPrepayStorage',owner:'export'});
  console.log('C1D4_ACCEPTED '+JSON.stringify({seed,tick:s.tick,hash:c.hash(s),
   units:s.c1f.accepted,freight:s.c1d.feePaid,pilotMinutes:s.c1d.pilotPaid,
   grossPaid:s.c1f.advanced+s.c1f.settled,minted:s.minted}));
 }
});
test('C1d-4: deterministic replay and save/load after settlement',()=>{
 let a=delivered(42),b=save(a);
 for(const s of [a,b])command(s,{type:'stationAcceptStorage',owner:'export'});
 assert.equal(c.hash(a),c.hash(b));
 for(let i=0;i<10;i++){
  c.step(a);c.step(b);audit(a);audit(b);
  if(i===4){a=save(a);b=save(b);}
  assert.equal(c.hash(a),c.hash(b));
 }
 assert.equal(a.c1f.accepted,4);
 assert.equal(a.minted,0);
});
test('C1d-4: falsified money, buyer, origin, escrow, labour and duplicates rejected',()=>{
 const a=delivered();
 for(const change of [
  x=>x.c1f.order.buyerBefore++,
  x=>x.c1f.order.advance++,
  x=>x.c1f.advanced++,
  x=>x.c1f.order.amount++,
  x=>x.owners.c1f_kaufrest_escrow.cash++,
  x=>x.owners.export.cash++,
  x=>x.ledger.lager.produced++,
  x=>x.stations.st_meridian.lager.lager++,
  x=>x.c1d.pilotPaid++,
  x=>{x.minted++;x.owners.house.cash++;}
 ]){
  const bad=structuredClone(a);change(bad);
  assert.throws(()=>c.load(JSON.stringify(bad)));
 }
 const settled=save(a);command(settled,{type:'stationAcceptStorage',owner:'export'});
 for(const change of [
  x=>x.c1f.accepted=0,
  x=>x.c1f.settled++,
  x=>x.c1f.order.acceptedTick++,
  x=>x.ledger.lager.exported++,
  x=>x.stations.st_meridian.lager.lager++,
  x=>x.owners.house.cash++
 ]){
  const bad=structuredClone(settled);change(bad);
  assert.throws(()=>c.load(JSON.stringify(bad)));
 }
});
