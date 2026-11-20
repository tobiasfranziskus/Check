/* P3 capacity research, NO product mutation.
 * Scan every economic minute between 3160 and 4600, not just 10-minute snapshots.
 * Identical original Rule204/S02 NPC dispatcher, no forced purchases, policies or waitlists.
 */
'use strict';
const assert=require('node:assert/strict');
const J8=require('../prototypes/verbund/konzern-session.js');
const {erstellen}=require('./p3-werft-mehrschiff-fixture.cjs');

const START=3160, END=4600;
function ownerAudit(w,s){
 const a=w.audit(s);
 assert.equal(a.ok,true,(a.fehler||[]).join('; '));
 for(const field of ['isk','goods','w3','w4','w5','w5transfer'])
  assert.equal(a.wirtschaft[field].ok,true,field);
 assert.equal(Object.values(s.owners).reduce((sum,x)=>sum+x.cash,0),33000);
 assert.equal(s.minted,0);
 assert.equal(s.burned,0);
 return a;
}
function run(){
 const f=erstellen(),j=J8.erstellen();
 j.oeffnen204(f.save,true);
 const w=j.weltReferenz(),s=w.load(f.save);
 assert.equal(s.rulesVersion,204);
 assert.equal(w.hash(s),f.hash);
 assert.equal(s.tick,START);
 const baseCash=s.owners.house.cash;
 const counts={W3:0,W5n:0,W5ac:0,none:0,overlap:0};
 const reasons=new Map(),transitions=[],sample=[],freeQuotes=[];
 let previous=null;
 for(let minute=START;minute<=END;minute++){
  assert.equal(s.tick,minute);
  const occupying=[
   ...(s.w3.auftrag?['W3']:[]),
   ...(s.w5n.frachtauftrag?['W5n']:[]),
   ...(s.w5ac.active?['W5ac']:[])
  ];
  if(occupying.length>1)counts.overlap++;
  const label=occupying.length===0?'none':occupying.join('+');
  if(Object.hasOwn(counts,label))counts[label]++;
  else counts.overlap++;
  const quote=w.kern.pilotW5TransferKalkulation(s,f.second);
  assert.equal(typeof quote.ok,'boolean');
  if(quote.ok)freeQuotes.push({tick:s.tick,kosten:quote.kosten,minuten:quote.minuten,label});
  const why=quote.ok?'ORIGINAL-ANGEBOT-OK':quote.grund||'ohne Grund';
  reasons.set(why,(reasons.get(why)||0)+1);
  if(label!==previous){
   transitions.push({tick:minute,from:previous,to:label,
     w3:s.w3.auftrag?.schiff??null,
     w5n:s.w5n.frachtauftrag?.schiff??null,
     w5ac:s.w5ac.active?.id??null});
   previous=label;
  }
  if((minute-START)%120===0||minute===END){
   ownerAudit(w,s);
   assert.equal(w.hash(w.load(w.save(s))),w.hash(s),
     'Original JSON roundtrip must retain exact world hash');
   assert.equal(s.ships[f.second].owner,'house');
   assert.equal(s.ships[f.second].system,'nadir');
   assert.equal(s.ships[f.first].owner,'house');
   sample.push({tick:minute,occupancy:label,quote:why,
     house:s.owners.house.cash,transport:s.owners.transport.cash,
     nadir:s.owners.st_nadir.cash});
  }
  if(minute<END)w.minute(s);
 }
 ownerAudit(w,s);
 assert.equal(s.kanon.spielerFrachten.auftraege.length,9);
 assert.equal(s.owners.house.cash>=baseCash-750,true);
 const result={status:freeQuotes.length?'minute-window-found':'minute-window-blocked',
  start:START,end:END,checks:END-START+1,first:f.first,second:f.second,
  occupancy:counts,reasons:[...reasons.entries()].sort((a,b)=>b[1]-a[1]),
  transitions:transitions.slice(0,60),transitionCount:transitions.length,
  freeQuotes:freeQuotes.slice(0,15),freeQuoteCount:freeQuotes.length,
  sample,hash:w.hash(s),house:s.owners.house.cash,
  worldMoney:Object.values(s.owners).reduce((sum,x)=>sum+x.cash,0),
  rounds:s.kanon.spielerFrachten.auftraege.length};
 // This is a deliberately falsifiable negative hypothesis. A real 1-minute
 // slot causes red CI and must be investigated, not silently re-labelled.
 assert.equal(result.freeQuoteCount,0,
  'Actual original 1-minute ferry window found; test hypothesis falsified');
 assert.equal(result.occupancy.none,0,
  'An uncovered 1-minute gap exists; determine why quote was still denied');
 assert.equal(result.hash,'2454761bd83b9c95',
  '1-minute world progression must be bit-identical to #501 10-minute audit');
 return result;
}
module.exports={run};
if(require.main===module)console.log('P3_MINUTE_CAPACITY '+JSON.stringify(run()));
