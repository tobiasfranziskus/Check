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

const AI={...AH,w5s:{...AH.w5s,successorResolvedHullRelease:true}};
const expected365={42:'901bc06267beadbc',7:'8ec3b4959cdd72d7'};
function beforeRedemption(seed=42){
  const s=funded(seed,BASE);
  for(let day=1;day<=30;day++)api.advance(s,1440,AH);
  assert.equal(s.w5s.newCarrierOrder.stage,'arrived');
  assert.equal(s.w5s.contract.stage,'reserved');
  assert.equal(s.w5s.contract.owner,'transport');
  assert.equal(s.w5s.contract.type,'frachter');
  assert.equal(s.owners.w5s_order_reserved.cash,810);
  assert.equal(s.owners.transport.cash,240);
  assert.equal(s.stations.st_nadir.lager.frachter,1);
  check(s,AH,'prepaid W5s replacement',true);
  return s;
}
function beforeThirdPartyPurchase(seed=42){
  const s=api.createW5RState(seed,'full','npc3');
  for(let day=1;day<=120;day++)api.advance(s,1440,BASE);
  for(const [type,owner,fields]of [
    ['stationRefine','st_nadir',{station:'st_nadir'}],
    ['stationBuildShip','werft_extern',{station:'st_nadir'}],
    ['shipFoundCarrier','export',{}],
    ['shipBuy','w5s_carrier2',{station:'st_nadir',klasse:'frachter'}]
  ]){
    const result=api.execute(s,{type,owner,...fields},BASE);
    assert.equal(result.ok,true,type+': '+result.reason);
    while(s.w4.auftrag||s.w5.auftrag)api.advance(s,1,BASE);
  }
  for(let day=0;day<35;day++)api.advance(s,1440,BASE);
  assert.equal(api.execute(s,{type:'shipPrepayNewCarrier',owner:'export'},BASE).ok,true);
  for(let i=0;i<600&&s.w5s.newCarrierOrder.stage!=='hull_ready';i++)
    api.advance(s,1,BASE);
  assert.equal(s.w5s.newCarrierOrder.stage,'hull_ready');
  check(s,BASE,'third party original purchase still reserved',true);
  return s;
}
test('W5s-ai: unchanged historical rule still blocks transport already prepaid in old research',()=>{
  for(const seed of [42,7]){
    const s=beforeRedemption(seed),hash=api.hash(s);
    api.advance(s,60,AH);
    assert.equal(s.w5s.contract.stage,'reserved');
    assert.equal(s.owners.w5s_order_reserved.cash,810);
    assert.equal(s.stations.st_nadir.lager.frachter,1);
    assert.equal(s.w5.verkauft,7);
    assert.notEqual(api.hash(s),hash,'time advances, but no free buy');
    check(s,AH,'W5s-ah never silently changes '+seed,true);
  }
});
test('W5s-ai: original privately prepaid third-party hull remains completely protected',()=>{
  for(const seed of [42,7]){
    const s=beforeThirdPartyPurchase(seed),hash=api.hash(s);
    const denied=api.execute(s,{type:'shipBuy',owner:'export',
      station:'st_nadir',klasse:'frachter'},AI);
    assert.equal(denied.ok,false);
    assert.match(denied.reason,/Fremdhuelle/);
    assert.equal(s.owners.w5s_new_carrier_reserved.cash,930);
    assert.equal(s.stations.st_nadir.lager.frachter,1);
    assert.equal(api.hash(s),hash,'forbidden purchase is transactionally inert');
    check(s,AI,'third hull protected '+seed,true);
  }
});
test('W5s-ai: original 810 ISK prepayment pays W5 hull and real flight separately',()=>{
  for(const seed of [42,7]){
    const s=beforeRedemption(seed),oldShipCount=s.w5.verkauft;
    api.advance(s,60,AI);
    assert.equal(s.w5s.contract.stage,'bought');
    assert.equal(s.w5s.contract.owner,'transport');
    assert.equal(s.w5.verkauft,oldShipCount+1);
    assert.equal(s.owners.w5s_order_reserved.cash,60);
    assert.equal(s.owners.transport.cash,240);
    assert.equal(s.stations.st_nadir.lager.frachter,0);
    const id=s.w5s.contract.ship;
    assert.ok(s.w5.schiffIds.includes(id));
    assert.equal(s.ships[id].owner,'transport');
    assert.equal(s.ships[id].klasse,'frachter');
    check(s,AI,'original purchase '+seed,true);
    api.advance(s,60,AI);
    assert.equal(s.w5s.contract.stage,'inflight');
    assert.equal(s.owners.w5s_order_reserved.cash,0);
    assert.equal(s.owners.transport.cash,240);
    check(s,AI,'real flight fully bound '+seed,true);
    api.advance(s,60,AI);
    const records=[...(s.w5s.orderHistory||[]),s.w5s.contract];
    const delivered=records.find(x=>x.owner==='transport'&&x.ship===id);
    assert.equal(delivered?.stage,'completed');
    assert.equal(delivered?.price,750);
    assert.equal(delivered?.wage,60);
    assert.ok(s.w5s.completed.some(x=>x.id===id&&x.owner==='transport'));
    check(s,AI,'real delivery '+seed,true);
  }
});
test('W5s-ai: ownership, 750+60 and physical hull cannot be forged or reused',()=>{
  const s=beforeRedemption();
  api.advance(s,60,AI);
  const original=api.save(s),hash=api.hash(s);
  for(const falsify of [
    x=>{x.w5s.contract.price++;},
    x=>{x.w5s.contract.ship='shFAKE';},
    x=>{x.owners.w5s_order_reserved.cash++;},
    x=>{x.w5.schiffIds.pop();},
    x=>{x.ships[x.w5s.contract.ship].owner='w5s_carrier2';}
  ]){
    const x=api.loadW5R(original);
    falsify(x);
    assert.equal(api.audit(x).ok,false,'no manipulated asset or accounts');
  }
  const again=api.execute(s,{type:'shipBuy',owner:'transport',
    station:'st_nadir',klasse:'frachter'},AI);
  assert.equal(again.ok,false,'no free second hull');
  assert.equal(api.hash(s),hash,'rejected duplicate cannot mutate');
  check(s,AI,'legitimate ledgers untouched',true);
});
test('W5s-ai: 13x90 inactive worlds do not acquire fictional freight or cash',()=>{
  for(const seed of seeds){
    const s=api.createW5RState(seed,'full','npc3');
    for(let day=1;day<=90;day++){
      api.advance(s,1440,AI);
      if(day%30===0)check(s,AI,'13x90 seed '+seed+' '+day,day===90);
    }
    assert.equal(s.w5s?.newCarrierOrder,undefined);
    assert.equal(s.minted,0);
  }
});
test('W5s-ai: Seed42/7 365d real recovered carrier and complete independent ledgers',()=>{
  for(const seed of [42,7]){
    const s=funded(seed,BASE),w=s.w5n,b={
      water:w.wasserVerbraucht,plant:w.fabrikFertig,ice:w.frachtAbgeschlossen,
      ore:s.w3.abgeschlossen,hulls:s.w5.verkauft};
    for(let day=Math.floor(s.tick/1440)+1;day<=365;day++){
      api.advance(s,1440-(s.tick%1440),AI);
      check(s,AI,'365d '+seed+' day '+day,day%30===0||day===365);
    }
    assert.equal(w.wasserVerbraucht-b.water,1524);
    assert.equal(w.fabrikFertig-b.plant,154);
    assert.equal(w.frachtAbgeschlossen-b.ice,31);
    assert.equal(s.w3.abgeschlossen-b.ore,3);
    assert.equal(s.w5.verkauft-b.hulls,2);
    assert.equal(s.owners.w5n_kunden.cash,8,'no artificial consumer capital');
    assert.equal(s.owners.w5s_carrier3.cash,480);
    assert.equal(s.owners.w5s_carrier2.cash,720);
    assert.equal(s.owners.transport.cash,240);
    assert.equal(s.owners.w5s_order_reserved.cash,0);
    assert.equal(money(s),33000);
    assert.equal(api.hash(s),expected365[seed]);
    console.log('W5S_AI_365 '+JSON.stringify({seed,
      water:w.wasserVerbraucht,extraIce:w.frachtAbgeschlossen-b.ice,
      extraSoldHulls:s.w5.verkauft-b.hulls,
      customer:s.owners.w5n_kunden.cash,transport:s.owners.transport.cash,
      money:money(s),hash:api.hash(s)}));
  }
});
