import test from 'node:test';
import assert from 'node:assert/strict';
import W4 from '../prototypes/w5aa/original-w4-core.js';

const {core,rules}=W4;
const paidShip={type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'};
const refinery={type:'stationRefine',owner:'st_nadir',station:'st_nadir'};
const money=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);

test('W5aa W4 long audit: 13 seeds x 90 days, one genuinely financed W3 shipment and W4 batch, replay and 0 emissions',()=>{
 const seeds=[1,2,7,11,13,42,99,123,777,1234,4096,65535,98765],finalHashes=[];
 for(const seed of seeds){
  const s=core.createW4State(seed);
  assert.equal(s.stations.st_nadir.lager.erz,0);
  assert.equal(s.ledger.material.initial,0);
  core.advance(s,50,rules);
  assert.equal(core.execute(s,paidShip,rules).ok,true,'real paid W3 hull');
  const sh=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter');
  assert.ok(sh);
  assert.equal(core.execute(s,{type:'shipFreight',owner:'transport',schiff:sh.id},rules).ok,true);
  core.advance(s,60,rules);
  assert.equal(core.execute(s,refinery,rules).ok,true,'20 ISK from the correct original Nadir owner');
  const r=core.loadW4(core.save(s));
  assert.equal(core.hash(s),core.hash(r));
  for(let day=1;day<=90;day++){
   core.advance(s,1440,rules);core.advance(r,1440,rules);
   assert.equal(core.hash(s),core.hash(r),'original W4 deterministic replay '+seed+'/'+day);
   const a=core.audit(s);
   assert.equal(a.ok,true,JSON.stringify({seed,day,audit:a}));
   assert.equal(a.w3.ok,true);
   assert.equal(a.w4.ok,true);
   assert.equal(a.isk.total,33000);
   assert.equal(money(s),33000);
   assert.equal(s.minted,0);
   assert.equal(s.owners.arbeitskraefte_nadir.cash,20,'real work paid, not reminted');
   assert.equal(s.stations.st_nadir.lager.material,5,'no phantom paid industrial buyer');
   assert.equal(s.w3.geliefert-s.w4.erzVerbraucht,s.stations.st_nadir.lager.erz);
   assert.equal(s.w4.gebucht,s.w4.gezahlt,'no escrow residue after completed batch');
  }
  assert.equal(s.w3.abgeschlossen,1);
  assert.equal(s.w4.abgeschlossen,1);
  const final=core.hash(s);finalHashes.push(final);
  assert.equal(core.hash(core.loadW4(core.save(s))),final,'end-of-day90 full W4 save replay');
 }
 assert.equal(finalHashes.length,13);
 assert.equal(new Set(finalHashes).size,13);
 console.log('W5AA_90D_AUDIT '+JSON.stringify({
  seeds:13,daysEach:90,simulatedDays:1170,financialRegimes:1,worldMoney:33000,
  originalCore:true,realInitialShipmentsPerSeed:1,realInitialProductionBatchesPerSeed:1,
  deterministicSaveReplay:true,materialDemandNotProven:true}));
});
