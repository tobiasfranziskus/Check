// P3 acceptance: genuine private-pilot wage -> locally delivered water -> Aldera
// buyer budget -> another paid original F4 order. NO new core economics.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W=require('../prototypes/welt/welt-kern.js');
const W5=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const P3=require('../prototypes/spiel/p3-handelsweg.js');
const Water=require('../prototypes/spiel/p3-wasserlohn.js');
const start=()=>{const j=J8.erstellen();j.starten195(W5.create(42,'private195').export(),true);return j;};
function sound(j){
 const s=j.zustandReferenz(),w=j.weltReferenz();
 assert.equal(w.audit(s).ok,true);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 return s;
}
test('P3: private earned wages purchase real Aldera water and finance an additional original ice round',()=>{
 const j=start();
 assert.equal(Water.auswerten(j.weltReferenz(),sound(j),j.angebote(),W.DATEN).sichtbar,false);
 assert.equal(j.ausfuehren('water-pilot-house-bedarf').ok,false,'no buyer gap before any trade');
 assert.equal(j.ausfuehren('water-pilot-house-999').ok,false,'no arbitrary amount allowed');
 let blocked=null,at=null;
 for(let i=0;i<90;i++){
  const p=P3.auswerten(j.zustandReferenz(),j.angebote(),j.weltReferenz());
  if(!p.bereit){blocked=p;at=sound(j);break;}
  if(p.art==='zeit')j.weiterspielen(60);
  else assert.equal(j.ausfuehren(p.aktion).ok,true,p.aktion);
 }
 assert.ok(blocked,'finite real buyer budget stops the baseline');
 assert.ok(at.kanon.spielerFrachten.auftraege.filter(a=>a.end!==null).length>=3);
 assert.ok(at.owners.st_aldera.cash<j.weltReferenz().rules.w5n.charge*j.weltReferenz().rules.w5n.eisPreis);
 const p=Water.auswerten(j.weltReferenz(),at,j.angebote(),W.DATEN);
 assert.equal(p.sichtbar,true);
 assert.ok(p.fehlbetrag>0 && p.zielMenge>0 && p.zielBereit,
   'real Aldera water and personal pilot wages cover exactly the original shortfall');
 assert.equal(p.preis,W.DATEN.wasser.preisAldera);
 assert.equal(p.eisKosten,j.weltReferenz().rules.w5n.charge*j.weltReferenz().rules.w5n.eisPreis);
 const before=j.exportieren(),buyer=at.owners.st_aldera.cash,wages=at.owners.pilot_house.cash,
   water=at.stations.st_aldera.lager.wasser,consumed=at.ledger.wasser.consumed;
 assert.equal(j.ausfuehren(p.zielAktion).ok,true);
 const newState=sound(j);
 assert.equal(newState.owners.st_aldera.cash,buyer+p.zielKosten);
 assert.equal(newState.owners.pilot_house.cash,wages-p.zielKosten);
 assert.equal(newState.stations.st_aldera.lager.wasser,water-p.zielMenge);
 assert.equal(newState.ledger.wasser.consumed,consumed+p.zielMenge);
 assert.notEqual(j.exportieren(),before);
 assert.ok(newState.owners.st_aldera.cash>=p.eisKosten);
 assert.equal(j.ausfuehren('water-pilot_house-1').ok,false,'forbidden arbitrary/foreign command');
 // All receipts must survive exact original Save/Load and deterministic replay.
 const restored=J8.erstellen();restored.oeffnen204(j.exportieren(),true);
 assert.equal(restored.exportieren(),j.exportieren());
 const originalRounds=at.kanon.spielerFrachten.auftraege.filter(x=>x.end!==null).length;
 let reached=originalRounds;
 for(let i=0;i<50;i++){
  const q=P3.auswerten(j.zustandReferenz(),j.angebote(),j.weltReferenz());
  if(q.abgeschlossen>originalRounds){reached=q.abgeschlossen;break;}
  assert.equal(q.bereit,true,q.grund||q.titel);
  if(q.art==='zeit')j.weiterspielen(60);
  else assert.equal(j.ausfuehren(q.aktion).ok,true,q.aktion);
 }
 assert.ok(reached>originalRounds,'the newly financed buyer did accept another mined batch and F4 delivery');
 sound(j);
 const fake=JSON.parse(j.exportieren());
 fake.owners.pilot_house.cash+=p.zielKosten;
 fake.owners.st_aldera.cash-=p.zielKosten; // same world money, forged unsigned owner transfer
 assert.throws(()=>J8.erstellen().oeffnen204(JSON.stringify(fake),true));
 console.log('P3_WATER_CYCLE_OK '+JSON.stringify({
  beforeRounds:originalRounds,afterRounds:reached,privateWageSpent:p.zielKosten,
  physicalWaterUsed:p.zielMenge,buyerBefore:buyer,buyerAfter:buyer+p.zielKosten,
  worldCash:33000,mint:0,burn:0,hash:j.weltReferenz().hash(j.zustandReferenz())
 }));
});
test('P3: Rule207 private/other-account spending is never exposed via normal career',()=>{
 const j=J8.erstellen();j.startenP8g(true);
 assert.equal(j.angebote().some(o=>o.id.startsWith('water-pilot-house-')),false);
 assert.equal(Water.auswerten(j.weltReferenz(),sound(j),j.angebote(),W.DATEN).sichtbar,false);
});
