import test from 'node:test';
import assert from 'node:assert/strict';
import Session from '../prototypes/w5ah/session.js';
import Factory from '../prototypes/w5ac/rule191-w5-ferry-core.js';
const ok=(out,why)=>assert.equal(out.ok,true,why+': '+out.reason);
function firstTwoBatches(options={}){
 const s=Session.create(options);
 ok(s.command('buy-freighter'),'first actual freighter');
 ok(s.command('buy-miner'),'real own miner');
 ok(s.command('mine-ice'),'first actual ice production');
 ok(s.advance(50),'first mine paid');ok(s.command('stop-miner'),'dock');
 ok(s.command('ore-freight'),'first W3 freight prepaid');
 ok(s.advance(120),'first ore pilot has worked 120');
 ok(s.command('ice-freight'),'first ice freight prepaid');
 ok(s.advance(60),'first ice arrival');
 ok(s.command('produce-water'),'first water work prepaid');
 ok(s.advance(20),'first water made');
 ok(s.command('ore-water',6),'ore pilot first purchase');
 ok(s.command('ice-water',4),'ice pilot first purchase');
 ok(s.advance(40),'first ice return');
 ok(s.command('produce-water'),'second water work prepaid');
 ok(s.advance(20),'second water made');
 ok(s.command('ore-water',2),'ore pilot second purchase');
 ok(s.command('ice-water',4),'ice pilot second purchase');
 assert.equal(s.snapshot().tick,310);
 assert.equal(s.snapshot().cash.pilot_eis,8);
 assert.equal(s.snapshot().waterNadir,4);
 return s;
}
function mineAgain(s){
 const started=s.snapshot();
 ok(s.command('mine-ice'),'fresh mine assignment, not invented supply');
 ok(s.advance(50),'second 50 actual paid mining minutes');
 ok(s.command('stop-miner'),'mine docked again');
 const end=s.snapshot(),raw=JSON.parse(s.export()),startRaw=JSON.parse(s.export());
 console.log('W5AI_SECOND_MINE_DIAGNOSTIC '+JSON.stringify({
  tick:end.tick,iceAldera:end.iceAldera,iceNadir:end.iceNadir,iceMined:raw.w5n.eisAbgebaut,
  iceSold:raw.w5n.mineVerkauft,ownerCash:end.cash.house,alderaCash:end.cash.st_aldera,
  miner:end.miner,ledger:raw.ledger.eis,events:end.events}));
 assert.equal(end.iceAldera,50,'a second physically mined batch exists');
 return started;
}
function genuineSecondPayroll(s,{buy=true}={}){
 mineAgain(s);
 const before=JSON.parse(s.export()),cashBefore=s.snapshot();
 assert.equal(cashBefore.cash.pilot_eis,8);
 ok(s.command('ice-freight'),'fresh W5n contract prepaid');
 const escrow=JSON.parse(s.export());
 assert.equal(escrow.w5n.frachtBeauftragt,2);
 assert.equal(escrow.w5ag.iceContracts.length,2);
 assert.equal(escrow.w5ag.iceContracts[1].end,null);
 assert.equal(escrow.owners.w5n_fracht_kauf.cash,490);
 assert.equal(escrow.owners.w5n_fracht_arbeit.cash,120);
 assert.equal(escrow.owners.st_nadir.cash,before.owners.st_nadir.cash-490);
 assert.equal(escrow.owners.transport.cash,before.owners.transport.cash-120);
 assert.equal(escrow.owners.pilot_eis.cash,before.owners.pilot_eis.cash,'no salary at contract creation');
 ok(s.advance(60),'second real outbound 60-min flight');
 assert.equal(s.snapshot().tick,420);
 assert.equal(s.snapshot().iceDelivered,100);
 assert.equal(s.snapshot().cash.pilot_eis,68,'wages only from 60 actual new flight minutes');
 if(buy)ok(s.command('ice-water',4),'second-flight wages pay for 4 existing water');
 ok(s.command('produce-water'),'third true financed water batch');
 ok(s.advance(20),'third factory pays 20 extra labor minutes');
 if(buy)ok(s.command('ice-water',2),'new inbound flight wages buy 2 more water');
 ok(s.advance(40),'second real ice return fully compensated');
 if(buy)ok(s.command('ice-water',3),'second outbound+return wages finance another 3 water');
 return s.snapshot();
}
test('W5ai: fresh ice mined, second fully escrowed original flight, 120 *new* pilot wages, further private purchases',()=>{
 const session=firstTwoBatches(),result=genuineSecondPayroll(session);
 assert.equal(result.tick,480);
 assert.equal(result.oreTrips,1);assert.equal(result.iceTrips,2);
 assert.equal(result.iceContracts,2);assert.equal(result.iceActive,false);
 assert.equal(result.paidMinutes,360);
 assert.equal(result.wages.erz,120);assert.equal(result.wages.eis,240);
 assert.equal(result.cash.pilot_erz,8);assert.equal(result.cash.pilot_eis,2);
 assert.equal(result.bought.eis.menge,17);assert.equal(result.bought.eis.isk,238);
 assert.equal(result.bought.erz.menge,8);assert.equal(result.bought.erz.isk,112);
 assert.equal(result.made,30);assert.equal(result.consumed,25);
 assert.equal(result.waterNadir,5);assert.equal(result.iceDelivered,100);
 assert.equal(result.waterSales,350);
 assert.equal(result.worldCash,33000);assert.equal(result.minted,0);assert.equal(result.auditOk,true);
 const raw=JSON.parse(session.export());
 assert.equal(raw.w5ag.iceContracts[1].start,360);
 assert.equal(raw.w5ag.iceContracts[1].end,480);
 assert.equal(raw.w5ag.payments.length,360);
 assert.equal(raw.w5ag.payments.filter(x=>x.kind==='eis'&&x.tick>360).length,120);
 assert.equal(raw.w5n.frachtAbgeschlossen,2);
 const clone=Session.create();ok(clone.import(session.export()),'Rule195 save and load');
 assert.deepEqual(clone.snapshot(),result);
 console.log('W5AI_SECOND_REAL_PAYROLL '+JSON.stringify({tick:result.tick,hash:result.hash,
   iceFlights:result.iceTrips,privatePaidMinutes:result.paidMinutes,newIceWages:120,
   waterMade:result.made,waterActuallyBought:result.consumed,waterRevenue:result.waterSales,
   savedIcePilot:result.cash.pilot_eis,mint:result.minted,worldISK:result.worldCash}));
});
test('W5ai: explicit saving still allowed; second legitimate flight cannot force buying',()=>{
 const s=firstTwoBatches(),v=genuineSecondPayroll(s,{buy:false});
 assert.equal(v.wages.eis,240);
 assert.equal(v.cash.pilot_eis,128,'all 120 newly earned ISK remain owned by pilot');
 assert.equal(v.consumed,16);assert.equal(v.made,30);assert.equal(v.waterNadir,14);
 assert.equal(v.waterSales,224);
 assert.equal(v.worldCash,33000);assert.equal(v.minted,0);
});
test('W5ai: no second company-paid flight when Nadir only has 454 ISK of required 490',()=>{
 const s=firstTwoBatches({buyerCash:1500});
 mineAgain(s);
 const state=JSON.parse(s.export());
 assert.equal(state.owners.st_nadir.cash,454);
 assert.equal(s.command('ice-freight').ok,false,'buyer cannot afford escrow');
 assert.equal(s.snapshot().hash,Factory.createPrivateWageResearch({carrierCash:2000,buyerCash:1500}).core.hash(state));
 assert.equal(s.snapshot().cash.pilot_eis,8);
 assert.equal(s.snapshot().iceTrips,1);
 assert.equal(s.snapshot().iceAldera,50,'real goods remain unsold, no phantom trip');
 assert.equal(s.snapshot().minted,0);
});
test('W5ai: replay after second wage and 90-day idle crisis; forged private receipts rejected',()=>{
 const s=firstTwoBatches();genuineSecondPayroll(s);
 const raw=JSON.parse(s.export()),save=s.export();
 const clone=Session.create();ok(clone.import(save),'full independent reload');
 const c=Factory.createPrivateWageResearch({carrierCash:2000,buyerCash:4000});
 const world=c.core.loadW5(save),mirror=c.core.loadW5(save);
 for(const tamper of [
   x=>{x.w5ag.iceContracts[1].start++;},
   x=>{x.w5ag.payments[250].owner='pilot_erz';},
   x=>{x.owners.pilot_eis.cash++;x.owners.transport.cash--;},
   x=>{x.w5n.wasserVerbraucht++;}
 ]){
  const forged=structuredClone(raw);tamper(forged);
  assert.throws(()=>clone.import(JSON.stringify(forged)));
  assert.equal(clone.snapshot().hash,s.snapshot().hash);
 }
 for(let day=1;day<=90;day++){
  c.core.advance(world,1440,c.rules);
  c.core.advance(mirror,1440,c.rules);
  const a=c.core.audit(world);
  assert.equal(a.ok,true,'all audited at day '+day);
  assert.equal(a.personal.ok,true);
  assert.equal(a.water.ok,true);
  assert.equal(c.core.hash(world),c.core.hash(mirror));
  if(day===30||day===90)
   assert.equal(c.core.hash(c.core.loadW5(c.core.save(world))),c.core.hash(world));
 }
 assert.equal(world.minted,0);
 assert.equal(Object.values(world.owners).reduce((sum,x)=>sum+x.cash,0),33000);
 assert.equal(world.w5n.wasserVerbraucht,25,'no automatic future consumption');
});
