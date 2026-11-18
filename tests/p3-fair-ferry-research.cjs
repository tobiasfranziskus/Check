/* Node-only experimental P3 queue: original 204 world, original signed payment.
 * No grants, no injected goods, no changes to JSON/Rule204 or the public browser.
 */
'use strict';
process.env.APHROS_P3_FAIR_FERRY_RESEARCH='1';
const assert=require('node:assert/strict');
const {erstellen}=require('./p3-werft-mehrschiff-fixture.cjs');
const J8=require('../prototypes/verbund/konzern-session.js');
const W=require('../prototypes/welt/welt-kern.js');
const limit=5200;
function audit(w,s){
 const a=w.audit(s);
 assert.equal(a.ok,true,(a.fehler||[]).join('; '));
 for(const x of ['isk','goods','w3','w4','w5','w5transfer'])
  assert.equal(a.wirtschaft[x].ok,true,x);
 const total=Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0);
 assert.equal(total,33000);
 assert.equal(s.minted,0);
 assert.equal(s.burned,0);
 assert.ok([0,1].includes(Number(!!s.w3.auftrag)+Number(!!s.w5n.frachtauftrag)
   +Number(!!s.w5ac.active)),'One shared corridor: no overlapping bookings');
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 return a;
}
function build(){
 const f=erstellen();
 const j=J8.erstellen();
 j.oeffnen204(f.save,true);
 const w=j.weltReferenz(),s=w.load(f.save);
 assert.equal(w.regel,204);
 assert.equal(s.tick,3160);
 assert.equal(w.hash(s),f.hash);
 assert.equal(typeof w.p3ForschungsAnmeldung,'function');
 return {f,w,s};
}
function run(){
 const {f,w,s}=build();
 const initialHash=w.hash(s),startCash=s.owners.house.cash;
 const original=w.kern.pilotW5TransferKalkulation(s,f.second);
 assert.equal(original.ok,false);
 assert.equal(w.p3ForschungsAnmeldung(s,'sh002').ok,false,
   'foreign NPC carrier cannot be queued under house owner');
 assert.equal(w.p3ForschungsAnmeldung(s,'sh999').ok,false);
 assert.equal(w.p3ForschungsAnmeldung(s,f.first).ok,false,
   'Aldera ship already transferred is not a new Nadir hull');
 assert.equal(w.hash(s),initialHash,'invalid requests must be pure');
 const enrolled=w.p3ForschungsAnmeldung(s,f.second,360);
 assert.equal(enrolled.ok,true);
 assert.equal(w.p3ForschungsAnmeldung(s,f.second).ok,false,
   'duplicate reservations must not occupy two queue positions');
 assert.equal(w.hash(s),initialHash,'enrolling is pure: no wallet or goods mutation');
 assert.equal(s.owners.house.cash,startCash);
 assert.equal(w.p3ForschungsStatus().wartend.schiff,f.second);
 let granted=null,completed=null,postNpc=null;
 const seen=new Set(),postNpcKinds=new Set();
 for(let tick=3160;tick<limit;tick++){
  if(tick%20===0)audit(w,s);
  const status=w.p3ForschungsStatus(),a=s.w5ac.active;
  if(!granted&&status.letzterBeleg?.status==='original-gestartet'){
   granted={...status.letzterBeleg,house:s.owners.house.cash,
     escrow:s.owners.w5ac_transfer_reserve?.cash??null};
   assert.equal(s.w5ac.active?.id,f.second);
   assert.equal(granted.kosten,60,'original funded W5ac salary, not an arbitrary quote');
   assert.equal(startCash-s.owners.house.cash,60);
   assert.equal(s.w5ac.active.owner,'house');
   assert.equal(w.p3ForschungsStatus().npcVorrang,true);
  }
  if(granted&&!completed){
   const receipt=s.w5ac.completed.find(x=>x.id===f.second);
   if(receipt){
    completed={tick:s.tick,receipt,house:s.owners.house.cash};
    assert.equal(s.ships[f.second].owner,'house');
    assert.equal(s.ships[f.second].heimat,'nadir');
    assert.equal(s.ships[f.second].system,'aldera');
    assert.equal(receipt.kosten,60);
    assert.equal(receipt.owner,'house');
    assert.equal(receipt.ankunft,granted.tick+60);
    assert.equal(w.p3ForschungsStatus().wartend,null);
   }
  }
  if(completed&&!postNpc && (s.w3.auftrag || s.w5n.frachtauftrag ||
     s.w5ac.active?.owner==='transport')){
    postNpc={tick:s.tick,kind:s.w3.auftrag?'W3':s.w5n.frachtauftrag?'W5n':'W5ac'};
  }
  if(granted && s.w5ac.active?.id===f.second){
    seen.add('house-ferry-active');
  }
  if(completed) {
   if(s.w3.auftrag)postNpcKinds.add('W3');
   if(s.w5n.frachtauftrag)postNpcKinds.add('W5n');
   if(s.w5ac.active?.owner==='transport')postNpcKinds.add('W5ac');
  }
  if(completed&&postNpc&&s.tick>=postNpc.tick+60)break;
  w.minute(s);
 }
 audit(w,s);
 assert.ok(granted,'finite research window must start the original house ferry');
 assert.ok(granted.tick<=3520,'one real corridor release must be available within 360min TTL');
 assert.ok(completed,'the original fully paid W5ac itinerary must actually complete');
 assert.ok(postNpc,'NPC traffic must resume after the bounded house booking');
 assert.ok(seen.has('house-ferry-active'));
 assert.equal(w.p3ForschungsStatus().npcVorrang,false);
 assert.equal(s.ships[f.first].owner,'house');
 assert.equal(s.kanon.spielerFrachten.auftraege.filter(x=>x.end!==null).length,9,
   'no invented second freight fee or delivery');
 // The queue is NOT serialized: importing a valid save must never grant access.
 const exported=w.save(s),cold=W.erstellenJ4c({carrierCash:2000,buyerCash:4000});
 const restored=cold.load(exported);
 assert.equal(cold.hash(restored),w.hash(s));
 assert.equal(cold.p3ForschungsStatus().wartend,null);
 assert.equal(cold.p3ForschungsStatus().abgeschlossen,0);
 assert.equal(cold.p3ForschungsStatus().letzterBeleg,null);
 assert.equal(cold.p3ForschungsAnmeldung(restored,f.second).ok,false,
   'already completed ferry must never be queued again');
 return {status:'completed-original-ferry-in-research-only-world',
  first:f.first,second:f.second,atRequest:3160,
  grant:granted,completion:completed,postNpc,
  npcLater:[...postNpcKinds],money:33000,mint:s.minted,burn:s.burned,
  intactPaidPlayerFreights:9,saveHash:w.hash(s),
  notes:'No original second F4 round was attempted; queue is not persistent'};
}
function expire(){
 const {f,w,s}=build();
 const hash=w.hash(s),cash=s.owners.house.cash;
 assert.equal(w.p3ForschungsAnmeldung(s,f.second,60).ok,true);
 for(let i=0;i<62;i++)w.minute(s);
 audit(w,s);
 assert.equal(w.p3ForschungsStatus().wartend,null);
 assert.equal(w.p3ForschungsStatus().letzterBeleg.status,'abgelaufen');
 assert.equal(w.p3ForschungsStatus().abgeschlossen,0);
 assert.equal(s.ships[f.second].system,'nadir');
 assert.equal(s.owners.house.cash,cash,'no money reserved or debited on expiry');
 assert.notEqual(w.hash(s),hash,'real original NPC time progresses');
 const sameState=w.load(w.save(s)),other=W.erstellenJ4c({carrierCash:2000,buyerCash:4000});
 assert.equal(w.p3ForschungsAnmeldung(sameState,f.second).ok,false,
   'pending queue bound to exact originating world state');
 assert.equal(other.p3ForschungsStatus().wartend,null);
 return {status:'expired-without-reservation',ship:f.second,
  tick:s.tick,cash:s.owners.house.cash};
}
module.exports={run,expire};
if(require.main===module){
 console.log('P3_FAIR_FERRY_RESEARCH '+JSON.stringify(run()));
 console.log('P3_FAIR_FERRY_EXPIRY '+JSON.stringify(expire()));
}
