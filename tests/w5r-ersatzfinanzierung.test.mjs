import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=api.W5R_RULES;
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];

function start(mode='full',miner='npc3',exportMode='off',rate=0,dayCap=0,totalCap=0,seed=42){
 const s=api.createW5RState(seed,mode,miner,exportMode,rate,dayCap,totalCap);
 verify(s,'start');
 return s;
}
function verify(s,label=''){
 const result=api.audit(s);
 assert.equal(result.ok,true,label+': '+JSON.stringify(Object.fromEntries(
   Object.entries(result).filter(([,v])=>v?.ok===false))));
 assert.equal(s.rulesVersion,32);assert.equal(s.schema,8);
 assert.equal(s.burned,0);assert.equal(s.minted,s.w5q.minted);
 assert.equal(Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0),
   33000+s.minted,label+' independent ISK');
 for(const [id,o] of Object.entries(s.owners))
   assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,label+' valid owner '+id);
 for(const [ware,l] of Object.entries(s.ledger)){
   const actual=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
   const due=l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported;
   assert.equal(actual,due,label+' exact '+ware);
 }
 assert.equal(result.w5n.ok,true,label+' W5n');
 assert.equal(result.w5o.ok,true,label+' W5o');
 assert.equal(result.w5q.ok,true,label+' W5q');
 assert.equal(result.w5r.ok,true,label+' W5r');
}
function day(s,d){api.advance(s,1440,rules);verify(s,'day '+d);return s}
function invalid(s,fn){
 const hash=api.hash(s),copy=api.loadW5R(api.save(s));
 fn(copy);
 assert.equal(api.audit(copy).ok,false,'forged cash/goods/receipt should be rejected');
 assert.throws(()=>api.loadW5R(api.save(copy)),/fehlerhaft|nicht ladbar/);
 assert.equal(api.hash(s),hash,'original saved state must not change');
}
test('W5r: R32 independent of R31; unchanged old world and strict schema8 save isolation',()=>{
 const older=api.createW5QState(42,'full','npc3','off',0,0,0);
 const gold=api.hash(older);
 assert.equal(api.audit(older).ok,true);
 assert.equal(api.hash(api.loadW5Q(api.save(older))),gold);
 const s=start();
 assert.equal(s.initialSupply,33000);
 assert.equal(s.w5r.servicePaid,0);assert.equal(s.w5r.losses.length,0);
 assert.equal(s.stations.st_aldera.lager.miner,2);
 assert.equal(s.stations.st_aldera.lager.frachter,0);
 assert.equal(s.ledger.miner.consumed,1);
 assert.equal(s.ledger.frachter.consumed,1);
 assert.throws(()=>api.loadW5R(api.save(older)),/inkompatibel/);
 assert.throws(()=>api.loadW5Q(api.save(s)),/inkompatibel/);
 assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
 assert.equal(api.hash(older),gold,'R31 world unchanged');
});
test('W5r: day15 miner actually lost with cargo; only real paid 600-ISK replacement',()=>{
 const s=start();
 const ownerStart=s.owners.npc3.cash;
 const werftStart=s.owners.werft_extern.cash;
 for(let i=1;i<=15;i++)day(s,i);
 assert.equal(s.w5r.miner.lost,1);
 assert.equal(s.w5r.miner.bought,1);
 assert.equal(s.w5r.losses[0].type,'miner');
 assert.equal(s.w5r.losses[0].cargo.find(x=>x.ware==='eis').menge,100);
 assert.equal(s.w5r.lostIce,100);
 assert.equal(s.ledger.eis.consumed,s.w5n.eisVerbraucht+100);
 assert.equal(s.ledger.miner.consumed,2);
 assert.equal(s.stations.st_aldera.lager.miner,1);
 assert.ok(!s.ships.sh001,'original hull physically removed');
 assert.equal(s.w5r.miner.id,'sh003','new physical ship, new ID');
 assert.equal(s.ships.sh003.owner,'npc3');
 assert.equal(s.owners.werft_extern.cash,werftStart+600);
 assert.equal(s.owners.npc3.cash,1600);
 assert.notEqual(s.owners.npc3.cash,ownerStart+600,'owner NOT subsidized');
 assert.equal(s.minted,0);
});
test('W5r: day30 freight hull disappears, no replacement despite 1250 ISK cash',()=>{
 const s=start();
 for(let d=1;d<=30;d++)day(s,d);
 assert.equal(s.w5r.miner.lost,2);
 assert.equal(s.w5r.miner.bought,2);
 assert.equal(s.ledger.miner.consumed,3);
 assert.equal(s.stations.st_aldera.lager.miner,0);
 assert.equal(s.w5r.frachter.lost,1);
 assert.equal(s.w5r.frachter.bought,0);
 assert.equal(s.w5r.frachter.id,null);
 assert.ok(!s.ships.sh002);
 assert.equal(s.stations.st_aldera.lager.frachter,0);
 assert.equal(s.ledger.frachter.consumed,1,'no invented hull');
 assert.equal(s.owners.transport.cash,1250,'operator has cash, no stock');
 assert.ok(s.w5r.blocked.frachter>=1);
 assert.equal(s.w5n.frachtauftrag,null,'no cancellation of a real working freight contract');
 assert.equal(s.minted,0);
});
test('W5r: scheduled facility service is 60 genuine prepaid minutes, no duplicate work',()=>{
 const s=start();
 for(let d=1;d<20;d++)day(s,d);
 assert.equal(s.w5r.serviceAllocated,0);
 api.advance(s,1440,rules);
 verify(s,'day 20');
 assert.equal(s.w5r.serviceAllocated,60);
 assert.equal(s.w5r.servicePaid,1);
 assert.equal(s.owners.w5r_maintenance_reserved.cash,59);
 assert.equal(s.owners.w5r_maintenance_workforce.cash,1);
 assert.equal(s.w5r.serviceJob.minutes,1);
 assert.equal(s.w5n.fabrikauftrag,null);
 const forbidden=api.execute(s,{type:'stationWater',owner:'st_nadir',station:'st_nadir'},rules);
 assert.equal(forbidden.ok,false,'water production cannot bypass paid station service');
 api.advance(s,59,rules);
 verify(s,'service complete');
 assert.equal(s.w5r.serviceJob,null);
 assert.equal(s.w5r.services,1);
 assert.equal(s.w5r.serviceAllocated,60);
 assert.equal(s.w5r.servicePaid,60);
 assert.equal(s.owners.w5r_maintenance_reserved.cash,0);
 assert.equal(s.owners.w5r_maintenance_workforce.cash,60);
 const hash=api.hash(s);
 for(let i=0;i<100;i++)api.pilotW5RStand(s);
 assert.equal(api.hash(s),hash,'projection read only');
});
test('W5r: five 90d cases verify loss, real hull stock and no individual rescue',()=>{
 const variants=[
   ['full','npc3','off',0,0,0,1500,0,2,3,0,'b456ac67d9797566'],
   ['npcSave','npc3','off',0,0,0,899,0,2,3,0,'ce03e37f5d57ae9c'],
   ['npcSave','npc3','household',14,140,3500,1500,3500,2,3,0,'c96e265d9c3fab5d'],
   ['full','house','off',0,0,0,789,0,1,2,0,'3d212c27ef130736'],
   ['full','house','household',14,140,7000,1490,4340,1,2,0,'2285bc6607c55100']
 ];
 for(const [mode,owner,exportMode,rate,dayCap,total,water,minted,
   minerBought,minerLost,freightBought,hash]of variants){
   const s=start(mode,owner,exportMode,rate,dayCap,total);
   for(let d=1;d<=90;d++)day(s,d);
   assert.equal(s.w5n.wasserVerbraucht,water);
   assert.equal(s.minted,minted);
   assert.equal(s.w5r.miner.bought,minerBought);
   assert.equal(s.w5r.miner.lost,minerLost);
   assert.equal(s.w5r.frachter.bought,freightBought);
   assert.equal(s.w5r.frachter.id,null,'no freighter materialized for free');
   assert.equal(s.w5r.servicePaid,240,'60 mins x 4 funded service jobs');
   assert.equal(s.ledger.eis.consumed,s.w5n.eisVerbraucht+s.w5r.lostIce);
   assert.equal(api.hash(s),hash);
   if(owner==='house')assert.equal(s.w5o.divMine,0,'player savings unrestricted');
   console.log('W5R_90 '+JSON.stringify({mode,owner,exportMode,total,
     water,minted,hash,shipLosses:s.w5r.losses.length,realHullBuys:s.w5r.purchases.length}));
 }
});
test('W5r: reject forged lost cargo, imaginary hulls, worker payouts and save receipts',()=>{
 const s=start();
 for(let d=1;d<=30;d++)day(s,d);
 invalid(s,x=>{x.w5r.lostIce+=1});
 invalid(s,x=>{x.ledger.eis.consumed+=1});
 invalid(s,x=>{x.ledger.miner.consumed+=1});
 invalid(s,x=>{x.w5r.miner.bought+=1});
 invalid(s,x=>{x.w5r.frachter.bought+=1});
 invalid(s,x=>{x.stations.st_aldera.lager.frachter++});
 invalid(s,x=>{x.w5r.servicePaid+=1});
 invalid(s,x=>{x.owners.w5r_maintenance_workers={id:'forged',cash:1}});
 invalid(s,x=>{x.w5r.serviceAllocated+=60});
 invalid(s,x=>{x.w5r.losses[0].id=x.w5r.losses[1].id});
 invalid(s,x=>{x.w5r.purchases[0].cost=0});
 invalid(s,x=>{x.w5r.purchases[1].id=x.w5r.purchases[0].id});
 invalid(s,x=>{x.w5r.miner.born=-1});
 invalid(s,x=>{x.w5r.frachter.born=-1});
 invalid(s,x=>{x.w5r.losses[0].owner='house'});
 invalid(s,x=>{x.w5r.purchases[0].owner='house'});
 invalid(s,x=>{x.minted++});
});
test('W5r: 13 fixed seeds x 90d dual replay, daily goods/cash, roundtrips day 30/60/90',()=>{
 for(const seed of seeds){
   const a=start('full','npc3','off',0,0,0,seed);
   const b=start('full','npc3','off',0,0,0,seed);
   for(let d=1;d<=90;d++){
     api.advance(a,1440,rules);api.advance(b,1440,rules);
     verify(a,'seed '+seed+' day '+d);
     assert.equal(api.hash(a),api.hash(b),'seed '+seed+' replay day '+d);
     if(d%30===0)assert.equal(api.hash(api.loadW5R(api.save(a))),api.hash(a));
   }
   assert.equal(a.w5n.wasserVerbraucht,1500);
   assert.equal(a.w5r.miner.bought,2);
   assert.equal(a.w5r.frachter.bought,0);
   assert.equal(a.w5r.servicePaid,240);
   console.log('W5R_13_SEEDS '+JSON.stringify({seed,hash:api.hash(a),
     consumed:a.w5n.wasserVerbraucht,waterWork:a.w5r.servicePaid,
     hullPurchases:a.w5r.purchases.length,iskMinted:a.minted}));
 }
});
test('W5r: 365d verifies finite stocked hulls, paid labor and no unsupported restart',()=>{
 for(const [mode,owner,eMode,rate,dailyCap,total,water,services,stock]of [
   ['full','npc3','off',0,0,0,1500,18,0],
   ['npcSave','npc3','off',0,0,0,899,18,0],
   ['full','house','off',0,0,0,789,17,0]]){
   const s=start(mode,owner,eMode,rate,dailyCap,total);
   for(let d=1;d<=365;d++)day(s,d);
   assert.equal(s.w5n.wasserVerbraucht,water);
   assert.equal(s.w5r.services,services);
   assert.equal(s.w5r.servicePaid,services*60);
   assert.equal(s.stations.st_aldera.lager.miner,stock);
   assert.equal(s.w5r.frachter.id,null);
   assert.equal(s.w5r.miner.id,null);
   assert.equal(s.w5n.frachtauftrag,null);
   assert.equal(s.owners.transport.cash,1250);
   assert.equal(s.minted,0);
   assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
   console.log('W5R_365 '+JSON.stringify({mode,owner,
     water,services,hash:api.hash(s),cash:s.owners.st_nadir.cash,
     noFreighterDays:s.w5r.blocked.frachter}));
 }
});
