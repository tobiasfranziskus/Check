// P3 diagnostic: explore actual original 204 capital and physically available
// reinvestment offers. Never mutate economic rules or promise any followup.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W5=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const P3=require('../prototypes/spiel/p3-handelsweg.js');
const Invest=require('../prototypes/spiel/p3-investition.js');
const start=()=>{const j=J8.erstellen();j.starten195(W5.create(42,'private195').export(),true);return j;};
function snapshot(j,label){
 const s=j.zustandReferenz(),w=j.weltReferenz();
 assert.equal(w.audit(s).ok,true);
 const sum=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
 assert.equal(sum,33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 const schiffe=Object.values(s.ships).filter(sh=>sh.owner==='house');
 const anlagen=schiffe.map(sh=>({id:sh.id,klasse:sh.klasse,ort:sh.system,phase:sh.phase,buchwert:w.buchwert(s,sh.id),minuten:s.kanon.verschleiss?.[sh.id]||0}));
 const offers=j.angebote().filter(x=>/^(buy-|ice-|freight-|gate-freight-|stop-)/.test(x.id));
 const buch=Object.entries(s.kanon.buch?.summen||{}).filter(([key])=>key.includes('|house|')||key.endsWith('|house'));
 const data={label,tick:s.tick,house:s.owners.house.cash,assets:anlagen,
  equity:s.owners.house.cash+anlagen.reduce((n,sh)=>n+sh.buchwert,0),
  stock:{aldera:{miner:s.stations.st_aldera.lager.miner,frachter:s.stations.st_aldera.lager.frachter,eis:s.stations.st_aldera.lager.eis},nadir:{miner:s.stations.st_nadir.lager.miner,frachter:s.stations.st_nadir.lager.frachter,jaeger:s.stations.st_nadir.lager.jaeger}},
  offers,freight:s.kanon.spielerFrachten||null,houseLedger:buch,worldMoney:sum};
 console.log('P3_REINVEST_PROBE '+JSON.stringify(data));
 return data;
}
test('P3: audit real two-round earnings, asset depreciation and reinvestment quotes',()=>{
 const j=start(),init=snapshot(j,'initial');
 let stage=0,history=[],finished=0;
 for(let i=0;i<45;i++){
  const p=P3.auswerten(j.zustandReferenz(),j.angebote());
  if(p.abgeschlossen>=2){finished=p.abgeschlossen;break;}
  assert.equal(p.bereit,true,p.grund||p.titel);
  if(p.art==='zeit')j.weiterspielen(60);
  else {const x=j.ausfuehren(p.aktion);assert.equal(x.ok,true,JSON.stringify(x));}
  if(p.aktion?.startsWith('buy-'))snapshot(j,'after-'+p.aktion);
  const after=P3.auswerten(j.zustandReferenz(),j.angebote());
  if(after.abgeschlossen>stage){stage=after.abgeschlossen;history.push(snapshot(j,'after-freight-'+stage));}
 }
 assert.equal(finished,2);
 const final=snapshot(j,'two-freights');
 const investTwo=Invest.auswerten(j.weltReferenz(),j.zustandReferenz(),j.angebote());
 assert.equal(investTwo.sichtbar,true);
 assert.equal(investTwo.veraenderung,525);
 assert.equal(investTwo.deckend,false);
 assert.equal(investTwo.bereit,true,'real ship can be bought even if earned surplus is < 600');

 assert.equal(final.house,2310);
 assert.equal(final.equity>=0,true);
 const available=final.offers.filter(x=>x.id.startsWith('buy-')&&x.ok);
 console.log('P3_REINVEST_OPTIONS '+JSON.stringify({investments:available,houseCashGrowth:final.house-init.house,houseEquityGrowth:final.equity-init.equity,freightRounds:final.freight.auftraege.length,elapsed:final.tick,assets:final.assets,prior:history.map(h=>({tick:h.tick,equity:h.equity,house:h.house}))}));
 // Three genuine rounds may finance an entire next miner from earned asset-adjusted surplus.
 for(let i=0;i<10;i++){
  const p=P3.auswerten(j.zustandReferenz(),j.angebote());
  if(p.abgeschlossen>=3)break;
  assert.equal(p.bereit,true,p.grund||p.titel);
  if(p.art==='zeit')j.weiterspielen(60);
  else assert.equal(j.ausfuehren(p.aktion).ok,true);
 }
 assert.equal(P3.auswerten(j.zustandReferenz(),j.angebote()).abgeschlossen,3);
 const third=snapshot(j,'three-freights');
 const investThree=Invest.auswerten(j.weltReferenz(),j.zustandReferenz(),j.angebote());
 assert.equal(investThree.deckend,true);
 assert.equal(investThree.veraenderung,751);
 assert.equal(investThree.preis,600);
 assert.equal(investThree.bereit,true);
 assert.equal(investThree.alderakasse,258);

 const originalShipIds=new Set(Object.keys(j.zustandReferenz().ships));
 const investment=j.angebote().find(a=>a.id==='buy-st_aldera-miner');
 assert.equal(investment?.ok,true,investment?.reason);
 const receipt=j.ausfuehren(investment.id);
 assert.equal(receipt.ok,true,JSON.stringify(receipt));
 const after=snapshot(j,'after-investment');
 const invested=Invest.auswerten(j.weltReferenz(),j.zustandReferenz(),j.angebote());
 assert.equal(invested.art,'arbeiten');
 assert.equal(invested.bereit,true,'new miner genuinely admits a funded original pendulum job');
 assert.equal(invested.miner,2);
 assert.equal(invested.lagerMiner,1);

 const newMiner=Object.values(j.zustandReferenz().ships)
  .find(sh=>sh.owner==='house'&&sh.klasse==='miner'&&!originalShipIds.has(sh.id));
 assert.ok(newMiner,'real new ship owned by house');
 assert.equal(after.house,third.house-600,'original 600 ISK transfer');
 assert.equal(after.equity,third.equity,'fully paid new 600-ISK hull replaces 600-ISK cash at purchase');
 const newJob=j.angebote().find(a=>a.id==='ice-'+newMiner.id);
 console.log('P3_REINVEST_OUTCOME '+JSON.stringify({
  beforeInvestment:third.equity,afterInvestment:after.equity,earnedSurplus:third.equity-init.equity,
  newMiner:newMiner.id,remainingMinerStock:after.stock.aldera.miner,
  originalMiningOffer:newJob||null,freeBuyerCash:j.zustandReferenz().owners.st_aldera.cash
 }));
 if(newJob?.ok){
  const begin=j.ausfuehren(newJob.id);assert.equal(begin.ok,true,JSON.stringify(begin));
  j.weiterspielen(60);
  snapshot(j,'second-miner-first-paid-work');
  const waiting=Invest.auswerten(j.weltReferenz(),j.zustandReferenz(),j.angebote());
  assert.equal(waiting.art,'wartet');
  assert.equal(waiting.bereit,false);
  assert.equal(j.weltReferenz().buchwert(j.zustandReferenz(),newMiner.id),600,
    'newly owned miner waits when station stock/buyer budget prevents new mining');

 }
 // Continue through original market exhaustion. Do not assume infinite demand:
 // the UI must stop at a genuine refused buyer or mining-funding quote.
 let blocked=null,attempts=0;
 for(let i=0;i<30;i++){
  const before=j.exportieren(),p=P3.auswerten(j.zustandReferenz(),j.angebote(),j.weltReferenz());
  assert.equal(j.exportieren(),before,'read-only finance view must not change world');
  if(!p.bereit){blocked=p;break;}
  if(p.art==='zeit')j.weiterspielen(60);
  else assert.equal(j.ausfuehren(p.aktion).ok,true);
  attempts++;
  assert.equal(j.weltReferenz().audit(j.zustandReferenz()).ok,true);
 }
 assert.ok(blocked,'a financed market cannot run forever on the limited original buyer money');
 assert.ok(blocked.grund,'core-backed financing or availability reason must be visible');
 assert.equal(blocked.bereit,false);
 const reached=snapshot(j,'post-market-block');
 console.log('P3_FINANCE_BLOCKED '+JSON.stringify({
   attempts,rounds:blocked.abgeschlossen,phase:blocked.art,reason:blocked.grund,
   buyerAl:reached.stock.aldera.eis,alderaCash:j.zustandReferenz().owners.st_aldera.cash,
   nadirCash:j.zustandReferenz().owners.st_nadir.cash,house:reached.house,equity:reached.equity
 }));
 const good=j.exportieren(),fake=JSON.parse(good);
 fake.owners.house.cash+=100;fake.owners.st_aldera.cash-=100;
 assert.equal(Object.values(fake.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.throws(()=>J8.erstellen().oeffnen204(JSON.stringify(fake),true),
   'unbacked owner transfer is forbidden even with conserved world money');
 const exported=good,again=J8.erstellen();again.oeffnen204(exported,true);assert.equal(again.exportieren(),exported);
});
