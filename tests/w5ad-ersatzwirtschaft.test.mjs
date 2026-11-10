import test from 'node:test';
import assert from 'node:assert/strict';
import W5ac from '../prototypes/w5ac/rule191-w5-ferry-core.js';
import {scenarios,runScenario,independent} from './helpers/w5ad-research.mjs';

test('W5ad: 13 economic regimes x 90d, independent accounting and deterministic replay',()=>{
 const results=[];
 for(const config of scenarios){
  const run=runScenario(config),again=runScenario(config,90,{check:false});
  assert.equal(run.result.hash,again.result.hash,config.id);
  assert.equal(run.result.dailyAudits,90);results.push(run.result);
 }
 const get=id=>results.find(x=>x.id===id);
 assert.equal(get('earned').replaced,1);assert.equal(get('earned').deployed,1);
 assert.ok(cfgProfitBeforeLoss(get('earned'))>=810,'replacement fully covered by actual prior freight profit');
 assert.equal(get('exact-930').replaced,1);assert.equal(get('exact-930').deployed,1);
 assert.equal(get('exact-930').events.find(x=>x.type==='researchShipLoss').cash,930);
 assert.equal(get('short-929').replaced,0);
 assert.equal(get('short-929').events.find(x=>x.type==='researchShipLoss').cash,929);
 assert.equal(get('buyer-739').trips,0);assert.equal(get('buyer-739').lost,0);
 assert.equal(get('no-yard-production').hullsProduced,0);
 assert.equal(get('no-refinery-material').hullsProduced,0);
 assert.equal(get('saving-1500').replaced,0);
 assert.equal(get('buffer-600').replaced,1);
 assert.equal(get('demand-one').replaced,1);assert.equal(get('demand-one').deployed,0);
 assert.equal(get('idle-saving').lost,0);assert.equal(get('idle-saving').trips,2);
 assert.equal(get('second-loss').lost,2);assert.equal(get('second-loss').replaced,1);
 console.log('W5AD_13_ECONOMIC_90D '+JSON.stringify(results));
});

test('W5ad: five economic crises through 365d with same-seed independent replay',()=>{
 for(const id of ['earned','short-929','buyer-739','saving-1500','second-loss']){
  const cfg=scenarios.find(x=>x.id===id),a=runScenario(cfg,365),b=runScenario(cfg,365,{check:false});
  assert.equal(a.result.hash,b.result.hash);assert.equal(a.result.dailyAudits,365);
  const checkpoints=a.result.checkpoints;
  const at90=checkpoints.find(x=>x.day===90),at365=checkpoints.find(x=>x.day===365);
  assert.deepEqual({...at90,day:365},at365,'no economic restart between day90 and 365');
  assert.equal(a.state.w3.auftrag,null);assert.equal(a.state.w5ac.active,null);
  console.log('W5AD_CRISIS_365D '+JSON.stringify(a.result));
 }
});

test('W5ad: own money, actual loss, no double purchase, no teleport, isolated saves',()=>{
 const cfg=scenarios.find(x=>x.id==='earned');
 const {core:c,rules:r}=W5ac.createResearch(cfgToRules(cfg));
 // Reproducible short funded world: six actual round trips, one produced hull.
 let s=c.createW5State(42);const cmd=(type,owner,extra={})=>c.execute(s,{type,owner,...extra},r);
 assert.equal(cmd('shipBuy','transport',{klasse:'frachter',station:'st_aldera'}).ok,true);
 const old=s.w5ad.purchases[0].id;
 for(let trips=0;trips<6;){
  if(c.pilotW3Kalkulation(s,old).ok)assert.equal(cmd('shipFreight','transport',{schiff:old}).ok,true);
  if(c.pilotW4Kalkulation(s).ok&&s.w4.materialErzeugt<5)cmd('stationRefine','st_nadir',{station:'st_nadir'});
  if(c.pilotW5Kalkulation(s).ok&&s.w5.fertig<1)cmd('stationBuildShip','werft_extern',{station:'st_nadir'});
  c.advance(s,1,r);trips=s.w3.abgeschlossen;
 }
 assert.equal(s.owners.transport.cash,970);assert.equal(s.w5.fertig,1);
 let h=c.hash(s);assert.equal(cmd('shipReplace','transport',{verlust:old,reserve:0}).ok,false);
 assert.equal(c.hash(s),h);
 assert.equal(cmd('researchShipLoss','transport',{schiff:old}).ok,true);
 h=c.hash(s);
 assert.equal(cmd('shipReplace','house',{verlust:old,reserve:0}).ok,false);
 assert.equal(cmd('shipReplace','transport',{verlust:old,reserve:-1}).ok,false);
 assert.equal(c.hash(s),h);
 assert.equal(cmd('shipReplace','transport',{verlust:old,reserve:0}).ok,true);
 const id=s.w5ad.assignments[0].id;
 assert.equal(s.ships[id].system,'nadir');assert.equal(s.ships[id].phase,'reise');
 assert.equal(s.owners.transport.cash,160);assert.equal(s.owners.w5ac_transfer_reserved.cash,60);
 h=c.hash(s);assert.equal(cmd('shipReplace','transport',{verlust:old,reserve:0}).ok,false);
 assert.equal(c.hash(s),h);assert.equal(s.w5.verkauft,1);
 c.advance(s,30,r);independent(s,r);
 const json=c.save(s),copy=c.loadW5(json);assert.equal(c.hash(copy),c.hash(s));
 for(const attack of [
  x=>{x.rulesVersion=191;},x=>{x.w5ad.profile.buyerCash++;},
  x=>{x.owners.transport.cash++;x.owners.export.cash--;},
  x=>{x.w5ad.assignments[0].cashBefore++;},x=>{x.w5ad.assignments.push(x.w5ad.assignments[0]);},
  x=>{x.w5ad.losses=[];},x=>{x.w5ad.purchases.pop();},
  x=>{x.ships[id].system='aldera';},x=>{x.w5ac.paid++;},
  x=>{x.owners.w5ac_transfer_pilot.cash++;x.owners.w5ac_transfer_reserved.cash--;},
  x=>{x.w5ad.freight[0].work=0;},x=>{x.w5ad.losses[0].tick=-1;}
 ]){const x=JSON.parse(json);attack(x);assert.throws(()=>c.loadW5(JSON.stringify(x)));}
 assert.throws(()=>W5ac.core.loadW5(json));
 assert.throws(()=>W5ac.createResearch({carrierCash:2000,buyerCash:4000}).core.loadW5(json));
 assert.throws(()=>c.loadW5(W5ac.core.save(W5ac.core.createW5State(42))));
 c.advance(s,30,r);c.advance(copy,30,r);assert.equal(c.hash(s),c.hash(copy));
 assert.equal(s.ships[id].system,'aldera');assert.equal(s.w5ac.paid,60);
 assert.equal(cmd('shipFreight','transport',{schiff:id}).ok,true);c.advance(s,120,r);
 assert.equal(s.w5ad.freight.at(-1).id,id);assert.equal(c.audit(s).replacement.deployed,1);
 assert.equal(c.audit(s).ok,true);independent(s,r);
 // Failure one ISK below full requirement must preserve every byte.
 const actual=runScenario(scenarios.find(x=>x.id==='short-929'),1);
 const before=actual.core.save(actual.state),lost=actual.state.w5ad.losses[0].id;
 assert.equal(actual.core.execute(actual.state,{type:'shipReplace',owner:'transport',verlust:lost,reserve:0},actual.rules).ok,false);
 assert.equal(actual.core.save(actual.state),before);
});
const cfgToRules=x=>({carrierCash:x.carrierCash,buyerCash:x.buyerCash});

function cfgProfitBeforeLoss(result){return result.config.lossAfter*120;}
