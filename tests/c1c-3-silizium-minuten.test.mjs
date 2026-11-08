import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,SILICON_PROFILE,PARTS_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

const c=createResearchCore({profile:SILICON_PROFILE}),legacy=createResearchCore({profile:PARTS_PROFILE});
function execute(s,cmd){const x=c.execute(s,cmd);assert.equal(x.ok,true,x.reason);}
function verify(s){
 const proof=c.audit(s);assert.equal(proof.ok,true,JSON.stringify(proof));
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 for(const owner of Object.values(s.owners))assert.ok(Number.isSafeInteger(owner.cash)&&owner.cash>=0);
 assert.equal(s.minted,0);assert.equal(s.burned,0);assert.equal(s.w5q.exported,0);
}
function advance(s,n){for(let i=0;i<n;i++){c.step(s);verify(s);}return s;}
function loaded(s){const h=c.hash(s),copy=c.load(c.save(s));assert.equal(c.hash(copy),h);return copy;}
function ore(seed=42){
 let s=c.create(seed);verify(s);
 execute(s,{type:'shipWait',owner:'npc3',schiff:'sh001'});
 execute(s,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'});
 execute(s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 advance(s,60);
 execute(s,{type:'shipWait',owner:'house',schiff:'sh003'});
 execute(s,{type:'shipFreight',owner:'transport',schiff:'sh002'});
 advance(s,60);
 execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 advance(s,60);
 assert.equal(s.w4.materialErzeugt,4);
 assert.equal(s.stations.st_nadir.lager.material,4);
 assert.equal(s.ledger.silizium.initial,0);
 assert.equal(s.ledger.bauteil.initial,0);
 return loaded(s);
}
function buyMiner(s){
 execute(s,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_nadir'});
 assert.equal(s.ships[s.w5b.minerId].owner,'house');
 return s.w5b.minerId;
}
function mineTenMinutes(s){
 execute(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
 const sold=s.w5b.siliziumAbnahme,earned=s.w5b.siliziumLohnBezahlt;
 for(let minute=1;minute<=9;minute++){
  advance(s,1);
  assert.equal(s.w5b.siliziumLohnBezahlt,earned+minute);
  assert.equal(s.w5b.siliziumAbnahme,sold);
  assert.equal(s.w5b.siliziumAuftrag.gearbeitet,minute);
  assert.equal(s.owners.w5b_silizium_arbeit.cash,10-minute);
  assert.equal(s.owners.w5b_silizium_kauf.cash,24);
  assert.equal(s.ships[s.w5b.minerId].ladung.silizium||0,0);
  assert.equal(s.stations.st_nadir.lager.silizium,0);
  assert.equal(s.ledger.silizium.mined,s.w5b.siliziumAbgebaut);
 }
 s=loaded(s);
 advance(s,1);
 assert.equal(s.w5b.siliziumLohnBezahlt,earned+10);
 assert.equal(s.w5b.siliziumAbnahme,sold+24);
 assert.equal(s.w5b.siliziumAuftrag,null);
 assert.equal(s.stations.st_nadir.lager.silizium,1);
 assert.equal(s.owners.w5b_silizium_arbeit.cash,0);
 assert.equal(s.owners.w5b_silizium_kauf.cash,0);
 assert.equal(s.ships[s.w5b.minerId].auftrag,'halten');
 return loaded(s);
}
function onePart(s){
 execute(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 const before=s.w5b.bauteilFertig;
 assert.equal(s.owners.w5b_fabrik_arbeit.cash,8);
 s=loaded(s);
 advance(s,7);
 assert.equal(s.w5b.bauteilFertig,before);
 assert.equal(s.owners.w5b_fabrik_arbeit.cash,1);
 s=loaded(s);
 advance(s,1);
 assert.equal(s.w5b.bauteilFertig,before+1);
 assert.equal(s.owners.w5b_fabrik_arbeit.cash,0);
 assert.equal(s.owners.arbeiter_w5b_nadir.cash,(before+1)*8);
 return loaded(s);
}
function twoParts(seed=42){
 let s=ore(seed);
 buyMiner(s);
 s=onePart(mineTenMinutes(s));
 s=onePart(mineTenMinutes(s));
 verify(s);return s;
}

test('C1c-3: isolated opt-in ten paid minutes and prior unchanged research profiles',()=>{
 assert.equal(c.rules.rulesVersion,3305);
 assert.equal(c.profile,SILICON_PROFILE);
 assert.equal(c.rules.w5b.silikonMenge,1);
 assert.equal(c.rules.w5b.silikonMinutenJeEinheit,10);
 assert.equal(c.rules.w5b.silikonLohn,10);
 assert.equal(legacy.rules.rulesVersion,3304);
 assert.equal(legacy.rules.w5b.silikonMinutenJeEinheit,undefined);
 assert.notEqual(c.fingerprint,legacy.fingerprint);
 assert.throws(()=>legacy.load(c.save(c.create())),/Profil/);
 assert.throws(()=>c.load(legacy.save(legacy.create())),/Profil/);
 verify(c.create());
});

test('C1c-3: exactly 10 independently paid minutes before FIRST silicon and no premature production',()=>{
 let s=ore();buyMiner(s);
 execute(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
 const beforeCash=s.owners.house.cash;
 advance(s,9);
 assert.equal(s.w5b.siliziumAbgebaut,0);
 assert.equal(s.w5b.siliziumLohnBezahlt,9);
 assert.equal(s.owners.w5b_silizium_arbeit.cash,1);
 assert.equal(s.owners.w5b_silizium_kauf.cash,24);
 assert.equal(s.ledger.silizium.mined,0);
 assert.equal(s.stations.st_nadir.lager.silizium,0);
 assert.equal(s.owners.house.cash,beforeCash-10,'10 ISK already reserved, no free mid-job rescue');
 const h=c.hash(s);
 assert.equal(c.execute(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'}).ok,false);
 assert.equal(c.hash(s),h);
 s=loaded(s);advance(s,1);
 assert.equal(s.w5b.siliziumAbgebaut,1);
 assert.equal(s.w5b.siliziumLohnBezahlt,10);
 assert.equal(s.stations.st_nadir.lager.silizium,1);
 assert.equal(s.w5b.siliziumAbnahme,24);
 verify(s);
});

test('C1c-3: Seed42/7 produce TWO physically sourced, paid parts without mint',()=>{
 for(const seed of [42,7]){
  const done=twoParts(seed);
  assert.equal(done.tick,216);
  assert.equal(done.ledger.bauteil.initial,0);
  assert.equal(done.ledger.material.produced,4);
  assert.equal(done.ledger.material.consumed,4);
  assert.equal(done.ledger.silizium.mined,2);
  assert.equal(done.ledger.silizium.consumed,2);
  assert.equal(done.ledger.bauteil.produced,2);
  assert.equal(done.stations.st_nadir.lager.bauteil,2);
  assert.equal(done.w5b.siliziumLohnBezahlt,20);
  assert.equal(done.w5b.fabrikLohnGebunden,16);
  assert.equal(done.w5b.fabrikLohnBezahlt,16);
  assert.equal(done.w5b.vorproduktKauf,240);
  assert.equal(done.owners.arbeiter_w5b_nadir.cash,16);
  assert.equal(done.minted,0);
  console.log('C1C3_RESULT '+JSON.stringify({seed,tick:done.tick,hash:c.hash(done),
   silicon:done.ledger.silizium.mined,siliconWorkISK:done.w5b.siliziumLohnBezahlt,
   parts:done.ledger.bauteil.produced,partsWorkISK:done.w5b.fabrikLohnBezahlt,minted:done.minted}));
 }
});

test('C1c-3: deterministic partial progress/save/replay across silicon ten-minute boundary',()=>{
 let s=ore();buyMiner(s);
 execute(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
 advance(s,3);
 const replay=loaded(s);
 advance(s,7);advance(replay,7);
 assert.equal(c.hash(s),c.hash(replay));
 assert.equal(s.w5b.siliziumAbgebaut,1);
 const same=loaded(s);
 assert.equal(c.hash(same),c.hash(s));
});

test('C1c-3: forged early silicon, unpaid progress and duplicate wage receipts rejected',()=>{
 let s=ore();buyMiner(s);
 execute(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
 advance(s,5);s=loaded(s);
 const h=c.hash(s);
 const probes=[
  x=>x.w5b.siliziumAbgebaut++,
  x=>x.ledger.silizium.mined++,
  x=>x.w5b.siliziumAuftrag.gearbeitet++,
  x=>x.w5b.siliziumLohnBezahlt++,
  x=>x.owners.w5b_silizium_arbeit.cash++,
  x=>x.owners.w5b_silizium_kauf.cash++,
  x=>x.ships[x.w5b.minerId].ladung.silizium=1,
  x=>{x.owners.house.cash++;x.minted++;},
  x=>x.c1b.profile=PARTS_PROFILE
 ];
 for(const mutate of probes){const bad=structuredClone(s);mutate(bad);assert.throws(()=>c.load(JSON.stringify(bad)));}
 assert.equal(c.hash(s),h);
});

test('C1c-3: no bauteil buyer, storage build or Meridian export is silently enabled',()=>{
 const s=twoParts();
 assert.equal(c.rules.world.systems.meridian,undefined);
 assert.equal(c.rules.economy.rezepte.r_lager,undefined);
 const h=c.hash(s);
 assert.throws(()=>c.execute(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'}),/ausserhalb/);
 assert.equal(c.hash(s),h);
 assert.equal(s.w5q.minted,0);
 assert.equal(s.ledger.bauteil.produced,2);
});
