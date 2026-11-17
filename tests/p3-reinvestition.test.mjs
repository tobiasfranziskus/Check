// P3 diagnostic: explore actual original 204 capital and physically available
// reinvestment offers. Never mutate economic rules or promise any followup.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W5=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const P3=require('../prototypes/spiel/p3-handelsweg.js');
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
 assert.equal(final.house,2310);
 assert.equal(final.equity>=0,true);
 const available=final.offers.filter(x=>x.id.startsWith('buy-')&&x.ok);
 console.log('P3_REINVEST_OPTIONS '+JSON.stringify({investments:available,houseCashGrowth:final.house-init.house,houseEquityGrowth:final.equity-init.equity,freightRounds:final.freight.auftraege.length,elapsed:final.tick,assets:final.assets,prior:history.map(h=>({tick:h.tick,equity:h.equity,house:h.house}))}));
 const exported=j.exportieren(),again=J8.erstellen();again.oeffnen204(exported,true);assert.equal(again.exportieren(),exported);
});
