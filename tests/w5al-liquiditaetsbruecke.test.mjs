import test from 'node:test';
import assert from 'node:assert/strict';
import Session from '../prototypes/w5ac/session.js';
import Factory from '../prototypes/w5ac/rule191-w5-ferry-core.js';
import Extension from '../prototypes/w5ag/extension.js';

const rules=Factory.createPrivateWageResearch({carrierCash:2000,buyerCash:4000}).rules;
const must=(r,name)=>assert.equal(r.ok,true,name+': '+r.reason);
function sequence(seed=42){
 const s=Session.create(seed,'private195'),traces=[];
 const snap=tag=>{const before=s.export(),x=Extension.capitalBridge(s.snapshot(),rules);
  assert.equal(s.export(),before,'view-model is strictly read-only');
  assert.equal(x.bridgeOk,true,tag+' balance');
  assert.equal(x.booked,x.free+x.oreBuyerHeld,tag+' escrow bridge');
  traces.push({tag,tick:JSON.parse(before).tick,...x});return x;};
 function cmd(req){must(s.command(req),req.type);}
 function tick(n){must(s.advance(n),'tick '+n);}
 cmd({type:'freightBuy'});cmd({type:'shipBuy',station:'st_aldera',klasse:'miner'});
 const miner=s.snapshot().selected;
 cmd({type:'shipMine',schiff:miner,ware:'eis'});tick(50);cmd({type:'shipWait',schiff:miner});
 cmd({type:'freightStart'});tick(60);tick(60);
 cmd({type:'iceFreight'});tick(60);
 cmd({type:'waterStart'});tick(20);
 cmd({type:'waterBuy',owner:'pilot_erz',menge:6});
 cmd({type:'waterBuy',owner:'pilot_eis',menge:4});
 tick(30);tick(10);
 cmd({type:'waterStart'});tick(20);
 cmd({type:'waterBuy',owner:'pilot_erz',menge:2});
 cmd({type:'waterBuy',owner:'pilot_eis',menge:4});
 snap('afterFirstFlightAndTwoFactories');
 cmd({type:'shipMine',schiff:miner,ware:'eis'});tick(50);cmd({type:'shipWait',schiff:miner});
 cmd({type:'shipSellIce',schiff:miner,menge:50});
 cmd({type:'iceFreight'});tick(60);tick(60);
 snap('afterSecondIceFlight');
 cmd({type:'waterStart'});tick(20);
 cmd({type:'waterBuy',owner:'pilot_eis',menge:8});
 const bound=snap('afterThirdFactory');
 assert.equal(bound.free,0);assert.equal(bound.oreBuyerHeld,1000);
 assert.equal(bound.nadirFree>=490,true);
 cmd({type:'shipMine',schiff:miner,ware:'eis'});tick(50);cmd({type:'shipWait',schiff:miner});
 const blocked=snap('thirdPhysicalCargoHeld');
 assert.equal(blocked.free,0);assert.equal(blocked.oreBuyerHeld,1000);
 const failedBefore=s.export();
 const rejection=s.command({type:'shipSellIce',schiff:miner,menge:50});
 assert.equal(rejection.ok,false);assert.equal(s.export(),failedBefore);
 assert.match(Extension.capitalText(blocked),/Erzankäufe gebunden 1000 ISK/);
 tick(50);
 const unlocked=snap('realW1OreEscrowCompletion');
 assert.equal(unlocked.free,1000);assert.equal(unlocked.oreBuyerHeld,0);
 cmd({type:'shipSellIce',schiff:miner,menge:50});
 const sold=snap('thirdRealSourceSale');assert.equal(sold.free,750);
 cmd({type:'iceFreight'});
 const start=s.snapshot();
 assert.equal(start.state.owners.w5n_fracht_kauf.cash,490);
 assert.equal(start.state.owners.w5n_fracht_arbeit.cash,120);
 tick(60);tick(60);
 const final=snap('thirdPaidRoundtrip');
 const end=JSON.parse(s.export());
 assert.equal(end.tick,720);
 assert.equal(end.w5n.frachtAbgeschlossen,3);
 assert.equal(end.w5n.eisGeliefert,150);
 assert.equal(end.w5ag.paid.eis,360);
 assert.equal(end.w5ag.payments.length,480);
 assert.equal(end.minted,0);
 assert.equal(Object.values(end.owners).reduce((sum,o)=>sum+o.cash,0),33000);
 assert.equal(Factory.createPrivateWageResearch({carrierCash:2000,buyerCash:4000}).core.audit(end).ok,true);
 const replay=Session.create(seed,'private195');must(replay.import(s.export()),'audited save import');
 assert.equal(replay.snapshot().hash,s.snapshot().hash);
 return {hash:s.snapshot().hash,traces};
}
for(const seed of [42,7])test('W5al core escrow visible and third paid flight in common hub, seed '+seed,()=>{
 const a=sequence(seed),b=sequence(seed);
 assert.equal(a.hash,b.hash);assert.deepEqual(a.traces,b.traces);
 console.log('W5AL_REAL_3RD_TRIP '+JSON.stringify({seed,hash:a.hash,steps:a.traces.map(({tag,tick,free,oreBuyerHeld,nadirFree,carrierFree})=>({tag,tick,free,oreBuyerHeld,nadirFree,carrierFree}))}));
});
test('W5al cash bridge accounts for every active W1 contract; private wages remain independent',()=>{
 const s=Session.create(42,'private195');
 for(let i=0;i<3;i++)must(s.command({type:'shipBuy',klasse:'miner',station:'st_aldera'}),'real own miner '+i);
 const ships=Object.values(s.snapshot().state.ships).filter(x=>x.owner==='house').map(x=>x.id);
 for(const id of ships.slice(0,2)){s.select(id);must(s.command({type:'shipMine',schiff:id,ware:'erz'}),'prepaid ore purchase');}
 must(s.advance(1),'actual core minute');
 const c=Extension.capitalBridge(s.snapshot(),rules);
 assert.equal(c.bridgeOk,true);assert.equal(c.free+c.oreBuyerHeld,c.booked);
 assert.ok(c.contracts.length>=2,'no single order is hidden');
 assert.equal(s.snapshot().state.w5ag.paid.eis,0,'escrow is not private pilot salary');
});
