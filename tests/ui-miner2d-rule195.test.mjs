import test from 'node:test';
import assert from 'node:assert/strict';
import Session from '../prototypes/w5ac/session.js';
import Factory from '../prototypes/w5ac/rule191-w5-ferry-core.js';
import Miner from '../prototypes/w5ag/miner.js';
const {rules,core}=Factory.createPrivateWageResearch({carrierCash:2000,buyerCash:4000});
function play(seed){
 const s=Session.create(seed,'private195');
 const cmd=req=>assert.equal(s.command(req).ok,true,JSON.stringify(req));
 cmd({type:'shipBuy',station:'st_aldera',klasse:'miner'});
 const id=s.snapshot().selected;
 cmd({type:'shipMine',schiff:id,ware:'erz'});s.advance(10);
 let snap=s.snapshot(),m=Miner.model(snap,rules);
 assert.equal(m.cargo,10);assert.equal(m.ship.ladung.erz,10);assert.equal(m.contract.menge,50);
 assert.equal(m.finance.erloese,0);assert.equal(m.station,'st_aldera');
 assert.deepEqual(m.fields.map(x=>x.ware),['erz','eis']);
 // Projection and previews neither produce resources nor consume simulation RNG.
 const before=s.export();Miner.model(s.snapshot(),rules);s.preview({type:'shipWait',schiff:id});assert.equal(s.export(),before);
 cmd({type:'shipWait',schiff:id});m=Miner.model(s.snapshot(),rules);
 assert.equal(m.cargo,0);assert.equal(m.contract,null);assert.ok(m.finance.erloese>0);
 cmd({type:'shipMine',schiff:id,ware:'eis'});s.advance(10);
 const mid=s.export(),loaded=Session.create(seed,'private195');loaded.import(mid);
 for(const session of [s,loaded]){
  const ice=Miner.model(session.snapshot(),rules);assert.equal(ice.cargo,10);assert.equal(ice.ship.ladung.eis,10);
  session.advance(20);session.advance(20);assert.equal(session.command({type:'shipWait',schiff:id}).ok,true);
 }
 assert.equal(s.export(),loaded.export());snap=s.snapshot();m=Miner.model(snap,rules);
 assert.equal(snap.state.w5n.eisAbgebaut,50);assert.equal(snap.state.w5n.mineVerkauft,0);assert.equal(m.cargo,50);
 // Existing buyer budget is reserved elsewhere: unsold ice remains real cargo, never UI income.
 assert.equal(snap.state.w5n.mineVerkaufWert,0);
 assert.equal(snap.audit.ok,true);assert.equal(snap.audit.total,33000);assert.equal(snap.state.minted,0);
 // Underlying Rule195 must reject travel too; UI must not fabricate flight/docking.
 const state=core.loadW5(s.export()),stable=core.save(state);
 assert.equal(core.execute(state,{type:'shipMove',owner:'house',schiff:id,ziel:'st_nadir'},rules).ok,false);
 assert.equal(core.save(state),stable);
 return s.export();
}
test('Miner cockpit: real partial ore, paid settlement, real ice, deterministic replay and mid-mining Save/Load',()=>{
 for(const seed of [42,7])assert.equal(play(seed),play(seed));
});
test('Miner selection uses owned IDs; rejected resource switch and foreign ship leave state intact',()=>{
 const s=Session.create(42,'private195');
 for(let i=0;i<2;i++)assert.equal(s.command({type:'shipBuy',station:'st_aldera',klasse:'miner'}).ok,true);
 const ids=Object.values(s.snapshot().state.ships).filter(x=>x.owner==='house').map(x=>x.id);
 s.select(ids[1]);assert.equal(Miner.model(s.snapshot(),rules).ship.id,ids[1]);
 assert.throws(()=>s.select('sh001'));assert.equal(s.snapshot().selected,ids[1]);
 s.command({type:'shipMine',schiff:ids[1],ware:'eis'});s.advance(1);const before=s.export();
 assert.equal(s.command({type:'shipMine',schiff:ids[1],ware:'erz'}).ok,false);assert.equal(s.export(),before);
 s.select(ids[0]);assert.equal(Miner.model(s.snapshot(),rules).cargo,0);s.select(ids[1]);assert.equal(Miner.model(s.snapshot(),rules).cargo,1);
});
