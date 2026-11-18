/* P3 research: a SECOND, separately paid W5 hull must be a REAL carrier.
 * Deterministic Seed42 Rule204 S02. Only original J8 offers and commands.
 * No grant, no buyer recharge, no NPC pause, no stock modification.
 */
'use strict';
const assert=require('node:assert/strict');
const J8=require('../prototypes/verbund/konzern-session.js');
const Industry=require('../prototypes/spiel/p3-industrie.js');
const {erstellen}=require('./p3-werft-mehrschiff-fixture.cjs');
const MAX_WAIT=144; // max 24h in original 10-minute Rule204 steps, per phase
function verify(j){
 const w=j.weltReferenz(),s=j.zustandReferenz(),a=w.audit(s);
 assert.equal(a.ok,true,a.fehler?.join('; '));
 for(const name of ['isk','goods','w3','w4','w5','w5transfer'])
  assert.equal(a.wirtschaft[name].ok,true,name);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 return s;
}
function available(j,id,phase){
 const reasons=new Map();
 for(let n=0;n<=MAX_WAIT;n++){
  const q=j.angebote().find(a=>a.id===id);
  if(q?.ok)return {quote:q,checks:n,at:j.zustandReferenz().tick,
    blockers:[...reasons.entries()]};
  const reason=q?.reason||'kein Originalangebot';
  reasons.set(reason,(reasons.get(reason)||0)+1);
  if(n<MAX_WAIT)j.weiterspielen(10);
  if(n%24===0)verify(j);
 }
 const s=verify(j);
 console.log('P3_ZWEITFRACHT_BLOCKED '+JSON.stringify({phase,ship:id,tick:s.tick,
  buyer:s.owners.st_nadir.cash,company:s.owners.house.cash,
  ice:s.stations.st_aldera.lager.eis||0,blockers:[...reasons.entries()]}));
 assert.fail('Keine belegte bezahlbare '+phase+' in 24 Originalstunden: '+JSON.stringify([...reasons.entries()]));
}
function run(){
 const seed=erstellen(),j=J8.erstellen();
 j.oeffnen204(seed.save,true);
 const w=j.weltReferenz(),s0=verify(j),v=(id)=>Industry.auswerten(w,j.zustandReferenz(),j.angebote(),id);
 assert.equal(s0.tick,3160);
 assert.equal(s0.ships[seed.first].system,'aldera');
 assert.equal(s0.ships[seed.second].system,'nadir');
 assert.equal(v().werftSpielerSchiffId,seed.first);
 assert.equal(v(seed.second).werftSpielerSchiffId,seed.second);
 assert.equal(v(seed.second).werftFrachtBereit,false);
 const oldCount=s0.kanon.spielerFrachten.auftraege.length;
 assert.equal(oldCount,9);
 const ferry=available(j,'reposition-'+seed.second,'W5ac-Überführung');
 assert.equal(ferry.quote.kosten,60);
 assert.equal(ferry.quote.minuten,60);
 const f0=verify(j),ownerCash=f0.owners.house.cash;
 const result=j.ausfuehren(ferry.quote.id);
 assert.equal(result.ok,true,result.reason);
 let active=verify(j);
 assert.equal(active.ships[seed.second].owner,'house');
 assert.equal(active.w5ac.active?.id,seed.second);
 assert.equal(active.ships[seed.first].owner,'house');
 assert.equal(v(seed.second).werftFrachtBereit,false,'traveling hull must not have an ice quote');
 j.weiterspielen(60);
 let afterFerry=verify(j),receipt=afterFerry.w5ac.completed.find(x=>x.id===seed.second);
 assert.ok(receipt,'the exact SECOND house hull must have paid original ferry receipt');
 assert.equal(receipt.owner,'house');assert.equal(receipt.kosten,60);
 assert.ok(receipt.ankunft>=ferry.at+60);
 assert.equal(afterFerry.ships[seed.second].system,'aldera');
 assert.equal(afterFerry.ships[seed.second].heimat,'nadir');
 assert.equal(afterFerry.ships[seed.first].system,'aldera');
 assert.equal(w.buchwert(afterFerry,seed.second),732);
 const freight=available(j,'freight-'+seed.second,'F4-Original-Eisrundfracht');
 const secondBefore=v(seed.second),firstBefore=v(seed.first);
 assert.equal(secondBefore.werftFrachtRunden,0);
 assert.equal(firstBefore.werftFrachtRunden,9);
 assert.equal(secondBefore.werftFrachtBereit,true);
 const s1=verify(j),preFreightPilot=s1.owners.pilot_house.cash;
 const f=j.ausfuehren(freight.quote.id);
 assert.equal(f.ok,true,f.reason);
 const started=verify(j);
 assert.equal(started.kanon.spielerFrachten.auftraege.length,10);
 const current=started.kanon.spielerFrachten.auftraege.at(-1);
 assert.equal(current.schiff,seed.second);
 assert.equal(current.start,freight.at);
 assert.equal(current.end,null);
 assert.equal(started.ships[seed.first].owner,'house');
 j.weiterspielen(60);verify(j);j.weiterspielen(60);
 const completed=verify(j),contract=completed.kanon.spielerFrachten.auftraege.at(-1);
 assert.equal(contract.schiff,seed.second);
 assert.equal(contract.geliefert,freight.at+60);
 assert.equal(contract.end,freight.at+120);
 assert.equal(contract.menge,50);
 assert.equal(contract.fracht,240);
 assert.equal(contract.arbeit,120);
 assert.equal(completed.kanon.spielerFrachten.gebuehr,10*240);
 assert.equal(completed.kanon.spielerFrachten.lohn,10*120);
 assert.equal(completed.owners.pilot_house.cash-preFreightPilot>=120,true);
 assert.equal(completed.ships[seed.second].heimat,'nadir');
 assert.equal(completed.ships[seed.second].system,'aldera');
 assert.equal(w.buchwert(completed,seed.second),696);
 assert.equal(v(seed.first).werftFrachtRunden,9);
 assert.equal(v(seed.second).werftFrachtRunden,1);
 assert.equal(v().werftSpielerSchiffId,seed.first);
 assert.deepEqual(v().werftFrachter.map(x=>x.id),[seed.first,seed.second]);
 const save=j.exportieren(),cold=J8.erstellen();
 cold.oeffnen204(save,true);
 assert.equal(cold.exportieren(),save);
 assert.equal(cold.weltReferenz().hash(cold.zustandReferenz()),w.hash(completed));
 assert.equal(verify(cold).kanon.spielerFrachten.auftraege.length,10);
 return {seed:42,first:seed.first,second:seed.second,
  ferry:{start:ferry.at,arrival:receipt.ankunft,kosten:receipt.kosten,
    checks:ferry.checks,blockers:ferry.blockers,beforeCash:ownerCash},
  freight:{start:freight.at,delivered:contract.geliefert,end:contract.end,
    menge:contract.menge,tarif:contract.fracht,lohn:contract.arbeit,
    checks:freight.checks,blockers:freight.blockers},
  shipsOwned:Object.values(completed.ships).filter(s=>s.owner==='house').map(s=>s.id),
  roundCount:completed.kanon.spielerFrachten.auftraege.length,
  homeSecond:completed.ships[seed.second].heimat,
  bookValueSecond:w.buchwert(completed,seed.second),
  ownerCash:completed.owners.house.cash,
  worldMoney:33000,hash:w.hash(completed)};
}
module.exports={run};
if(require.main===module)console.log('P3_ZWEITFRACHT_OK '+JSON.stringify(run()));
