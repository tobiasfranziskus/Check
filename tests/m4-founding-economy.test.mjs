import assert from 'node:assert/strict';
import test from 'node:test';
import J8 from '../prototypes/verbund/konzern-session.js';
import OLD from '../prototypes/w5ac/session.js';

function begin(optIn){
 const j=J8.erstellen(); j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 // Exact public startNeu policy selection on main 85a94f9e.
 if(optIn){
   w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
   w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 }
 assert.equal(s.kanon.npcAuto===true,optIn);
 return {j,w};
}
function checked(w,s){
 assert.deepEqual(w.audit(s).fehler,[]);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
}
function report(w,s){
 checked(w,s);
 return {tick:s.tick,house:s.owners.house.cash,transport:s.owners.transport.cash,
 stockAldera:s.stations.st_aldera.lager.frachter||0,stockNadir:s.stations.st_nadir.lager.frachter||0,
 fleet:Object.values(s.ships).filter(x=>x.klasse==='frachter').map(x=>({id:x.id,owner:x.owner,system:x.system})),
 ore:s.w3.geliefert,material:s.ledger.material.produced,materialNadir:s.stations.st_nadir.lager.material||0,
 built:s.w5.fertig,ice:s.w5n.eisGeliefert,hash:w.hash(s)};
}
function run(optIn,houseFirst){
 const {j,w}=begin(optIn);
 const start=report(w,j.zustandReferenz()),actions=[];
 const act=id=>{const r=j.ausfuehren(id);actions.push({tick:j.zustandReferenz().tick,id,ok:r.ok,reason:r.reason??null});return r;};
 let f=null;
 if(houseFirst){
   const r=act('buy-st_aldera-frachter');
   assert(r.ok);
   f=j.ansicht().schiffe.find(x=>x.klasse==='frachter').id;
 }else{
   w.advance(j.zustandReferenz(),1);
   // Do not buy the sole founding hull if the NPC has not acquired it.
   const s=j.zustandReferenz();
   if(s.stations.st_nadir.lager.frachter>0){
     const r=act('buy-st_nadir-frachter');
     if(r.ok)f=j.ansicht().schiffe.find(x=>x.klasse==='frachter').id;
   }
 }
 if(!houseFirst&&!f){
   // Observe up to the first 24 hours for the first actual industrial hull.
   for(let i=j.zustandReferenz().tick;i<1440;i=j.zustandReferenz().tick){
     w.advance(j.zustandReferenz(),1);
     if(j.zustandReferenz().stations.st_nadir.lager.frachter>0){
       if(act('buy-st_nadir-frachter').ok)f=j.ansicht().schiffe.find(x=>x.klasse==='frachter').id;
       break;
     }
   }
 }
 if(f&&j.zustandReferenz().ships[f].system==='nadir'){
   for(let i=0;i<=24;i++){
     const q=j.angebote().find(x=>x.id==='reposition-'+f);
     if(q?.ok){
       const cash=j.zustandReferenz().owners.house.cash;
       if(act('reposition-'+f).ok){
         assert.equal(cash-j.zustandReferenz().owners.house.cash,q.kosten);
         w.advance(j.zustandReferenz(),q.minuten);
         assert.equal(j.zustandReferenz().ships[f].system,'aldera');
       }
       break;
     }
     if(i<24)j.weiterspielen(60);
   }
 }
 if(f&&act('buy-st_aldera-miner').ok){
   const m=j.ansicht().schiffe.find(x=>x.klasse==='miner').id;
   if(act('ice-'+m).ok){
     w.advance(j.zustandReferenz(),120);
     if(act('freight-'+f).ok)w.advance(j.zustandReferenz(),120);
   }
 }
 const s=j.zustandReferenz(),before=report(w,s);
 assert(s.tick<10080); w.advance(s,10080-s.tick);
 const end=report(w,s);assert.equal(end.tick,10080);
 return {optIn,houseFirst,start,actions,before,end};
}
test('M4 founding hull: public standard vs explicit S02, house-first vs NPC-first',()=>{
 const cases=[];
 for(const optIn of [false,true])for(const houseFirst of [true,false]){
   const a=run(optIn,houseFirst),b=run(optIn,houseFirst);
   assert.deepEqual(a,b);
   cases.push(a);
 }
 console.log('M4_FOUNDING_MAIN '+JSON.stringify(cases));
});

function earlyMiner(mode){
 const {j,w}=begin(mode==='s02');
 if(mode==='k7-only')assert.equal(w.industrieAutoSetzen(j.zustandReferenz(),true).ok,true);
 const actions=[],failed={}; let f=null, firstF4=null, firstF4End=null, firstHull=null;
 const act=id=>{
   const tick=j.zustandReferenz().tick,r=j.ausfuehren(id);
   if(r.ok)actions.push({tick,id});
   else failed[r.reason??'unknown']=(failed[r.reason??'unknown']||0)+1;
   return r;
 };
 assert(act('buy-st_aldera-miner').ok);
 const m=j.ansicht().schiffe.find(x=>x.klasse==='miner').id;
 assert(act('ice-'+m).ok);
 const checkpoints=[];
 for(let i=0;i<7*1440;i+=10){
   let s=j.zustandReferenz();
   if(!f&&s.stations.st_nadir.lager.frachter>0){
     if(act('buy-st_nadir-frachter').ok){
       s=j.zustandReferenz(); f=j.ansicht().schiffe.find(x=>x.klasse==='frachter').id;
       assert.equal(s.ships[f].owner,'house');
       assert(s.w5.schiffIds.includes(f));
       firstHull=s.tick;
     }
   }
   s=j.zustandReferenz();
   if(f&&s.ships[f].system==='nadir'&&s.ships[f].phase==='dock')
     act('reposition-'+f);
   s=j.zustandReferenz();
   if(f&&s.ships[f].system==='aldera'&&s.ships[f].flug.lage==='angedockt'
     &&!s.w5n.frachtauftrag&&!s.w3.auftrag&&(s.stations.st_aldera.lager.eis||0)>=50){
     if(act('freight-'+f).ok&&firstF4===null)firstF4=s.tick;
   }
   s=j.zustandReferenz();
   w.advance(s,10);
   const receipts=s.kanon.spielerFrachten?.auftraege||[];
   if(firstF4End===null&&receipts.some(r=>r.end!==null))firstF4End=s.tick;
   if(s.tick%1440===0){
     checkpoints.push({...report(w,s),paidF4:receipts.filter(r=>r.end!==null).length,
       f4Tariff:s.kanon.spielerFrachten?.gebuehr??0,f4Wages:s.kanon.spielerFrachten?.lohn??0});
   }
 }
 const end=j.zustandReferenz(), receipts=end.kanon.spielerFrachten?.auftraege||[];
 assert.equal(end.tick,10080);
 assert.equal(receipts.filter(r=>r.end!==null).length,checkpoints.at(-1).paidF4);
 return {mode,firstHull,firstF4,firstF4End,actions,failed,checkpoints};
}
test('M4 active miner-first career: standard, existing K7-only policy, and S02, repeatable real manager decisions',()=>{
 const cases=[];
 for(const mode of ['standard','k7-only','s02']){
   const a=earlyMiner(mode),b=earlyMiner(mode);
   assert.deepEqual(a,b);
   cases.push(a);
 }
 console.log('M4_MINER_FIRST '+JSON.stringify(cases));
});
