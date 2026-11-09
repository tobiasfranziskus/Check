import test from 'node:test';
import assert from 'node:assert/strict';
import Session from '../prototypes/w5ah/session.js';
import Original from '../prototypes/w5ac/rule191-w5-ferry-core.js';

/**
 * W5aj-b: ORIGINAL RULE195 RESEARCH. No price or cash intervention.
 * All cash/goods changes happen solely through the one original Core.
 * Phase snapshots expose exactly which existing jobs drain Aldera's treasury.
 */
const must=(r,what)=>assert.equal(r.ok,true,what+': '+r.reason);
const accounts=['st_aldera','st_nadir','house','npc3','transport','fonds_aldera','pilot_eis','pilot_erz','export'];
function phase(app,label){
 const state=JSON.parse(app.export()),snap=app.snapshot();
 const s=state.stations.st_aldera,ledger=state.stats.konto.st_aldera;
 const tracked=Object.fromEntries(accounts.filter(id=>state.owners[id])
  .map(id=>[id,state.owners[id].cash]));
 const miners=Object.values(state.ships).filter(x=>x.owner==='house'&&x.klasse==='miner');
 const st=state.stats.konto;
 return {label,tick:state.tick,hash:snap.hash,
  cash:tracked,
  aldera:{cash:tracked.st_aldera,erz:s.lager.erz,eis:s.lager.eis,
   erloese:ledger.erloes,kosten:ledger.kosten,
   ownersCashBridge:1000+ledger.erloes-ledger.kosten},
  ice:{mined:state.w5n.eisAbgebaut,sold:state.w5n.mineVerkauft,
   sourceSaleNominal:state.w5n.mineVerkaufWert,
   delivered:state.w5n.eisGeliefert,sourceRevenue:state.w5n.eisTransferWert},
  ore:{stationCost:st.st_aldera.kosten,
   ownerRevenue:st.house.erloes,npcRevenue:st.npc3.erloes,
   delivered:state.w3.geliefert,freightPurchases:state.w3.kaufAusgaben},
  shipIce:miners.reduce((n,x)=>n+(x.ladung.eis||0),0),
  water:{produced:state.w5n.wasserProduziert,consumed:state.w5n.wasserVerbraucht},
  auditOk:snap.auditOk,worldCash:snap.worldCash,mint:snap.minted};
}
function drill(seed,buyerCash){
 const app=Session.create({seed,buyerCash,carrierCash:2000}),records=[];
 const see=name=>{const p=phase(app,name);records.push(p);
  assert.equal(p.auditOk,true,name+' failed original audit');
  assert.equal(p.worldCash,33000,name+' minted or lost money');
  assert.equal(p.mint,0,name+' nonzero mint');
  return p;};
 const buy=(code,label)=>must(app.command(code),label);
 const advance=(n,label)=>must(app.advance(n),label);
 const origin=see('origin');
 buy('buy-freighter','paid transport ship');buy('buy-miner','paid miner');
 see('hullsBought');
 buy('mine-ice','first real 50 ice');advance(50,'50 paid mining minutes');
 buy('stop-miner','stop first miner');see('afterFirstIceMining');
 buy('ore-freight','first paid 120-minute W3 flight');
 advance(120,'first ore flight');see('afterOreFlight');
 buy('ice-freight','first paid W5n ice flight');
 advance(60,'first arrival');see('afterFirstIceDelivery');
 buy('produce-water','first water batch');
 advance(20,'first factory');buy('ore-water',undefined);
 // The initial own-water purchases follow W5aj exactly.
 // The next blocks intentionally use explicit integer amounts.
 return {app,see,records,origin,buy,advance};
}
function run(seed,buyerCash){
 const app=Session.create({seed,buyerCash,carrierCash:2000}),rows=[];
 const observe=label=>{const p=phase(app,label);rows.push(p);
  assert.equal(p.auditOk,true);assert.equal(p.worldCash,33000);
  assert.equal(p.mint,0);return p;};
 const cmd=(action,why,amount)=>must(app.command(action,amount),why);
 const tick=(n,why)=>must(app.advance(n),why);
 observe('start');
 cmd('buy-freighter','financed transport ship');
 cmd('buy-miner','financed miner');observe('afterHullPurchases');
 cmd('mine-ice','initial mining');tick(50,'initial ice from real work');
 cmd('stop-miner','initial mining stop');observe('afterInitialIceMining');
 cmd('ore-freight','full ore flight');tick(120,'ore flight 120');
 observe('afterOreFreight');
 cmd('ice-freight','first ice flight');tick(60,'first ice arrival');
 observe('firstIceDelivery');
 cmd('produce-water','first factory');tick(20,'20 work minutes');
 cmd('ore-water','ore household buys 6',6);
 cmd('ice-water','ice household buys 4',4);
 tick(40,'first ice return');
 cmd('produce-water','second real factory');tick(20,'20 work minutes');
 cmd('ore-water','ore household buys 2',2);
 cmd('ice-water','ice household buys 4',4);
 observe('endW5ah');
 cmd('mine-ice','second real mining');tick(50,'second mining 50');
 cmd('stop-miner','second miner stop');
 observe('afterSecondIceMining');
 const raw=JSON.parse(app.export()),miner=Object.values(raw.ships)
  .find(s=>s.owner==='house'&&s.klasse==='miner');
 if(miner.ladung.eis===50)cmd('sell-ice','explicit, fully paid second ice sale');
 observe('afterSecondSourcePurchase');
 cmd('ice-freight','second full prepaid ice freight');
 tick(120,'second 120 minute flight');observe('afterSecondIceFreight');
 cmd('produce-water','third factory');tick(20,'third factory work minutes');
 cmd('ice-water','voluntary purchase 8 from earned wages',8);
 observe('afterThirdWaterFactoryAndPurchase');
 cmd('mine-ice','third real mining');
 tick(50,'third physically mined ice');
 cmd('stop-miner','third miner stopped');
 const before=observe('thirdUnsoldIceOnMiner');
 assert.equal(before.shipIce,50);
 assert.equal(before.aldera.cash,0);
 assert.ok(before.cash.st_nadir>490,'distant buyer can afford goods but not source owner');
 const hash=before.hash,st=JSON.parse(app.export());
 const refused=app.command('sell-ice');
 assert.equal(refused.ok,false,'zero-ISK Aldera must reject actual 50-ice purchase');
 assert.equal(app.snapshot().hash,hash,'denied purchase must be atomic');
 assert.equal(JSON.parse(app.export()).ships[miner.id].ladung.eis,50);
 const result=observe('rejectedThirdSourcePurchase');
 assert.deepEqual(result,before?{...before,label:'rejectedThirdSourcePurchase'}:result);
 assert.equal(st.owners.st_aldera.cash,0);
 assert.equal(result.ice.sold,100);
 assert.equal(result.ice.mined,150);
 assert.equal(result.ice.delivered,100);
 const engine=Original.createPrivateWageResearch({buyerCash,carrierCash:2000});
 assert.equal(engine.core.hash(engine.core.loadW5(app.export())),result.hash);
 console.log('W5AJB_STATION_CASH_TRACE '+JSON.stringify({seed,buyerCash,
  lines:rows,refused:refused.reason}));
 return rows;
}
for(const {seed,buyerCash} of [{seed:42,buyerCash:4000},{seed:7,buyerCash:2000}]){
 test('W5aj-b original cash bridge and stranded third real ice cargo, seed '+seed,()=>{
  const rows=run(seed,buyerCash);
  assert.equal(rows.length,14);
 });
}
