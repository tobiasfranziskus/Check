// Independent audit of the #574 research head. No product code, no new rules.
// Derive the transaction from real J8 actions, then inspect individual core ticks
// instead of accepting a successful terminal aggregate as sufficient.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const {engpassNach48}=require('./m4-u5-engpass-ablauf.cjs');
const {pruefen}=require('../tools/w6-szenarien.cjs');
const cash=(s,id)=>s.owners[id]?.cash??0;

test('Independent U7/U8 audit: per-minute escrow, physical cargo, ownership and paid W5 hull',()=>{
 const original=engpassNach48(),originalJson=original.exportieren();
 const j=J8.erstellen();j.oeffnenU7U8(originalJson,true);
 const yes=id=>{const r=j.ausfuehren(id);assert.equal(r.ok,true,id+': '+r.reason);};
 yes('stop-sh004');yes('stop-sh005');
 for(let i=0;i<240&&!j.angebote().some(x=>x.id==='industry-accept-sh003'&&x.ok);i++)j.weiterspielen(1);
 assert.ok(j.angebote().some(x=>x.id==='industry-accept-sh003'&&x.ok),'real NPC offer');
 const before=j.zustandReferenz();
 assert.equal(before.kanon.industrieErz.signFracht,false);
 assert.equal(before.w3.auftrag,null);
 const prior={freight:before.w5ad.freight.length,delivered:before.w3.geliefert,
  finished:before.w3.abgeschlossen,water:before.kanon.wasser.rueckGeliefert,
  hull:before.w5.fertig,material:before.w5.materialVerbraucht,wages:before.w5.arbeitsGezahlt};
 yes('industry-accept-sh003');j.weiterspielen(1);yes('industry-water-sh003');
 const checkpoint=j.exportieren(),w=j.weltReferenz(),s=w.load(checkpoint),copy=w.load(checkpoint);
 const phases=new Set(),observations=[];
 let checked=0,waterLoaded=0,freightClosed=false;
 const reject=(cmd)=>{
  const snapshot=w.save(s),r=w.execute(s,cmd);
  assert.equal(r.ok,false,JSON.stringify(cmd));
  assert.equal(w.save(s),snapshot,'rejection must be atomic');
 };
 reject({type:'industrialOreAcceptFreight',owner:'transport'});
 reject({type:'industrialWaterAcceptBackhaul',owner:'npc3',schiff:'sh003'});
 reject({type:'industrialWaterAcceptBackhaul',owner:'house',schiff:'sh003'});
 reject({type:'industrialWaterBackhaul',owner:'house',schiff:'sh003'});
 reject({type:'shipFreightIce',owner:'house',schiff:'sh003'});
 const check=()=>{
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.deepEqual(pruefen(w,s),[]);
  const a=s.w3.auftrag,sh=s.ships.sh003;
  assert.equal(sh.owner,'house');
  if(a){
   assert.equal(a.carrier,'house');assert.equal(a.schiff,'sh003');
   assert.equal(a.menge,50);assert.equal(a.arbeitsKosten,120);
   assert.equal(a.gesamt,740);assert.equal(a.frachtGebuehr,240);
   assert.equal(cash(s,'w3_arbeit_treuhand'),120-a.gearbeitet*w.rules.w3.arbeitJeMinute);
   assert.equal(cash(s,'w3_kauf_treuhand'),a.phase==='rueck'?240:740);
   assert.equal(s.w5ad.freight.length,prior.freight);
   assert.equal(s.w5n.frachtauftrag,null);
   assert.equal(s.w5ac?.active??null,null);
   assert.equal(sh.ladung.erz||0,a.phase==='hin'?50:0);
   const r=s.kanon.rueckfracht;
   if(r){
    assert.equal(a.phase,'rueck');assert.equal(r.schiff,'sh003');
    assert.equal(r.art,'erz');assert.equal(sh.ladung.wasser,r.menge);
    assert.equal(cash(s,'k1_rueckfracht'),r.gebuehr);
    waterLoaded=r.menge;
   }
   if(!phases.has(a.phase)){
    phases.add(a.phase);observations.push({tick:s.tick,phase:a.phase,kauf:cash(s,'w3_kauf_treuhand'),arbeit:cash(s,'w3_arbeit_treuhand')});
   }
  }else if(!freightClosed){
   freightClosed=true;
   assert.equal(s.w3.abgeschlossen,prior.finished+1);
   assert.equal(s.w3.geliefert,prior.delivered+50);
   assert.equal(s.w5ad.freight.length,prior.freight+1);
   const receipt=s.w5ad.freight.at(-1);
   assert.equal(receipt.id,'sh003');assert.equal(receipt.owner,'house');
   assert.equal(receipt.amount,50);assert.equal(receipt.fee,240);assert.equal(receipt.work,120);
   assert.equal(cash(s,'w3_kauf_treuhand'),0);assert.equal(cash(s,'w3_arbeit_treuhand'),0);
   assert.equal(cash(s,'k1_rueckfracht'),0);
   assert.ok(waterLoaded>0,'water was actually loaded on the return leg');
   assert.equal(s.kanon.wasser.rueckGeliefert-prior.water,waterLoaded);
   assert.equal(sh.system,'aldera');assert.equal(sh.ladung.wasser||0,0);
   observations.push({tick:s.tick,phase:'closed',receipt,water:waterLoaded});
  }
  checked++;
 };
 check();
 for(let n=0;n<1200&&(!freightClosed||s.w5.fertig===prior.hull);n++){
  w.advance(s,1);w.advance(copy,1);check();
  if(n%30===0)assert.equal(w.save(s),w.save(copy),'deterministic intermediate replay');
 }
 assert.ok(freightClosed,'actual W3 contract completed');
 assert.ok(phases.has('hin')&&phases.has('rueck'));
 assert.equal(s.w5.fertig,prior.hull+1,'physical paid hull produced');
 assert.equal(s.w5.materialVerbraucht-prior.material,w.rules.w5.material);
 assert.equal(s.w5.arbeitsGezahlt-prior.wages,w.rules.w5.dauer*w.rules.w5.lohnJeMinute);
 assert.equal(cash(s,'k7_werft_treuhand'),0);
 assert.equal(cash(s,'w5_arbeit_treuhand'),0);
 assert.equal(w.save(s),w.save(copy));
 assert.equal(w.save(w.load(w.save(s))),w.save(s));
 assert.equal(original.exportieren(),originalJson);
 console.log('M4_INDEPENDENT_LEDGER_AUDIT',JSON.stringify({checked,observations,hull:s.w5.fertig,hash:w.hash(s)}));
});
