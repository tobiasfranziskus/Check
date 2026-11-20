// M3-P2: original Rule204 industrial limits, reached through genuine transactions.
// No direct edits to cash, warehouse, ownership, rules, or researched P3 queues.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const OLD=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const W6=require('../tools/w6-szenarien.cjs');

function begin(){
 const j=J8.erstellen();j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 check(w,s);return {j,w,s};
}
function check(w,s){
 assert.equal(w.audit(s).ok,true,'original audited Rule204 world');
 assert.deepEqual(W6.pruefen(w,s),[],'independent account, inventory and contract audit');
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s),'lossless original save/load');
}
function refuse(w,s,cmd){
 const before=w.save(s),old=w.hash(s),out=w.execute(s,cmd);
 assert.equal(out.ok,false,'must refuse original '+cmd.type);
 assert.equal(w.save(s),before,'failed command cannot change real accounts/stock/contracts');
 assert.equal(w.hash(s),old);
 assert.ok(out.reason,'original blocker reason must be retained');
 check(w,s);
 return out.reason;
}
function refuseJ8(j,id){
 const before=j.exportieren(),old=j.ansicht().hash;
 const quote=j.angebote().find(x=>x.id===id);
 assert.ok(quote,'actual house action must exist in J8 plan: '+id);
 assert.equal(quote.ok,false,'original quote must refuse '+id);
 assert.ok(quote.reason);
 const out=j.ausfuehren(id);
 assert.equal(out.ok,false);
 assert.equal(out.reason,quote.reason,'original J8 reason must survive');
 assert.equal(j.exportieren(),before,'rejected J8 command must be byte-identical');
 assert.equal(j.ansicht().hash,old);
 check(j.weltReferenz(),j.zustandReferenz());
 return quote.reason;
}
function advance(w,s,minutes){for(let n=0;n<minutes;n++)w.advance(s,1);}

test('M3-P2: real missing W3 inputs and W5 hull stock refuse without booking',()=>{
 const {j,w,s}=begin();
 const refinery=refuse(w,s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
 const yard=refuse(w,s,{type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'});
 const stock=refuseJ8(j,'buy-st_nadir-frachter');
 assert.match(refinery,/Erz/);assert.match(yard,/Material/);
 assert.equal(stock,'kein Komplettschiff auf Lager');
 assert.equal(s.w3.geliefert,0);assert.equal(s.w4.materialErzeugt,0);
 assert.equal(s.w5.fertig,0);
 console.log('M3_P2_NATURAL_MISSING_STOCK '+JSON.stringify({refinery,yard,stock,hash:w.hash(s)}));
});

test('M3-P2: real built hull can be bought but original W3 route blocks premature ferry',()=>{
 const {j,w,s}=begin();
 advance(w,s,253);
 check(w,s);
 assert.ok(s.w3.auftrag,'original paid W3 return voyage is still active');
 assert.equal(s.w3.abgeschlossen,0);
 assert.equal(s.w5.fertig,1);
 assert.equal(s.stations.st_nadir.lager.frachter,1);
 const q=j.angebote().find(x=>x.id==='buy-st_nadir-frachter');
 assert.equal(q?.ok,true,q?.reason);
 const beforeCash=s.owners.house.cash;
 const receipt=j.ausfuehren(q.id);
 assert.equal(receipt.ok,true,JSON.stringify(receipt));
 const paid=j.zustandReferenz();
 const owned=Object.values(paid.ships).find(sh=>sh.owner==='house' && sh.system==='nadir'
  && paid.w5.schiffIds.includes(sh.id));
 assert.ok(owned,'physical Nadir ship is house-owned after genuine 750-ISK purchase');
 assert.equal(paid.owners.house.cash,beforeCash-750);
 assert.equal(paid.stations.st_nadir.lager.frachter,0);
 const route=refuseJ8(j,'reposition-'+owned.id);
 assert.equal(route,'Noch aktive W3-Fracht oder Ueberfuehrung');
 const sold=refuseJ8(j,'buy-st_nadir-frachter');
 assert.equal(sold,'kein Komplettschiff auf Lager');
 const original=j.exportieren(),restored=J8.erstellen();restored.oeffnen204(original,true);
 assert.equal(restored.exportieren(),original);
 assert.equal(refuseJ8(restored,'reposition-'+owned.id),route);
 console.log('M3_P2_REAL_FERRY_BLOCK '+JSON.stringify({tick:paid.tick,ship:owned.id,route,
  stock:sold,houseCash:paid.owners.house.cash,hash:j.ansicht().hash}));
});

test('M3-P2: genuine capital depletion does not conjure an unavailable W5 hull',()=>{
 const {j,w}=begin();
 // Legitimate starter purchases spend real house money and consume finite stock.
 const purchases=['buy-st_aldera-miner','buy-st_aldera-miner','buy-st_aldera-miner',
   'buy-st_aldera-frachter'];
 for(const id of purchases){
  const q=j.angebote().find(x=>x.id===id);
  assert.equal(q?.ok,true,`${id}: ${q?.reason}`);
  const before=j.zustandReferenz().owners.house.cash;
  const result=j.ausfuehren(id);
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.ok(j.zustandReferenz().owners.house.cash<before,'every hull is paid for');
 }
 const afterPurchases=j.zustandReferenz();
 assert.equal(afterPurchases.owners.house.cash,450,'3×600 + 750 is original funded spending');
 check(w,afterPurchases);
 const snapshot=j.exportieren(),replay=J8.erstellen();replay.oeffnen204(snapshot,true);
 const s1=j.zustandReferenz(),s2=replay.zustandReferenz(),w2=replay.weltReferenz();
 let firstAvailable=null;
 // Inspect every actual minute so an available hull is not mistaken for
 // perpetual availability after a competing, legitimate NPC purchase.
 for(let i=0;i<=1440;i++){
  if(s1.stations.st_nadir.lager.frachter>0){firstAvailable=i;break;}
  if(i<1440){w.advance(s1,1);w2.advance(s2,1);}
 }
 assert.equal(w.hash(s1),w2.hash(s2),'same paid action history replays deterministically');
 assert.equal(w.save(s1),w2.save(s2),'exact original replay bytes');
 check(w,s1);
 // CI first revealed the negative result: after these lawful purchases no
 // unbought Nadir hull appears during the sampled 1,440 minutes. Never infer
 // a finance-blocked W5 offer from an inventory-blocked market.
 assert.equal(firstAvailable,null,
  'this exact paid seed has no physical Nadir hull during the observed horizon');
 assert.equal(s1.stations.st_nadir.lager.frachter,0);
 assert.equal(s1.owners.house.cash,450,
  'no synthetic company income or balance adjustment was used in the run');
 const reason=refuseJ8(j,'buy-st_nadir-frachter');
 assert.equal(reason,'kein Komplettschiff auf Lager',
  'stock absence, not insufficient cash, is the observed original first blocker');
 assert.equal(j.zustandReferenz().w5.schiffIds.some(id=>
   j.zustandReferenz().ships[id]?.owner==='house'),false,
  'no fabricated player-owned Nadir freighter');
 const originalSave=w.save(s1);
 const original=w.execute(s1,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'frachter'});
 assert.equal(original.ok,false);
 assert.equal(original.reason,reason,'original core blocker exactly preserved');
 assert.equal(w.save(s1),originalSave,'failed direct core purchase stays byte-identical');
 check(w,s1);
 console.log('M3_P2_NATURAL_CAPITAL_AND_STOCK_LIMIT '+JSON.stringify({
  tick:s1.tick,worldDays:Math.floor(s1.tick/1440),unboughtNadirHullEverSeen:firstAvailable!==null,
  w3Completed:s1.w3.abgeschlossen,w4Completed:s1.w4.abgeschlossen,w5Completed:s1.w5.fertig,
  stock:s1.stations.st_nadir.lager.frachter,houseCash:s1.owners.house.cash,
  reason,hash:w.hash(s1)}));
});
