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

// W5s-aj is test-only research of the EXISTING W5q gated experiment.
// It does not change the game core, prices, production or default rules.
// Money model B emission/recipients/rates are NOT approved product rules.
function scenario(seed,mode='off',rate=0,cap=0){
  const s=funded(seed,BASE);
  if(mode!=='off')Object.assign(s.w5q,{
    mode,rate,dayCap:rate*10,totalCap:cap});
  return {s,startWater:s.w5n.wasserVerbraucht};
}
function audited(s,label,save=false){
  const a=api.audit(s);
  assert.equal(a.ok,true,label+': '+JSON.stringify(
    Object.keys(a).filter(k=>a[k]?.ok===false)));
  assert.equal(api.w5sFinanzStatus(s,AI).ok,true,label+': financed owners');
  assert.equal(money(s),33000+s.minted,label+': exact issued total');
  assert.equal(s.minted,s.w5q.minted,label+': W5q source');
  assert.equal(s.burned,0,label+': no burn');
  assert.ok(s.minted<=s.w5q.totalCap,label+': bounded issue');
  if(save)assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
    label+': save/load exact');
}
function runTo(s,lastDay,label){
  for(let d=Math.floor(s.tick/1440)+1;d<=lastDay;d++){
    api.advance(s,1440-(s.tick%1440),AI);
    if(d%15===0||d===lastDay)audited(s,label+' day '+d,d%60===0||d===lastDay);
  }
}
test('W5s-aj: no export, no emission is still the authoritative W5s-ai baseline',()=>{
  for(const seed of [42,7]){
    const {s,startWater}=scenario(seed);
    runTo(s,365,'off '+seed);
    assert.equal(s.w5q.exported,0);
    assert.equal(s.minted,0);
    assert.equal(s.w5n.wasserVerbraucht-startWater,1524);
    assert.equal(s.owners.w5n_kunden.cash,8);
    assert.equal(api.hash(s),expected365[seed]);
  }
});
test('W5s-aj: 500 real exported water units, 7000 audited ISK and finite 425d consumer stall',()=>{
  const hashes={42:'3731b9b2f70efbf4',7:'da311751ca38b39c'};
  const at365={42:'fb4bc7079fa2d2a7',7:'237e20efdc599179'};
  for(const seed of [42,7]){
    const {s,startWater}=scenario(seed,'household',14,7000);
    runTo(s,365,'household7k '+seed);
    assert.equal(s.w5q.exported,500);
    assert.equal(s.ledger.wasser.exported,500);
    assert.equal(s.w5q.events.length,50);
    assert.equal(s.minted,7000);
    assert.equal(s.w5q.payout,7000);
    assert.equal(s.owners.w5n_kunden.cash,2082);
    assert.equal(s.w5n.wasserVerbraucht-startWater,10072);
    assert.equal(api.hash(s),at365[seed]);
    runTo(s,425,'finite household '+seed);
    assert.equal(s.minted,7000,'never issues beyond cap');
    assert.equal(s.w5q.exported,500,'no fake repeat export');
    assert.equal(s.owners.w5n_kunden.cash,8,'household no longer buys 14 ISK water');
    assert.equal(s.w5n.wasserVerbraucht-startWater,12174);
    assert.equal(api.hash(s),hashes[seed]);
    console.log('W5S_AJ_FINITE '+JSON.stringify({seed,minted:s.minted,
      realExport:s.w5q.exported,additionalWater:s.w5n.wasserVerbraucht-startWater,
      household:s.owners.w5n_kunden.cash,hash:api.hash(s)}));
  }
});
test('W5s-aj: existing W5q price/cap/recipient scenarios have different real outcomes',()=>{
  for(const [mode,rate,cap,units,consumed,house,hash] of [
    ['household',7,3500,500,9230,7,'175e4b55783abfe5'],
    ['household',14,3500,250,6990,9,'b7861cc51469b772'],
    ['station',14,7000,500,7066,3,'38e90d35d5e8bb7a']
  ]){
    const {s,startWater}=scenario(42,mode,rate,cap);
    runTo(s,365,'alternative '+mode+rate+cap);
    assert.equal(s.w5q.exported,units);
    assert.equal(s.minted,cap);
    assert.equal(s.w5n.wasserVerbraucht-startWater,consumed);
    assert.equal(s.owners.w5n_kunden.cash,house);
    assert.equal(s.w5q.payout,mode==='household'?cap:0,
      'routing only as original W5q recorded');
    assert.equal(api.hash(s),hash);
    console.log('W5S_AJ_ALTERNATIVE '+JSON.stringify({mode,rate,cap,
      exported:units,consumption:consumed,household:house,hash}));
  }
});
test('W5s-aj: fraudulent money, water, recipients and event timestamps never pass global audit',()=>{
  const {s}=scenario(42,'household',14,7000);
  runTo(s,160,'legitimate original export');
  assert.ok(s.w5q.events.length>0);
  const original=api.save(s),hash=api.hash(s);
  for(const change of [
    x=>{x.minted++;},
    x=>{x.w5q.minted++;},
    x=>{x.w5q.events[0].units++;},
    x=>{x.w5q.events[0].tick++;},
    x=>{x.ledger.wasser.exported++;},
    x=>{x.owners.w5n_kunden.cash++;}
  ]){
    const fake=api.loadW5R(original);
    change(fake);
    assert.equal(api.audit(fake).ok,false,'no unearned ISK, water or payment');
  }
  assert.equal(api.hash(s),hash);
  audited(s,'genuine export remains intact',true);
});
