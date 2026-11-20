// M3-P2: survey legitimate paid purchases against real S02 shipyard stock.
// This first pass collects original offers; never mutate cash, stock or rules by hand.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const OLD=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const W6=require('../tools/w6-szenarien.cjs');

function start(){
 const j=J8.erstellen();
 j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);
 w.npcSiliziumSetzen(s,true);
 assert.equal(w.audit(s).ok,true);
 return {j,w,s};
}
function check(j){
 const w=j.weltReferenz(),s=j.zustandReferenz(),before=w.save(s);
 assert.equal(w.audit(s).ok,true);
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000);
 assert.equal(s.minted,0);
 assert.equal(s.burned,0);
 assert.equal(w.save(s),before);
 assert.equal(w.hash(w.load(before)),w.hash(s));
}
function observe(j,label){
 const s=j.zustandReferenz(),quotes=j.angebote();
 const watch=['buy-st_aldera-miner','buy-st_aldera-frachter',
 'buy-st_nadir-frachter','buy-st_nadir-jaeger'];
 const out={label,tick:s.tick,house:s.owners.house.cash,
   nadirStock:s.stations.st_nadir.lager.frachter,
   alderaStock:s.stations.st_aldera.lager,
   w3:s.w3.abgeschlossen,w4:s.w4.abgeschlossen,w5:s.w5.fertig,
   quotes:Object.fromEntries(watch.map(id=>{const q=quotes.find(x=>x.id===id);
     return [id,{ok:q?.ok??null,reason:q?.reason||null}];}))};
 console.log('M3_P2_ORIGINAL_OFFERS '+JSON.stringify(out));
 return out;
}
test('M3-P2 exploration: purchase only real Aldera ship offers after authentic S02 hull completion',()=>{
 const {j,w,s}=start();
 observe(j,'before');
 for(let t=0;t<253;t++)w.advance(s,1);
 check(j);
 const initial=observe(j,'hull-built-t253');
 assert.equal(initial.nadirStock,1,'authentic W5 hull is on sale at minute 253');
 assert.equal(initial.house,3000);
 const attempts=['buy-st_aldera-miner','buy-st_aldera-miner',
   'buy-st_aldera-miner','buy-st_aldera-frachter','buy-st_nadir-jaeger'];
 for(const id of attempts){
   const q=j.angebote().find(x=>x.id===id);
   const before=j.exportieren(),old=j.ansicht().hash;
   const result=q?.ok?j.ausfuehren(id):null;
   if(result){
     assert.equal(result.ok,true,JSON.stringify(result));
     assert.notEqual(j.exportieren(),before,'paid transaction must change the original save');
   }else{
     assert.equal(j.exportieren(),before,'unavailable offer cannot change the save');
     assert.equal(j.ansicht().hash,old);
   }
   check(j);
   const entry=observe(j,'after-'+id);
   console.log('M3_P2_ORIGINAL_PURCHASE '+JSON.stringify({id,available:q?.ok||false,
      reason:q?.reason||null,receipt:result?.ok||false,cash:entry.house,stock:entry.nadirStock}));
 }
 const final=observe(j,'final');
 if(final.nadirStock>0&&final.house<750){
   const q=j.angebote().find(x=>x.id==='buy-st_nadir-frachter');
   assert.equal(q.ok,false,'actual funded core must deny without enough cash');
   assert.ok(q.reason,'original reason is required');
   const old=j.exportieren(),hash=j.ansicht().hash,out=j.ausfuehren(q.id);
   assert.equal(out.ok,false);
   assert.equal(out.reason,q.reason);
   assert.equal(j.exportieren(),old);
   assert.equal(j.ansicht().hash,hash);
   check(j);
   console.log('M3_P2_NATURAL_FINANCE_ONLY_SUCCESS '+JSON.stringify({reason:q.reason,
    house:final.house,stock:final.nadirStock,hash}));
 }else console.log('M3_P2_NATURAL_FINANCE_ONLY_NOT_REACHED '+JSON.stringify(final));
});

test('M3-P2 timing survey: pay for genuine ships after K7 has begun, before W5 completes',()=>{
 const candidates=[0,30,60,71,90,120,203,223];
 const records=[],proved=[];
 for(const purchaseAt of candidates){
   const {j,w}=start();
   for(let t=0;t<purchaseAt;t++)w.advance(j.zustandReferenz(),1);
   const original=j.zustandReferenz();
   const prior={tick:original.tick,k7:original.kanon.industrieErz?.phase,
    w3Active:!!original.w3.auftrag,aldera:{...original.stations.st_aldera.lager}};
   const purchased=[],blocked=[];
   for(const id of ['buy-st_aldera-miner','buy-st_aldera-miner',
     'buy-st_aldera-miner','buy-st_aldera-frachter']){
     const q=j.angebote().find(x=>x.id===id);
     if(q?.ok){
       const before=j.zustandReferenz().owners.house.cash;
       const a=j.ausfuehren(id);
       assert.equal(a.ok,true,JSON.stringify({purchaseAt,id,a}));
       assert.ok(j.zustandReferenz().owners.house.cash<before);
       purchased.push(id);
     }else blocked.push({id,reason:q?.reason||'absent'});
   }
   for(let t=purchaseAt;t<253;t++)w.advance(j.zustandReferenz(),1);
   check(j);
   const now=j.zustandReferenz(),nadirStock=now.stations.st_nadir.lager.frachter,
     house=now.owners.house.cash,q=j.angebote().find(x=>x.id==='buy-st_nadir-frachter');
   const result={purchaseAt,prior,purchased,blocked,house,nadirStock,
     w3:now.w3.abgeschlossen,w4:now.w4.abgeschlossen,w5:now.w5.fertig,
     offer:{ok:q?.ok??null,reason:q?.reason||null},hash:w.hash(now)};
   if(nadirStock>0 && house<750){
     assert.equal(q.ok,false,'original finance should refuse real stocked 750-ISK hull');
     assert.ok(q.reason);
     const before=j.exportieren(),hash=j.ansicht().hash,
       out=j.ausfuehren('buy-st_nadir-frachter');
     assert.equal(out.ok,false);
     assert.equal(out.reason,q.reason);
     assert.equal(j.exportieren(),before);
     assert.equal(j.ansicht().hash,hash);
     const direct=w.execute(now,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'frachter'});
     assert.equal(direct.ok,false);
     assert.equal(direct.reason,q.reason);
     assert.equal(j.exportieren(),before);
     check(j);
     proved.push(result);
   }
   records.push(result);
 }
 console.log('M3_P2_PAID_TIMING_SURVEY '+JSON.stringify(records));
 if(proved.length)console.log('M3_P2_AUTHENTIC_FINANCE_ONLY '+JSON.stringify(proved));
 else console.log('M3_P2_FINANCE_ONLY_REMAINS_UNPROVEN '+JSON.stringify({
   scenarios:candidates.length,allAudited:true,records:records.map(x=>({
    purchaseAt:x.purchaseAt,house:x.house,nadirStock:x.nadirStock,w5:x.w5
   }))}));
});

test('M3-P2: a genuine first Nadir purchase leaves 450 ISK; inspect second organic W5 stock',()=>{
 const {j,w}=start();
 for(let t=0;t<71;t++)w.advance(j.zustandReferenz(),1);
 assert.equal(j.zustandReferenz().w3.auftrag!==null,true,
  'original W3 ore order must have started before house expenditure');
 const bought=[];
 for(let n=0;n<3;n++){
   const q=j.angebote().find(x=>x.id==='buy-st_aldera-miner');
   assert.equal(q?.ok,true,'the three existing Aldera miners must actually be sold');
   const pre=j.zustandReferenz().owners.house.cash;
   const out=j.ausfuehren(q.id);
   assert.equal(out.ok,true,JSON.stringify(out));
   assert.equal(j.zustandReferenz().owners.house.cash,pre-600);
   bought.push(q.id);
 }
 assert.equal(j.zustandReferenz().owners.house.cash,1200);
 for(let t=71;t<253;t++)w.advance(j.zustandReferenz(),1);
 check(j);
 const atFirst=j.zustandReferenz(),first=j.angebote().find(x=>x.id==='buy-st_nadir-frachter');
 assert.equal(atFirst.stations.st_nadir.lager.frachter,1,'first real NPC-funded W5 hull must exist');
 assert.equal(first?.ok,true,first?.reason);
 assert.equal(j.ausfuehren(first.id).ok,true);
 const after=j.zustandReferenz();
 assert.equal(after.stations.st_nadir.lager.frachter,0);
 assert.equal(after.owners.house.cash,450,'three paid 600-ISK miners and one 750-ISK Nadir hull');
 assert.equal(Object.values(after.ships).filter(s=>s.owner==='house'&&
  after.w5.schiffIds.includes(s.id)).length,1,'the house paid for precisely one W5 ship');
 check(j);
 const replay=J8.erstellen(),checkpoint=j.exportieren();
 replay.oeffnen204(checkpoint,true);
 assert.equal(replay.exportieren(),checkpoint,'cold J8 recovery after legitimate W5 purchase');
 let witness=null;const end=253+3*1440;
 for(let tick=254;tick<=end;tick++){
   w.advance(j.zustandReferenz(),1);
   replay.weltReferenz().advance(replay.zustandReferenz(),1);
   const s=j.zustandReferenz();
   if(s.stations.st_nadir.lager.frachter>0){
     witness={tick,house:s.owners.house.cash,stock:s.stations.st_nadir.lager.frachter,
       w3:s.w3.abgeschlossen,w4:s.w4.abgeschlossen,w5:s.w5.fertig,
       sold:s.w5.verkauft,hash:w.hash(s)};
     break;
   }
 }
 const a=j.zustandReferenz(),b=replay.zustandReferenz();
 assert.equal(w.save(a),replay.weltReferenz().save(b),'two genuine histories must replay identically');
 check(j);check(replay);
 const quote=j.angebote().find(x=>x.id==='buy-st_nadir-frachter');
 const result={firstPurchaseTick:253,houseAfterFirst:450,
   firstOwnedW5:1,secondStockSeen:witness!==null,witness,
   lastTick:a.tick,latestHouse:a.owners.house.cash,latestStock:a.stations.st_nadir.lager.frachter,
   built:a.w5.fertig,sold:a.w5.verkauft,quote:{ok:quote?.ok??null,reason:quote?.reason||null},
   hash:w.hash(a)};
 if(witness&&witness.house<750){
   assert.equal(quote.ok,false,'second real physical W5 hull must be denied to underfunded house');
   assert.ok(quote.reason);
   const original=j.exportieren(),old=j.ansicht().hash,
     out=j.ausfuehren('buy-st_nadir-frachter');
   assert.equal(out.ok,false);
   assert.equal(out.reason,quote.reason);
   assert.equal(j.exportieren(),original);
   assert.equal(j.ansicht().hash,old);
   const direct=w.execute(a,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'frachter'});
   assert.equal(direct.ok,false);
   assert.equal(direct.reason,quote.reason);
   assert.equal(j.exportieren(),original);
   check(j);
   console.log('M3_P2_ORGANIC_SECOND_HULL_FINANCE_BLOCK '+JSON.stringify(result));
 }else{
   console.log('M3_P2_SECOND_HULL_SEARCH_NEGATIVE '+JSON.stringify(result));
 }
});
