import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchCore,SECOND_EXPORT_PROFILE,SECOND_BATCH_PROFILE,FOLLOWUP_PROFILE,TITLE_PROFILE,FINANCED_PROFILE,BUNDLE_PROFILE,EXPORT_PROFILE} from '../tools/research/c1b-1-wasser.mjs';

const c=createResearchCore({profile:SECOND_EXPORT_PROFILE});
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


function ordered(seed=42){
 let s=completedSecondProduction(seed);
 assert.equal(s.tick,1062);
 assert.equal(s.owners.export.cash,18180);
 assert.equal(s.stations.st_nadir.lager.lager,4);
 const originalFirst=structuredClone({order:s.c1f.order,flight:s.c1d.job});
 command(s,{type:'stationPrepayStorageSecond',owner:'export'});
 assert.equal(s.c1f.secondOrder.id,'C1D8B-0002');
 assert.equal(s.c1f.secondOrder.status,'prepaid');
 assert.equal(s.owners.export.cash,16460);
 assert.equal(s.owners.c1f_kaufrest_escrow.cash,1380);
 assert.deepEqual({order:s.c1f.order,flight:s.c1d.job},originalFirst);
 reject(s,{type:'stationPrepayStorageSecond',owner:'export'});
 return save(s);
}
function sailed(seed=42,minutes=240){
 let s=ordered(seed);
 command(s,{type:'shipCapitalFreightSecond',owner:'transport',schiff:'sh002'});
 assert.equal(s.c1d.second.job.id,'C1D8B-FREIGHT-0002');
 assert.equal(s.owners.c1d_freight_escrow.cash,300);
 assert.equal(s.owners.c1d_pilot_escrow.cash,240);
 assert.equal(s.c1d.pilotPaid,240);
 step(s,minutes);
 return save(s);
}
function settled(seed=42){
 let s=sailed(seed);
 assert.equal(s.tick,1302);
 assert.equal(s.c1d.second.completed,1);
 command(s,{type:'stationAcceptStorageSecond',owner:'export'});
 audit(s);
 return save(s);
}

test('C1d-8b: rule3313 isolated with independent order/flight IDs; 3312 remains separate',()=>{
 const old=createResearchCore({profile:SECOND_BATCH_PROFILE});
 assert.equal(c.rules.rulesVersion,3313);
 assert.equal(c.rules.c1d.secondEnabled,true);
 assert.equal(c.rules.c1f.secondEnabled,true);
 assert.equal(old.rules.rulesVersion,3312);
 assert.equal(old.rules.c1d.secondEnabled,undefined);
 assert.equal(old.rules.c1f.secondEnabled,undefined);
 assert.throws(()=>old.load(c.save(c.create())),/Profil/);
 assert.throws(()=>c.load(old.save(old.create())),/Profil/);
 audit(c.create());
});

test('C1d-8b: buyer's second 1720 ISK held without mint or prepay double-spend on 42/7',()=>{
 for(const seed of [42,7]){
  let s=ordered(seed);
  assert.equal(s.c1f.advanced,340);
  assert.equal(s.c1f.secondAdvanced,340);
  assert.equal(s.c1f.settled,1380);
  assert.equal(s.c1f.secondSettled,0);
  assert.equal(s.c1f.order.status,'accepted');
  assert.equal(s.c1f.secondOrder.status,'prepaid');
  assert.equal(s.c1f.secondOrder.buyerBefore,18180);
  assert.equal(s.owners.export.cash,16460);
  assert.equal(s.owners.house.cash,2492);
  assert.equal(s.owners.c1f_kaufrest_escrow.cash,1380);
  assert.equal(s.ledger.lager.exported,4);
  assert.equal(s.minted,0);
  reject(s,{type:'stationAcceptStorageSecond',owner:'export'});
  audit(s);
 }
});

test('C1d-8b: real second 300-ISK/240-min flight: second physical loading and delivery',()=>{
 for(const seed of [42,7]){
  let s=sailed(seed,60);
  assert.equal(s.tick,1122);
  assert.equal(s.c1d.second.job.phase,'delivery');
  assert.equal(s.stations.st_nadir.lager.lager,0);
  assert.equal(s.ships.sh002.ladung.lager,4);
  assert.equal(s.c1d.second.pilotPaid,60);
  reject(s,{type:'stationAcceptStorageSecond',owner:'export'});
  step(s,60);
  assert.equal(s.tick,1182);
  assert.equal(s.stations.st_meridian.lager.lager,4);
  assert.equal(s.ships.sh002.ladung.lager||0,0);
  assert.equal(s.c1d.second.delivered,1);
  reject(s,{type:'stationAcceptStorageSecond',owner:'export'},/Rueckflug/);
  step(s,120);
  assert.equal(s.tick,1302);
  assert.equal(s.c1d.second.job.phase,'finished');
  assert.equal(s.c1d.second.pilotPaid,240);
  assert.equal(s.owners.c1d_pilot.cash,480);
  assert.equal(s.c1d.second.feePaid,300);
  assert.equal(s.owners.c1d_freight_escrow.cash,0);
  assert.equal(s.owners.c1d_pilot_escrow.cash,0);
  assert.equal(s.ships.sh002.system,'aldera');
  assert.equal(s.ships.sh002.phase,'dock');
  assert.equal(s.ledger.lager.exported,4);
  audit(s);
 }
});

test('C1d-8b: two distinct signed sales, exactly eight existing units and finite customer money',()=>{
 for(const seed of [42,7]){
  let s=settled(seed);
  assert.equal(s.tick,1302);
  assert.equal(s.c1f.accepted,4);
  assert.equal(s.c1f.secondAccepted,4);
  assert.equal(s.c1f.order.id,'C1D4-0001');
  assert.equal(s.c1f.secondOrder.id,'C1D8B-0002');
  assert.equal(s.c1f.order.status,'accepted');
  assert.equal(s.c1f.secondOrder.status,'accepted');
  assert.equal(s.ledger.lager.produced,8);
  assert.equal(s.ledger.lager.exported,8);
  assert.equal(s.stations.st_nadir.lager.lager,0);
  assert.equal(s.stations.st_meridian.lager.lager,0);
  assert.equal(s.owners.house.cash,3572);
  assert.equal(s.owners.export.cash,16460);
  assert.equal(s.owners.transport.cash,1610);
  assert.equal(s.owners.c1f_kaufrest_escrow.cash,0);
  assert.equal(s.c1d.pilotPaid+s.c1d.second.pilotPaid,480);
  assert.equal(s.c1d.feePaid+s.c1d.second.feePaid,600);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  audit(s);
  console.log('C1D8B_SECOND_ACCEPT '+JSON.stringify({
   seed,tick:s.tick,hash:c.hash(s),sold:s.ledger.lager.exported,
   seller:s.owners.house.cash,buyer:s.owners.export.cash,
   carrier:s.owners.transport.cash,pilot:s.owners.c1d_pilot.cash,minted:s.minted
  }));
 }
});

test('C1d-8b: cannot resell first or second cargo, third order and third flight rejected',()=>{
 const s=settled();
 const old=c.hash(s);
 for(const cmd of [
  {type:'stationPrepayStorage',owner:'export'},
  {type:'stationAcceptStorage',owner:'export'},
  {type:'stationPrepayStorageSecond',owner:'export'},
  {type:'stationAcceptStorageSecond',owner:'export'},
  {type:'shipCapitalFreight',owner:'transport',schiff:'sh002'},
  {type:'shipCapitalFreightSecond',owner:'transport',schiff:'sh002'}
 ])reject(s,cmd);
 assert.equal(c.hash(s),old);
 assert.equal(s.ledger.lager.exported,8);
 audit(s);
});

test('C1d-8b: tampered second title, buyer journal, escrow, pilot or invented cash rejected',()=>{
 const s=settled(42);
 const alterations=[
  x=>x.c1f.secondOrder.id='C1D4-0001',
  x=>x.c1f.secondOrder.buyerBefore++,
  x=>x.c1f.secondOrder.buyerJournal.costs++,
  x=>x.c1f.secondOrder.acceptedTick=1100,
  x=>x.c1d.second.job.id='C1D8B-FREIGHT-0001',
  x=>x.c1d.second.job.sellerJournal.revenue++,
  x=>x.c1d.second.job.carrierJournal.costs++,
  x=>x.c1d.second.pilotPaid--,
  x=>x.c1d.second.feePaid--,
  x=>x.w5b.bauteilTitel[6].owner='st_nadir',
  x=>x.ledger.lager.exported--,
  x=>x.owners.c1f_kaufrest_escrow.cash++,
  x=>x.owners.export.cash++,
  x=>{x.minted++;x.owners.house.cash++;}
 ];
 for(let i=0;i<alterations.length;i++){
  let bad=structuredClone(s);alterations[i](bad);
  assert.throws(()=>c.load(JSON.stringify(bad)),'forgery '+i);
 }
 audit(s);
});

test('C1d-8b: original-save replay deterministic throughout second flight and post-settlement',()=>{
 for(const seed of [42,7]){
  let a=ordered(seed),b=save(a);
  for(const s of [a,b])command(s,{type:'shipCapitalFreightSecond',owner:'transport',schiff:'sh002'});
  for(let i=0;i<240;i++){
   c.step(a);c.step(b);audit(a);audit(b);
   assert.equal(c.hash(a),c.hash(b));
   if([59,119,239].includes(i)){a=save(a);b=save(b);}
  }
  for(const s of [a,b])command(s,{type:'stationAcceptStorageSecond',owner:'export'});
  assert.equal(c.hash(a),c.hash(b));
  for(let i=0;i<10;i++){c.step(a);c.step(b);audit(a);audit(b);assert.equal(c.hash(a),c.hash(b));}
  assert.equal(a.c1f.secondAccepted,4);
 }
});
