import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,EXPORT_PROFILE,DELIVERY_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

const core=createResearchCore({profile:EXPORT_PROFILE});
const prior=createResearchCore({profile:DELIVERY_PROFILE});
const reserve={type:'stationExportReserve',owner:'house',station:'st_meridian'};
const accept={type:'stationExportAccept',owner:'house',station:'st_meridian'};
function command(s,c){const x=core.execute(s,c);assert.equal(x.ok,true,x.reason)}
function verify(s){
 const a=core.audit(s);assert.equal(a.ok,true,JSON.stringify(a));
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000+s.c1e.minted);
 assert.equal(s.minted,s.c1e.minted);
 assert.equal(s.burned,0);
 assert.equal(s.w5q.exported,0);
 assert.equal(s.w5q.minted,0);
 assert.equal(s.ledger.lager.initial,0);
 assert.equal(s.ledger.lager.exported,s.c1e.accepted);
 assert.equal(s.stations.st_meridian.lager.lager,s.c1d.delivered-s.c1e.accepted);
}
function run(s,n){
 for(let i=0;i<n;i++){core.step(s);verify(s)}
 return s;
}
function saved(s){const h=core.hash(s),x=core.load(core.save(s));assert.equal(core.hash(x),h);return x}
function manufactured(seed=42){
 let s=core.create(seed);verify(s);
 command(s,{type:'shipWait',owner:'npc3',schiff:'sh001'});
 command(s,{type:'shipBuy',owner:'house',station:'st_aldera',klasse:'miner'});
 command(s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 run(s,60);
 command(s,{type:'shipWait',owner:'house',schiff:'sh003'});
 command(s,{type:'shipFreight',owner:'transport',schiff:'sh002'});
 run(s,60);
 command(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 run(s,60);
 command(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'});
 command(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
 run(s,20);
 command(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 run(s,16);
 command(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
 run(s,12);
 assert.equal(s.tick,228);
 assert.equal(s.ledger.lager.produced,1);
 assert.equal(s.stations.st_nadir.lager.lager,1);
 return saved(s);
}
function delivered(seed=42){
 let s=manufactured(seed);
 for(let i=0;i<200;i++){
  const sh=s.ships.sh002;
  if(sh.phase==='dock'&&sh.auftrag==='halten'&&sh.system==='aldera'
    &&!s.w3.auftrag&&!s.w5n.frachtauftrag)break;
  run(s,1);
 }
 assert.equal(s.tick,300);
 command(s,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'});
 run(s,119);assert.equal(s.c1d.delivered,0);
 assert.equal(s.stations.st_meridian.lager.lager,0);
 run(s,1);assert.equal(s.tick,420);
 assert.equal(s.c1d.delivered,1);
 assert.equal(s.stations.st_meridian.lager.lager,1);
 assert.equal(s.c1e.accepted,0);
 run(s,120);
 assert.equal(s.tick,540);
 assert.equal(s.c1d.completed,1);
 assert.equal(s.c1d.pilotPaid,240);
 assert.equal(s.c1d.feePaid,300);
 return saved(s);
}
function accepted(seed=42){
 let s=delivered(seed);
 const day0=core.hash(s);
 assert.equal(core.execute(s,reserve).ok,false);
 assert.equal(core.hash(s),day0);
 run(s,1440-s.tick);
 const cash=s.owners.house.cash;
 command(s,reserve);
 assert.equal(s.c1e.reserved,430);
 assert.equal(s.minted,0);
 s=saved(s);
 command(s,accept);
 assert.equal(s.owners.house.cash,cash+430);
 assert.equal(s.minted,430);
 assert.equal(s.c1e.accepted,1);
 assert.equal(s.stations.st_meridian.lager.lager,0);
 assert.equal(s.ledger.lager.exported,1);
 verify(s);
 return saved(s);
}
test('C1d-2: isolated research-only model, older saves and profile remain untouched',()=>{
 const s=core.create();verify(s);
 assert.equal(core.rules.rulesVersion,3307);
 assert.equal(core.rules.c1e.price,430);
 assert.deepEqual([core.rules.c1e.dayCap,core.rules.c1e.cap30,
  core.rules.c1e.cap365,core.rules.c1e.carryDays],[400,12000,146000,30]);
 assert.ok(Object.isFrozen(core.rules.c1e));
 assert.equal(prior.rules.c1e,undefined);
 assert.equal(prior.rules.rulesVersion,3306);
 assert.throws(()=>prior.load(core.save(s)),/Profil/);
 assert.throws(()=>core.load(prior.save(prior.create())),/Profil/);
 assert.throws(()=>prior.execute(prior.create(),reserve),/Befehl/);
});
test('C1d-2: two seeds have exactly one real warehouse accepted after 400/day carry',()=>{
 for(const seed of [42,7]){
  const s=accepted(seed);
  assert.equal(s.c1e.order.tick,1440);
  assert.equal(s.c1e.order.available,800);
  assert.equal(s.c1e.order.price,430);
  assert.equal(s.c1e.order.day,1);
  assert.equal(s.c1e.minted,430);
  assert.equal(s.c1e.accepted,1);
  assert.equal(s.ledger.lager.produced,1);
  assert.equal(s.ledger.lager.exported,1);
  assert.equal(s.stations.st_nadir.lager.lager,0);
  assert.equal(s.stations.st_meridian.lager.lager,0);
  assert.equal(s.initialSupply+s.minted,33430);
  verify(s);
  console.log('C1D2_ACCEPT '+JSON.stringify({seed,tick:s.tick,
   hash:core.hash(s),day:s.c1e.order.day,rights:s.c1e.order.available,
   minted:s.minted,exported:s.ledger.lager.exported}));
 }
});
test('C1d-2: no stock, no arrival or elapsed time alone can mint ISK',()=>{
 let s=core.create();run(s,1441);
 assert.equal(s.minted,0);
 const h=core.hash(s);
 assert.equal(core.execute(s,reserve).ok,false);
 assert.equal(core.execute(s,accept).ok,false);
 assert.equal(core.hash(s),h);
 let stock=manufactured();
 const pre=core.hash(stock);
 assert.equal(core.execute(stock,reserve).ok,false);
 assert.equal(core.hash(stock),pre);
 let shipped=delivered();
 const before=core.hash(shipped);
 assert.equal(core.execute(shipped,accept).ok,false);
 assert.equal(core.execute(shipped,reserve).ok,false);
 assert.equal(core.hash(shipped),before);
});
test('C1d-2: double reservation, double acceptance and foreign owner are rejected atomically',()=>{
 let s=delivered();run(s,1440-s.tick);
 const old=core.hash(s);
 assert.equal(core.execute(s,{...reserve,owner:'transport'}).ok,false);
 assert.equal(core.hash(s),old);
 command(s,reserve);const h=core.hash(s);
 assert.equal(core.execute(s,reserve).ok,false);
 assert.equal(core.execute(s,{...accept,owner:'transport'}).ok,false);
 assert.equal(core.hash(s),h);
 command(s,accept);const after=core.hash(s);
 assert.equal(core.execute(s,reserve).ok,false);
 assert.equal(core.execute(s,accept).ok,false);
 assert.equal(core.hash(s),after);
 verify(s);
});
test('C1d-2: replay and save/load stay deterministic before and after the single payment',()=>{
 let a=delivered(),b=saved(a);
 for(let i=0;i<900;i++){
  core.step(a);core.step(b);verify(a);
  if(i===300||i===899){a=saved(a);b=saved(b)}
  assert.equal(core.hash(a),core.hash(b));
 }
 for(const s of [a,b])command(s,reserve);
 assert.equal(core.hash(a),core.hash(b));
 a=saved(a);b=saved(b);
 for(const s of [a,b])command(s,accept);
 assert.equal(core.hash(a),core.hash(b));
 for(let i=0;i<120;i++){
  core.step(a);core.step(b);verify(a);
  assert.equal(core.hash(a),core.hash(b));
 }
 assert.equal(a.c1e.events.length,1);
 assert.equal(a.minted,430);
 assert.equal(a.c1e.reserved,0);
});
test('C1d-2: forged cash, rights, stock, contract and double mint fail independent audits',()=>{
 const paid=accepted();
 const reserved=delivered();run(reserved,1440-reserved.tick);command(reserved,reserve);
 for(const mutate of [
  x=>x.c1e.order.available++,
  x=>x.c1e.order.day=0,
  x=>x.c1e.order.price++,
  x=>x.c1e.reserved=0,
  x=>x.c1e.order.status='accepted',
  x=>x.ledger.lager.exported++,
  x=>x.minted++,
  x=>x.owners.house.cash++
 ]){
  const bad=structuredClone(reserved);mutate(bad);
  assert.throws(()=>core.load(JSON.stringify(bad)));
 }
 for(const mutate of [
  x=>x.c1e.minted++,
  x=>x.c1e.accepted=0,
  x=>x.c1e.events.push(x.c1e.events[0]),
  x=>x.c1e.events[0].amount++,
  x=>x.c1e.events[0].tick--,
  x=>x.c1e.order.available=400,
  x=>x.c1e.order.acceptedTick=0,
  x=>x.ledger.lager.exported=0,
  x=>x.stations.st_meridian.lager.lager++,
  x=>x.owners.house.cash++,
  x=>x.minted++,
  x=>x.c1d.delivered=0
 ]){
  const bad=structuredClone(paid);mutate(bad);
  assert.throws(()=>core.load(JSON.stringify(bad)));
 }
});
