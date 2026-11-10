import test from 'node:test';
import assert from 'node:assert/strict';
import Factory from '../prototypes/w5ac/rule191-w5-ferry-core.js';

const cases=Object.freeze([
 {id:'two-private-buyers',carrier:2000,buyer:4000,oreBuy:6,iceBuy:4},
 {id:'both-private-pilots-save',carrier:2000,buyer:4000},
 {id:'ore-pilot-spends-ice-pilot-saves',carrier:2000,buyer:4000,oreBuy:6},
 {id:'ice-pilot-spends-ore-pilot-saves',carrier:2000,buyer:4000,iceBuy:4},
 {id:'ice-pilot-insufficient-for-six-at-minute-200',carrier:2000,buyer:4000,iceBuy:6},
 {id:'ice-only-ship-pilot',carrier:2000,buyer:4000,skipOre:true,iceBuy:5},
 {id:'water-factory-deliberately-closed',carrier:2000,buyer:4000,noFactory:true,oreBuy:1},
 {id:'no-paid-ice-miner',carrier:2000,buyer:4000,noMiner:true,oreBuy:1},
 {id:'no-freighter-hull',carrier:2000,buyer:4000,noFreighter:true,iceBuy:1},
 {id:'buyer739-no-ore-but-ice-works',carrier:2000,buyer:739,iceBuy:5},
 {id:'buyer489-no-valid-freight',carrier:2000,buyer:489,iceBuy:1},
 {id:'carrier869-cannot-escrow-labor',carrier:869,buyer:4000,iceBuy:1},
 {id:'carrier870-wages-exactly-funded',carrier:870,buyer:4000,oreBuy:6,iceBuy:4}
]);
const allISK=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function independent(core,s){
 const a=core.audit(s);
 assert.equal(a.ok,true,JSON.stringify({tick:s.tick,personal:a.personal,water:a.water,w3:a.w3}));
 assert.equal(a.personal.ok,true);assert.equal(a.water.ok,true);
 assert.equal(a.w3.ok,true);assert.equal(a.w4.ok,true);assert.equal(a.w5.ok,true);
 assert.equal(a.wageTrade.ok,true);assert.equal(a.replacement.ok,true);
 assert.equal(allISK(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.owners.fonds_transport.cash,0);
 assert.equal(s.w5ae.spent,0);
 for(const key of ['erz','eis']){
  const id='pilot_'+key,earned=s.w5ag.paid[key];
  const spent=s.w5n.kaufDeals.filter(x=>x.owner===id).reduce((n,d)=>n+d.betrag,0);
  assert.equal(s.owners[id].cash,earned-spent,'immutable earned wage, spend only own money');
  assert.equal(s.stats.konto[id].erloes,earned);
  assert.equal(s.stats.konto[id].kosten,spent);
 }
 assert.equal(s.w5ag.paid.erz,s.w3.arbeitsKosten);
 assert.equal(s.w5ag.paid.eis,s.w5n.frachtLohn);
 assert.equal(s.w5n.wasserErlos,
   s.w5n.kaufDeals.reduce((n,d)=>n+d.betrag,0));
 for(const ware of ['eis','wasser']){
  const physical=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
    +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
  const v=s.ledger[ware];
  assert.equal(physical,v.initial+v.mined+v.produced+v.imported-v.consumed-v.exported,ware);
 }
}
function run(config,{days=90,verify=true}={}){
 const {core,rules}=Factory.createPrivateWageResearch({carrierCash:config.carrier,buyerCash:config.buyer});
 const s=core.createW5State(42),denials={},accepted={};
 const runCommand=(type,owner,props={})=>{
  const a=core.execute(s,{type,owner,...props},rules);
  if(!a.ok)denials[type]=a.reason;
  else accepted[type]=(accepted[type]||0)+1;
  if(verify)independent(core,s);
  return a.ok;
 };
 const reach=t=>{assert.ok(s.tick<=t);core.advance(s,t-s.tick,rules);if(verify)independent(core,s);};
 let ship,miner;
 if(!config.noFreighter&&runCommand('shipBuy','transport',{klasse:'frachter',station:'st_aldera'}))
  ship=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter');
 if(!config.noMiner&&runCommand('shipBuy','house',{klasse:'miner',station:'st_aldera'})){
  miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  runCommand('shipMine','house',{schiff:miner.id,ware:'eis'});
 }
 reach(50);
 if(miner&&miner.auftrag==='foerdern')
  runCommand('shipWait','house',{schiff:miner.id});
 let ore=false,ice=false;
 if(ship&&!config.skipOre)
  ore=runCommand('shipFreight','transport',{schiff:ship.id});
 reach(170);
 if(ship)
  ice=runCommand('shipFreightIce','transport',{schiff:ship.id});
 reach(230);
 if(!config.noFactory)
  runCommand('stationWater','st_nadir',{station:'st_nadir'});
 reach(250);
 if(config.oreBuy)
  runCommand('pilotWaterBuy','pilot_erz',{menge:config.oreBuy});
 if(config.iceBuy)
  runCommand('pilotWaterBuy','pilot_eis',{menge:config.iceBuy});
 const position250={
  waterUsed:s.w5n.wasserVerbraucht,
  iceDelivered:s.w5n.eisGeliefert,waterMade:s.w5n.wasserProduziert,
  oreWages:s.w5ag.paid.erz,iceWages:s.w5ag.paid.eis,
  oreCash:s.owners.pilot_erz.cash,iceCash:s.owners.pilot_eis.cash,
  waterRevenue:s.w5n.wasserErlos,iceStarted:ice,oreStarted:ore};
 reach(290);
 if(verify)independent(core,s);
 const saved=core.save(s),replay=core.loadW5(saved),hash=core.hash(s);
 assert.equal(core.hash(replay),hash);
 for(let day=1;day<=days;day++){
  core.advance(s,1440,rules);core.advance(replay,1440,rules);
  if(verify)independent(core,s);
  assert.equal(core.hash(s),core.hash(replay),config.id+' day '+day);
  if(verify&&(day===30||day===90||day===365))
    assert.equal(core.hash(core.loadW5(core.save(s))),core.hash(s));
 }
 return {id:config.id,days,hash:core.hash(s),
  ...position250,endedIceWages:s.w5ag.paid.eis,
  endOreCash:s.owners.pilot_erz.cash,endIceCash:s.owners.pilot_eis.cash,
  consumed:s.w5n.wasserVerbraucht,
  materialPurchased:s.w5ae.spent,
  pooledCash:s.owners.fonds_transport.cash,
  minted:s.minted,worldISK:allISK(s),denials};
}
test('W5ag: 13 economically distinct 90-day rules on two true individual private salary wallets',()=>{
 assert.equal(cases.length,13);
 const first=cases.map(c=>run(c)),second=cases.map(c=>run(c,{verify:false}));
 for(let i=0;i<cases.length;i++)assert.equal(first[i].hash,second[i].hash);
 const row=id=>first.find(x=>x.id===id);
 assert.equal(row('two-private-buyers').waterUsed,10);
 assert.equal(row('two-private-buyers').waterRevenue,140);
 assert.equal(row('two-private-buyers').oreCash,36);
 assert.equal(row('two-private-buyers').iceCash,24);
 assert.equal(row('both-private-pilots-save').waterUsed,0);
 assert.equal(row('both-private-pilots-save').oreCash,120);
 assert.equal(row('both-private-pilots-save').iceCash,80);
 assert.equal(row('ore-pilot-spends-ice-pilot-saves').iceCash,80);
 assert.equal(row('ice-pilot-spends-ore-pilot-saves').oreCash,120);
 assert.equal(row('ice-pilot-insufficient-for-six-at-minute-200').waterUsed,0);
 assert.match(row('ice-pilot-insufficient-for-six-at-minute-200').denials.pilotWaterBuy,/nicht genug|Nicht genug|Lohn/);
 assert.equal(row('ice-only-ship-pilot').oreWages,0);
 assert.equal(row('ice-only-ship-pilot').waterUsed,5);
 assert.equal(row('water-factory-deliberately-closed').waterMade,0);
 assert.equal(row('no-paid-ice-miner').iceDelivered,0);
 assert.equal(row('no-freighter-hull').oreWages,0);
 assert.equal(row('no-freighter-hull').iceWages,0);
 assert.equal(row('buyer739-no-ore-but-ice-works').oreStarted,false);
 assert.equal(row('buyer739-no-ore-but-ice-works').iceStarted,true);
 assert.equal(row('buyer489-no-valid-freight').iceStarted,false);
 assert.equal(row('carrier869-cannot-escrow-labor').oreStarted,false);
 assert.equal(row('carrier869-cannot-escrow-labor').iceStarted,false);
 assert.equal(row('carrier870-wages-exactly-funded').oreStarted,true);
 assert.equal(row('carrier870-wages-exactly-funded').iceStarted,true);
 for(const v of first) {
  assert.equal(v.minted,0);assert.equal(v.worldISK,33000);
  assert.equal(v.pooledCash,0);assert.equal(v.materialPurchased,0);
 }
 console.log('W5AG_13_PRIVATE_ECONOMIES '+JSON.stringify(first));
});
test('W5ag: three 365-day crises explicitly distinguish private saving, voluntary consumption and no buyer capital',()=>{
 for(const id of ['two-private-buyers','both-private-pilots-save','buyer489-no-valid-freight']){
  const c=cases.find(x=>x.id===id),a=run(c,{days:365}),b=run(c,{days:365,verify:false});
  assert.equal(a.hash,b.hash);
  assert.equal(a.minted,0);assert.equal(a.worldISK,33000);
  assert.equal(a.consumed,a.waterUsed,
    'once delivered water has no automatically guaranteed future customer');
  console.log('W5AG_365D_PERSONAL_CRISIS '+JSON.stringify(a));
 }
});
