import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// W5s-ag uses the exact same exported R32 simulation as W5s-ad–af.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const BASE={...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,autoNpcOre:true,
  prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,retainFleetEarnings:true,
  carrierWorkingCapital:true,autoOreSettlement:true,autoTakeover:true,autoNpcVenture:true,
  autoOreWageHousehold:true,autoIndustryWages:true,onDemandMaintenance:true,
  independentSuccessor:true,successorFreight:true,successorOperations:true,
  successorOreFreight:true,successorNewOrder:true,successorNewPurchase:true,
  successorNewFreight:true,successorNewAuto:true,successorNewWear:true,
  successorNewIce:true
}};
const ON={...BASE,w5s:{...BASE.w5s,successorDemandLoop:true}};
const seeds=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];
function money(s){return Object.values(s.owners).reduce((n,o)=>n+o.cash,0)}
function check(s,r,tag,save=false){
  const a=api.audit(s);
  assert.equal(a.ok,true,tag+': core ledger '+JSON.stringify({
    failed:Object.keys(a).filter(k=>a[k]?.ok===false),
    w3:a.w3?.ok===false?a.w3:undefined,
    w5s:a.w5s?.ok===false?{
      newCarrier:a.w5s.newCarrierOrder,
      successor:a.w5s.successor,
      contract:a.w5s.contract,
      allocated:a.w5s.allocated,paid:a.w5s.paid}:undefined,
    newCarrierState:s.w5s?.newCarrierOrder?.stage,
    freightW3:s.w3?.auftrag?.owner,
    freightIce:s.w5n?.frachtauftrag?.owner
  }));
  assert.equal(api.w5sFinanzStatus(s,r).ok,true,tag+': owner and work audit');
  assert.equal(money(s),33000,tag+': every original ISK preserved');
  assert.equal(s.minted,0,tag+': no issuance');
  assert.equal(s.burned,0,tag+': no burn');
  if(save)assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
    tag+': exact save/load');
}
function funded(seed,r=ON){
  const s=api.createW5RState(seed,'full','npc3');
  for(let day=1;day<=120;day++)api.advance(s,1440,r);
  for(const [type,owner,fields] of [
    ['stationRefine','st_nadir',{station:'st_nadir'}],
    ['stationBuildShip','werft_extern',{station:'st_nadir'}],
    ['shipFoundCarrier','export',{}],
    ['shipBuy','w5s_carrier2',{station:'st_nadir',klasse:'frachter'}]
  ]){
    const res=api.execute(s,{type,owner,...fields},r);
    assert.equal(res.ok,true,type+': '+res.reason);
    while(s.w4.auftrag||s.w5.auftrag)api.advance(s,1,r);
  }
  for(let day=0;day<35;day++)api.advance(s,1440,r);
  assert.equal(api.execute(s,{type:'shipPrepayNewCarrier',owner:'export'},r).ok,true);
  for(let i=0;i<600&&s.w5s.newCarrierOrder.stage!=='hull_ready';i++)
    api.advance(s,1,r);
  assert.equal(s.w5s.newCarrierOrder.stage,'hull_ready');
  assert.equal(api.execute(s,{type:'shipClaimNewCarrier',owner:'export'},r).ok,true);
  const id=s.w5s.newCarrierOrder.ship;
  assert.equal(api.execute(s,{type:'shipReposition',
    owner:'w5s_carrier3',schiff:id},r).ok,true);
  api.advance(s,60,r);
  assert.equal(s.w5s.newCarrierOrder.stage,'arrived');
  check(s,r,'paid startup '+seed,true);
  return s;
}

const AH={...ON,w5s:{...ON.w5s,autoTransferWageHousehold:true}};
const hashes={42:'8b2aad35deff33b8',7:'777180b0d6276eaa'};
test('W5s-ah: OFF is original W5s-ag and does not invent pilot incomes',()=>{
  for(const seed of [42,7]){
    const s=funded(seed,BASE);
    assert.equal(s.owners.w5s_transfer_pilot.cash,1020);
    for(let d=1;d<=35;d++)api.advance(s,1440,ON);
    assert.equal(s.w5s.transferPilotWages??0,0);
    assert.equal(s.owners.w5s_transfer_pilot.cash,1080);
    assert.equal(s.w5n.wasserVerbraucht-6479,384);
    assert.equal(api.hash(s),seed===42?'eacbbe44f8d9886a':'c0bfade2da365112');
    check(s,ON,'OFF unchanged '+seed,true);
  }
});
test('W5s-ah: already earned 1020 ISK transfer wage reaches households only once',()=>{
  for(const seed of [42,7]){
    const s=funded(seed,BASE),prior=s.owners.w5n_kunden.cash;
    assert.equal(s.w5s.paid,1020);
    api.advance(s,60,AH);
    assert.equal(s.w5s.transferPilotWages,1020);
    assert.equal(s.owners.w5s_transfer_pilot.cash,0);
    assert.ok(s.owners.w5n_kunden.cash>prior);
    assert.equal(s.w5s.transferPilotPays.length,1);
    assert.equal(s.w5s.transferPilotPays[0].amount,1020);
    assert.equal(api.w5sFinanzStatus(s,AH).transferPilotWages.ok,true);
    check(s,AH,'real wages '+seed,true);
    const hash=api.hash(s);
    assert.equal(api.w5sFinanzStatus(s,AH).transferPilotWages.paid,1020);
    assert.equal(api.hash(s),hash,'read-only report');
    api.advance(s,2,AH);
    assert.equal(s.w5s.transferPilotPays.length,1,'no duplicate');
    check(s,AH,'minute checks '+seed);
    api.advance(s,1440,ON);
    assert.equal(s.w5s.transferPilotWages,1020,'flag off does not re-pay');
    check(s,ON,'flag-independent saved ledger '+seed,true);
  }
});
test('W5s-ah: unearned, forged, or duplicate pilot records fail core audit',()=>{
  const idle=api.createW5RState(42,'full','npc3');
  api.advance(idle,60,AH);
  assert.equal(idle.w5s?.transferPilotWages??0,0);
  check(idle,AH,'no employment, no money',true);
  const s=funded(42,BASE);
  api.advance(s,60,AH);
  for(const mutate of [
    f=>{f.w5s.transferPilotWages--;},
    f=>{f.w5s.transferPilotPays[0].amount++;},
    f=>{f.w5s.transferPilotPays[0].tick++;},
    f=>{f.owners.w5s_transfer_pilot.cash++;},
    f=>{f.w5s.paid--;}
  ]){
    const f=api.loadW5R(api.save(s));
    mutate(f);
    assert.equal(api.audit(f).ok,false,'tampered accounting not accepted');
  }
  check(s,AH,'unchanged source after mutations',true);
});
test('W5s-ah: 35d real consumer, factory, freight and two independent companies',()=>{
  for(const seed of [42,7]){
    const s=funded(seed,BASE),w=s.w5n,
      b={water:w.wasserVerbraucht,factory:w.fabrikFertig,
        ice:w.frachtAbgeschlossen,ore:s.w3.abgeschlossen};
    for(let d=1;d<=35;d++){
      api.advance(s,1440,AH);
      check(s,AH,'real consumption '+seed+' d'+d,d===35);
    }
    const result={seed,water:w.wasserVerbraucht-b.water,
      factory:w.fabrikFertig-b.factory,ice:w.frachtAbgeschlossen-b.ice,
      ore:s.w3.abgeschlossen-b.ore,
      wages:s.w5s.transferPilotWages,events:s.w5s.transferPilotPays.length,
      newCarrier:s.owners.w5s_carrier3.cash,
      otherCarrier:s.owners.w5s_carrier2.cash,
      jobs:s.w5s.newCarrierOrder.trips+(s.w5s.newCarrierOrder.oreTrips||0),
      worldISK:money(s),hash:api.hash(s)};
    assert.equal(result.water,1490);
    assert.equal(result.factory,150);
    assert.equal(result.ice,30);
    assert.equal(result.wages,1080);
    assert.equal(result.events,2);
    assert.equal(result.newCarrier,1080);
    assert.equal(result.otherCarrier,720);
    assert.ok(result.jobs>0,'original orders fully paid');
    assert.equal(result.worldISK,33000);
    assert.equal(s.minted,0);
    assert.equal(s.burned,0);
    console.log('W5S_AH_35D '+JSON.stringify(result));
  }
});
test('W5s-ah: thirteen 90d deterministic seeded worlds with strict money/audit gates',()=>{
  for(const seed of seeds){
    const s=api.createW5RState(seed,'full','npc3');
    for(let day=1;day<=90;day++){
      api.advance(s,1440,AH);
      if(day%30===0)check(s,AH,'13x90 seed '+seed+' d'+day,day===90);
    }
    assert.equal(s.owners.w5s_carrier3,undefined,'no phantom company');
    assert.equal(s.minted,0);
  }
});
test('W5s-ah: Seed 42 and 7 exact day365 replay with paid but finite household income',()=>{
  for(const seed of [42,7]){
    const s=funded(seed,BASE),w=s.w5n,
      b={water:w.wasserVerbraucht,factory:w.fabrikFertig,ice:w.frachtAbgeschlossen};
    for(let day=Math.floor(s.tick/1440)+1;day<=365;day++){
      api.advance(s,1440-(s.tick%1440),AH);
      check(s,AH,'365d seed '+seed+' d'+day,day%30===0||day===365);
    }
    assert.equal(w.wasserVerbraucht-b.water,1490);
    assert.equal(w.fabrikFertig-b.factory,150);
    assert.equal(w.frachtAbgeschlossen-b.ice,30);
    assert.equal(s.w5s.transferPilotWages,1080);
    assert.equal(s.owners.w5s_transfer_pilot.cash,0);
    assert.equal(s.owners.w5n_kunden.cash,9,'finite income cannot buy 14-ISK water');
    assert.equal(s.owners.w5s_carrier3.cash,1080);
    assert.equal(money(s),33000);
    assert.equal(api.hash(s),hashes[seed]);
    console.log('W5S_AH_365 '+JSON.stringify({seed,
      wages:s.w5s.transferPilotWages,waterUnits:w.wasserVerbraucht,
      company:s.owners.w5s_carrier3.cash,household:s.owners.w5n_kunden.cash,
      hash:api.hash(s)}));
  }
});
