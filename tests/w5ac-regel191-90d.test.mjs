import test from 'node:test';
import assert from 'node:assert/strict';
import W5ac from '../prototypes/w5ac/rule191-w5-ferry-core.js';

const {core,rules}=W5ac;
const sum=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const factory=(type,owner,other={})=>({type,owner,...other});

test('W5ac real Rule191: 13 RNG seeds x 90 days after funded W0-W5, 60 paid ferry minutes and W3 cargo roundtrip',()=>{
 const seeds=[1,2,7,11,13,42,99,123,777,1234,4096,65535,98765],hashes=[];
 for(const seed of seeds){
  const s=core.createW5State(seed),cmd=command=>{
   const result=core.execute(s,command,rules);
   assert.equal(result.ok,true,JSON.stringify({seed,command,result}));
  };
  cmd(factory('shipBuy','transport',{klasse:'frachter',station:'st_aldera'}));
  core.advance(s,50,rules);
  const old=Object.values(s.ships).find(sh=>sh.klasse==='frachter'&&sh.owner==='transport');
  assert.ok(old);
  cmd(factory('shipFreight','transport',{schiff:old.id}));
  core.advance(s,60,rules);
  cmd(factory('stationRefine','st_nadir',{station:'st_nadir'}));core.advance(s,20,rules);
  cmd(factory('stationBuildShip','werft_extern',{station:'st_nadir'}));core.advance(s,30,rules);
  cmd(factory('shipBuy','transport',{klasse:'frachter',station:'st_nadir'}));
  const newId=s.w5.schiffIds[0];assert.equal(newId,'sh004');
  core.advance(s,10,rules);
  cmd(factory('shipReposition','transport',{schiff:newId}));
  const mid=core.loadW5(core.save(s));core.advance(s,60,rules);core.advance(mid,60,rules);
  assert.equal(core.hash(mid),core.hash(s),'same real prefinanced flight');
  assert.equal(s.ships[newId].system,'aldera');
  assert.equal(s.w5ac.completed.length,1);
  assert.equal(s.owners.w5ac_transfer_pilot.cash,60);
  assert.equal(s.owners.w5ac_transfer_reserved.cash,0);
  cmd(factory('shipFreight','transport',{schiff:newId}));
  core.advance(s,120,rules);
  assert.equal(s.w3.auftrag,null);
  assert.equal(s.w3.abgeschlossen,2);
  assert.equal(s.w3.geliefert,100);
  assert.equal(s.owners.transport.cash,680);
  const copy=core.loadW5(core.save(s));
  assert.equal(core.hash(copy),core.hash(s));
  for(let day=1;day<=90;day++){
   core.advance(s,1440,rules);core.advance(copy,1440,rules);
   const a=core.audit(s);
   assert.equal(a.ok,true,JSON.stringify({seed,day,w3:a.w3,w4:a.w4,w5:a.w5,transfer:a.w5transfer}));
   assert.equal(a.isk.ok,true);assert.equal(a.goods.ok,true);
   assert.equal(a.w3.ok,true);assert.equal(a.w4.ok,true);
   assert.equal(a.w5.ok,true);assert.equal(a.w5transfer.ok,true);
   assert.equal(sum(s),33000);
   assert.equal(s.minted,0);
   assert.equal(s.w5ac.allocated,60);
   assert.equal(s.w5ac.paid,60);
   assert.equal(s.owners.w5ac_transfer_pilot.cash,60);
   assert.equal(s.owners.w5ac_transfer_reserved.cash,0);
   assert.equal(s.w5ac.completed.length,1);
   assert.equal(s.w5.schiffIds[0],newId);
   assert.equal(s.w3.abgeschlossen,2);
   assert.equal(core.hash(copy),core.hash(s),'daily replay seed '+seed+' day '+day);
  }
  const hash=core.hash(s);
  assert.equal(core.hash(core.loadW5(core.save(s))),hash);
  hashes.push(hash);
 }
 assert.equal(new Set(hashes).size,13);
 console.log('W5AC_13X90_AUDIT '+JSON.stringify({
  seeds:13,daysPerSeed:90,simulatedDays:1170,economicRegimes:1,
  paidOriginalW5Ships:13,fullyFundedFerries:13,
  paidTransferMinutes:780,realW3FollowUpTrips:13,
  worldISK:33000,minted:0,deterministic:true,
  proofOfProfitabilityBeyondOneFollowUp:false}));
});
