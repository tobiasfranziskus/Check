// Independent characterization of #574 at 7f5f6407.
// This test intentionally documents the current behavior, NOT a security pass.
// A failing assertion after hardening means the characterization must be
// replaced with the corresponding rejection/re-confirmation regression.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const {engpassNach48}=require('./m4-u5-engpass-ablauf.cjs');
const {pruefen}=require('../tools/w6-szenarien.cjs');

function resume(json){
 const j=J8.erstellen();
 j.oeffnenU7U8(json,true);
 return j;
}
function check(j){
 const s=j.zustandReferenz();
 assert.deepEqual(pruefen(j.weltReferenz(),s),[]);
 assert.equal(Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
}
function accept(j,id){
 const r=j.ausfuehren(id);
 assert.equal(r.ok,true,id+': '+r.reason);
}
test('AUDIT characterization: imported consent flags versus genuine J8 player commands',()=>{
 const standard=engpassNach48(),original=standard.exportieren();
 const real=resume(original);
 accept(real,'stop-sh004');accept(real,'stop-sh005');
 for(let n=0;n<240&&!real.angebote().some(x=>x.id==='industry-accept-sh003'&&x.ok);n++)
   real.weiterspielen(1);
 assert.ok(real.angebote().some(x=>x.id==='industry-accept-sh003'&&x.ok));
 const offered=real.exportieren(),raw=JSON.parse(offered);
 assert.equal(raw.kanon.industrieErz.signFracht,false);
 assert.equal(raw.w3.auftrag,null);
 const untouched=resume(offered);
 untouched.weiterspielen(1);
 assert.equal(untouched.zustandReferenz().w3.auftrag,null,'no actual consent, no dispatch');

 // Change exactly one untrusted JSON property; no command, no money edit.
 raw.kanon.industrieErz.signFracht=true;
 const imported=resume(JSON.stringify(raw));
 accept(real,'industry-accept-sh003');
 assert.deepEqual(JSON.parse(imported.exportieren()),JSON.parse(real.exportieren()),
   'external pending consent indistinguishable from real player command');
 imported.weiterspielen(1);real.weiterspielen(1);
 assert.equal(imported.exportieren(),real.exportieren());
 assert.equal(imported.zustandReferenz().w3.auftrag?.carrier,'house');
 check(imported);check(real);

 // The equivalent mutation of the voluntary water consent.
 const active=JSON.parse(real.exportieren());
 assert.ok(['vorbestellt','hin'].includes(active.w3.auftrag.phase));
 assert.notEqual(active.w3.auftrag.wasserZustimmung,true);
 active.w3.auftrag.wasserZustimmung=true;
 const importedWater=resume(JSON.stringify(active));
 accept(real,'industry-water-sh003');
 assert.deepEqual(JSON.parse(importedWater.exportieren()),JSON.parse(real.exportieren()));
 for(let n=0;n<10&&real.zustandReferenz().w3.auftrag;n++){
   importedWater.weiterspielen(60);real.weiterspielen(60);
 }
 assert.equal(importedWater.exportieren(),real.exportieren());
 const s=importedWater.zustandReferenz();
 assert.equal(s.w3.abgeschlossen,1);
 assert.ok(s.kanon.wasser.rueckGeliefert>1414,'physical water delivery');
 check(importedWater);check(real);
 assert.equal(standard.exportieren(),original);
 console.log('U7_IMPORT_CONSENT_CHARACTERIZATION',JSON.stringify({
  result:'IMPORTED_FLAGS_EQUIVALENT_TO_PLAYER_COMMANDS',
  tick:s.tick,water:s.kanon.wasser.rueckGeliefert-1414,
  hash:importedWater.ansicht().hash,worldMoney:33000
 }));
});
