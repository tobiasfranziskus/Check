/* [ANALYSE] No new economic rules, stocks, consumers or reserved buyers.
 * Probe actual J8 ship purchase offers after nine fully financed W5 F4 rounds.
 * One original ten-minute world step between checks, at most 24 h.
 */
'use strict';
const assert=require('node:assert/strict');
const {run}=require('./p3-werftfrachter-zyklus.cjs');
const J8=require('../prototypes/verbund/konzern-session.js');
const MAX=144, STEP=10; // J8 accepts only 1, 10 or 60; 1,440 real economic minutes
function cashSum(s){return Object.values(s.owners).reduce((n,o)=>n+o.cash,0);}
function audit(j){
 const w=j.weltReferenz(),s=j.zustandReferenz(),a=w.audit(s);
 assert.equal(a.ok,true,a.fehler?.join('; '));
 for(const k of ['isk','goods','w3','w4','w5','w5transfer'])
  assert.equal(a.wirtschaft[k].ok,true,k);
 assert.equal(cashSum(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 return s;
}
function pruefen(){
 const earlier=run({target:9,checks:360}),j=J8.erstellen();
 assert.equal(earlier.receipts.length,9,'must start from actual pre-financed nine original F4 rounds');
 j.oeffnen204(earlier.finalSave,true);
 const w=j.weltReferenz(),s0=audit(j),end0=s0.tick;
 assert.equal(end0,2220);
 const count={},timeline=[];
 let firstPaid=null;
 for(let i=0;i<=MAX;i++){
  const s=audit(j),t=s.tick;
  const offers=j.angebote(),freight=offers.find(x=>x.id==='buy-st_nadir-frachter'),
    miner=offers.find(x=>x.id==='buy-st_aldera-miner');
  assert.ok(freight&&miner,'both original purchase affordances remain accessible');
  const selection=freight.ok?{type:'frachter',offer:freight,station:'st_nadir'}:
    miner.ok?{type:'miner',offer:miner,station:'st_aldera'}:null;
  if(selection){
   const beforeCash=s.owners.house.cash,ids=new Set(Object.keys(s.ships)),
    beforeStock=s.stations[selection.station].lager[selection.type]||0;
   const price=w.rules.economy.waren[selection.type].basis;
   assert.ok(beforeCash>=price);assert.ok(beforeStock>=1);
   const result=j.ausfuehren(selection.offer.id);
   assert.equal(result.ok,true,JSON.stringify(result));
   const after=audit(j),fresh=Object.values(after.ships).filter(x=>!ids.has(x.id));
   assert.equal(fresh.length,1);
   assert.equal(fresh[0].owner,'house');assert.equal(fresh[0].klasse,selection.type);
   assert.equal(after.owners.house.cash,beforeCash-price);
   assert.equal(after.stations[selection.station].lager[selection.type],beforeStock-1);
   assert.equal(w.buchwert(after,fresh[0].id),price);
   if(selection.type==='frachter')
    assert.ok(after.w5.schiffIds.includes(fresh[0].id),'second hull must be truly factory produced');
   const save=j.exportieren(),cold=J8.erstellen();
   cold.oeffnen204(save,true);
   assert.equal(cold.exportieren(),save);
   assert.equal(cold.weltReferenz().hash(cold.zustandReferenz()),w.hash(after));
   firstPaid={tick:t,type:selection.type,ship:fresh[0].id,price,
     from:selection.station,remaining:after.owners.house.cash,
     stockAfter:after.stations[selection.station].lager[selection.type],
     value:w.buchwert(after,fresh[0].id),hash:w.hash(after)};
   return {test:'natural-buy-offer',firstPaid,window:{start:end0,end:t,
    worldCash:33000,mint:0,burn:0,priceCarrier:750,priceMiner:600},
    observedCount:i+1,obstacles:count,timeline};
  }
  for(const [key,q] of [['frachter',freight],['miner',miner]]){
   const reason=q.reason||'kein Originalkaufangebot';
   const k=key+': '+reason;count[k]=(count[k]||0)+1;
  }
  if(i%6===0||i===MAX)timeline.push({tick:t,
   cash:s.owners.house.cash,alderaMiner:s.stations.st_aldera.lager.miner||0,
   nadirFrachter:s.stations.st_nadir.lager.frachter||0,
   w5Gebaut:s.w5.fertig,w4Chargen:s.w4.abgeschlossen,
   buyerFreight:freight.reason||null,buyerMiner:miner.reason||null});
  if(i===MAX)break;
  j.weiterspielen(STEP);
 }
 const last=audit(j),save=j.exportieren(),cold=J8.erstellen();
 cold.oeffnen204(save,true);
 assert.equal(cold.exportieren(),save);
 assert.equal(cold.weltReferenz().hash(cold.zustandReferenz()),w.hash(last));
 return {test:'natural-buy-offer',firstPaid:null,window:{start:end0,end:last.tick,
    worldCash:33000,mint:0,burn:0,priceCarrier:750,priceMiner:600},
   observedCount:MAX+1,obstacles:count,timeline,
   final:{cash:last.owners.house.cash,hash:w.hash(last),
    alderaminers:last.stations.st_aldera.lager.miner||0,
    nadirfreighters:last.stations.st_nadir.lager.frachter||0}};
}
module.exports={pruefen};
if(require.main===module)console.log(JSON.stringify(pruefen(),null,2));
