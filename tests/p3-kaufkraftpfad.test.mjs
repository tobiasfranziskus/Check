// P3 research-only reproducible income/market diagnosis.
// No new economic rule, no production activation, no money injection.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const W5=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const P3=require('../prototypes/spiel/p3-handelsweg.js');
const original=()=>{
  const j=J8.erstellen();
  j.starten195(W5.create(42,'private195').export(),true);
  return j;
};
function snap(j,label){
  const s=j.zustandReferenz(),w=j.weltReferenz();
  assert.equal(w.audit(s).ok,true);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
  const x={label,tick:s.tick,rounds:s.kanon.spielerFrachten?.auftraege.filter(x=>x.end!==null).length||0,
    owners:Object.fromEntries(Object.entries(s.owners).map(([k,v])=>[k,v.cash])),
    aldera:s.stations.st_aldera.lager,nadir:s.stations.st_nadir.lager,
    water:s.kanon.wasser,automation:s.kanon.politik.automatik,
    k:s.kanon.politik,emission:[s.minted,s.burned],
    availableAccounts:Object.fromEntries(['pilot_house','eigner_house','pilot_eis','pilot_erz','eigner_st_aldera','eigner_st_nadir','eigner_transport','eigner_npc3']
      .filter(x=>s.owners[x]).map(x=>[x,{cash:s.owners[x].cash,home: ['eigner_nadir','w5n_arbeit'].includes(x)?'nadir':'aldera',
      quoted:w.execute(w.load(j.exportieren()),{type:'householdBuy',owner:x,menge:1})}]))};
  console.log('P3_BUYER_DIAG '+JSON.stringify(x));
  return x;
}
test('research: account-level verified buyer cash flow and real water demand',()=>{
  const j=original(),seen=new Set();
  for(let i=0;i<65;i++){
    const p=P3.auswerten(j.zustandReferenz(),j.angebote(),j.weltReferenz());
    if(!seen.has(p.abgeschlossen)){seen.add(p.abgeschlossen);snap(j,'round-'+p.abgeschlossen);}
    if(!p.bereit){snap(j,'blocked'); break;}
    if(p.art==='zeit') j.weiterspielen(60);
    else assert.equal(j.ausfuehren(p.aktion).ok,true,p.aktion);
  }
  const t=snap(j,'base-final');
  assert.ok(t.rounds>=3);
  const s=j.zustandReferenz(),w=j.weltReferenz(),buyerCost=w.rules.w5n.charge*w.rules.w5n.eisPreis;
  const shortfall=Math.max(0,buyerCost-s.owners.st_aldera.cash);
  console.log('P3_BUYER_SHORTFALL '+JSON.stringify({buyerCost,shortfall,accountWallets:t.availableAccounts,waterAldera:t.aldera.wasser,waterNadir:t.nadir.wasser}));
  for(const owner of ['pilot_house','eigner_house','pilot_eis','pilot_erz','eigner_st_aldera','eigner_transport','eigner_npc3']){
    const copy=w.load(j.exportieren());
    const maxByStock=Math.min(copy.stations.st_aldera.lager.wasser,Math.floor(copy.owners[owner].cash/16));
    const quantity=Math.min(Math.max(1,Math.ceil(shortfall/16)),Math.max(1,maxByStock));
    const r=w.execute(copy,{type:'householdBuy',owner,menge:quantity});
    console.log('P3_BUYER_REPAY '+JSON.stringify({owner,quantity,ok:r.ok,reason:r.reason||null,after:r.ok?copy.owners.st_aldera.cash:null,waterAfter:copy.stations.st_aldera.lager.wasser}));
    if(r.ok){assert.equal(w.audit(copy).ok,true);assert.equal(Object.values(copy.owners).reduce((n,o)=>n+o.cash,0),33000);}
  }
});
