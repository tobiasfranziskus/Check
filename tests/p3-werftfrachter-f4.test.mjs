// Paid, auditable Nadir-built W5 freighter -> real F4 ice freight, Rule204.
// No money mint, fake origin, teleport, extra buyer or altered economic rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
function audit(j){
 const w=j.weltReferenz(),s=j.zustandReferenz(),a=w.audit(s);
 assert.equal(a.ok,true,JSON.stringify(a.fehler));
 for(const k of ['isk','goods','w3','w4','w5','w5transfer'])
   assert.equal(a.wirtschaft[k].ok,true,k);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 return s;
}
function startReady(){
 const j=J8.erstellen();
 j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 for(let i=0;i<5;i++)j.weiterspielen(60);
 assert.equal(j.ausfuehren('buy-st_nadir-frachter').ok,true);
 const ship=Object.values(audit(j).ships).find(sh=>sh.owner==='house'
   &&sh.klasse==='frachter'&&audit(j).w5.schiffIds.includes(sh.id)).id;
 assert.equal(j.ausfuehren('reposition-'+ship).ok,true);
 assert.equal(audit(j).w5ac.active.id,ship);
 j.weiterspielen(60);
 assert.ok(audit(j).w5ac.completed.some(t=>t.id===ship&&t.owner==='house'&&t.kosten===60));
 assert.equal(audit(j).ships[ship].heimat,'nadir','do not forge Nadir origin');
 assert.equal(audit(j).ships[ship].system,'aldera','real paid arrival');
 assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);
 const miner=Object.values(audit(j).ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner').id;
 assert.equal(j.ausfuehren('ice-'+miner).ok,true);
 j.weiterspielen(60);j.weiterspielen(60);
 const ready=audit(j);
 assert.equal(ready.tick,480);
 assert.ok(ready.stations.st_aldera.lager.eis>=50);
 assert.equal(ready.owners.house.cash,1719);
 assert.equal(ready.ships[ship].heimat,'nadir');
 return {j,ship,miner,readyHash:w.hash(ready)};
}
function finish(){
 const {j,ship,readyHash}=startReady(),w=j.weltReferenz();
 assert.equal(w.hash(j.zustandReferenz()),readyHash);
 const id='freight-'+ship;
 const offer=j.angebote().find(o=>o.id===id);
 assert.equal(offer?.ok,true,'audit-backed offer must agree with the real order: '+offer?.reason);
 const before=j.exportieren();
 const res=j.ausfuehren(id);
 assert.equal(res.ok,true,JSON.stringify(res));
 let s=audit(j);
 assert.equal(s.kanon.spielerFrachten.auftraege.length,1);
 assert.equal(s.kanon.spielerFrachten.auftraege[0].start,480);
 assert.equal(s.w5n.frachtauftrag.schiff,ship);
 assert.equal(s.owners.w5n_fracht_arbeit.cash,120);
 assert.equal(s.owners.w5n_fracht_kauf.cash,490);
 assert.equal(s.stations.st_aldera.lager.eis,0);
 assert.equal(s.ships[ship].ladung.eis,50);
 // Transit is legitimate under a cold import (not a repaired illegal clone).
 const cold=J8.erstellen();cold.oeffnen204(j.exportieren(),true);
 assert.equal(cold.exportieren(),j.exportieren());
 j.weiterspielen(60);cold.weiterspielen(60);
 s=audit(j);
 assert.equal(cold.exportieren(),j.exportieren(),'cold replay incl. delivered ice');
 j.weiterspielen(60);cold.weiterspielen(60);
 s=audit(j);
 assert.equal(cold.exportieren(),j.exportieren(),'cold replay incl. paid return');
 const x=s.kanon.spielerFrachten.auftraege[0];
 assert.equal(x.geliefert,540);assert.equal(x.end,600);
 assert.equal(s.kanon.spielerFrachten.lohn,120);
 assert.equal(s.kanon.spielerFrachten.gebuehr,240);
 // The NPC dispatcher may already start its *next* funded F4 contract in
 // this same world minute. Shared escrow is not the player's own residual.
 assert.equal(s.kanon.spielerFrachten.auftraege.filter(a=>a.end===null).length,0);
 // The original miner shuttle may keep paying further flight minutes in
 // parallel. K1's validated wage ledger isolates exactly 120 ISK F4 wages.
 assert.ok(s.owners.pilot_house.cash>=s.kanon.spielerFrachten.lohn,
   'the private pilot account includes all proven player-freight wages');
 const active=s.w5n.frachtauftrag;
 if(active){
   assert.notEqual(active.schiff,ship,'next contract belongs to a different freighter');
   assert.notEqual(s.ships[active.schiff].owner,'house','no new player freight was ordered');
   assert.equal(s.owners.w5n_fracht_arbeit.cash,120-active.gearbeitet,
     'original 120-ISK wage escrow belongs to the new running NPC contract');
 }else{
   assert.equal(s.owners.w5n_fracht_arbeit.cash,0,'no unattached wage escrow');
   assert.equal(s.owners.w5n_fracht_kauf.cash,0,'no unattached buyer escrow');
 }
 assert.equal(s.ships[ship].system,'aldera');
 assert.equal(s.ships[ship].heimat,'nadir');
 // The original ice miner continues to operate in the same world clock:
 // extra mined/sold goods and wages are NOT attributable to the F4 tariff.
 assert.ok(Number.isSafeInteger(s.owners.house.cash)&&s.owners.house.cash>=0);
 assert.equal(s.kanon.spielerFrachten.gebuehr-s.kanon.spielerFrachten.lohn,120,
   'the 240-ISK transport fee and 120-ISK pilot wages are separately booked, not net corporate profit');
 const done=j.exportieren();
 const tampered=JSON.parse(done);
 tampered.w5ac.completed[0].kosten=0;
 assert.throws(()=>J8.erstellen().oeffnen204(JSON.stringify(tampered),true),
   'a free or forged ferry must never authenticate the Nadir-built hull');
 const wrong=JSON.parse(done);wrong.ships[ship].heimat='aldera';
 assert.throws(()=>J8.erstellen().oeffnen204(JSON.stringify(wrong),true),
   'do not rewrite the immutable Nadir origin');
 const fresh=J8.erstellen();fresh.oeffnen204(done,true);
 assert.equal(fresh.exportieren(),done);
 return {initialHash:readyHash,afterHash:w.hash(s),save:done};
}
test('P3: legitimate Nadir W5 hull executes original prepaid F4 and completes real paid return',()=>{
 const r=finish();
 assert.notEqual(r.initialHash,r.afterHash);
});
test('P3: original F4 carrier with immutable Nadir provenance is deterministic on independent replay',()=>{
 const a=finish(),b=finish();
 assert.deepEqual(a,b);
});
