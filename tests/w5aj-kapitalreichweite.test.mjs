import test from 'node:test';
import assert from 'node:assert/strict';
import Session from '../prototypes/w5ah/session.js';

/*
 * W5aj ANALYSE only. This is a manual experiment scheduler, NOT a second
 * economic core, NPC autopilot, game command or production decision.
 * Every minute, item, escrow, wallet and receipt is original Rule195.
 */
const ok=(r,label)=>assert.equal(r.ok,true,label+': '+r.reason);
const denied=(s,fn,label)=>{
 const before=s.snapshot().hash,reply=fn();
 assert.equal(reply.ok,false,label+' unexpectedly financed');
 assert.equal(s.snapshot().hash,before,'a blocked action may not change the world');
 return reply.reason;
};
function setup(seed=42,buyerCash=4000,carrierCash=2000){
 const s=Session.create({seed,buyerCash,carrierCash});
 ok(s.command('buy-freighter'),'real transport hull');
 ok(s.command('buy-miner'),'real player miner');
 ok(s.command('mine-ice'),'first mine');
 ok(s.advance(50),'first ice mining cost');
 ok(s.command('stop-miner'),'first miner stop');
 ok(s.command('ore-freight'),'prepaid ore roundtrip');
 ok(s.advance(120),'first ore roundtrip');
 ok(s.command('ice-freight'),'first prepaid 50-ice freight');
 ok(s.advance(60),'ice delivery 1');
 ok(s.command('produce-water'),'water batch 1');
 ok(s.advance(20),'water production 1');
 ok(s.command('ore-water',6),'ore pilot voluntary purchase 6');
 ok(s.command('ice-water',4),'ice pilot voluntary purchase 4');
 ok(s.advance(40),'first ice roundtrip complete');
 ok(s.command('produce-water'),'water batch 2');
 ok(s.advance(20),'water production 2');
 ok(s.command('ore-water',2),'ore pilot voluntary purchase 2');
 ok(s.command('ice-water',4),'ice pilot voluntary purchase 4');
 const a=s.snapshot();
 assert.equal(a.tick,310);
 assert.equal(a.iceTrips,1);
 assert.equal(a.worldCash,33000);
 assert.equal(a.minted,0);
 assert.equal(a.auditOk,true);
 return s;
}
function newIceCargo(s){
 const start=JSON.parse(s.export()),before=s.snapshot();
 const active=Object.values(start.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert.ok(active,'no fake replacement miner');
 if((active.ladung.eis||0)>0)return {ok:false,at:'existingMinerCargo',reason:'Unsold real ice belongs to miner'};
 const begin=s.command('mine-ice');
 if(!begin.ok)return {ok:false,at:'mineCommand',reason:begin.reason};
 ok(s.advance(50),'50 actually paid mining minutes');
 ok(s.command('stop-miner'),'miner paused');
 const state=JSON.parse(s.export());
 const miner=Object.values(state.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 const aboard=miner?.ladung.eis||0;
 const stock=s.snapshot().iceAldera;
 assert.equal(state.w5n.eisAbgebaut,start.w5n.eisAbgebaut+50,
   'real 50-unit additional ice physically mined');
 assert.equal((aboard+stock)-(before.iceAldera),50,
   'the additional mined ice is accounted for on-board or at origin');
 if(aboard){
  const sale=s.command('sell-ice');
  if(!sale.ok)return {ok:false,at:'sourcePurchase',reason:sale.reason};
 }
 assert.equal(s.snapshot().iceAldera>=before.iceAldera+50,true,
   'Aldera must actually purchase an additional original 50-piece batch');
 return {ok:true};
}
function cycle(s,policy){
 const mined=newIceCargo(s);if(!mined.ok)return mined;
 const before=JSON.parse(s.export()),old=s.snapshot();
 const started=s.command('ice-freight');
 if(!started.ok)return {ok:false,at:'iceFreightPrepayment',reason:started.reason};
 const reserved=JSON.parse(s.export());
 assert.equal(reserved.owners.w5n_fracht_kauf.cash,490,'buyer must reserve 250 ice + 240 freight');
 assert.equal(reserved.owners.w5n_fracht_arbeit.cash,120,'carrier reserves 120 real working minutes');
 assert.equal(reserved.owners.st_nadir.cash,before.owners.st_nadir.cash-490);
 assert.equal(reserved.owners.transport.cash,before.owners.transport.cash-120);
 assert.equal(reserved.owners.pilot_eis.cash,before.owners.pilot_eis.cash,'no salary before actual work');
 ok(s.advance(120),'two paid 60-minute original flights');
 const paid=s.snapshot();
 assert.equal(paid.wages.eis,old.wages.eis+120,'no salary from unused or invented time');
 assert.equal(paid.iceTrips,old.iceTrips+1);
 let factories=0,factoryBlock=null;
 for(let i=0;i<policy.factoryBatches;i++){
  const result=s.command('produce-water');
  if(!result.ok){factoryBlock=result.reason;break;}
  ok(s.advance(20),'20 prepaid physical water-factory minutes');
  factories++;
 }
 let purchase=0,shoppingBlock=null;
 if(policy.buyWater>0){
  // No consumption is automatic: this is a voluntary, explicitly authored
  // intent of the experiment. Never borrow from another wallet.
  const amount=Math.min(policy.buyWater,Math.floor(s.snapshot().cash.pilot_eis/14),
    s.snapshot().waterNadir);
  if(amount>0){
   const result=s.command('ice-water',amount);
   if(result.ok)purchase=amount;else shoppingBlock=result.reason;
  }else shoppingBlock='No personal cash or produced stock for the intended voluntary buy';
 }
 const after=s.snapshot();
 assert.equal(after.worldCash,33000);
 assert.equal(after.minted,0);
 assert.equal(after.auditOk,true);
 return {ok:true,work:120,factories,purchase,
  factoryBlock,shoppingBlock};
}
const policies=[
 {name:'save',factoryBatches:1,buyWater:0},
 {name:'small-buy',factoryBatches:1,buyWater:4},
 {name:'paid-buy',factoryBatches:1,buyWater:8},
 {name:'produce-2',factoryBatches:2,buyWater:8},
 {name:'produce-5',factoryBatches:5,buyWater:8}
];
const regimes=[
 {seed:42,buyerCash:4000,carrierCash:2000,policy:2},
 {seed:7,buyerCash:2000,carrierCash:2000,policy:2},
 {seed:1,buyerCash:2400,carrierCash:2100,policy:0},
 {seed:2,buyerCash:2700,carrierCash:1900,policy:1},
 {seed:3,buyerCash:3000,carrierCash:2300,policy:4},
 {seed:4,buyerCash:3300,carrierCash:1800,policy:3},
 {seed:5,buyerCash:3600,carrierCash:2200,policy:2},
 {seed:6,buyerCash:3900,carrierCash:1700,policy:1},
 {seed:8,buyerCash:4200,carrierCash:2100,policy:4},
 {seed:9,buyerCash:4400,carrierCash:2000,policy:0},
 {seed:10,buyerCash:2800,carrierCash:2400,policy:3},
 {seed:11,buyerCash:2200,carrierCash:1850,policy:1},
 {seed:12,buyerCash:3500,carrierCash:1950,policy:2}
];
function inspect(s){
 const view=s.snapshot(),state=JSON.parse(s.export());
 const b={};for(const id of ['st_nadir','st_aldera','transport','house','pilot_eis','pilot_erz'])
  b[id]=state.owners[id].cash;
 assert.equal(Object.values(state.owners).reduce((acc,o)=>acc+o.cash,0),33000);
 assert.equal(state.w5ag.paid.eis,state.w5n.frachtLohn,'real paid flight wage receipts');
 assert.equal(state.w5ag.payments.filter(x=>x.kind==='eis').length,state.w5n.frachtLohn);
 assert.equal(b.pilot_eis+state.w5n.kaufDeals.filter(x=>x.owner==='pilot_eis')
  .reduce((acc,x)=>acc+x.betrag,0),state.w5ag.paid.eis);
 assert.equal(view.minted,0);
 assert.equal(view.auditOk,true);
 return {tick:view.tick,hash:view.hash,flights:view.iceTrips,
  sourceIce:view.iceAldera,destinationIce:view.iceNadir,water:view.waterNadir,
  produced:view.made,paidWater:view.consumed,waterRevenue:view.waterSales,
  wages:view.wages.eis,cash:b};
}
test('W5aj: 13 economic regimes x 90 real idle days, atomic finance/warehouse gates and independently audited cash reach',()=>{
 const results=[];
 for(const reg of regimes){
  const policy=policies[reg.policy],s=setup(reg.seed,reg.buyerCash,reg.carrierCash);
  const cycles=[],limit=12;let blocking=null;
  for(let n=0;n<limit;n++){
   const result=cycle(s,policy);
   if(!result.ok){blocking=result;break;}
   cycles.push(result);
  }
  assert.ok(blocking||cycles.length===limit,'no unexplained loop exit');
  const before=inspect(s),saved=s.export();
  const replay=Session.create({seed:reg.seed,buyerCash:reg.buyerCash,carrierCash:reg.carrierCash});
  ok(replay.import(saved),'audit and reload research snapshot');
  assert.equal(replay.snapshot().hash,before.hash);
  for(let day=1;day<=90;day++){
   ok(s.advance(1440),'90-day real core idle day '+day);
   if(day===30||day===90){
    const mid=inspect(s),copy=Session.create({seed:reg.seed,
      buyerCash:reg.buyerCash,carrierCash:reg.carrierCash});
    ok(copy.import(s.export()),'30/90-day roundtrip with original audit');
    assert.equal(copy.snapshot().hash,mid.hash);
    assert.equal(mid.paidWater,before.paidWater,
      'saving and stopping must not silently trigger private water consumption');
    assert.equal(mid.wages,before.wages,
      'no further pilot salary without a genuinely financed flight');
   }
  }
  const after=inspect(s);
  assert.equal(after.paidWater,before.paidWater);
  results.push({seed:reg.seed,buyerCash:reg.buyerCash,carrierCash:reg.carrierCash,
   policy:policy.name,extraIceFlights:cycles.length,
   extraWaterWork:cycles.reduce((a,c)=>a+c.factories,0),
   extraVoluntaryBuy:cycles.reduce((a,c)=>a+c.purchase,0),
   blocker:blocking,firstFactoryBlock:cycles.find(x=>x.factoryBlock)?.factoryBlock||null,
   pre90:before,day90:{hash:after.hash,cash:after.cash}});
 }
 assert.equal(results.length,13);
 assert.ok(results.some(x=>x.blocker),'must show a real finite gate rather than inventing rescue');
 assert.ok(results.some(x=>x.extraIceFlights>=1),'at least one genuine further paid flight');
 assert.ok(results.some(x=>x.extraVoluntaryBuy===0),'non-consumption must be allowed');
 console.log('W5AJ_REAL_FINANCE_13X90 '+JSON.stringify(results));
});
test('W5aj: low Nadir liquidity 454 < 490 cannot produce a second shipment, 365-day saving crisis cannot create money',()=>{
 const s=setup(42,1500,2000);
 assert.equal(s.snapshot().cash.st_nadir,454);
 const source=newIceCargo(s);
 assert.equal(source.ok,true,'Aldera actually pays for new physical ice');
 const before=inspect(s);
 const reason=denied(s,()=>s.command('ice-freight'),'underfunded 490-ISK buyer contract');
 assert.match(reason,/Nadir|bezahlen|Geld|Kasse|Kapital|finanzieren/i);
 const stranded=inspect(s);
 assert.equal(stranded.sourceIce,50);
 assert.equal(stranded.flights,1);
 assert.equal(stranded.wages,120);
 for(let day=1;day<=365;day++){
  ok(s.advance(1440),'365 real idle audit days');
  if(day%30===0||day===365){
   const data=inspect(s);assert.equal(data.paidWater,before.paidWater);
   assert.equal(data.wages,before.wages);
  }
 }
 console.log('W5AJ_365D_FINANCE_BLOCK '+JSON.stringify({
  reason,tick:s.snapshot().tick,hash:s.snapshot().hash,
  blockedBuyerISK:454,minimumISK:490,
  privateIceSalary:s.snapshot().wages.eis,
  minted:s.snapshot().minted,worldISK:s.snapshot().worldCash
 }));
});
