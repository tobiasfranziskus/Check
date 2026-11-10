import test from 'node:test';
import assert from 'node:assert/strict';
import Session from '../prototypes/w5ac/session.js';
function play(seed){
 const s=Session.create(seed,'private195');
 const cmd=r=>{const before=s.export();const q=s.preview(r);assert.equal(s.export(),before);
  assert.equal(q.ok,true,JSON.stringify(q));assert.equal(s.command(r).ok,true);};
 cmd({type:'freightBuy'});cmd({type:'shipBuy',klasse:'miner',station:'st_aldera'});
 const id=s.snapshot().selected;
 cmd({type:'shipMine',schiff:id,ware:'eis'});s.advance(50);cmd({type:'shipWait',schiff:id});
 cmd({type:'freightStart'});s.advance(60);cmd({type:'refineStart'});s.advance(20);
 cmd({type:'yardStart'});s.advance(30);cmd({type:'yardBuy'});s.advance(10);
 cmd({type:'iceFreight'});s.advance(60);cmd({type:'waterStart'});s.advance(20);
 const mid=s.export(),other=Session.create(seed,'private195');other.import(mid);
 cmd({type:'waterBuy',owner:'pilot_erz',menge:6});cmd({type:'waterBuy',owner:'pilot_eis',menge:4});
 s.advance(30);s.advance(10);
 for(const r of [{type:'waterBuy',owner:'pilot_erz',menge:6},{type:'waterBuy',owner:'pilot_eis',menge:4}])
  assert.equal(other.command(r).ok,true);
 other.advance(30);other.advance(10);assert.equal(s.export(),other.export());
 const snap=s.snapshot();
 assert.equal(snap.state.w5.verkauft,1);
 assert.equal(snap.state.w5ag.paid.erz,120);assert.equal(snap.state.w5ag.paid.eis,120);
 assert.equal(snap.state.owners.pilot_erz.cash,36);assert.equal(snap.state.owners.pilot_eis.cash,64);
 assert.equal(snap.state.w5n.wasserVerbraucht,10);
 assert.equal(snap.audit.total,33000);assert.equal(snap.state.minted,0);
 assert.equal(snap.audit.ok,true);
 return s;
}
test('W5ag browser-session commands: complete paid W0-W5 + two private water buyers; replay and midflight Save/Load',()=>{
 for(const seed of [42,7])assert.equal(play(seed).export(),play(seed).export());
});
test('W5ag session: failed ownership, forged import and foreign rule cannot replace live state',()=>{
 const s=play(42),stable=s.export();
 for(const req of [{type:'waterBuy',owner:'house',menge:1},{type:'waterBuy',owner:'pilot_eis',menge:-1},
  {type:'shipMine',schiff:'sh999',ware:'eis'},{type:'workerWaterBuy',menge:1}]){
  assert.equal(s.command(req).ok,false);assert.equal(s.export(),stable);
 }
 for(const mutate of [x=>x.rulesVersion=194,x=>x.w5ag.payments[0].owner='pilot_eis',
  x=>{x.owners.pilot_eis.cash++;x.owners.pilot_erz.cash--;}]) {
  const fake=JSON.parse(stable);mutate(fake);assert.throws(()=>s.import(JSON.stringify(fake)));assert.equal(s.export(),stable);
 }
 assert.throws(()=>s.import(Session.create().export()));assert.equal(s.export(),stable);
 assert.throws(()=>Session.create().import(stable));
});
