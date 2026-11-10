import test from 'node:test';
import assert from 'node:assert/strict';
import Factory from '../prototypes/w5ac/rule191-w5-ferry-core.js';

const cash=s=>Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0);
const command=(c,s,r,type,owner,other={})=>c.execute(s,{type,owner,...other},r);
function audited(c,s) {
 const a=c.audit(s);
 assert.equal(a.ok,true,'audited complete original W0-W5 Rule195 at tick '+s.tick+': '+JSON.stringify(a));
 for(const k of ['w3','w4','w5','water','wageTrade','personal','replacement','w5transfer','vollkosten','goods','isk'])
   assert.equal(a[k]?.ok,true,k);
 assert.equal(cash(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.owners.fonds_transport.cash,0);
 assert.equal(s.w5ae.spent,0);
 for(const [key,owner] of [['erz','pilot_erz'],['eis','pilot_eis']]){
  const made=s.w5ag.paid[key];
  const spent=s.w5n.kaufDeals.filter(x=>x.owner===owner).reduce((n,x)=>n+x.betrag,0);
  assert.equal(s.owners[owner].cash+spent,made,owner+' entirely owned real wages');
  assert.equal(s.stats.konto[owner].erloes,made);
  assert.equal(s.stats.konto[owner].kosten,spent);
 }
 assert.equal(s.w5ag.paid.erz,s.w3.arbeitsKosten);
 assert.equal(s.w5ag.paid.eis,s.w5n.frachtLohn);
 const realWater=s.stations.st_nadir.lager.wasser;
 assert.equal(realWater+s.w5n.wasserVerbraucht,s.w5n.wasserProduziert);
 assert.equal(s.w5n.wasserVerbraucht,s.w5n.kaufDeals.reduce((n,x)=>n+x.menge,0));
 assert.equal(s.w5n.wasserErlos,s.w5n.kaufDeals.reduce((n,x)=>n+x.betrag,0));
 return a;
}
function fixture({carrierCash=2000,buyerCash=4000,seed=42}={}){
 const {core,rules}=Factory.createPrivateWageResearch({carrierCash,buyerCash});
 const s=core.createW5State(seed);
 const good=(type,owner,p={})=>{
  const r=command(core,s,rules,type,owner,p);
  assert.equal(r.ok,true,type+' : '+r.reason);
  audited(core,s);
  return r;
 };
 audited(core,s);
 good('shipBuy','transport',{klasse:'frachter',station:'st_aldera'});
 good('shipBuy','house',{klasse:'miner',station:'st_aldera'});
 const freighter=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter');
 const miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 good('shipMine','house',{schiff:miner.id,ware:'eis'});
 core.advance(s,50,rules);
 audited(core,s);
 assert.equal(s.stations.st_aldera.lager.eis,50);
 good('shipWait','house',{schiff:miner.id});
 assert.equal(s.stations.st_aldera.lager.erz>=50,true,'original NPC mining does create physical 50 ore');
 return {core,rules,s,freighter,miner,good};
}
function twoPilots(){
 const ctx=fixture(),{core,rules,s,freighter,good}=ctx;
 good('shipFreight','transport',{schiff:freighter.id});
 core.advance(s,120,rules);audited(core,s);
 assert.equal(s.tick,170);
 assert.equal(s.owners.pilot_erz.cash,120);
 assert.equal(s.owners.pilot_eis.cash,0);
 assert.equal(s.owners.fonds_transport.cash,0);
 assert.equal(s.w3.abgeschlossen,1);
 good('shipFreightIce','transport',{schiff:freighter.id});
 core.advance(s,60,rules);audited(core,s);
 assert.equal(s.owners.pilot_eis.cash,60);
 good('stationWater','st_nadir',{station:'st_nadir'});
 core.advance(s,20,rules);audited(core,s);
 assert.equal(s.tick,250);assert.equal(s.w5n.wasserProduziert,10);
 assert.equal(s.owners.pilot_eis.cash,80);
 assert.equal(s.owners.pilot_erz.cash,120);
 return ctx;
}
test('W5ag: private Rule195 only opt-in; Rule191/192/193/194 untouched and saves incompatible',()=>{
 assert.equal(Factory.rules.rulesVersion,191);
 assert.equal(Factory.createResearch({}).rules.rulesVersion,192);
 assert.equal(Factory.createWageResearch({}).rules.rulesVersion,193);
 assert.equal(Factory.createWaterResearch({}).rules.rulesVersion,194);
 const {core,rules}=Factory.createPrivateWageResearch({carrierCash:2000,buyerCash:4000});
 assert.equal(rules.rulesVersion,195);
 assert.deepEqual(rules.w5ag.pilots,{erz:'pilot_erz',eis:'pilot_eis'});
 const s=core.createW5State(42);audited(core,s);
 assert.equal(s.owners.pilot_erz.cash,0);assert.equal(s.owners.pilot_eis.cash,0);
 assert.throws(()=>Factory.createPrivateWageResearch({personalWages:false}));
 assert.throws(()=>Factory.createPrivateWageResearch({unapprovedGift:2000}));
 for(const r of [Factory.createWaterResearch({carrierCash:2000,buyerCash:4000}),
  Factory.createWageResearch({carrierCash:2000,buyerCash:4000})]){
  assert.throws(()=>r.core.loadW5(core.save(s)));
  assert.throws(()=>core.loadW5(r.core.save(r.core.createW5State(42))));
 }
 const h=core.hash(s);
 assert.equal(command(core,s,rules,'workerWaterBuy','fonds_transport',{menge:1}).ok,false);
 assert.equal(command(core,s,rules,'workerMaterialBuy','fonds_transport',{menge:1}).ok,false);
 assert.equal(command(core,s,rules,'pilotWaterBuy','pilot_erz',{menge:1}).ok,false);
 assert.equal(core.hash(s),h);
});
test('W5ag: actual W3 ore and W5n ice jobs pay two different real pilot owners, no pooled transfer',()=>{
 const {core,rules,s,freighter,good}=twoPilots();
 const a=audited(core,s);
 assert.equal(a.personal.earnedOre,120);
 assert.equal(a.personal.earnedIce,80);
 assert.equal(a.personal.paidMinutes,200);
 assert.equal(s.w5ag.payments[0].tick,51);
 assert.equal(s.w5ag.payments[0].owner,'pilot_erz');
 assert.equal(s.w5ag.payments[120].tick,171);
 assert.equal(s.w5ag.payments[120].owner,'pilot_eis');
 assert.equal(s.w5ag.iceContracts[0].start,170);
 assert.equal(s.w5ag.iceContracts[0].end,null);
 const h=core.hash(s),snap=core.save(s);
 assert.equal(core.hash(core.loadW5(snap)),h,'midflight private wage balances replay');
 for(const [owner,menge] of [['fonds_transport',1],['transport',1],['house',1],
  ['pilot_eis',6],['pilot_erz',9],['pilot_erz',0],['pilot_eis',1.5]]){
  const type=owner==='fonds_transport'?'workerWaterBuy':'pilotWaterBuy';
  assert.equal(command(core,s,rules,type,owner,{menge}).ok,false,type+' '+owner+' '+menge);
  assert.equal(core.hash(s),h);
 }
 good('pilotWaterBuy','pilot_erz',{menge:6});
 good('pilotWaterBuy','pilot_eis',{menge:4});
 audited(core,s);
 assert.equal(s.owners.pilot_erz.cash,36);
 assert.equal(s.owners.pilot_eis.cash,24);
 assert.equal(s.owners.fonds_transport.cash,0);
 assert.equal(s.owners.st_nadir.cash,2890);
 assert.equal(s.w5n.wasserVerbraucht,10);
 assert.equal(s.w5n.wasserErlos,140);
 assert.equal(s.stations.st_nadir.lager.wasser,0);
 const h250=core.hash(s);
 assert.equal(core.hash(core.loadW5(core.save(s))),h250);
 core.advance(s,40,rules);audited(core,s);
 assert.equal(s.tick,290);
 assert.equal(s.w5ag.paid.eis,120);
 assert.equal(s.owners.pilot_eis.cash,64);
 assert.equal(s.w5ag.iceContracts[0].end,290);
 assert.equal(s.w5ag.payments.length,240);
 assert.equal(s.owners.pilot_erz.cash,36);
 console.log('W5AG_TWO_REAL_PERSONAL_WAGES '+JSON.stringify({
  seed:42,tick:s.tick,hash:core.hash(s),w3OrePilotEarned:120,
  icePilotEarned:120,orePilotSpentWater:84,icePilotSpentWater:56,
  orePilotSaved:36,icePilotSaved:64,waterConsumed:10,sellerRevenue:140,
  noPooledSalary:0,worldISK:33000,mint:0}));
});
test('W5ag: one pilot cannot claim another pilot earning, or mint a timed wage by forging saves',()=>{
 const {core,rules,s}=twoPilots();
 const stable=core.save(s),hash=core.hash(s);
 const attacks=[
  x=>{x.rulesVersion=194;},
  x=>{x.owners.pilot_erz.cash+=10;x.owners.pilot_eis.cash-=10;},
  x=>{x.owners.pilot_eis.cash++;x.owners.transport.cash--;},
  x=>{x.owners.fonds_transport.cash++;x.owners.pilot_eis.cash--;},
  x=>{x.w5ag.paid.eis++;},
  x=>{x.w5ag.paid.erz++;},
  x=>{x.w5ag.payments[0].owner='pilot_eis';},
  x=>{x.w5ag.payments[0].tick=50;},
  x=>{x.w5ag.payments[0].isk=2;},
  x=>{x.w5ag.payments[0].schiff='sh999';},
  x=>{x.w5ag.payments.pop();},
  x=>{x.w5ag.payments.push(x.w5ag.payments[0]);},
  x=>{x.w5ag.iceContracts[0].start=171;},
  x=>{x.w5ag.iceContracts[0].schiff='sh999';},
  x=>{x.w5ag.iceContracts[0].end=250;},
  x=>{x.w5ag=null;},
  x=>{x.stats.konto.pilot_eis.erloes++;},
  x=>{x.owners.pilot_eis.kind='fund';},
  x=>{x.w5n.frachtLohn++;},
  x=>{x.w3.arbeitsKosten++;},
  x=>{x.w5n.wasserProduziert++;},
 ];
 for(const change of attacks){
  const fake=JSON.parse(stable);change(fake);
  assert.throws(()=>core.loadW5(JSON.stringify(fake)),
    'forged private salary/water/ownership must reject');
 }
 assert.equal(core.hash(s),hash,'failed detached imports never modify real state');
 assert.equal(core.hash(core.loadW5(stable)),hash);
});
test('W5ag: fraud in paid water provenance cannot hide in a balanced wallet cash transfer',()=>{
 const {core,rules,s,good}=twoPilots();
 good('pilotWaterBuy','pilot_erz',{menge:5});
 const stable=core.save(s),h=core.hash(s);
 const attacks=[
  x=>{x.w5n.kaufDeals[0].owner='pilot_eis';},
  x=>{x.w5n.kaufDeals[0].menge++;},
  x=>{x.w5n.kaufDeals[0].betrag++;},
  x=>{x.w5n.kaufDeals[0].tick=-1;},
  x=>{x.stats.konto.pilot_erz.kosten=0;},
  x=>{x.owners.pilot_erz.cash+=70;x.owners.st_nadir.cash-=70;},
  x=>{x.w5n.wasserVerbraucht++;x.stations.st_nadir.lager.wasser--;},
 ];
 for(const change of attacks){const fake=JSON.parse(stable);change(fake);
  assert.throws(()=>core.loadW5(JSON.stringify(fake))); }
 assert.equal(core.hash(s),h);
});
