// Real W5 hull -> paid W5ac transfer using the existing manager paths.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
const Karte=require('../prototypes/spiel/p3-manager-karte.js');
const Manager=require('../prototypes/spiel/p3-manager-disposition.js');
const Handel=require('../prototypes/spiel/p3-handelsweg.js');
const W6=require('../tools/w6-szenarien.cjs');
function start(){
 const j=J8.erstellen();j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 return j;
}
function view(j){
 const s=j.zustandReferenz(),w=j.weltReferenz(),q=j.angebote(),before=j.exportieren();
 const m=Manager.auswerten(w,s,q),h=Handel.auswerten(s,q,w);
 assert.equal(j.exportieren(),before);
 return {m,h,q};
}
function audit(j){
 const w=j.weltReferenz(),s=j.zustandReferenz();
 assert.equal(w.audit(s).ok,true);
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 const cold=J8.erstellen();cold.oeffnen204(j.exportieren(),true);
 assert.equal(cold.exportieren(),j.exportieren());
 return cold;
}
function buy(j){
 assert.equal(j.ausfuehren('buy-st_nadir-frachter').ok,true);
 const ship=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='frachter'&&sh.system==='nadir');
 assert.ok(ship);return ship.id;
}
test('M4: real blocked W5ac quote is displayed instead of suggesting another carrier purchase',()=>{
 const j=start(),w=j.weltReferenz();
 for(let i=0;i<253;i++)w.advance(j.zustandReferenz(),1);
 const offer=view(j).q.find(q=>q.id==='buy-st_nadir-frachter');
 assert.equal(offer.ok,true);
 assert.equal(offer.kaufPlan.kaufpreis,750);
 const id=buy(j),before=j.exportieren(),p=view(j);
 const quote=p.q.find(q=>q.id==='reposition-'+id);
 assert.equal(quote.ok,false);
 assert.equal(offer.kaufPlan.ueberfuehrung.grund,quote.reason);
 assert.equal(p.m.transport.aktion,quote.id);
 assert.equal(p.m.transport.bereit,false);
 assert.equal(p.m.transport.grund,quote.reason);
 assert.equal(j.ausfuehren(quote.id).ok,false);
 assert.equal(j.exportieren(),before);
 audit(j);
});
test('M4: existing Nadir carrier gets a real paid ferry and then completes an original F4 trip',()=>{
 function run(){
  const j=start(),w=j.weltReferenz();
  for(let i=0;i<5;i++)j.weiterspielen(60);
  const before=j.exportieren();
  const quote=view(j).q.find(q=>q.id==='buy-st_nadir-frachter').kaufPlan;
  assert.equal(quote.kaufpreis,750);
  assert.equal(quote.ueberfuehrung.kosten,60);
  assert.equal(quote.ueberfuehrung.restkasse,quote.restkasse-60);
  assert.equal(j.exportieren(),before);
  const id=buy(j);
  assert.ok(j.zustandReferenz().w5.schiffIds.includes(id));
  const plan=Karte.auswerten(j.ansicht(),j.zustandReferenz(),w,j.angebote());
  assert.equal(plan.schiffe.find(sh=>sh.id===id).rest,2500);
  assert.equal(plan.hauskasse,quote.restkasse);
  assert.equal(plan.fremdeSchiffe.every(sh=>sh.angebote.length===0),true);
  let p=view(j);
  assert.equal(p.m.transport.aktion,'reposition-'+id);
  assert.equal(p.m.transport.bereit,true,p.m.transport.grund);
  // Preserve the verified original W5 carrier provenance and purchase path.
  assert.equal(j.ausfuehren(p.m.transport.aktion).ok,true);
  assert.equal(j.zustandReferenz().w5ac.active.id,id);
  const cold=audit(j);
  j.weiterspielen(60);cold.weiterspielen(60);
  assert.equal(cold.exportieren(),j.exportieren());
  const s=j.zustandReferenz();
  assert.ok(s.w5ac.completed.some(t=>t.id===id&&t.owner==='house'&&t.kosten===60));
  assert.equal(s.ships[id].system,'aldera');
  assert.equal(s.ships[id].heimat,'nadir');
  assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);
  const miner=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner');
  assert.equal(j.ausfuehren('ice-'+miner.id).ok,true);
  j.weiterspielen(60);j.weiterspielen(60);
  p=view(j);
  assert.equal(p.m.transport.aktion,'freight-'+id);
  assert.equal(p.h.aktion,'freight-'+id);
  assert.equal(p.m.transport.bereit,true,p.m.transport.grund);
  assert.equal(j.ausfuehren(p.m.transport.aktion).ok,true);
  j.weiterspielen(60);j.weiterspielen(60);
  assert.equal(j.zustandReferenz().kanon.spielerFrachten.gebuehr,240);
  assert.equal(j.zustandReferenz().kanon.spielerFrachten.lohn,120);
  audit(j);
  return j.exportieren();
 }
 assert.equal(run(),run());
});
test('M4: trade guidance prefers an owned ferry, preserves refusal and allows only the real active ferry to advance',()=>{
 // Projection-only cases supplement the real W5ac test; no authority or core booking.
 const base={rulesVersion:204,kanon:{},ships:{
  m:{id:'m',owner:'house',klasse:'miner',system:'aldera'},
  f:{id:'f',owner:'house',klasse:'frachter',system:'nadir'},
  foreign:{id:'foreign',owner:'transport',klasse:'frachter',system:'nadir'}},
  stations:{st_aldera:{lager:{eis:50}}},owners:{house:{cash:3000}}};
 const q=[{id:'reposition-f',ok:false,reason:'Original-Sperre'},{id:'reposition-foreign',ok:true}];
 let p=Handel.auswerten(base,q);
 assert.equal(p.aktion,'reposition-f');assert.equal(p.bereit,false);assert.equal(p.grund,'Original-Sperre');
 p=Handel.auswerten(base,[{id:'reposition-f',ok:true}]);
 assert.equal(p.aktion,'reposition-f');assert.equal(p.bereit,true);
 p=Handel.auswerten({...base,w5ac:{active:{id:'f',owner:'house'}}},q);
 assert.equal(p.art,'zeit');assert.equal(p.aktion,null);
 p=Handel.auswerten({...base,w5ac:{active:{id:'foreign',owner:'transport'}}},q);
 assert.equal(p.bereit,false);assert.equal(p.aktion,'reposition-f');
});
