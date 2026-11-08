import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,SECOND_BATCH_PROFILE,FOLLOWUP_PROFILE,TITLE_PROFILE,FINANCED_PROFILE,BUNDLE_PROFILE,EXPORT_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

const c=createResearchCore({profile:SECOND_BATCH_PROFILE});
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

function afterSecondMaterials(seed=42){
 const s=finished(seed);
 // The physical 10 ore still in Nadir are refined first, not deleted.
 command(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});step(s,10);
 assert.equal(s.stations.st_nadir.lager.erz,0);
 command(s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 step(s,65);
 command(s,{type:'shipWait',owner:'house',schiff:'sh003'});
 let waiting=0;
 while(s.w5h.bestand<50&&waiting<180){step(s,1);waiting++;}
 assert.equal(s.w5h.bestand,50);
 const before=s.owners.st_nadir.cash;
 command(s,{type:'shipFreight',owner:'transport',schiff:'sh002'});
 assert.equal(s.owners.st_nadir.cash,before-740);
 step(s,120);
 assert.equal(s.w3.geliefert,100);
 for(let i=0;i<3;i++){
  command(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
  step(s,10);
 }
 assert.equal(s.tick,870);
 assert.equal(s.stations.st_nadir.lager.material,16);
 assert.equal(s.stations.st_nadir.lager.erz,20);
 return save(s);
}
function completedSecondProduction(seed=42){
 let s=afterSecondMaterials(seed);
 for(let i=5;i<=8;i++){
  command(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'});
  step(s,20);
  command(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
  step(s,16);
  assert.equal(s.w5b.bauteilTitel[i-1].owner,'house');
  assert.equal(s.w5b.bauteilTitel[i-1].custodian,'st_nadir');
  assert.equal(s.w5b.bauteilTitel[i-1].usedUnits,0);
  command(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'});
  step(s,12);
  assert.equal(s.w5b.bauteilTitel[i-1].usedBy,'C1D5-LAGER-'+String(i).padStart(4,'0'));
  assert.equal(s.w5b.lagerFertig,i);
  s=save(s);
 }
 return s;
}

test('C1d-8: rule3312 isolated; historical 3311 caps and save fingerprint untouched',()=>{
 const old=createResearchCore({profile:FOLLOWUP_PROFILE});
 assert.equal(c.rules.rulesVersion,3312);
 assert.equal(c.rules.w5b.maxSiliconLots,8);
 assert.equal(c.rules.w5b.maxPartsLots,8);
 assert.equal(c.rules.w5b.maxStorageLots,8);
 assert.equal(c.rules.c1d.allowSecondManufacturing,true);
 assert.equal(old.rules.rulesVersion,3311);
 assert.equal(old.rules.w5b.maxStorageLots,4);
 assert.equal(old.rules.c1d.allowSecondManufacturing,undefined);
 const a=c.create();
 assert.throws(()=>c.load(old.save(old.create())),/Profil/);
 assert.throws(()=>old.load(c.save(a)),/Profil/);
 audit(a);
});

test('C1d-8: two paid lots 5-8 of real silicon, material, parts, storage; seeds42/7',()=>{
 for(const seed of [42,7]){
  const s=completedSecondProduction(seed);
  assert.equal(s.tick,1062);
  assert.equal(s.ledger.material.produced,32);
  assert.equal(s.ledger.material.consumed,32);
  assert.equal(s.ledger.silizium.mined,16);
  assert.equal(s.ledger.silizium.consumed,16);
  assert.equal(s.ledger.bauteil.produced,16);
  assert.equal(s.ledger.bauteil.consumed,16);
  assert.equal(s.ledger.lager.produced,8);
  assert.equal(s.ledger.lager.exported,4);
  assert.equal(s.stations.st_nadir.lager.lager,4);
  assert.equal(s.stations.st_meridian.lager.lager,0);
  assert.equal(s.w5b.bauteilTitel.length,8);
  assert.equal(s.w5b.bauteilTitel.filter(x=>x.usedUnits===2).length,8);
  assert.equal(s.w5b.siliziumLohnBezahlt,160);
  assert.equal(s.w5b.fabrikLohnBezahlt,224);
  assert.equal(s.w5b.vorproduktKauf,1920);
  assert.equal(s.c1f.accepted,4);
  assert.equal(s.c1d.completed,1);
  assert.equal(s.minted,0);
  audit(s);
  console.log('C1D8_TWO_REAL_BATCHES '+JSON.stringify({
    seed,tick:s.tick,hash:c.hash(s),producer:s.owners.house.cash,
    station:s.owners.st_nadir.cash,carrier:s.owners.transport.cash,
    buyer:s.owners.export.cash,stored:s.stations.st_nadir.lager.lager,
    exported:s.ledger.lager.exported,minted:s.minted}));
 }
});

test('C1d-8: new four-module goods cannot be sold under previously accepted order',()=>{
 const s=completedSecondProduction(42),hash=c.hash(s);
 assert.equal(s.c1f.order.status,'accepted');
 assert.equal(s.c1f.order.id,'C1D4-0001');
 assert.equal(s.owners.export.cash,18180);
 reject(s,{type:'stationPrepayStorage',owner:'export'});
 reject(s,{type:'stationAcceptStorage',owner:'export'});
 reject(s,{type:'shipCapitalFreight',owner:'transport',schiff:'sh002'});
 assert.equal(c.hash(s),hash);
 assert.equal(s.stations.st_nadir.lager.lager,4);
 audit(s);
});

test('C1d-8: the 9th silicon, part or storage lot cannot be financed by forged capacity',()=>{
 const s=completedSecondProduction(42);
 reject(s,{type:'shipMine',owner:'house',schiff:s.w5b.minerId,ware:'silizium'},/Siliziumvorkommen/);
 reject(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'},/Bauteilchargen/);
 reject(s,{type:'stationBuildStorage',owner:'house',station:'st_nadir'},/Lagerauftrag/);
 assert.equal(s.w5b.bauteilTitel.length,8);
 assert.equal(s.ledger.lager.produced,8);
 audit(s);
});

test('C1d-8: ownership, journal and physical inventory falsification rejected',()=>{
 const s=completedSecondProduction(42);
 const changes=[
  x=>x.w5b.bauteilTitel[4].owner='st_nadir',
  x=>x.w5b.bauteilTitel[7].id='C1D5-BT-0007',
  x=>x.w5b.bauteilTitel[5].usedUnits=0,
  x=>x.w5b.bauteilTitel[6].usedTick=-1,
  x=>x.stations.st_nadir.lager.lager++,
  x=>x.ledger.bauteil.produced++,
  x=>x.owners.st_nadir.cash++,
  x=>x.c1f.order.buyerJournal.revenue++,
  x=>x.c1d.job.carrierJournal.costs++
 ];
 for(const change of changes){
  const x=structuredClone(s);change(x);
  assert.throws(()=>c.load(JSON.stringify(x)));
 }
 audit(save(s));
});

test('C1d-8: deterministic save-load and ten post-production ticks preserve all paid lots',()=>{
 for(const seed of [42,7]){
  let a=completedSecondProduction(seed),b=save(a);
  assert.equal(c.hash(a),c.hash(b));
  for(let i=0;i<10;i++){
   c.step(a);c.step(b);audit(a);audit(b);
   assert.equal(c.hash(a),c.hash(b));
   if(i===4){a=save(a);b=save(b);}
  }
  assert.equal(a.c1d.completed,1);
  assert.equal(a.c1f.accepted,4);
  assert.equal(a.stations.st_nadir.lager.lager,4);
 }
});
