// Independent integration gate: quotes must not book and wear must agree with the existing core.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
const Karte=require('../prototypes/spiel/p3-manager-karte.js');

function ready(){
 const j=J8.erstellen();
 j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 for(let i=0;i<5;i++)j.weiterspielen(60);
 return j;
}

test('U10 integration: repeated purchase projections do not reserve, buy or mutate a save',()=>{
 const j=ready(),w=j.weltReferenz(),s=j.zustandReferenz();
 const before=j.exportieren(),hash=w.hash(s);
 const first=j.angebote(),second=j.angebote();
 assert.deepEqual(first,second);
 const quote=first.find(o=>o.id==='buy-st_nadir-frachter');
 assert.equal(quote.ok,true);
 assert.equal(quote.kaufPlan.kaufpreis,750);
 assert.equal(quote.kaufPlan.ueberfuehrung.kosten,60);
 const model=Karte.auswerten(j.ansicht(),s,w,first);
 assert.equal(model.stationen.find(st=>st.id==='st_nadir').frachterbestand,1);
 assert.equal(model.hauskasse,s.owners.house.cash);
 assert.equal(j.exportieren(),before);
 assert.equal(w.hash(s),hash);
 assert.equal(w.audit(s).ok,true);
 const alien=Object.values(s.ships).find(sh=>sh.owner!=='house'&&sh.klasse==='frachter');
 assert.ok(alien);
 assert.equal(j.ausfuehren('reposition-'+alien.id).ok,false);
 assert.equal(j.exportieren(),before);
 assert.equal(j.ausfuehren(quote.id).ok,true);
 const bought=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='frachter'&&sh.system==='nadir');
 assert.ok(bought);
 assert.equal(j.zustandReferenz().owners.house.cash,quote.kaufPlan.restkasse);
 assert.equal(j.ausfuehren('reposition-'+bought.id).ok,true);
 assert.equal(j.zustandReferenz().owners.house.cash,quote.kaufPlan.ueberfuehrung.restkasse);
 assert.equal(w.audit(j.zustandReferenz()).ok,true);
});

test('U10 integration: remaining active minutes agree with the core retirement boundary',()=>{
 const j=ready(),w=j.weltReferenz();
 assert.equal(j.ausfuehren('buy-st_nadir-frachter').ok,true);
 const s=j.zustandReferenz(),saved=j.exportieren();
 const sh=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='frachter'&&x.system==='nadir');
 assert.ok(sh);
 assert.equal(w.restAktivminuten(s,sh.id),2500);
 // Deliberate projection-only boundary probes; never imported, executed or persisted.
 for(const [used,remaining] of [[2380,120],[2499,1],[2500,0],[2501,0]]){
  const copy=JSON.parse(JSON.stringify(s));
  copy.kanon.verschleiss[sh.id]=used;
  assert.equal(w.restAktivminuten(copy,sh.id),remaining);
  assert.equal(w.stillgelegt(copy,sh.id),remaining===0);
 }
 const copy=JSON.parse(JSON.stringify(s));
 copy.kanon.politik.stilllegung=false;
 assert.equal(w.restAktivminuten(copy,sh.id),null);
 assert.equal(w.stillgelegt(copy,sh.id),false);
 assert.equal(j.exportieren(),saved);
 assert.equal(w.audit(s).ok,true);
});
