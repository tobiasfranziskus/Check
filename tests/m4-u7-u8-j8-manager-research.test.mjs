import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const {engpassNach48}=require('./m4-u5-engpass-ablauf.cjs');
const {pruefen}=require('../tools/w6-szenarien.cjs');
test('U7/U8 J8: separate 48-round manager copy, NPC offer, house consent, paid return and restart',()=>{
 const old=engpassNach48(),original=old.exportieren();
 const j=J8.erstellen();
 assert.throws(()=>j.oeffnenU7U8(original,false));
 const view=j.oeffnenU7U8(original,true);
 assert.equal(view.transportForschung,true);
 assert.equal(view.quelleHash,'f63f2cd09ba5a88c');
 const s=()=>j.zustandReferenz(),w=j.weltReferenz();
 const check=()=>assert.deepEqual(pruefen(w,s()),[]);
 const yes=id=>{const r=j.ausfuehren(id);assert.equal(r.ok,true,id+': '+r.reason);check();};
 const until=(pred,limit,label)=>{
  for(let i=0;i<limit&&!pred();i++)j.weiterspielen(1);
  assert.ok(pred(),label+' @ '+s().tick+' '+JSON.stringify({i:s().kanon.industrieErz,a:s().w3.auftrag,aldera:s().owners.st_aldera.cash,nadir:s().owners.st_nadir.cash,werft:s().owners.werft_extern.cash}));
  check();
 };
 const initial=j.exportieren();
 for(const id of ['industrialOreOffer','industrialOreCommit','industrialOreAcceptMine','industrialWaterBackhaul','industry-accept-sh999']){
  assert.equal(j.ausfuehren(id).ok,false);
  assert.equal(j.exportieren(),initial);
 }
 yes('stop-sh004');yes('stop-sh005');
 until(()=>j.angebote().some(x=>x.id==='industry-accept-sh003'&&x.ok),240,'actual NPC offer');
 const i=s().kanon.industrieErz;
 assert.equal(i.signMiner,true);assert.equal(i.signWerft,true);assert.equal(i.signFracht,false);
 assert.equal(s().w3.auftrag,null);
 const offered=j.exportieren();
 // No automatic transport dispatch before the house's consent.
 assert.equal(j.ausfuehren('industry-accept-sh999').ok,false);
 assert.equal(j.exportieren(),offered);
 yes('industry-accept-sh003');
 j.weiterspielen(1);
 assert.equal(s().w3.auftrag?.carrier,'house');
 yes('industry-water-sh003');
 const checkpoint=j.exportieren();
 assert.throws(()=>J8.erstellen().oeffnen204(checkpoint,true),/U8/);
 assert.throws(()=>J8.erstellen().oeffnenU7U8(checkpoint,false));
 const resumed=J8.erstellen();resumed.oeffnenU7U8(checkpoint,true);
 // No dependence on selecting the exact arrival minute in the UI.
 for(let n=0;n<10&&s().w3.auftrag;n++){j.weiterspielen(60);resumed.weiterspielen(60);}
 assert.equal(j.exportieren(),resumed.exportieren());
 assert.equal(s().w3.abgeschlossen,1);
 assert.equal(s().w5ad.freight.at(-1).owner,'house');
 assert.ok(s().kanon.wasser.rueckGeliefert>1414,'actual water delivery');
 assert.equal(s().owners.w3_arbeit_treuhand.cash,0);
 assert.equal(s().owners.w3_kauf_treuhand.cash,0);
 check();assert.equal(old.exportieren(),original);
 console.log('M4_U7_U8_J8_MANAGER',JSON.stringify({tick:s().tick,hash:j.ansicht().hash,water:s().kanon.wasser.rueckGeliefert-1414,house:s().owners.house.cash}));
});
