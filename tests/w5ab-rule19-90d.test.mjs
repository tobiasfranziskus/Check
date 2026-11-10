import test from 'node:test';
import assert from 'node:assert/strict';
import W5 from '../prototypes/w5ab/original-w5-core.js';

const {core,rules}=W5;
const countCash=s=>Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0);

test('W5ab long regression: 13 seeds x 90 days original Rule19 after one real ore->material->paid ship, exact W0-W5 replay',()=>{
 const seeds=[1,2,7,11,13,42,99,123,777,1234,4096,65535,98765],hashes=[];
 const buy={type:'shipBuy',owner:'transport',station:'st_aldera',klasse:'frachter'};
 const refinery={type:'stationRefine',owner:'st_nadir',station:'st_nadir'};
 const build={type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'};
 const sell={type:'shipBuy',owner:'transport',station:'st_nadir',klasse:'frachter'};
 for(const seed of seeds){
  const s=core.createW5State(seed);
  assert.equal(core.audit(s).ok,true);
  core.advance(s,50,rules);
  assert.equal(core.execute(s,buy,rules).ok,true);
  const f=Object.values(s.ships).find(x=>x.klasse==='frachter'&&x.owner==='transport');
  assert.ok(f);
  assert.equal(core.execute(s,{type:'shipFreight',owner:'transport',schiff:f.id},rules).ok,true);
  core.advance(s,60,rules);
  assert.equal(core.execute(s,refinery,rules).ok,true);
  core.advance(s,20,rules);
  assert.equal(core.execute(s,build,rules).ok,true);
  core.advance(s,30,rules);
  assert.equal(core.execute(s,sell,rules).ok,true);
  const replay=core.loadW5(core.save(s));
  assert.equal(core.hash(s),core.hash(replay));
  for(let day=1;day<=90;day++){
   core.advance(s,1440,rules);core.advance(replay,1440,rules);
   const a=core.audit(s);
   assert.equal(a.ok,true,'full W0-W5 audit seed '+seed+' day '+day+': '+JSON.stringify(a.w5));
   assert.equal(a.w3.ok,true);assert.equal(a.w4.ok,true);assert.equal(a.w5.ok,true);
   assert.equal(a.isk.total,33000);assert.equal(countCash(s),33000);
   assert.equal(s.minted,0);
   assert.equal(s.w5.fertig,1);assert.equal(s.w5.verkauft,1);
   assert.equal(s.w5.materialVerbraucht,5);assert.equal(s.w5.materialUmsatz,500);
   assert.equal(s.owners.arbeiter_werft_nadir.cash,30);
   assert.equal(s.stations.st_nadir.lager.frachter,0,'no free unsold starter hull');
   assert.equal(core.hash(s),core.hash(replay),'same seeded original tick/queue/event history');
  }
  const hash=core.hash(s);hashes.push(hash);
  assert.equal(core.hash(core.loadW5(core.save(s))),hash,'day90 original W5 full save hash');
 }
 assert.equal(hashes.length,13);
 assert.equal(new Set(hashes).size,13);
 console.log('W5AB_LONG_REGRESSION '+JSON.stringify({seeds:13,daysPerSeed:90,simulatedDays:1170,
   economicRegimes:1,realFreightShipments:13,realRefinements:13,realShipsBuiltAndBought:13,
   minted:0,worldMoney:33000,materialResaleConfirmed:true,ongoingDemandNotConfirmed:true}));
});
