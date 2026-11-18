/* [ANALYSE] Rule204/S02, real J8 commands only. No market or rule overrides.
 * The scenario intentionally leaves NPC policy running; an unavailable
 * player offer is recorded, never converted into an invented contract.
 */
'use strict';
const assert=require('node:assert/strict');
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
const maxChecks=72; // 72 x 10 minutes after the first paid round
function verify(j){
 const w=j.weltReferenz(),s=j.zustandReferenz(),a=w.audit(s);
 assert.equal(a.ok,true,a.fehler?.join('; '));
 for(const k of ['isk','goods','w3','w4','w5','w5transfer'])
   assert.equal(a.wirtschaft[k].ok,true,k);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 return s;
}
function started(){
 const j=J8.erstellen();
 j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);
 w.npcSiliziumSetzen(s,true);
 for(let i=0;i<5;i++)j.weiterspielen(60);
 assert.equal(j.ausfuehren('buy-st_nadir-frachter').ok,true);
 const yardId=Object.values(verify(j).ships).find(sh=>sh.owner==='house'
   &&sh.klasse==='frachter'&&verify(j).w5.schiffIds.includes(sh.id))?.id;
 assert.ok(yardId);
 assert.equal(j.ausfuehren('reposition-'+yardId).ok,true);
 j.weiterspielen(60);
 assert.ok(verify(j).w5ac.completed.some(t=>t.id===yardId&&t.owner==='house'
  &&t.kosten===60&&t.ankunft===360));
 assert.equal(verify(j).ships[yardId].heimat,'nadir');
 assert.equal(verify(j).ships[yardId].system,'aldera');
 assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);
 const mi=Object.values(verify(j).ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner');
 assert.ok(mi);
 assert.equal(j.ausfuehren('ice-'+mi.id).ok,true);
 j.weiterspielen(60);j.weiterspielen(60);
 assert.equal(verify(j).tick,480);
 return {j,ship:yardId,miner:mi.id};
}
function run(){
 const {j,ship,miner}=started(),w=j.weltReferenz();
 const receipts=[],reasons=new Map(),timeline=[];
 function offer(){return j.angebote().find(x=>x.id==='freight-'+ship);}
 function book(){
   const s0=verify(j),q=offer();
   assert.equal(q?.ok,true,'unfunded player freight cannot be forced: '+q?.reason);
   const start=s0.tick,oldValue=w.buchwert(s0,ship),oldWear=s0.kanon.verschleiss[ship]||0;
   const before=j.exportieren(),accepted=j.ausfuehren('freight-'+ship);
   assert.equal(accepted.ok,true,JSON.stringify(accepted));
   assert.notEqual(j.exportieren(),before);
   let x=verify(j).kanon.spielerFrachten.auftraege.at(-1);
   assert.equal(x.schiff,ship);assert.equal(x.start,start);assert.equal(x.end,null);
   j.weiterspielen(60);verify(j);
   j.weiterspielen(60);
   const s=verify(j);
   x=s.kanon.spielerFrachten.auftraege.at(-1);
   assert.equal(x.end,start+120);assert.equal(x.geliefert,start+60);
   assert.equal(s.ships[ship].system,'aldera');assert.equal(s.ships[ship].heimat,'nadir');
   const wear=oldValue-w.buchwert(s,ship),minutes=(s.kanon.verschleiss[ship]||0)-oldWear;
   assert.equal(minutes,120,'only 120 real paid original flight minutes per freight');
   assert.ok(wear>=0,'never create artificial book value');
   const receipt={start,end:s.tick,ship,menge:x.menge,tarif:x.fracht,lohn:x.arbeit,
     verzehr:wear,beitrag:x.fracht-x.arbeit-wear,
     haus:s.owners.house.cash,aldera:s.owners.st_aldera.cash,nadir:s.owners.st_nadir.cash,
     frachterBuchwert:w.buchwert(s,ship),hash:w.hash(s)};
   receipts.push(receipt);
   return receipt;
 }
 const first=book();
 assert.equal(first.start,480);
 for(let i=0;i<maxChecks && receipts.length<4;i++){
   const q=offer();
   if(q?.ok){book();continue;}
   const reason=q?.reason||'Kein Originalangebot';
   reasons.set(reason,(reasons.get(reason)||0)+1);
   const state=verify(j);
   if(i===0||i%6===0||i===maxChecks-1){
     timeline.push({tick:state.tick,reason,
       eis:state.stations.st_aldera.lager.eis||0,
       aldera:state.owners.st_aldera.cash,
       nadir:state.owners.st_nadir.cash,
       npcFracht:state.w5n.frachtauftrag?.schiff||null});
   }
   j.weiterspielen(10);verify(j);
 }
 const end=verify(j),save=j.exportieren(),cold=J8.erstellen();
 cold.oeffnen204(save,true);
 assert.equal(cold.exportieren(),save,'cold Rule204 reload must preserve complete history');
 assert.equal(cold.weltReferenz().hash(cold.zustandReferenz()),w.hash(end));
 const own=end.kanon.spielerFrachten;
 assert.equal(own.auftraege.filter(x=>x.end!==null).length,receipts.length);
 assert.equal(own.gebuehr,receipts.reduce((a,x)=>a+x.tarif,0));
 assert.equal(own.lohn,receipts.reduce((a,x)=>a+x.lohn,0));
 return {rules:204,seed:42,ship,miner,method:'unmodified S02 NPC policy; manual offers every 10 original minutes after first freight',
    first,receipts,reasonCounts:[...reasons.entries()],timeline,
    end:{tick:end.tick,hash:w.hash(end),house:end.owners.house.cash,
      aldera:end.owners.st_aldera.cash,nadir:end.owners.st_nadir.cash,
      ice:end.stations.st_aldera.lager.eis||0,bookValue:w.buchwert(end,ship),
      pilot:end.owners.pilot_house.cash,completed:receipts.length,
      tariff:own.gebuehr,wages:own.lohn,
      transportContribution:receipts.reduce((a,x)=>a+x.beitrag,0)},
    finalSave:save};
}
module.exports={run};
if(require.main===module){const r=run();delete r.finalSave;console.log(JSON.stringify(r,null,2));}
