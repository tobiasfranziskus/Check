// P3/W6: S02 has its own lawful cash-funded carrier fleet, yard and ferry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const OLD=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const M=require('../prototypes/spiel/p3-npc-werft.js');
const total=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function clean(w,s){
 const a=w.audit(s);assert.equal(a.ok,true,a.fehler?.join('; '));
 assert.equal(total(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 for(const [id,owner] of Object.entries(s.owners)){
  assert.ok(Number.isSafeInteger(owner.cash)&&owner.cash>=0,'no free/negative ISK on '+id);
 }
}
function realCareer(){
 const j=J8.erstellen();j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 clean(w,s);return {j,w,s};
}
test('P3 S02: original NPC carrier purchases founding hull using its own company cash',()=>{
 const {j,w,s}=realCareer(),initialHash=w.hash(s),info=M.auswerten(w,s);
 assert.equal(info.sichtbar,true);
 assert.equal(info.gesamtFlotte,0);assert.equal(info.preis,750);
 assert.equal(info.gesamt,810,'750 ship + original 60 paid transfer minutes');
 assert.equal(info.transportGeld,2000);
 assert.equal(w.hash(s),initialHash,'read-only quote must not mutate original world');
 assert.equal(j.ausfuehren('buy-st_nadir-frachter-for-transport').ok,false,
  'the player cannot issue a purchase from the carrier wallet');
 j.weiterspielen(60);
 const after=j.zustandReferenz(),got=M.auswerten(w,after);
 clean(w,after);
 assert.ok(got.gesamtFlotte>=1,'NPC logistics firm legitimately acquired a hull');
 assert.equal(got.frachterGeliefert,after.ledger.frachter.consumed);
 assert.equal(after.owners.house.cash,3000,'no player cash injection or forced transaction');
 assert.equal(Object.values(after.ships).filter(sh=>sh.owner==='transport'&&sh.klasse==='frachter').length,got.gesamtFlotte);
 const exported=j.exportieren(),copy=J8.erstellen();copy.oeffnen204(exported,true);
 assert.equal(copy.exportieren(),exported);
 assert.equal(M.auswerten(copy.weltReferenz(),copy.zustandReferenz()).sichtbar,true);
 const forged=JSON.parse(exported);forged.owners.transport.cash+=50;forged.owners.house.cash-=50;
 assert.throws(()=>J8.erstellen().oeffnen204(JSON.stringify(forged),true),
  'stolen player cash cannot be imported as a carrier purchase');
 console.log('P3_NPC_FREIGHT_BUY '+JSON.stringify({tick:after.tick,carrier:got.transportGeld,
  owned:got.gesamtFlotte,stock:got.alderaStock,world:total(after),
  hash:w.hash(after)}));
});
test('P3 S02: original W4-W5 materials, paid replacement hulls and ferry remain auditable',()=>{
 const {w,s}=realCareer();
 const initial=w.save(s);w.advance(s,10*1440);clean(w,s);
 const info=M.auswerten(w,s);assert.equal(info.sichtbar,true);
 assert.ok(info.werftGebaut>=1,'real finished shipyard production must happen without grants');
 assert.equal(info.werftGebaut,s.ledger.frachter.produced,
  'every manufactured freighter has matching physical ledger');
 assert.equal(info.frachterGeliefert,s.ledger.frachter.consumed,
  'all owned hulls have physical inventory debit');
 assert.ok(info.ersatzInsgesamt>=1,'real aged-ship replacements occurred');
 assert.ok(info.werftherkunft>=1,'transport owns at least one built Nadir hull');
 assert.ok(info.ueberfuehrt>=1,'at least one signed paid transfer from Nadir occurred');
 assert.ok(s.w4.materialErzeugt>=s.w5.materialVerbraucht,'no ghost ship material');
 assert.equal(s.w5.materialVerbraucht,s.w5.begonnen*w.rules.w5.material);
 assert.equal(s.owners.house.cash,3000);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s),'original Save/Load');
 assert.equal(w.hash(w.load(initial)),w.hash(w.load(initial)),'unmodified source remains verifiable');
 console.log('P3_NPC_FREIGHT_REPLACEMENT '+JSON.stringify({
  tick:s.tick,werft:info.werftGebaut,manufacturedOwned:info.werftherkunft,
  transfers:info.ueberfuehrt,replacementsAllClasses:info.ersatzInsgesamt,
  cash:info.transportGeld,material:info.materialVerbraucht,world:total(s),hash:w.hash(s)
 }));
});
test('P3: classic savings career and Rule207 research are never made to purchase NPC ships',()=>{
 const normal=J8.erstellen();normal.starten195(OLD.create(42,'private195').export(),true);
 const w=normal.weltReferenz(),s=normal.zustandReferenz();
 const hash=w.hash(s);
 assert.equal(M.auswerten(w,s).sichtbar,false);
 assert.equal(w.hash(s),hash);
 const w6=J8.erstellen();w6.startenP8g(true);
 assert.equal(M.auswerten(w6.weltReferenz(),w6.zustandReferenz()).sichtbar,false);
});
