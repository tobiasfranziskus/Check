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
 const held=Object.values(state.owners).filter(x=>x.id.startsWith('erz_treuhand_'))
  .reduce((sum,x)=>sum+x.cash,0);
 const active=Object.entries(state.erzpilotVertraege||{}).map(([ship,c])=>({
  ship,materialCash:state.owners[c.konto]?.cash||0,
  workCash:state.owners[c.arbeitsKonto]?.cash||0,quantity:c.menge}));
 const tracked=Object.fromEntries(accounts.filter(id=>state.owners[id])
  .map(id=>[id,state.owners[id].cash]));
 const miners=Object.values(state.ships).filter(x=>x.owner==='house'&&x.klasse==='miner');
 const st=state.stats.konto;
 return {label,tick:state.tick,hash:snap.hash,
  cash:tracked,
  aldera:{cash:tracked.st_aldera,erz:s.lager.erz,eis:s.lager.eis,
   erloese:ledger.erloes,kosten:ledger.kosten,
   ownersCashBridge:1000+ledger.erloes-ledger.kosten,
   sourceErzEscrow:held,liveOreContracts:active,
   cashPlusErzEscrow:tracked.st_aldera+held,
   financeBridgeDelta:tracked.st_aldera+held-1000-ledger.erloes+ledger.kosten},
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
function run(seed,buyerCash){
 const app=Session.create({seed,buyerCash,carrierCash:2000}),rows=[];
 const observe=label=>{const p=phase(app,label);rows.push(p);
  assert.equal(p.auditOk,true);assert.equal(p.worldCash,33000);
  assert.equal(p.mint,0);
  assert.equal(p.aldera.financeBridgeDelta,0,
   'Original-CashBridge: starting ISK + real booked sales - expenses = free ISK + held ore-buyer escrow');
  return p;};
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
 return {rows,app};
}
function probeRealEscrowUnlock(app){
 const start=phase(app,'beforeWaiting'),initialWages=app.snapshot().wages.eis;
 const windows=[],beforeCash=start.aldera.cash,beforeEscrow=start.aldera.sourceErzEscrow;
 assert.equal(beforeCash,0);assert.ok(beforeEscrow>=250,
   'capital reserved for W1 ore production, rather than vanished from the world');
 let soldTick=null,reason=null,afterSaleCash=null;
 for(let i=0;i<48;i++){
  const snap=app.snapshot();
  if(snap.cash.st_aldera>=250){
   const beforeSale=phase(app,'beforeDelayedSale'),saved=app.snapshot().hash;
   const sold=app.command('sell-ice');
   if(sold.ok){
    soldTick=app.snapshot().tick;afterSaleCash=beforeSale.aldera.cash-250;
    assert.equal(app.snapshot().iceAldera,50,
     'only physically loaded owned ice can be sold to a solvent source station');
    break;
   }
   reason=sold.reason;
   assert.equal(app.snapshot().hash,saved,'failed sale does not touch original state');
  }
  must(app.advance(10),'ten actual Core minutes, never imaginary income');
  if(i%6===5){
   const state=phase(app,'afterWait'+((i+1)*10));
   assert.equal(state.aldera.financeBridgeDelta,0);
   windows.push({tick:state.tick,cash:state.aldera.cash,
    oreEscrow:state.aldera.sourceErzEscrow,
    activeContracts:state.aldera.liveOreContracts.length,boughtIce:state.ice.sold});
  }
 }
 const now=phase(app,'afterWaitWindow');
 assert.equal(now.worldCash,33000);assert.equal(now.mint,0);
 assert.equal(soldTick,600,'W1 work releases exactly the 1,000 reserved ISK by tick600');
 assert.equal(afterSaleCash,750,'real 50 ice costs Aldera 250 ISK at historical fixed Core price');
 assert.equal(app.snapshot().wages.eis,initialWages,
  'waiting may process NPC work but cannot pay a private ice-flight pilot');
 if(soldTick!==null){
  assert.ok(now.ice.sold>=150);
  const before=app.snapshot(),flight=app.command('ice-freight');
  assert.equal(flight.ok,true,'third Nadir 490 and carrier 120 ISK must be truly prefinanced: '+flight.reason);
  must(app.advance(120),'third fully paid original flight after a real ice purchase');
  assert.equal(app.snapshot().wages.eis,before.wages.eis+120);
  assert.equal(app.snapshot().iceTrips,before.iceTrips+1);
  assert.equal(app.snapshot().minted,0);
 }
 const end=phase(app,'endOfWaitProbe');
 console.log('W5AJB_REAL_ESCROW_WAIT '+JSON.stringify({
  from:start.tick,to:end.tick,originalFree:beforeCash,originalOreEscrow:beforeEscrow,
  windows,soldTick,afterSaleCash,afterIceSold:end.ice.sold,
  afterIceDelivered:end.ice.delivered,afterFlights:app.snapshot().iceTrips,
  endFree:end.aldera.cash,endEscrow:end.aldera.sourceErzEscrow,
  endNadir:end.cash.st_nadir,reason,worldISK:end.worldCash,mint:end.mint}));
}

for(const {seed,buyerCash} of [{seed:42,buyerCash:4000},{seed:7,buyerCash:2000}]){
 test('W5aj-b original cash bridge and stranded third real ice cargo, seed '+seed,()=>{
  const {rows}=run(seed,buyerCash);
  assert.equal(rows.length,12);
  assert.equal(rows.at(-1).aldera.sourceErzEscrow,1000,
    'Station has a live W1 buyer escrow; money not lost or emitted');
  assert.equal(rows.at(-1).aldera.cash,0);
 });
}

test('W5aj-b: 50-minute genuine W1 escrow release finances third ice trip, seed42',()=>{
 const {app}=run(42,4000);
 probeRealEscrowUnlock(app);
});
test('W5aj-b: same genuine escrow release also enables 3rd full ice trip at lower Nadir budget, seed7',()=>{
 const {app}=run(7,2000);
 probeRealEscrowUnlock(app);
});
