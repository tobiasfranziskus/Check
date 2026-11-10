import test from 'node:test';
import assert from 'node:assert/strict';
import Factory from '../prototypes/w5ac/rule191-w5-ferry-core.js';

const START_BUYER_CASH=1536;
const expectedWorldMoney=33000;
const engine=()=>Factory.createPrivateWageResearch({buyerCash:START_BUYER_CASH,carrierCash:2000});
const cash=s=>Object.values(s.owners).reduce((v,o)=>v+o.cash,0);
const paidBuyer=state=>state.owners.st_nadir.cash;
function scenario(seed){
 const {core,rules}=engine(),s=core.createW5State(seed);
 const log=[];
 const audit=label=>{
  const r=core.audit(s);
  assert.equal(r.ok,true,label+' core audit: '+JSON.stringify(r));
  for(const [name,v] of [['water',core.pilotWaterStand(s)],['privateWages',core.pilotPrivateWageStand(s)]])
   assert.equal(v.ok,true,label+' '+name+' audit');
  assert.equal(cash(s),expectedWorldMoney,label+' conservation');
  assert.equal(s.minted,0,label+' no mint');
  assert.equal(s.burned,0,label+' no burn');
  log.push({label,tick:s.tick,hash:core.hash(s),buyer:paidBuyer(s),
   waterProduced:s.w5n.wasserProduziert,waterSold:s.w5n.wasserVerbraucht,
   waterRevenue:s.w5n.wasserErlos,orePilotCash:s.owners.pilot_erz.cash,
   icePilotCash:s.owners.pilot_eis.cash,carrier:s.owners.transport.cash});
 };
 function good(type,owner,extra={}){
  const r=core.execute(s,{type,owner,...extra},rules);
  assert.equal(r.ok,true,type+' denied: '+r.reason);
  audit(type);
 }
 function minutes(n){core.advance(s,n,rules);audit('minute+'+n);}
 function refuse(type,owner,extra={}){
  const save=core.save(s),hash=core.hash(s);
  const r=core.execute(s,{type,owner,...extra},rules);
  assert.equal(r.ok,false,'must refuse unfunded '+type);
  assert.equal(core.save(s),save,'refusal must not transfer money or mutate goods');
  assert.equal(core.hash(s),hash,'refusal must not advance RNG');
  audit('refused:'+type);
  return r.reason;
 }
 audit('initial');
 good('shipBuy','transport',{station:'st_aldera',klasse:'frachter'});
 good('shipBuy','house',{station:'st_aldera',klasse:'miner'});
 const freighter=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter');
 const miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert.ok(miner&&freighter,'physically financed hulls');
 good('shipMine','house',{schiff:miner.id,ware:'eis'});minutes(50);
 good('shipWait','house',{schiff:miner.id});
 good('shipFreight','transport',{schiff:freighter.id});minutes(120);
 good('shipFreightIce','transport',{schiff:freighter.id});minutes(60);
 good('stationWater','st_nadir',{station:'st_nadir'});minutes(20);
 good('pilotWaterBuy','pilot_erz',{menge:6});
 good('pilotWaterBuy','pilot_eis',{menge:4});
 minutes(40);
 good('stationWater','st_nadir',{station:'st_nadir'});minutes(20);
 assert.equal(s.tick,310);
 assert.equal(s.w5n.wasserProduziert,20);
 assert.equal(s.w5n.wasserVerbraucht,10);
 assert.equal(s.stations.st_nadir.lager.wasser,10,'real unsold water');
 assert.equal(s.owners.pilot_erz.cash,36,'paid ore wages minus voluntary purchases');
 assert.equal(s.owners.pilot_eis.cash,64,'paid ice wages minus voluntary purchases');
 good('shipMine','house',{schiff:miner.id,ware:'eis'});minutes(50);
 good('shipWait','house',{schiff:miner.id});
 good('shipSellIce','house',{schiff:miner.id,menge:50});
 assert.equal(s.tick,360);
 assert.equal(paidBuyer(s),406,'genuine underfunded buyer before demand');
 const quote=core.pilotIceFreightQuote(s,freighter.id);
 assert.equal(quote.gesamt,490,'original buyer escrow requirement');
 assert.equal(quote.arbeit,120,'original carrier labor escrow requirement');
 assert.equal(s.owners.transport.cash>=quote.arbeit,true,'carrier can cover real wages');
 const blocked=refuse('shipFreightIce','transport',{schiff:freighter.id});
 assert.match(blocked,/Nadir|Kaeufer|Käufer|ISK/);
 assert.equal(s.stations.st_nadir.lager.wasser,10,'water still available');
 assert.equal(s.w5n.wasserErlos,140,'first ten water purchases were real revenue');
 // Five genuine optional wage purchases return 70 ISK, still less than 490.
 good('pilotWaterBuy','pilot_eis',{menge:3});
 good('pilotWaterBuy','pilot_erz',{menge:2});
 assert.equal(paidBuyer(s),476,'five extra purchases cannot yet finance voyage');
 refuse('shipFreightIce','transport',{schiff:freighter.id});
 const buyerBefore=s.owners.st_nadir.cash;
 const ownerBefore=s.owners.pilot_eis.cash;
 good('pilotWaterBuy','pilot_eis',{menge:1});
 assert.equal(s.owners.pilot_eis.cash,ownerBefore-14,'private wage-funded buying');
 assert.equal(paidBuyer(s),buyerBefore+14,'money returned to the actual buyer station');
 assert.equal(paidBuyer(s),quote.gesamt,'threshold is reached by earned wages, not a subsidy');
 assert.equal(s.w5n.wasserVerbraucht,16);
 assert.equal(s.w5n.wasserErlos,224);
 assert.equal(s.stations.st_nadir.lager.wasser,4);
 assert.equal(s.owners.pilot_erz.cash,8);
 assert.equal(s.owners.pilot_eis.cash,8);
 const reopen=core.save(s),hash=core.hash(s);
 const clone=engine().core.loadW5(reopen);
 assert.equal(core.hash(clone),hash,'Rule195 roundtrip at exact finance gate');
 good('shipFreightIce','transport',{schiff:freighter.id});
 assert.equal(s.owners.w5n_fracht_kauf.cash,quote.gesamt,'genuine 490 ISK buyer escrow');
 assert.equal(s.owners.w5n_fracht_arbeit.cash,quote.arbeit,'genuine 120 ISK carrier escrow');
 minutes(60);minutes(60);
 assert.equal(s.tick,480);
 assert.equal(s.w5n.frachtAbgeschlossen,2);
 assert.equal(s.w5n.eisGeliefert,100);
 assert.deepEqual(s.w5ag.paid,{erz:120,eis:240});
 assert.equal(s.w5ag.payments.length,360);
 assert.equal(s.w5n.wasserVerbraucht,16);
 assert.equal(s.w5n.wasserErlos,224);
 const reopened=engine().core.loadW5(core.save(s));
 assert.equal(core.hash(reopened),core.hash(s),'save/load after financed flight');
 return {hash:core.hash(s),log,finalBuyer:paidBuyer(s),buyerEscrow:quote.gesamt,
  waterUnitsFromSecondBatch:6,revenues:224,spendingFromPilots:84};
}
for(const seed of [42,7]){
 test('W6a: voluntary consumption from two paid pilots unlocks a previously blocked second ice voyage, seed '+seed,()=>{
  const a=scenario(seed),b=scenario(seed);
  assert.deepEqual(a,b,'deterministic original Core across identical commands');
  console.log('W6A_REAL_WAGE_DEMAND '+JSON.stringify({seed,hash:a.hash,threshold:a.buyerEscrow,returnedViaWater:a.spendingFromPilots,waterRevenue:a.revenues,worldMoney:expectedWorldMoney,mint:0}));
 });
}
