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
