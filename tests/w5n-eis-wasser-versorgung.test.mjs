import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=api.W5N_RULES;
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
function audit(s,where=''){
 const a=api.audit(s);
 assert.equal(a.ok,true,where+': '+JSON.stringify(Object.fromEntries(
   Object.entries(a).filter(([,v])=>v?.ok===false))));
 assert.equal(s.schema,8);assert.equal(s.rulesVersion,29);
 assert.equal(s.initialSupply,33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 const cash=Object.values(s.owners).reduce((n,x)=>n+x.cash,0);
 assert.equal(cash,33000,'independent money '+where);
 for(const [id,o]of Object.entries(s.owners))
   assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,'account '+id+' '+where);
 for(const [ware,b]of Object.entries(s.ledger)){
   const actual=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
   assert.equal(actual,b.initial+b.mined+b.produced+b.imported-b.consumed-b.exported,
     'independent goods '+ware+' '+where);
 }
 assert.equal(a.w5n.ok,true);return a;
}
function cmd(s,type,owner,data={}){
 const res=api.execute(s,{type,owner,...data},rules);
 assert.equal(res.ok,true,type+': '+res.reason);
 audit(s,type);return res;
}
function refuse(s,type,owner,data={}){
 const before=api.hash(s);
 const res=api.execute(s,{type,owner,...data},rules);
 assert.equal(res.ok,false,type+' must reject');
 assert.equal(api.hash(s),before,type+' rejected state is immutable');
 return res.reason;
}
function started(seed=42){
 const s=api.createW5NState(seed);audit(s,'new');
 cmd(s,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
 cmd(s,'shipMine','house',{schiff:'sh002',ware:'eis'});
 cmd(s,'shipBuy','transport',{station:'st_aldera',klasse:'frachter'});
 return s;
}
function route(s){
 api.advance(s,50,rules);audit(s,'first 50 minutes');
 assert.equal(s.ledger.eis.mined,50);
 assert.equal(s.w5n.mineVerkauft,50);
 assert.equal(s.stations.st_aldera.lager.eis,50);
 assert.equal(s.owners.house.cash,2550);
 assert.equal(s.owners.st_aldera.cash,250);
 cmd(s,'shipFreightIce','transport',{schiff:'sh003'});
 assert.equal(s.owners.w5n_fracht_kauf.cash,490);
 assert.equal(s.owners.w5n_fracht_arbeit.cash,120);
 api.advance(s,60,rules);audit(s,'physical delivery');
 assert.equal(s.stations.st_nadir.lager.eis,50);
 assert.equal(s.w5n.eisTransferWert,250);
 assert.equal(s.w5n.frachtauftrag.phase,'rueck');
 api.advance(s,60,rules);audit(s,'paid return');
 assert.equal(s.w5n.frachtAbgeschlossen,1);
 assert.equal(s.owners.w5n_fracht_kauf.cash,0);
 assert.equal(s.owners.w5n_fracht_arbeit.cash,0);
 assert.equal(s.w5n.frachtLohn,120);
 assert.equal(s.w5n.frachtUmsatz,240);
 assert.equal(s.ships.sh003.system,'aldera');
 return s;
}
test('W5n: R29 isolation and preexisting R26/R27/R28 save rules',()=>{
 const r26=api.createW5IState(42);
 assert.equal(api.hash(r26),'343559f8c88543e4');
 assert.equal(api.audit(r26).ok,true);
 const r27=api.createW5LState(42);
 const r28=api.createW5MState(42);
 for(const [state,load]of [[r27,api.loadW5L],[r28,api.loadW5M]])
   assert.equal(api.hash(load(api.save(state))),api.hash(state));
 const s=api.createW5NState(42);audit(s,'fresh R29');
 assert.equal(s.owners.w5n_kunden.cash,1400);
 assert.equal(s.owners.st_nadir.cash,1700);
 assert.equal(api.hash(api.loadW5N(api.save(s))),api.hash(s));
 assert.throws(()=>api.loadW5M(api.save(s)),/inkompatibel/);
 assert.throws(()=>api.loadW5N(api.save(r28)),/inkompatibel/);
 refuse(r28,'shipFreightIce','npc3',{schiff:'sh001'});
});
test('W5n: genuine paid ice->W3-like two-way freight->water->consumption',()=>{
 const s=started();
 route(s);
 cmd(s,'stationWater','st_nadir',{station:'st_nadir'});
 assert.equal(s.owners.w5n_fabrik_arbeit.cash,20);
 api.advance(s,20,rules);audit(s,'water production completed');
 assert.equal(s.stations.st_nadir.lager.eis,40);
 assert.equal(s.stations.st_nadir.lager.wasser,10);
 assert.equal(s.ledger.eis.consumed,10);
 assert.equal(s.ledger.wasser.produced,10);
 assert.equal(s.owners.w5n_arbeit.cash,20);
 api.advance(s,50,rules);audit(s,'first paid water consumption');
 assert.equal(s.ledger.wasser.consumed,2);
 assert.equal(s.w5n.wasserErlos,28);
 assert.equal(s.owners.w5n_kunden.cash,1372);
 assert.equal(s.stations.st_nadir.lager.wasser,8);
 console.log('W5N_VERSORGUNG '+JSON.stringify({seed:42,hash:api.hash(s),tick:s.tick,
   iceMined:s.ledger.eis.mined,iceDelivered:s.w5n.eisGeliefert,
   waterProduced:s.w5n.wasserProduziert,waterPaid:s.w5n.wasserErlos,
   mint:s.minted}));
});
test('W5n: rejects free freight, wrong owner and processing without inputs',()=>{
 const s=started();
 refuse(s,'shipFreightIce','transport',{schiff:'sh003'});
 refuse(s,'stationWater','st_nadir',{station:'st_nadir'});
 refuse(s,'stationWater','house',{station:'st_nadir'});
 refuse(s,'shipSellIce','house',{schiff:'sh002',menge:50});
 refuse(s,'shipSellIce','npc3',{schiff:'sh002',menge:1});
 refuse(s,'shipFreightIce','house',{schiff:'sh003'});
 api.advance(s,50,rules);
 cmd(s,'shipFreightIce','transport',{schiff:'sh003'});
 refuse(s,'shipFreightIce','transport',{schiff:'sh003'});
 const before=api.hash(s);
 api.advance(s,120,rules);
 audit(s,'freight finished');
 assert.notEqual(api.hash(s),before);
});
test('W5n: NPC miners can work independently in ice instead of auto-restarting Erz',()=>{
 const s=api.createW5NState(42);
 const npc=Object.values(s.ships).find(sh=>sh.owner==='npc3'&&sh.klasse==='miner');
 assert.ok(npc,'original NPC hull is paid and owned');
 cmd(s,'shipWait','npc3',{schiff:npc.id});
 cmd(s,'shipMine','npc3',{schiff:npc.id,ware:'eis'});
 api.advance(s,70,rules);audit(s,'NPC ice autonomy across hourly planner ticks');
 assert.equal(s.w5n.eisAbgebaut,70);
 assert.equal(s.w5n.mineVerkauft,50);
 assert.equal(npc.ware,'eis','NPC Erz planner may not hijack other ore types');
 assert.equal(npc.auftrag,'foerdern');
 assert.equal(npc.ladung.eis,20);
 assert.equal(s.owners.npc3.cash,2510,'600 hull + 140 paid work + 250 paid ice sales');
 assert.equal(s.minted,0);
 assert.equal(api.hash(api.loadW5N(api.save(s))),api.hash(s));
});
test('W5n: consumption stops when physical water or real cash are missing',()=>{
 const s=started();
 api.advance(s,1440,rules);audit(s,'no processing 24h');
 assert.equal(s.w5n.wasserVerbraucht,0);
 assert.equal(s.w5n.wasserErlos,0);
 assert.equal(s.owners.w5n_kunden.cash,1400);
 assert.ok(s.w5n.knappheitsStunden>=24);
 assert.equal(s.minted,0);
 const end=s.w5n.wasserErlos;
 api.advance(s,1440,rules);audit(s,'no rescue 48h');
 assert.equal(s.w5n.wasserErlos,end);
});
test('W5n: two paid deliveries, ten real water batches, finite consumers pay exactly 1400 ISK',()=>{
 const s=started(42);
 api.advance(s,50,rules);
 for(let n=0;n<2;n++){
   cmd(s,'shipFreightIce','transport',{schiff:'sh003'});
   api.advance(s,120,rules);audit(s,'two-way freight '+n);
 }
 assert.equal(s.w5n.eisGeliefert,100);
 for(let n=0;n<10;n++){
   cmd(s,'stationWater','st_nadir',{station:'st_nadir'});
   api.advance(s,20,rules);
   audit(s,'water batch '+n);
 }
 assert.equal(s.w5n.wasserProduziert,100);
 assert.equal(s.w5n.fabrikBezahlt,200);
 api.advance(s,3600,rules);audit(s,'after 60 hours');
 assert.equal(s.w5n.wasserVerbraucht,100);
 assert.equal(s.w5n.wasserErlos,1400);
 assert.equal(s.owners.w5n_kunden.cash,0,'finite household funding exhausted');
 assert.equal(s.owners.st_nadir.cash,1920,'true 2 x 490 + 10 x 20 cost, 1400 paid revenue');
 assert.equal(s.ledger.wasser.produced,100);
 assert.equal(s.ledger.wasser.consumed,100);
 assert.equal(s.minted,0);
 const hash=api.hash(s),received=s.w5n.wasserErlos;
 api.advance(s,1440,rules);audit(s,'one more day with empty customer budget');
 assert.equal(s.w5n.wasserErlos,received,'no imaginary civilian refinancing');
 assert.equal(s.owners.w5n_kunden.cash,0);
 assert.equal(api.hash(api.loadW5N(api.save(s))),api.hash(s));
 console.log('W5N_ZWEI_ZYKLEN '+JSON.stringify({seed:42,
   sold:s.w5n.mineVerkauft,shipped:s.w5n.eisGeliefert,
   water:s.w5n.wasserVerbraucht,consumerPaid:received,
   nadirCash:s.owners.st_nadir.cash,minted:s.minted,hash}));
});
test('W5n: forgery of commodity ledger, payment and escrow is rejected on load',()=>{
 const s=route(started());
 cmd(s,'stationWater','st_nadir',{station:'st_nadir'});
 api.advance(s,20,rules);audit(s,'baseline');
 const snapshot=api.save(s),hash=api.hash(s);
 for(const change of [
   x=>{x.owners.w5n_kunden.cash+=14;},
   x=>{x.stations.st_nadir.lager.wasser+=10;},
   x=>{x.w5n.wasserErlos+=28;},
   x=>{x.w5n.frachtLohn-=1;},
   x=>{x.w5n.fabrikBezahlt+=1;},
 ]){
   const forged=JSON.parse(snapshot);change(forged);
   assert.equal(api.audit(forged).ok,false,'tampering must invalidate ledgers');
   assert.throws(()=>api.loadW5N(api.save(forged)),/fehlerhaft/);
 }
 assert.equal(api.hash(api.loadW5N(snapshot)),hash);
});
test('W5n: 13 seeds x 90 days, independent money and goods audits + replay/save',()=>{
 for(const seed of seeds){
   const a=route(started(seed));
   cmd(a,'stationWater','st_nadir',{station:'st_nadir'});
   api.advance(a,20,rules);
   const b=api.loadW5N(api.save(a));
   for(let day=1;day<=90;day++){
     api.advance(a,1440,rules);
     api.advance(b,1440,rules);
     audit(a,'seed '+seed+' day '+day);
     assert.equal(api.hash(a),api.hash(b),'replay seed '+seed+' day '+day);
     if(day%30===0)assert.equal(api.hash(api.loadW5N(api.save(a))),api.hash(a));
   }
   assert.equal(a.minted,0);
   console.log('W5N_90T '+JSON.stringify({seed,hash:api.hash(a),
     ice:a.ledger.eis.mined,water:a.ledger.wasser.consumed,
     consumerCash:a.owners.w5n_kunden.cash,ISK:33000}));
 }
});
