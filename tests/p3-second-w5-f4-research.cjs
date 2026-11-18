/* P3 draft-only follow-up: exact original 204/F4 paid contract for sh010 after
 * a genuine paid W5ac ferry in the opt-in Node research scheduling branch.
 * No new buyers, deposits, inventory, balances, save fields or release flags.
 */
'use strict';
process.env.APHROS_P3_FAIR_FERRY_RESEARCH='1';
const assert=require('node:assert/strict');
const W=require('../prototypes/welt/welt-kern.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const {erstellen}=require('./p3-werft-mehrschiff-fixture.cjs');

function audit(w,s){
 const a=w.audit(s);assert.equal(a.ok,true,(a.fehler||[]).join('; '));
 for(const k of ['isk','goods','w3','w4','w5','w5transfer'])
  assert.equal(a.wirtschaft[k].ok,true,k);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.ok(Number(!!s.w3.auftrag)+Number(!!s.w5n.frachtauftrag)
   +Number(!!s.w5ac.active)<=1,'No overbooking of real shared corridor');
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s),'Original JSON roundtrip');
}
function run(){
 const f=erstellen(),j=J8.erstellen();j.oeffnen204(f.save,true);
 const w=j.weltReferenz(),s=w.load(f.save);
 assert.equal(s.tick,3160);assert.equal(w.hash(s),f.hash);
 assert.equal(s.kanon.spielerFrachten.auftraege.length,9);
 audit(w,s);
 assert.equal(w.p3ForschungsAnmeldung(s,f.second,360).ok,true);
 let ferry=null,npcRejoined=null;
 while(s.tick<3550){
  w.minute(s);
  ferry=s.w5ac.completed.find(x=>x.id===f.second);
  if(ferry&&s.w5n.frachtauftrag?.schiff
    &&s.w5n.frachtauftrag.schiff!==f.second)npcRejoined ||= s.tick;
  if(ferry&&npcRejoined&&!w.p3ForschungsStatus().npcVorrang)break;
 }
 assert.ok(ferry,'Second genuine ferry must finish before F4 admission');
 assert.equal(ferry.start,3377);
 assert.equal(ferry.ankunft,3437);
 assert.equal(ferry.kosten,60);
 assert.equal(ferry.owner,'house');
 assert.ok(npcRejoined,'Original NPC must resume before another player request');
 assert.equal(w.p3ForschungsStatus().npcVorrang,false);
 audit(w,s);
 const atRequest=s.tick,saved=w.save(s);
 const before=w.hash(s),cash=s.owners.house.cash;
 const oldCount=s.kanon.spielerFrachten.auftraege.length;
 assert.equal(w.p3ForschungsFrachtAnmeldung(s,'sh002').ok,false);
 // sh004 is ALSO an originally purchased and ferried Nadir-built owned hull.
 // Never blacklist it merely because this test selects sh010 for the next job.
 const attempt=w.p3ForschungsFrachtAnmeldung(s,f.second,1440);
 assert.equal(attempt.ok,true,attempt.reason);
 assert.equal(w.hash(s),before,'Admission must not debit or alter signed world');
 assert.equal(s.owners.house.cash,cash,'No early debit without audited escrow model');
 assert.equal(w.save(s),saved,'Unpersisted research queue must not self-activate on import');
 assert.equal(w.p3ForschungsFrachtAnmeldung(s,f.second,1440).ok,false);
 const beforeBookValue=w.buchwert(s,f.second);
 const beforePilot=s.owners.pilot_house.cash;
 const beforePlayerWage=s.kanon.spielerFrachten.lohn;
 const beforePlayerFreight=s.kanon.spielerFrachten.gebuehr;
 const beforeBuyer=s.owners.st_nadir.cash;
 const beforeMoney=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
 const beforeIce=s.w5n.eisGeliefert;
 let started=null,closed=null;
 const samples=[];
 const until=Math.min(s.tick+1560,6000);
 for(let i=0;s.tick<until;i++){
  w.minute(s);
  const last=w.p3ForschungsStatus().letzterBeleg;
  if(!started && last?.status==='original-f4-gestartet' && last.schiff===f.second){
   started={...last,house:s.owners.house.cash,buyer:s.owners.st_nadir.cash,
    buyEscrow:s.owners.w5n_fracht_kauf?.cash,
    workEscrow:s.owners.w5n_fracht_arbeit?.cash};
   assert.equal(s.w5n.frachtauftrag?.schiff,f.second);
   assert.equal(s.kanon.spielerFrachten.auftraege.length,oldCount+1);
   assert.equal(started.lohn,120);
   assert.equal(started.frachttarif,240);
   assert.equal(started.menge,50);
   assert.equal(started.workEscrow,120);
   assert.equal(started.buyEscrow,490,'Original buyer paid real 50 ice + 240 tariff');
  }
  const contract=s.kanon.spielerFrachten.auftraege.at(-1);
  if(started&&contract?.schiff===f.second&&contract.end!==null){
   closed={tick:s.tick,start:contract.start,end:contract.end,
    delivered:contract.geliefert,menge:contract.menge,
    arbeit:contract.arbeit,fracht:contract.fracht,
    house:s.owners.house.cash,pilot:s.owners.pilot_house.cash,
    iceDelivered:s.w5n.eisGeliefert};
  }
  if((i%120===0||closed))audit(w,s);
  if(i%120===0)samples.push({tick:s.tick,occupied:s.w3.auftrag?'W3':
    s.w5n.frachtauftrag?'W5n':s.w5ac.active?'W5ac':'none',
    ice:s.stations.st_aldera.lager.eis,buyer:s.owners.st_nadir.cash,
    quote:w.kern.pilotIceFreightQuote(s,f.second).grund,
    status:last?.status||null});
  if(closed)break;
  if(!w.p3ForschungsStatus().wartend&&!started)break;
 }
 const end=w.p3ForschungsStatus();
 const outcome={status:closed?'paid-second-f4-completed':
   started?'paid-second-f4-open':'second-f4-original-gate-blocked',
   atRequest,ferry,f4Requested:attempt,started,closed,
   last:end.letzterBeleg,at:s.tick,first:f.first,second:f.second,
   cash:s.owners.house.cash,buyer:s.owners.st_nadir.cash,
   pilotGain:s.owners.pilot_house.cash-beforePilot,
   paidPlayerWage:s.kanon.spielerFrachten.lohn-beforePlayerWage,
   paidPlayerFreight:s.kanon.spielerFrachten.gebuehr-beforePlayerFreight,
   buyerBefore:beforeBuyer,worldMoney:beforeMoney,oldRounds:oldCount,
   bookBefore:beforeBookValue,bookAfter:w.buchwert(s,f.second),
   currentRounds:s.kanon.spielerFrachten.auftraege.length,
   extraIceDelivered:s.w5n.eisGeliefert-beforeIce,
   hash:w.hash(s),sample:samples};
 console.log('P3_SECOND_W5_F4_DIAGNOSTIC '+JSON.stringify(outcome));
 assert.ok(started,'Legitimate fully funded signed second W5/F4 quote never became available');
 assert.ok(closed,'Real second ship must complete both legs and receive original freight ledger');
 assert.equal(closed.start,started.tick);
 assert.equal(closed.end,closed.start+120);
 assert.equal(closed.delivered,closed.start+60);
 assert.equal(closed.menge,50);
 assert.equal(closed.arbeit,120);
 assert.equal(closed.fracht,240);
 // Pilot household, NPC water purchases and NPC freights can also change
 // independently while 120 real minutes pass. Match the SIGNED player-specific
 // original freight book rather than mistakenly treating global deltas as solely
 // this one player's F4 contract.
 assert.equal(outcome.paidPlayerWage,120);
 assert.equal(outcome.paidPlayerFreight,240);
 assert.equal(outcome.bookBefore-outcome.bookAfter,36,
   'Only the original ship wear core may deduct the 120-minute ferry book value');
 assert.ok(outcome.pilotGain>=120);
 assert.ok(outcome.extraIceDelivered>=50);
 assert.equal(outcome.currentRounds,10);
 assert.equal(s.ships[f.second].owner,'house');
 assert.equal(s.ships[f.second].system,'aldera');
 assert.equal(s.ships[f.first].owner,'house');
 audit(w,s);
 const clean=W.erstellenJ4c({carrierCash:2000,buyerCash:4000});
 const fresh=clean.load(w.save(s));
 assert.equal(clean.hash(fresh),w.hash(s));
 assert.equal(clean.p3ForschungsStatus().wartend,null);
 assert.equal(clean.p3ForschungsStatus().letzterBeleg,null);
 return outcome;
}
module.exports={run};
if(require.main===module)console.log('P3_SECOND_W5_F4 '+JSON.stringify(run()));
