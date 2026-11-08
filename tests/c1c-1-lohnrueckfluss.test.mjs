import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,WAGES_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

// C1c uses the original W3/W4 production, W5s-q/r wage distribution,
// C1b-1 water demand and the original deterministic tick. No wage engine here.
const c=createResearchCore({profile:WAGES_PROFILE});
const old=createResearchCore({profile:'aphros-research:C1b-2:material-precursor-v1'});
const ore={type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'};
const stop={type:'shipWait',owner:'house',schiff:'sh003'};
const freight={type:'shipFreight',owner:'transport',schiff:'sh002'};
const refine={type:'stationRefine',owner:'st_nadir',station:'st_nadir'};
function command(core,s,cmd){
 const result=core.execute(s,cmd);
 assert.equal(result.ok,true,result.reason);
}
function start(core,seed=42){
 const s=core.create(seed);
 command(core,s,{type:'shipWait',owner:'npc3',schiff:'sh001'});
 command(core,s,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'});
 command(core,s,ore);
 return s;
}
function check(core,s,earned=false){
 const a=core.audit(s);
 assert.equal(a.ok,true,JSON.stringify(a));
 assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);assert.equal(s.w5q.exported,0);
 if(earned){
  const w=s.w5s,industry=w.industryWages.paid;
  assert.equal(s.owners.arbeitskraefte_nadir.cash,s.w4.gezahlt-(industry.refinery||0));
  assert.equal(s.owners.fonds_transport.cash,
   core.rules.owners.find(x=>x.id==='fonds_transport').cash+
   s.w3.arbeitsKosten+s.w5n.frachtLohn-s.w5o.lohnFracht-(w.orePilotWages||0));
  assert.equal(s.owners.w5n_kunden.cash,
   1400+s.w5o.ausgezahlt+(w.orePilotWages||0)
   +Object.values(industry).reduce((n,x)=>n+x,0)-18*s.w5n.wasserVerbraucht);
 }
}
function advance(core,s,n,earned=false){
 for(let i=0;i<n;i++){
  core.step(s);check(core,s,earned);
 }
 return s;
}
function roundtrip(core,s){
 const before=core.hash(s),copy=core.load(core.save(s));
 assert.equal(core.hash(copy),before);
 return copy;
}
function finishOreChain(core,seed=42){
 let s=start(core,seed);
 advance(core,s,60,core===c);
 command(core,s,stop);command(core,s,freight);
 advance(core,s,60,core===c);
 s=roundtrip(core,s);
 command(core,s,refine);
 advance(core,s,10,core===c);
 advance(core,s,50,core===c);
 return roundtrip(core,s);
}
test('C1c: new research profile is isolated and not imported into C1b-2',()=>{
 const s=c.create();
 assert.equal(c.profile,WAGES_PROFILE);
 assert.equal(c.rules.rulesVersion,3303);
 assert.equal(c.rules.w5s.autoOreWageHousehold,true);
 assert.equal(c.rules.w5s.autoIndustryWages,true);
 assert.equal(c.rules.w5s.autoIndustry,true);
 assert.ok(Object.isFrozen(c.rules.w5s));
 assert.equal(old.rules.w5s,undefined);
 assert.throws(()=>old.load(c.save(s)),/Profil/);
 assert.throws(()=>c.load(old.save(old.create())),/Profil/);
 check(c,s,true);
});
test('C1c: real W3 and W4 wages reach consumer from existing funds exactly once',()=>{
 for(const seed of [42,7]){
  const before=finishOreChain(old,seed),after=finishOreChain(c,seed);
  assert.equal(after.tick,180);
  assert.equal(after.w3.arbeitsKosten,120);
  assert.equal(after.w4.gezahlt,10);
  assert.equal(after.w4.materialErzeugt,4);
  assert.equal(after.w5s.orePilotWages,120);
  assert.equal(after.w5s.industryWages.paid.refinery,10);
  assert.equal(after.owners.arbeitskraefte_nadir.cash,0);
  assert.equal(after.owners.w5n_kunden.cash-before.owners.w5n_kunden.cash,130);
  assert.equal(after.owners.fonds_transport.cash-before.owners.fonds_transport.cash,-120);
  assert.equal(after.owners.arbeitskraefte_nadir.cash-before.owners.arbeitskraefte_nadir.cash,-10);
  assert.equal(after.ledger.material.produced,before.ledger.material.produced);
  assert.equal(after.ledger.erz.mined,before.ledger.erz.mined);
  assert.equal(after.minted,0);
  check(c,after,true);
  const h=c.hash(after),cash=after.owners.w5n_kunden.cash;
  assert.equal(c.diagnostics.oreWages(after,c.rules),0);
  assert.equal(c.diagnostics.industryWages(after,c.rules),0);
  assert.equal(c.hash(after),h);
  assert.equal(after.owners.w5n_kunden.cash,cash);
 }
});
test('C1c: save/load, replay and consumer purchases continue deterministically',()=>{
 let s=finishOreChain(c),control=finishOreChain(old);
 let replay=roundtrip(c,s);
 for(let i=s.tick+1;i<=3*1440;i++){
  c.step(s);c.step(replay);old.step(control);
  check(c,s,true);
  if(i%1440===0){
   assert.equal(c.hash(s),c.hash(replay));
   s=roundtrip(c,s);
  }
 }
 assert.equal(c.hash(s),c.hash(replay));
 assert.equal(s.minted,0);
 assert.ok(s.w5s.orePilotWages>=120);
 assert.ok((s.w5s.industryWages.paid.refinery||0)>=10);
 const transferred=s.w5s.orePilotWages+Object.values(s.w5s.industryWages.paid).reduce((n,x)=>n+x,0);
 assert.ok(transferred>=130);
 assert.equal(s.owners.w5n_kunden.cash,
  1400+s.w5o.ausgezahlt+transferred-18*s.w5n.wasserVerbraucht);
 console.log('C1C1_REPLAY '+JSON.stringify({tick:s.tick,hash:c.hash(s),
  pilotPaid:s.w5s.orePilotWages,refineryPaid:s.w5s.industryWages.paid.refinery||0,
  customerCash:s.owners.w5n_kunden.cash,waterBought:s.w5n.wasserVerbraucht,
  comparisonWaterBought:control.w5n.wasserVerbraucht,minted:s.minted}));
});
test('C1c: forged W3/W4 wages, false receipts and incompatible saves are rejected',()=>{
 const s=finishOreChain(c);
 for(const mutate of [
  x=>x.w5s.orePilotWages++,
  x=>x.w5s.orePilotPays[0].amount++,
  x=>x.w5s.industryWages.paid.refinery++,
  x=>x.w5s.industryWages.events[0].amount++,
  x=>x.owners.w5n_kunden.cash++,
  x=>x.w3.arbeitsKosten++,
  x=>x.w4.gezahlt++,
  x=>{x.minted++;x.owners.house.cash++;},
  x=>x.c1b.profile='aphros-research:C1b-2:material-precursor-v1'
 ]){
  const bad=structuredClone(s);
  mutate(bad);
  assert.throws(()=>c.load(JSON.stringify(bad)));
 }
});
test('C1c: without new work and no due wages, manual repeated payout creates no ISK',()=>{
 const s=c.create();
 const original=c.hash(s);
 assert.equal(c.diagnostics.oreWages(s,c.rules),0);
 assert.equal(c.diagnostics.industryWages(s,c.rules),0);
 assert.equal(c.hash(s),original);
 const noMoney=s.owners.w5n_kunden.cash;
 advance(c,s,60,true);
 assert.equal(c.diagnostics.oreWages(s,c.rules),0);
 assert.equal(c.diagnostics.industryWages(s,c.rules),0);
 assert.equal(s.owners.w5n_kunden.cash,noMoney+s.w5o.ausgezahlt-18*s.w5n.wasserVerbraucht);
});
