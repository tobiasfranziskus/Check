import test from 'node:test';
import assert from 'node:assert/strict';
import Session from '../prototypes/w5ac/session.js';
import Factory from '../prototypes/w5ac/rule191-w5-ferry-core.js';

function play(seed,{saving=false,coreBuyer=null}={}){
 const engine=Factory.createPrivateWageResearch({carrierCash:2000,buyerCash:coreBuyer??4000});
 const session=Session.create(seed,'private195');let state=engine.core.createW5State(seed);
 const raw=()=>coreBuyer===null?JSON.parse(session.export()):state;
 const save=()=>coreBuyer===null?session.export():engine.core.save(state);
 let miner;
 function cmd(req){
  if(coreBuyer===null){const before=save();const q=session.preview(req);assert.equal(save(),before);assert.equal(q.ok,true,q.reason);assert.equal(session.command(req).ok,true);}
  else{
   const types={freightBuy:{type:'shipBuy',owner:'transport',station:'st_aldera',klasse:'frachter'},iceFreight:{type:'shipFreightIce',owner:'transport',schiff:Object.values(state.ships).find(x=>x.owner==='transport')?.id},freightStart:{type:'shipFreight',owner:'transport',schiff:Object.values(state.ships).find(x=>x.owner==='transport')?.id},waterStart:{type:'stationWater',owner:'st_nadir',station:'st_nadir'}};
   const command=types[req.type]||{...req,owner:req.owner||'house',type:req.type==='waterBuy'?'pilotWaterBuy':req.type};
   const result=engine.core.execute(state,command,engine.rules);assert.equal(result.ok,true,result.reason);
  }
 }
 const step=n=>coreBuyer===null?session.advance(n):engine.core.advance(state,n,engine.rules);
 const buy=(owner,menge)=>cmd({type:'waterBuy',owner,menge});
 cmd({type:'freightBuy'});cmd({type:'shipBuy',station:'st_aldera',klasse:'miner'});
 miner=Object.values(raw().ships).find(x=>x.owner==='house').id;
 cmd({type:'shipMine',schiff:miner,ware:'eis'});step(50);cmd({type:'shipWait',schiff:miner});
 cmd({type:'freightStart'});step(60);step(60);
 cmd({type:'iceFreight'});step(60);cmd({type:'waterStart'});step(20);
 buy('pilot_erz',6);buy('pilot_eis',4);step(30);step(10);
 cmd({type:'waterStart'});step(20);buy('pilot_erz',2);buy('pilot_eis',4);
 assert.equal(raw().tick,310);
 cmd({type:'shipMine',schiff:miner,ware:'eis'});step(50);cmd({type:'shipWait',schiff:miner});
 assert.equal(raw().ships[miner].ladung.eis,50);
 cmd({type:'shipSellIce',schiff:miner,menge:50});
 if(coreBuyer!==null){
  assert.equal(raw().owners.st_nadir.cash,454);const before=save();
  const result=engine.core.execute(state,{type:'shipFreightIce',owner:'transport',schiff:Object.values(state.ships).find(x=>x.owner==='transport')?.id},engine.rules);
  assert.equal(result.ok,false);assert.match(result.reason,/Nadir/);assert.equal(save(),before);return;
 }
 const before=raw();cmd({type:'iceFreight'});const escrow=raw();
 assert.equal(escrow.owners.w5n_fracht_kauf.cash,490);assert.equal(escrow.owners.w5n_fracht_arbeit.cash,120);
 assert.equal(escrow.owners.st_nadir.cash,before.owners.st_nadir.cash-490);
 assert.equal(escrow.owners.transport.cash,before.owners.transport.cash-120);
 assert.equal(escrow.owners.pilot_eis.cash,before.owners.pilot_eis.cash);
 const mid=save(),clone=Session.create(seed,'private195');clone.import(mid);
 step(60);if(!saving)buy('pilot_eis',4);cmd({type:'waterStart'});step(20);
 if(!saving)buy('pilot_eis',2);step(30);step(10);if(!saving)buy('pilot_eis',3);
 for(const n of [60,20,30,10]){
  clone.advance(n);
  if(n===60){if(!saving)assert.equal(clone.command({type:'waterBuy',owner:'pilot_eis',menge:4}).ok,true);assert.equal(clone.command({type:'waterStart'}).ok,true);}
  if(n===20&&!saving)assert.equal(clone.command({type:'waterBuy',owner:'pilot_eis',menge:2}).ok,true);
 }
 if(!saving)assert.equal(clone.command({type:'waterBuy',owner:'pilot_eis',menge:3}).ok,true);
 assert.equal(clone.export(),save());
 const end=raw(),snap=session.snapshot();
 assert.equal(end.tick,480);assert.equal(end.w5n.frachtAbgeschlossen,2);assert.equal(end.w5ag.payments.length,360);
 assert.deepEqual(end.w5ag.paid,{erz:120,eis:240});assert.equal(end.w5n.wasserProduziert,30);
 assert.equal(end.w5n.wasserVerbraucht,saving?16:25);assert.equal(end.w5n.wasserErlos,saving?224:350);
 assert.equal(end.stations.st_nadir.lager.wasser,saving?14:5);assert.equal(end.owners.pilot_eis.cash,saving?128:2);
 assert.equal(end.minted,0);assert.equal(Object.values(end.owners).reduce((n,x)=>n+x.cash,0),33000);
 for(const audit of [engine.core.audit(end),engine.core.pilotWirtschaftsStand(end),engine.core.pilotW3Stand(end),engine.core.pilotWaterStand(end),engine.core.pilotPrivateWageStand(end)])assert.equal(audit.ok,true);
 assert.equal(engine.core.hash(end),snap.hash);
 return session;
}
test('W5ak: W5ai reference through shared hub session, Seeds42/7, independent audits, midflight Save/Load and hash replay',()=>{
 for(const seed of [42,7]){const a=play(seed),b=play(seed);assert.equal(a.export(),b.export());console.log('W5ak',seed,a.snapshot().hash);}
});
test('W5ak: saving is voluntary; no forced follow-up consumption',()=>{play(42,{saving:true});});
test('W5ak: original Core refuses underfunded second flight with 454/490 ISK atomically',()=>{play(42,{coreBuyer:1500});});
test('W5ak: sale rejects absent buyer funds, foreign ships, cargo and amounts; profile and forged import stay protected',()=>{
 const poor=Session.create(42,'private195');
 for(let i=0;i<3;i++)assert.equal(poor.command({type:'shipBuy',klasse:'miner',station:'st_aldera'}).ok,true);
 const ids=Object.values(poor.snapshot().state.ships).filter(x=>x.owner==='house').map(x=>x.id);
 for(const sid of ids.slice(0,2)){poor.select(sid);assert.equal(poor.command({type:'shipMine',schiff:sid,ware:'erz'}).ok,true);}
 poor.select(ids[2]);poor.command({type:'shipMine',schiff:ids[2],ware:'eis'});poor.advance(10);
 const noFunds=poor.export();assert.equal(JSON.parse(noFunds).owners.st_aldera.cash,0);
 assert.equal(poor.command({type:'shipSellIce',schiff:ids[2],menge:10}).ok,false);assert.equal(poor.export(),noFunds);
 const s=Session.create(42,'private195');s.command({type:'shipBuy',klasse:'miner',station:'st_aldera'});const id=s.snapshot().selected;
 s.command({type:'shipMine',schiff:id,ware:'erz'});s.advance(10);s.command({type:'shipWait',schiff:id});
 s.command({type:'shipMine',schiff:id,ware:'eis'});s.advance(50);s.command({type:'shipWait',schiff:id});
 const stable=s.export();assert.equal(JSON.parse(stable).ships[id].ladung.eis,50);
 for(const req of [{type:'shipSellIce',schiff:id,menge:51},{type:'shipSellIce',schiff:'sh001',menge:1},{type:'shipSellIce',schiff:id,menge:0},{type:'shipSellIce',schiff:id,menge:1.5},{type:'iceFreight'}]){
  assert.equal(s.preview(req).ok,false,JSON.stringify(req));assert.equal(s.command(req).ok,false);assert.equal(s.export(),stable);
 }
 assert.equal(Session.create().command({type:'shipSellIce',schiff:id,menge:1}).ok,false);
 const end=play(42),saved=end.export();
 for(const mutate of [x=>x.w5ag.iceContracts[1].start++,x=>x.w5ag.payments[250].owner='pilot_erz',x=>x.w5n.kaufDeals[0].menge++,x=>x.rulesVersion=194]){
  const fake=JSON.parse(saved);mutate(fake);assert.throws(()=>end.import(JSON.stringify(fake)));assert.equal(end.export(),saved);
 }
});
