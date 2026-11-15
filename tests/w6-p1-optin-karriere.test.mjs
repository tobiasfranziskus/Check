// W6/X1: Die sichtbare, AUSWAEHLBARE neue Karriere benutzt denselben Regel204-
// Kern und genau die Original-Regel195-Quelle. Bestehende Saves werden nicht migriert.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const OLD=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const original=()=>OLD.create(42,'private195').export();
function start(aktiv) {
 const neu=J8.erstellen();
 const info=neu.starten195(original(),true);
 assert.equal(info.regel,204);
 assert.equal(info.weltgeld,33000);
 const welt=neu.weltReferenz(),s=neu.zustandReferenz();
 if(aktiv){
  welt.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
  welt.npcAutoSetzen(s,true);
  welt.npcSiliziumSetzen(s,true);
  assert.equal(welt.audit(s).ok,true);
 }
 return {neu,welt,s};
}
function pruefen(w,s){
 const audit=w.audit(s);
 assert.deepEqual(audit.fehler,[]);
 assert.equal(audit.ok,true);
 assert.equal(Object.values(s.owners).reduce((a,o)=>a+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
}
test('W6/X1: nicht aktivierte Karriere erhaelt Originalhash ohne zusaetzliche gespeicherte Flags',()=>{
 const {neu,welt,s}=start(false);
 assert.equal(s.kanon.npcAuto,undefined);
 assert.equal(s.kanon.npcSilizium,undefined);
 assert.equal(welt.hash(s),'674400c1d181fcf2');
 const save=neu.exportieren();
 const other=J8.erstellen();const info=other.oeffnen204(save,true);
 assert.equal(info.regel,204);
 assert.equal(other.weltReferenz().hash(other.zustandReferenz()),welt.hash(s));
 assert.equal(other.zustandReferenz().kanon.npcAuto,undefined);
 pruefen(welt,s);
});
test('W6/X1: aktiver S02-Karrierestart ist finanziert, speicherbar, reproduzierbar',()=>{
 const {neu,welt,s}=start(true);
 assert.equal(s.kanon.npcAuto,true);
 assert.deepEqual(s.kanon.npcSilizium,{aktiv:true,werftauftrag:false});
 assert.equal(s.kanon.politik.stilllegung,true);
 assert.equal(s.kanon.politik.betriebsreserve.werft_extern,1060);
 assert.equal(s.owners.house.cash,3000);
 const save=neu.exportieren();
 const copy=J8.erstellen();const reopened=copy.oeffnen204(save,true);
 assert.equal(reopened.regel,204);
 assert.equal(welt.canonical(s),copy.weltReferenz().canonical(copy.zustandReferenz()));
 assert.equal(copy.zustandReferenz().kanon.npcSilizium.aktiv,true);
 neu.weiterspielen(1440);
 copy.weiterspielen(1440);
 assert.equal(welt.canonical(neu.zustandReferenz()),
    copy.weltReferenz().canonical(copy.zustandReferenz()));
 pruefen(welt,neu.zustandReferenz());
 assert.equal(neu.zustandReferenz().owners.house.cash,3000);
 console.log('W6_CAREER_OPTIN_OK',JSON.stringify({tick:neu.zustandReferenz().tick,
  hash:welt.hash(neu.zustandReferenz()),weltgeld:33000,house:3000,
  npc:neu.zustandReferenz().kanon.npcAuto,silizium:neu.zustandReferenz().kanon.npcSilizium.aktiv}));
});
test('W6/X1: Manipulierte Opt-in-Flags werden von der Core-Ladevalidierung abgewiesen',()=>{
 const {neu}=start(true);
 const json=JSON.parse(neu.exportieren());
 json.kanon.npcSilizium.aktiv='gratis';
 assert.throws(()=>J8.erstellen().oeffnen204(JSON.stringify(json),true));
});
