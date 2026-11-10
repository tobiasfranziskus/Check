import test from 'node:test';
import assert from 'node:assert/strict';
import Factory from '../prototypes/w5ac/rule191-w5-ferry-core.js';

const scenarios=Object.freeze([
 {id:'wage-water-five-plus-three',carrierCash:2000,buyerCash:4000,buy130:5,buy170:3},
 {id:'workers-save-every-isk',carrierCash:2000,buyerCash:4000},
 {id:'workers-buy-one-early',carrierCash:2000,buyerCash:4000,buy130:1},
 {id:'six-units-before-salary',carrierCash:2000,buyerCash:4000,buy130:6},
 {id:'eight-after-full-salary',carrierCash:2000,buyerCash:4000,buy170:8},
 {id:'nine-above-120-salary',carrierCash:2000,buyerCash:4000,buy170:9},
 {id:'water-factory-withheld',carrierCash:2000,buyerCash:4000,noFactory:true,buy170:1},
 {id:'no-ice-miner-purchased',carrierCash:2000,buyerCash:4000,noMiner:true,buy170:1},
 {id:'no-freighter-purchased',carrierCash:2000,buyerCash:4000,noFreighter:true,buy170:1},
 {id:'buyer-489-ice-cargo-blocked',carrierCash:2000,buyerCash:489,buy170:1},
 {id:'buyer-490-cannot-pay-waterwork',carrierCash:2000,buyerCash:490,buy170:1},
 {id:'carrier-869-cannot-pay-ice-flight',carrierCash:869,buyerCash:4000,buy170:1},
 {id:'carrier-870-120-exact-labor',carrierCash:870,buyerCash:4000,buy170:8},
]);
function independent(core,s,r){
 const a=core.audit(s),w=s.w5n;
 assert.equal(a.ok,true,'original full audit at '+s.tick+': '+JSON.stringify({ice:a.water,wage:a.wageTrade,w3:a.w3}));
 assert.equal(a.water.ok,true);assert.equal(a.wageTrade.ok,true);
 assert.equal(a.isk.ok,true);assert.equal(a.goods.ok,true);assert.equal(a.replacement.ok,true);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.owners.fonds_transport.cash+s.w5ae.spent+w.wasserErlos,
   s.w3.arbeitsKosten+w.frachtLohn);
 assert.equal(s.owners.fonds_aldera.cash,
   s.ledger.erz.mined*r.erzpilot.minerJeMinute+w.mineLohn);
 assert.equal(s.owners.w5n_arbeit.cash,w.fabrikBezahlt);
 assert.equal(s.owners.w5n_fracht_arbeit?.cash??0,
   w.frachtauftrag?120-w.frachtauftrag.gearbeitet:0);
 assert.equal(s.owners.w5n_fabrik_arbeit?.cash??0,w.fabrikGebucht-w.fabrikBezahlt);
 const physical=ware=>Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
  +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
 for(const ware of ['eis','wasser']){
  const l=s.ledger[ware];
  assert.equal(physical(ware),l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,ware);
 }
 assert.equal(s.stations.st_nadir.lager.eis,w.eisGeliefert-w.eisVerbraucht);
 assert.equal(s.stations.st_nadir.lager.wasser,w.wasserProduziert-w.wasserVerbraucht);
 assert.equal(w.wasserVerbraucht,w.kaufDeals.reduce((n,t)=>n+t.menge,0));
 assert.equal(w.wasserErlos,w.kaufDeals.reduce((n,t)=>n+t.betrag,0));
 assert.equal(w.wasserVerbraucht*14,w.wasserErlos);
 assert.equal(s.ledger.wasser.consumed,w.wasserVerbraucht);
 assert.equal(s.ledger.eis.consumed,w.eisVerbraucht);
 assert.equal(s.owners.st_nadir.cash+w.kaufAusgaben+w.fabrikGebucht+s.w3.kaufAusgaben+s.w4.gebucht
   -s.w5.materialUmsatz-s.w5ae.spent-w.wasserErlos,
   r.owners.find(x=>x.id==='st_nadir').cash);
}
function run(config,{verify=true,days=90}={}){
 const {core,rules}=Factory.createWaterResearch({carrierCash:config.carrierCash,buyerCash:config.buyerCash});
 let s=core.createW5State(42);const denials={},events=[];
 const exec=(type,owner,fields={})=>{
  const result=core.execute(s,{type,owner,...fields},rules);
  if(result.ok)events.push({tick:s.tick,type,owner,...fields});
  else denials[type]=result.reason;
  if(verify)independent(core,s,rules);
  return result.ok;
 };
 const goto=t=>{assert.ok(s.tick<=t);core.advance(s,t-s.tick,rules);if(verify)independent(core,s,rules);};
 let ship=null,miner=null;
 if(!config.noFreighter&&exec('shipBuy','transport',{klasse:'frachter',station:'st_aldera'}))
  ship=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter');
 if(!config.noMiner&&exec('shipBuy','house',{klasse:'miner',station:'st_aldera'})){
  miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  exec('shipMine','house',{schiff:miner.id,ware:'eis'});
 }
 goto(50);
 if(miner&&miner.auftrag==='foerdern')exec('shipWait','house',{schiff:miner.id});
 let freightStarted=false;
 if(ship)freightStarted=exec('shipFreightIce','transport',{schiff:ship.id});
 goto(110);
 if(!config.noFactory)exec('stationWater','st_nadir',{station:'st_nadir'});
 goto(130);
 if(config.buy130)exec('workerWaterBuy','fonds_transport',{menge:config.buy130});
 if(verify)independent(core,s,rules);
 const savedMid=core.save(s),hMid=core.hash(s);
 if(verify)assert.equal(core.hash(core.loadW5(savedMid)),hMid);
 goto(170);
 if(config.buy170)exec('workerWaterBuy','fonds_transport',{menge:config.buy170});
 if(verify)independent(core,s,rules);
 const summaryAt170={
  iceMined:s.w5n.eisAbgebaut,iceSold:s.w5n.mineVerkauft,
  iceDelivered:s.w5n.eisGeliefert,
  waterProduced:s.w5n.wasserProduziert,waterUsed:s.w5n.wasserVerbraucht,
  waterRevenue:s.w5n.wasserErlos,workerWages:s.w5n.frachtLohn,
  workerCash:s.owners.fonds_transport.cash,buyerCash:s.owners.st_nadir.cash,
  minerWages:s.w5n.mineLohn,factoryWages:s.w5n.fabrikBezahlt,
  freightCompleted:s.w5n.frachtAbgeschlossen,freightStarted,denials};
 const replay=core.loadW5(core.save(s));
 assert.equal(core.hash(s),core.hash(replay));
 for(let day=1;day<=days;day++){
  core.advance(s,1440,rules);core.advance(replay,1440,rules);
  if(verify)independent(core,s,rules);
  assert.equal(core.hash(s),core.hash(replay),config.id+' day '+day);
  if(verify&&(day===30||day===90||day===365))
   assert.equal(core.hash(core.loadW5(core.save(s))),core.hash(s),'valid replayed water save');
 }
 return {id:config.id,days,hash:core.hash(s),...summaryAt170,
   worldCash:33000,mint:s.minted,
   overTimeWaterUsed:s.w5n.wasserVerbraucht,
   waterProducedForever:s.w5n.wasserProduziert,
   individualWorkerOwnershipNotProven:true};
}
test('W5af: 13 genuinely different 90d water finance/consumption/production scenarios, saved and re-played',()=>{
 assert.equal(scenarios.length,13);
 const results=scenarios.map(c=>run(c)),replay=scenarios.map(c=>run(c,{verify:false}));
 for(let i=0;i<results.length;i++)assert.equal(results[i].hash,replay[i].hash,scenarios[i].id);
 const one=id=>results.find(x=>x.id===id);
 assert.equal(one('wage-water-five-plus-three').waterUsed,8);
 assert.equal(one('wage-water-five-plus-three').waterRevenue,112);
 assert.equal(one('wage-water-five-plus-three').iceDelivered,50);
 assert.equal(one('wage-water-five-plus-three').waterProduced,10);
 assert.equal(one('wage-water-five-plus-three').workerCash,8);
 assert.equal(one('workers-save-every-isk').waterUsed,0);
 assert.equal(one('workers-save-every-isk').workerCash,120);
 assert.equal(one('six-units-before-salary').waterUsed,0);
 assert.equal(one('nine-above-120-salary').waterUsed,0);
 assert.equal(one('eight-after-full-salary').waterUsed,8);
 assert.equal(one('water-factory-withheld').waterProduced,0);
 assert.equal(one('no-ice-miner-purchased').iceDelivered,0);
 assert.equal(one('no-freighter-purchased').iceDelivered,0);
 assert.equal(one('buyer-489-ice-cargo-blocked').iceDelivered,0);
 assert.equal(one('buyer-490-cannot-pay-waterwork').iceDelivered,50);
 assert.equal(one('buyer-490-cannot-pay-waterwork').waterProduced,0);
 assert.equal(one('carrier-869-cannot-pay-ice-flight').iceDelivered,0);
 assert.equal(one('carrier-870-120-exact-labor').iceDelivered,50);
 assert.equal(one('carrier-870-120-exact-labor').waterUsed,8);
 for(const x of results){assert.equal(x.worldCash,33000);assert.equal(x.mint,0);}
 console.log('W5AF_13_ECONOMIC_90D '+JSON.stringify(results));
});
test('W5af: 3 explicit 365-day crises prove only finite wage-based water demand, never imply permanent buyers',()=>{
 for(const id of ['wage-water-five-plus-three','workers-save-every-isk','buyer-490-cannot-pay-waterwork']){
  const config=scenarios.find(x=>x.id===id);
  const a=run(config,{days:365}),b=run(config,{verify:false,days:365});
  assert.equal(a.hash,b.hash);assert.equal(a.overTimeWaterUsed,a.waterUsed);
  assert.equal(a.waterProducedForever,a.waterProduced);
  assert.equal(a.mint,0);assert.equal(a.worldCash,33000);
  console.log('W5AF_WATER_YEAR_CRISE '+JSON.stringify(a));
 }
});
