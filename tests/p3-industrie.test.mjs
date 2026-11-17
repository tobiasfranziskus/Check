// P3/W4/W5: authentic S02 ore freight -> paid refining -> original shipyard,
// with an actual house-owned purchase from a finished Nadir production batch.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const OLD=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const Industry=require('../prototypes/spiel/p3-industrie.js');
const sum=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function clean(w,s){
 const a=w.audit(s);
 assert.equal(a.ok,true,a.fehler?.join('; '));
 assert.equal(sum(s),33000,'no new/missing money');
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 return s;
}
function begin(){
 const j=J8.erstellen();j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 clean(w,s);return {j,w};
}
test('P3: first complete original W3→W4→W5 production ends in legal player-owned Nadir freighter',()=>{
 const {j,w}=begin(),read=()=>Industry.auswerten(w,clean(w,j.zustandReferenz()),j.angebote());
 const start=read();assert.equal(start.sichtbar,true);
 assert.equal(start.hausKaufbereit,false);assert.equal(start.w5Gebaut,0);
 assert.equal(j.ausfuehren('stationBuildShip-for-house').ok,false,'player cannot sign foreign W5 manufacturing');
 assert.equal(j.ausfuehren('transport:shipBuy').ok,false,'player cannot use NPC company money');
 for(let i=0;i<5;i++)j.weiterspielen(60);
 const p=read(),before=j.zustandReferenz(),old=w.hash(before);
 assert.equal(before.tick,300,'five real paid/simulated S02 world steps');
 assert.ok(p.w3Vertraege>=1&&p.w3Geliefert>=50,'at least one original W3 delivery');
 assert.ok(p.w4Chargen>=1&&p.w4Material>=5,'at least one original W4 refinery job');
 assert.ok(p.w5Gebaut>=1,'at least one new W5 hull');
 assert.equal(p.hullenNadir,1);
 assert.equal(p.hausKaufpreis,750);
 assert.equal(p.hausKasse,3000);
 assert.equal(p.kaufberechtigt,true,'actual produced unsold Nadir ship is available');
 assert.equal(w.hash(before),old,'read-only adapter may never mutate original world');
 const wasSh=new Set(Object.keys(before.ships)),stock=p.hullenNadir,customer=before.owners.house.cash;
 const payment=j.ausfuehren(p.hausKaufId);
 assert.equal(payment.ok,true,JSON.stringify(payment));
 const after=clean(w,j.zustandReferenz()),p2=read();
 const bought=Object.values(after.ships).filter(sh=>!wasSh.has(sh.id));
 assert.equal(bought.length,1,'only ONE physically transferred real hull');
 assert.equal(bought[0].owner,'house');assert.equal(bought[0].klasse,'frachter');
 assert.equal(bought[0].system,'nadir');
 assert.ok(after.w5.schiffIds.includes(bought[0].id),'real factory-origin hull, not phantom genesis');
 assert.equal(after.owners.house.cash,customer-750);
 assert.equal(after.stations.st_nadir.lager.frachter,stock-1);
 assert.equal(p2.kaufberechtigt,false,'sold-out hull cannot be purchased twice');
 assert.equal(after.w5.fertig,before.w5.fertig,'ship transfer is not a free additional build');
 assert.equal(after.ledger.frachter.produced,before.ledger.frachter.produced);
 assert.equal(after.ledger.frachter.consumed,before.ledger.frachter.consumed+1);
 assert.equal(j.ausfuehren(p.hausKaufId).ok,false,'same hull cannot be bought a second time');
 const json=j.exportieren(),resumed=J8.erstellen();resumed.oeffnen204(json,true);
 assert.equal(resumed.exportieren(),json);assert.equal(w.hash(resumed.zustandReferenz()),w.hash(after));
 const forged=JSON.parse(json);forged.owners.house.cash+=750;forged.owners.werft_extern.cash-=750;
 assert.throws(()=>J8.erstellen().oeffnen204(JSON.stringify(forged),true),'cash laundering must be rejected');
 console.log('P3_W4_W5_HOUSE_HULL_OK '+JSON.stringify({tick:after.tick,
  w3:p.w3Vertraege,ore:p.w3Geliefert,w4:p.w4Chargen,materials:p.w4Material,w5:p.w5Gebaut,
  ship:bought[0].id,spent:750,house:after.owners.house.cash,world:sum(after),hash:w.hash(after)}));
});
test('W4/W5 14-day repeated original ore contract and production full ledger/replay',()=>{
 const {j,w}=begin(),first=w.save(j.zustandReferenz()),s=w.load(first);
 w.advance(s,14*1440);
 clean(w,s);
 const p=Industry.auswerten(w,s,[
  {id:'buy-st_nadir-frachter',ok:false,reason:'No duplicate hull in stock'}
 ]);
 assert.equal(p.w3Vertraege,4,'four fully financed W3 ore freights');
 assert.equal(p.w3Geliefert,200,'four real 50-ore receipts');
 assert.equal(p.w4Chargen,18,'18 funded refinery charges');
 assert.equal(p.w4Material,90,'original 10 ore -> 5 materials, eighteen times');
 assert.equal(p.w4ErzVerbraucht,180);
 assert.equal(p.w5Gebaut,7,'seven real newly built W5 hulls');
 assert.equal(p.w5MaterialVerbraucht,p.w5Begonnen*5);
 assert.equal(p.ledger.materialProduced,p.w4Material);
 assert.equal(p.ledger.freighterProduced,p.w5Gebaut);
 assert.equal(p.ledger.materialConsumed,
  p.w5MaterialVerbraucht
   +(s.kanon.minerWerft?.materialVerbraucht||0)
   +(s.kanon.bauteile?.materialVerbraucht||0)
   +(s.kanon.jaeger?.materialVerbraucht||0),
  'material consumed only by original W5, miner, J3 parts or J4 fighter production');
 assert.ok(p.w3Geliefert>=p.w4ErzVerbraucht,
  'not more ore refined than physically delivered');
 const endHash=w.hash(s),copy=w.load(first);w.advance(copy,14*1440);
 clean(w,copy);assert.equal(w.hash(copy),endHash);
 assert.equal(w.hash(w.load(w.save(s))),endHash);
 assert.equal(s.owners.house.cash,3000,'NPC economy never forces player purchases');
 console.log('P3_W4_W5_REPEAT_OK '+JSON.stringify({
  days:14,w3:p.w3Vertraege,ore:p.w3Geliefert,w4:p.w4Chargen,materials:p.w4Material,
  w5:p.w5Gebaut,materialConsumed:p.ledger.materialConsumed,
  house:s.owners.house.cash,world:sum(s),mint:s.minted,burn:s.burned,hash:endHash
 }));
});
test('P3: no industrial purchase authority in classic career or separate Rule207 worlds',()=>{
 const normal=J8.erstellen();normal.starten195(OLD.create(42,'private195').export(),true);
 const w=normal.weltReferenz(),s=normal.zustandReferenz(),hash=w.hash(s);
 assert.equal(Industry.auswerten(w,s,normal.angebote()).sichtbar,false);
 assert.equal(w.hash(s),hash);
 const w6=J8.erstellen();w6.startenP8g(true);
 assert.equal(Industry.auswerten(w6.weltReferenz(),w6.zustandReferenz(),w6.angebote()).sichtbar,false);
});
