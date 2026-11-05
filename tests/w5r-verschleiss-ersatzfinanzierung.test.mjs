import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=api.W5R_RULES;
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const make=(seed=42,mode='full',owner='npc3',
  exportMode='off',rate=0,dayCap=0,totalCap=0)=>
  api.createW5RState(seed,mode,owner,exportMode,rate,dayCap,totalCap);
function check(s,where=''){
 const a=api.audit(s);
 assert.equal(a.ok,true,where+' '+JSON.stringify(Object.fromEntries(
   Object.entries(a).filter(([,v])=>v?.ok===false))));
 assert.equal(s.rulesVersion,32);assert.equal(s.schema,8);
 const cash=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
 assert.equal(cash,33000+s.minted-s.burned,'total money at '+where);
 assert.equal(s.burned,0);assert.equal(s.minted,s.w5q.minted);
 for(const [name,o] of Object.entries(s.owners))
   assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,where+' cash '+name);
 for(const [ware,g] of Object.entries(s.ledger)){
   const actual=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
   assert.equal(actual,g.initial+g.mined+g.produced+g.imported-g.consumed-g.exported,
     where+' physical stock '+ware);
 }
 assert.equal(a.w5m.ok,true);
 assert.equal(a.w5n.ok,true);
 assert.equal(a.w5o.ok,true);
 assert.equal(a.w5q.ok,true);
 assert.equal(a.w5r.ok,true);
 return a;
}
function advance(s,days,label=''){
 for(let day=1;day<=days;day++){
   api.advance(s,1440,rules);
   check(s,label+' day '+day);
   if(day===30||day===60||day===90||day===180||day===365)
     assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),'roundtrip '+label+' day '+day);
 }
 return s;
}
function wrong(s,change){
 const raw=api.save(s),hash=api.hash(s),copy=api.loadW5R(raw);
 change(copy);
 assert.equal(api.audit(copy).ok,false,'forgery detected');
 assert.throws(()=>api.loadW5R(api.save(copy)),/fehlerhaft/);
 assert.equal(api.hash(s),hash,'original save immutable');
}
test('W5r: isolated Regel32 starts with zero emission and preserves R31/R30 saves',()=>{
 const prev=api.createW5QState(42,'full','npc3');
 const hash=api.hash(prev);
 assert.equal(api.audit(prev).ok,true);
 assert.equal(api.hash(api.loadW5Q(api.save(prev))),hash);
 const w5o=api.createW5OState(42,'full','npc3');
 assert.equal(api.audit(w5o).ok,true);
 assert.equal(api.hash(api.loadW5O(api.save(w5o))),api.hash(w5o));
 const s=make();check(s,'initial');
 assert.equal(s.minted,0);
 assert.equal(s.w5r.serviceFunded,0);
 assert.equal(s.w5r.retired.length,0);
 assert.equal(s.w5r.replacements.length,0);
 assert.throws(()=>api.loadW5Q(api.save(s)),/inkompatibel/);
 assert.throws(()=>api.loadW5R(api.save(prev)),/inkompatibel/);
 assert.equal(api.hash(prev),hash);
});
test('W5r: 200 real factory-minutes trigger 2 physical ice and 20 prepaid service minutes',()=>{
 const s=make();
 let minute=0;
 while(s.w5r.serviceStarted===0&&minute<20000){
   api.advance(s,1,rules);minute++;
 }
 assert.ok(minute<20000,'service obligation must be reached by real work');
 check(s,'service reserved');
 assert.equal(s.w5r.workWaterMinutes,200);
 assert.equal(s.w5r.serviceStarted,1);
 assert.equal(s.w5r.serviceCompleted,0);
 assert.equal(s.w5r.serviceFunded,20);
 assert.equal(s.w5r.servicePaid,0);
 assert.equal(s.owners.w5r_service_escrow.cash,20);
 assert.equal(s.w5r.serviceIceConsumed,2);
 assert.equal(s.ledger.eis.consumed,s.w5n.eisVerbraucht+2);
 assert.equal(s.w5r.serviceOrder.worked,0);
 api.advance(s,10,rules);check(s,'half-paid service');
 assert.equal(s.w5r.servicePaid,10);
 assert.equal(s.owners.w5r_service_escrow.cash,10);
 assert.equal(s.w5r.serviceOrder.worked,10);
 api.advance(s,10,rules);check(s,'finished service');
 assert.equal(s.w5r.servicePaid,20);
 assert.equal(s.w5r.serviceCompleted,1);
 assert.equal(s.w5r.serviceOrder,null);
 assert.equal(s.owners.w5r_service_escrow.cash,0);
 assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
});
test('W5r: 90d NPC supply buys two real miner hulls, freight retirement halts supplies',()=>{
 const s=advance(make(),90,'npc full');
 const p=api.pilotW5RStand(s);
 assert.equal(p.retiredMiner,2);
 assert.equal(p.retiredFreighter,1);
 assert.equal(p.replacements,2);
 assert.equal(p.replacementPaidISK,1200);
 assert.equal(s.w5r.replacements.filter(x=>x.kind==='miner').length,2);
 assert.deepEqual(s.w5r.replacements.map(x=>x.cost),[600,600]);
 assert.equal(s.stations.st_aldera.lager.miner,0);
 assert.equal(s.stations.st_aldera.lager.frachter,0);
 assert.equal(s.ledger.miner.consumed,3);
 assert.equal(p.serviceStarted,9);
 assert.equal(p.serviceCompleted,9);
 assert.equal(p.servicePaid,180);
 assert.equal(p.iceConsumed,18);
 assert.equal(p.consumed,980);
 assert.equal(p.produced,980);
 assert.ok(p.missingFreighterHours>1000);
 assert.equal(p.worldISK,33000);
 assert.equal(s.minted,0);
 const before=api.hash(s);
 const fail=api.execute(s,{type:'shipBuy',owner:'transport',
   klasse:'frachter',station:'st_aldera'},rules);
 assert.equal(fail.ok,false,'no physical freighter stock, regardless of wallet');
 assert.equal(api.hash(s),before,'no phantom purchase');
 const retiredMiner=s.w5r.retired.find(x=>x.kind==='miner');
 const denied=api.execute(s,{type:'shipMine',owner:retiredMiner.owner,
   schiff:retiredMiner.id,ware:'eis'},rules);
 assert.equal(denied.ok,false,'worn hull cannot keep mining after retirement');
 assert.equal(api.hash(s),before);
 console.log('W5R_90 '+JSON.stringify({hash:api.hash(s),
   water:p.consumed,retired:p.retiredMiner+p.retiredFreighter,
   paidReplacement:p.replacementPaidISK,service:p.servicePaid,
   lackFreighterHours:p.missingFreighterHours}));
});
test('W5r: savings and player-owned miner still follow shared paid replacement rules',()=>{
 for(const c of [
   {mode:'npcSave',owner:'npc3',water:675,miner:1,freight:0,replace:1,paid:600,service:140,customer:9},
   {mode:'full',owner:'house',water:574,miner:1,freight:0,replace:1,paid:600,service:120,customer:6}
 ]){
   const s=advance(make(42,c.mode,c.owner),90,c.mode+' '+c.owner);
   const p=api.pilotW5RStand(s);
   assert.equal(p.consumed,c.water);
   assert.equal(p.retiredMiner,c.miner);
   assert.equal(p.retiredFreighter,c.freight);
   assert.equal(p.replacements,c.replace);
   assert.equal(p.replacementPaidISK,c.paid);
   assert.equal(p.servicePaid,c.service);
   assert.equal(p.customer,c.customer);
   assert.equal(s.w5o.divMine,c.owner==='house'?0:s.w5o.divMine,
     'player keeps income');
   assert.equal(s.minted,0);
 }
});
test('W5r: capped physical export income does not create a nonexistent freighter hull',()=>{
 const s=advance(make(42,'full','npc3','household',14,140,7000),90,'export');
 const p=api.pilotW5RStand(s);
 assert.equal(p.consumed,812);
 assert.equal(p.retiredMiner,2);
 assert.equal(p.retiredFreighter,1);
 assert.equal(p.replacements,2);
 assert.equal(p.replacementPaidISK,1200);
 assert.equal(p.minted,2352);
 assert.equal(p.worldISK,35352);
 assert.equal(s.w5q.exported,168);
 assert.equal(s.stations.st_aldera.lager.frachter,0);
 assert.ok(p.customer>4000,'well funded households, but no actual resupply route');
 assert.ok(p.missingFreighterHours>1000);
});
test('W5r: forged ship age, paid replacement, service ice and escrow are rejected',()=>{
 const s=advance(make(),30,'tamper base');
 assert.ok(s.w5r.retired.length>0);
 assert.ok(s.w5r.replacements.length>0);
 assert.ok(s.w5r.serviceCompleted>0);
 wrong(s,x=>{x.w5r.replacements[0].cost=0});
 wrong(s,x=>{x.w5r.retired[0].age=1});
 wrong(s,x=>{x.w5r.minutes[x.w5r.retired[0].id].minutes++});
 wrong(s,x=>{x.w5r.servicePaid++});
 wrong(s,x=>{x.w5r.serviceFunded++});
 wrong(s,x=>{x.w5r.serviceIceConsumed++});
 wrong(s,x=>{x.ledger.eis.consumed--});
 wrong(s,x=>{x.owners.w5n_kunden.cash+=1});
 wrong(s,x=>{x.ships[x.w5r.retired[0].id].w5rRetired=false});
 wrong(s,x=>{x.w5r.replacements.push({...x.w5r.replacements[0]})});
});
test('W5r: 365d history of financed plant and hull replacement vs saving collapse',()=>{
 const variants=[
   {mode:'full',owner:'npc3',ex:'off',rate:0,day:0,cap:0,water:980,
     replacements:2,services:9,freight:1,minted:0,hash:'801f5c83ffdc525b'},
   {mode:'npcSave',owner:'npc3',ex:'off',rate:0,day:0,cap:0,water:675,
     replacements:1,services:7,freight:0,minted:0,hash:'ebd1011d0eeabb29'},
   {mode:'full',owner:'house',ex:'off',rate:0,day:0,cap:0,water:574,
     replacements:1,services:6,freight:0,minted:0,hash:'b8950a2102767135'},
   {mode:'full',owner:'npc3',ex:'household',rate:14,day:140,cap:7000,water:812,
     replacements:2,services:9,freight:1,minted:2352,hash:'74e53495a2d884df'}
 ];
 for(const c of variants){
   const s=advance(make(42,c.mode,c.owner,c.ex,c.rate,c.day,c.cap),365,
     '365 '+c.mode+' '+c.owner+' '+c.ex);
   const p=api.pilotW5RStand(s);
   assert.equal(p.consumed,c.water);
   assert.equal(p.replacements,c.replacements);
   assert.equal(p.serviceCompleted,c.services);
   assert.equal(p.retiredFreighter,c.freight);
   assert.equal(p.minted,c.minted);
   assert.equal(api.hash(s),c.hash);
   console.log('W5R_365 '+JSON.stringify({mode:c.mode,owner:c.owner,
     ex:c.ex,water:c.water,repairs:p.serviceCompleted,
     replacement:p.replacementPaidISK,retiredFreight:c.freight,
     emitted:c.minted,hash:c.hash}));
 }
});
test('W5r: 13 seeds x 90d audited money/goods, deterministic double replay and saves',()=>{
 for(const seed of seeds){
   const a=make(seed),b=make(seed);
   for(let d=1;d<=90;d++){
     api.advance(a,1440,rules);
     api.advance(b,1440,rules);
     check(a,'seed '+seed+' day '+d);
     assert.equal(api.hash(a),api.hash(b),'deterministic replay '+seed+'/'+d);
     if(d%30===0)
       assert.equal(api.hash(api.loadW5R(api.save(a))),api.hash(a),
         'save/load '+seed+'/'+d);
   }
   const p=api.pilotW5RStand(a);
   assert.equal(p.worldISK,33000);
   assert.equal(p.consumed,980);
   assert.equal(p.replacements,2);
   assert.equal(p.retiredFreighter,1);
   assert.equal(p.serviceCompleted,9);
   console.log('W5R_SEED '+JSON.stringify({seed,hash:api.hash(a),
     water:p.consumed,ships:p.replacements,service:p.serviceCompleted,
     missingFreightHours:p.missingFreighterHours}));
 }
});
