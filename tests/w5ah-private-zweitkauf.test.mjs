import test from 'node:test';
import assert from 'node:assert/strict';
import Session from '../prototypes/w5ah/session.js';
import Factory from '../prototypes/w5ac/rule191-w5-ferry-core.js';
function ok(result,label){assert.equal(result.ok,true,label+': '+result.reason);}
function example(){
 const app=Session.create();
 ok(app.command('buy-freighter'),'buy freighter');ok(app.command('buy-miner'),'buy miner');
 ok(app.command('mine-ice'),'mine ice');ok(app.advance(50),'50 worked');
 ok(app.command('stop-miner'),'mine stop');
 ok(app.command('ore-freight'),'ore freight');ok(app.advance(120),'ore round trip');
 ok(app.command('ice-freight'),'ice freight');ok(app.advance(60),'ice arrival');
 ok(app.command('produce-water'),'first real water');
 ok(app.advance(20),'first paid production');return app;
}
test('W5ah: unchanged Rule195, two genuinely paid voluntary buyers and a second real funded water batch',()=>{
 assert.equal(Factory.rules.rulesVersion,191);
 assert.equal(Factory.createPrivateWageResearch().rules.rulesVersion,195);
 const app=example(),first=app.snapshot();
 assert.equal(first.tick,250);assert.equal(first.wages.erz,120);assert.equal(first.wages.eis,80);
 assert.equal(first.made,10);assert.equal(first.iceNadir,40);
 ok(app.command('ore-water',6),'ore pilot pays 84');
 ok(app.command('ice-water',4),'ice pilot pays 56');
 ok(app.advance(40),'ice return paid');
 const before=app.snapshot();
 assert.equal(before.tick,290);assert.equal(before.cash.pilot_erz,36);assert.equal(before.cash.pilot_eis,64);
 assert.equal(before.waterNadir,0);assert.equal(before.consumed,10);
 ok(app.command('produce-water'),'second real water funded by Nadir');
 ok(app.advance(20),'second original Core workshop');
 assert.equal(app.snapshot().waterNadir,10);
 ok(app.command('ore-water',2),'second earned ore-pilot purchase');
 ok(app.command('ice-water',4),'second earned ice-pilot purchase');
 const final=app.snapshot();
 assert.equal(final.tick,310);assert.equal(final.waterWorks,2);
 assert.equal(final.made,20);assert.equal(final.consumed,16);assert.equal(final.waterNadir,4);
 assert.equal(final.cash.pilot_erz,8);assert.equal(final.cash.pilot_eis,8);
 assert.equal(final.bought.erz.menge,8);assert.equal(final.bought.erz.isk,112);
 assert.equal(final.bought.eis.menge,8);assert.equal(final.bought.eis.isk,112);
 assert.equal(final.waterSales,224);assert.equal(final.cash.fonds_transport,0);
 assert.equal(final.minted,0);assert.equal(final.worldCash,33000);
 assert.equal(final.auditOk,true);
 const data=app.export();const copy=Session.create();
 ok(copy.import(data),'load');assert.deepEqual(copy.snapshot(),final);
 ok(app.advance(30),'advance independent');assert.deepEqual(copy.snapshot(),final);
 console.log('W5AH_SECOND_PRIVATE_DEMAND '+JSON.stringify({tick:final.tick,hash:final.hash,
  batches:final.waterWorks,paidWater:final.consumed,waterUnsold:final.waterNadir,
  orePilotSaved:final.cash.pilot_erz,icePilotSaved:final.cash.pilot_eis,
  realRevenue:final.waterSales,minted:final.minted,worldISK:final.worldCash}));
});
test('W5ah: shortage, independent ownership, no state mutation on denied commands or fake saves',()=>{
 const app=example(),h=app.snapshot().hash;
 assert.equal(app.command('ice-water',6).ok,false,'80 ISK cannot buy 84 ISK');
 assert.equal(app.command('ore-water',11).ok,false,'only 10 physical water exist');
 assert.equal(app.command('ice-water',0).ok,false);
 assert.equal(app.command('ore-water',1.5).ok,false);
 assert.equal(app.command('ice-freight').ok,false,'the occupied freighter cannot take duplicate ice freight');
 assert.equal(app.command('private-gift',100).ok,false);
 assert.equal(app.advance(0).ok,false);assert.equal(app.advance(1441).ok,false);
 assert.equal(app.snapshot().hash,h,'denied actions must not modify the core');
 const saved=app.export(),v=JSON.parse(saved);
 for(const attack of [
   x=>{x.rulesVersion=194;},
   x=>{x.owners.pilot_eis.cash+=7;x.owners.transport.cash-=7;},
   x=>{x.w5ag.paid.eis+=1;},
   x=>{x.w5n.wasserProduziert+=1;}
 ]){
   const fake=structuredClone(v);attack(fake);
   assert.throws(()=>app.import(JSON.stringify(fake)));
   assert.equal(app.snapshot().hash,h);
 }
 const old=Factory.createWaterResearch().core;
 assert.throws(()=>app.import(old.save(old.createW5State(42))));
});
