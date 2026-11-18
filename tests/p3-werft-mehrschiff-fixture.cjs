/* Strict P3 original Rule204/Seed42 multi-ship end-to-end fixture.
 * No altered warehouses, accounts, RNG, legacy import trust or game rules.
 * First ship sh004 plus nine paid F4 rounds; second sh010 factory hull is
 * purchased only after its genuine J8 quote becomes available.
 */
'use strict';
const assert=require('node:assert/strict');
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
function erstellen(){
 const j=J8.erstellen();j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 for(let i=0;i<5;i++)j.weiterspielen(60);
 assert.equal(j.ausfuehren('buy-st_nadir-frachter').ok,true);
 const first=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='frachter');
 assert.equal(first.id,'sh004');
 assert.equal(j.ausfuehren('reposition-'+first.id).ok,true);
 j.weiterspielen(60);
 assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);
 const miner=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner');
 assert.equal(miner.id,'sh005');
 assert.equal(j.ausfuehren('ice-'+miner.id).ok,true);
 j.weiterspielen(60);j.weiterspielen(60);
 assert.equal(j.zustandReferenz().tick,480);
 let rounds=0;
 for(let i=0;i<400 && rounds<9;i++){
  const q=j.angebote().find(a=>a.id==='freight-'+first.id);
  if(q?.ok){
   const a=j.ausfuehren(q.id);
   assert.equal(a.ok,true,a.reason);
   j.weiterspielen(60);j.weiterspielen(60);
   rounds++;
  }else j.weiterspielen(10);
 }
 assert.equal(rounds,9,'all nine F4 rounds must be genuinely financed');
 assert.equal(j.zustandReferenz().tick,2220,'deterministic pre-reinvestment S02 reference');
 let second=null;
 for(let i=0;i<=144;i++){
  const q=j.angebote().find(a=>a.id==='buy-st_nadir-frachter');
  if(q?.ok){
   const before=new Set(Object.keys(j.zustandReferenz().ships));
   const cash=j.zustandReferenz().owners.house.cash;
   const result=j.ausfuehren(q.id);
   assert.equal(result.ok,true,result.reason);
   const after=j.zustandReferenz();
   second=Object.values(after.ships).find(sh=>!before.has(sh.id));
   assert.ok(second);
   assert.equal(after.owners.house.cash,cash-750);
   assert.equal(after.stations.st_nadir.lager.frachter,0);
   assert.equal(second.owner,'house');assert.equal(second.system,'nadir');
   assert.ok(after.w5.schiffIds.includes(second.id));
   break;
  }
  if(i!==144)j.weiterspielen(10);
 }
 assert.equal(second?.id,'sh010','newest actual shop-purchased factory hull');
 const state=j.zustandReferenz(),a=w.audit(state);
 assert.equal(state.tick,3160);
 assert.equal(a.ok,true,a.fehler?.join('; '));
 assert.equal(Object.values(state.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(state.minted,0);assert.equal(state.burned,0);
 assert.equal(state.ships[first.id].system,'aldera');
 assert.equal(state.ships[first.id].heimat,'nadir');
 const save=j.exportieren(),cold=J8.erstellen();
 cold.oeffnen204(save,true);
 assert.equal(cold.exportieren(),save);
 assert.equal(cold.weltReferenz().hash(cold.zustandReferenz()),w.hash(state));
 return {save,first:first.id,second:second.id,miner:miner.id,hash:w.hash(state),tick:state.tick};
}
module.exports={erstellen};
if(require.main===module){
 const x=erstellen();delete x.save;console.log('P3_MULTI_W5_FIXTURE '+JSON.stringify(x));
}
