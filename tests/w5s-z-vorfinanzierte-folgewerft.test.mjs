import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const RULES={...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,autoNpcOre:true,
  prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,retainFleetEarnings:true,
  carrierWorkingCapital:true,autoOreSettlement:true,autoTakeover:true,autoNpcVenture:true,
  autoOreWageHousehold:true,autoIndustryWages:true,onDemandMaintenance:true,
  independentSuccessor:true,successorFreight:true,successorOperations:true,
  successorOreFreight:true,successorNewOrder:true
}};
const OFF={...RULES,w5s:{...RULES.w5s,successorNewOrder:false}};
function fullAudit(s,label){
  const core=api.audit(s),proof=api.w5sFinanzStatus(s,RULES);
  assert.equal(core.ok,true,label+': world '+Object.entries(core).filter(([,v])=>v?.ok===false).map(([k])=>k).join(','));
  assert.equal(proof.ok,true,label+': independent transport accounts');
  assert.equal(proof.successor.ok,true,label+': previous company unchanged');
  assert.equal(proof.newCarrierOrder?.ok??true,true,label+': new order audit if exposed');
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000,label+': ISK supply');
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),label+': Save/Load');
}
function world(seed,r=RULES){
  const s=api.createW5RState(seed,'full','npc3');
  for(let day=1;day<=120;day++)api.advance(s,1440,r);
  for(const [type,owner,extra] of [
    ['stationRefine','st_nadir',{station:'st_nadir'}],
    ['stationBuildShip','werft_extern',{station:'st_nadir'}],
    ['shipFoundCarrier','export',{}],
    ['shipBuy','w5s_carrier2',{station:'st_nadir',klasse:'frachter'}]
  ]){
    const result=api.execute(s,{type,owner,...extra},r);
    assert.equal(result.ok,true,type+': '+result.reason);
    while(s.w4.auftrag||s.w5.auftrag)api.advance(s,1,r);
  }
  return s;
}
function activeOrder(seed){
  const s=world(seed);
  assert.equal(api.execute(s,{type:'shipPrepayNewCarrier',owner:'export'},RULES).ok,
    false,'no buyer before actually retiring the old hull');
  for(let day=1;day<=35;day++)api.advance(s,1440,RULES);
  fullAudit(s,'before private purchase order');
  assert.equal(s.w5s.successor.retired?.reason,'verschleiss');
  assert.equal(s.owners.w5s_carrier2.cash,720);
  assert.equal(s.stations.st_nadir.lager.frachter,0);
  const oldOwnerCash=720,oldShip=s.w5s.successor.ship,previousPrice=s.w5.fertig;
  const status=api.w5sNewCarrierOrder(s,RULES);
  assert.equal(status.approved,true,status.stage);
  const hash=api.hash(s),exportCash=s.owners.export.cash;
  assert.equal(api.hash(s),hash,'read-only order plan');
  const start=api.execute(s,{type:'shipPrepayNewCarrier',owner:'export'},RULES);
  assert.equal(start.ok,true,start.reason);
  assert.equal(s.owners.export.cash,exportCash-930);
  assert.equal(s.owners.w5s_new_carrier_reserved.cash,930,'real 930 ISK locked');
  assert.equal(s.owners.w5s_carrier2.cash,oldOwnerCash,'no bailout');
  assert.equal(s.w5s.successor.ship,oldShip,'no ghost replacement');
  assert.equal(s.ships[oldShip],undefined);
  assert.equal(s.owners.w5s_carrier3,undefined,'no invented firm');
  assert.equal(api.execute(s,{type:'shipPrepayNewCarrier',owner:'export'},RULES).ok,
    false,'no duplicate equity');
  assert.equal(api.execute(s,{type:'shipPrepayNewCarrier',owner:'house'},RULES).ok,
    false,'private owner is not authorized investor');
  fullAudit(s,'new fully prepaid investor order');
  let ref=0,build=0,ready=0;
  for(let minute=1;minute<=600;minute++){
    api.advance(s,1,RULES);
    if(s.w4.auftrag)ref++;
    if(s.w5.auftrag)build++;
    if(s.w5s.newCarrierOrder.stage==='hull_ready'){ready=minute;break;}
    if(minute%10===0)fullAudit(s,'contract minute '+minute);
  }
  assert.ok(ref>0,'real W4 work started');
  assert.ok(build>0,'real W5 work started');
  assert.ok(ready>0,'physical hull delivered to reserved yard');
  const o=s.w5s.newCarrierOrder;
  assert.equal(o.capital,930);assert.equal(o.stage,'hull_ready');
  assert.equal(s.stations.st_nadir.lager.frachter,1);
  assert.equal(s.w5.fertig,previousPrice+1);
  assert.equal(s.ledger.frachter.produced>=s.ledger.frachter.consumed,true);
  assert.equal(s.owners.w5s_new_carrier_reserved.cash,930);
  assert.equal(s.owners.w5s_carrier2.cash,720,'old NPC insolvent as before');
  assert.equal(s.owners.w5s_carrier3,undefined,'no automatic corporate handover');
  assert.equal(api.execute(s,{type:'shipBuy',owner:RULES.w5.kaeufer,
    station:'st_nadir',klasse:'frachter'},RULES).ok,false,
    'prepaid production must not be stolen by other NPC company');
  const state=api.w5sNewCarrierOrder(s,RULES);
  assert.equal(state.stage,'hull_ready');
  assert.equal(state.amount,930);assert.equal(state.actualBuilt,1);
  assert.equal(state.independentBuyer,true);
  assert.equal(state.ownershipTransferred,false);
  fullAudit(s,'finished paid W4/W5 hull');
  console.log('W5S_Z_REAL '+JSON.stringify({seed,readyMinute:ready,refMinutes:ref,
    buildMinutes:build,finalHash:api.hash(s),
    oldCompanyCash:s.owners.w5s_carrier2.cash,escrow:o.capital,
    investorCash:s.owners.export.cash,
    yardCash:s.owners.werft_extern.cash,
    physicalHull:s.stations.st_nadir.lager.frachter,
    producedAfter:o.baseline,alreadyOwned:!!s.owners.w5s_carrier3}));
  return s;
}
test('W5s-z: two real crisis worlds obtain investor-prepaid and physically built new hulls',()=>{
  activeOrder(42);activeOrder(7);
});
test('W5s-z: replay is bit-identical and save/load preserves the real locked capital',()=>{
  const a=activeOrder(42),b=activeOrder(42);
  assert.equal(api.hash(a),api.hash(b));
  assert.deepEqual(api.w5sNewCarrierOrder(a,RULES),api.w5sNewCarrierOrder(b,RULES));
});
test('W5s-z: missing option does not authorize new investor funds or alter old hashes',()=>{
  const s=world(42,OFF);
  for(let day=1;day<=35;day++)api.advance(s,1440,OFF);
  assert.equal(api.execute(s,{type:'shipPrepayNewCarrier',owner:'export'},OFF).ok,false);
  assert.equal(api.w5sNewCarrierOrder(s,OFF).stage,'inaktiv');
  assert.equal(s.w5s?.newCarrierOrder,undefined);
  assert.equal(api.hash(s),'92bd14083ab5d210',
    'old W5s-x 35d hash preserved if new option is disabled');
  assert.equal(api.audit(s).ok,true);
});
test('W5s-z: escrow forgery and private transfers cannot fool the independent audit',()=>{
  const s=activeOrder(7);
  const variations=[
    t=>{t.owners.w5s_new_carrier_reserved.cash--},
    t=>{t.w5s.newCarrierOrder.capital++},
    t=>{t.w5s.newCarrierOrder.baseline--},
    t=>{t.w5s.newCarrierOrder.buyer='w5s_carrier2'},
    t=>{t.w5s.newCarrierOrder.stage='reserved'},
    t=>{t.owners.export.cash+=1},
    t=>{t.owners.w5s_carrier2.cash+=210;t.owners.export.cash-=210}
  ];
  for(const [i,modify] of variations.entries()){
    const t=api.loadW5R(api.save(s));
    modify(t);
    assert.equal(api.audit(t).ok,false,'tamper blocked '+i);
  }
  assert.equal(api.audit(s).ok,true);
});
