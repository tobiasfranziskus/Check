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

// W5s-al is a test-only R32 experiment: existing W5q mode='station'.
// External export pays the actual warehouse owner. No new civil income
// or transfer entitlement is implemented. ALL rules remain Default OFF.
const alSeeds=[42,7];
function stationWorld(seed,rate,totalCap){
  const s=funded(seed,BASE);
  const initial={water:s.w5n.wasserVerbraucht,
    factory:s.w5n.fabrikFertig,
    freight:s.w5n.frachtAbgeschlossen,
    wages:s.w5o.lohnEis+s.w5o.lohnFracht+s.w5o.lohnWasser,
    dividend:s.w5o.divStation};
  Object.assign(s.w5q,{mode:'station',rate,dayCap:rate*10,totalCap});
  assert.equal(api.audit(s).ok,true,'opt-in W5q starts from valid paid R32');
  return {s,initial};
}
function stationAudit(s,label,save=false){
  const a=api.audit(s);
  assert.equal(a.ok,true,label+': failed '+Object.keys(a).filter(k=>a[k]?.ok===false));
  assert.equal(api.w5sFinanzStatus(s,AI).ok,true,label+': R32 owner/work audit');
  const q=s.w5q;
  assert.equal(q.mode,'station');
  assert.equal(q.payout,0,label+': no unsupported household grant');
  assert.equal(q.stationNet,q.minted,label+': export belongs to station');
  assert.equal(s.minted,q.minted,label+': no second source of emitted money');
  assert.equal(s.burned,0);
  assert.equal(money(s),33000+q.minted,label+': all world accounts sum correctly');
  assert.ok(q.minted<=q.totalCap,label+': finite global experiment cap');
  assert.equal(s.ledger.wasser.exported,q.exported,
    label+': physically removed export inventory');
  assert.equal(s.stations.st_nadir.lager.wasser,
    s.w5n.wasserProduziert-s.w5n.wasserVerbraucht-q.exported,
    label+': one physical unit is consumed or exported, never both');
  const income=s.w5o.ausgezahlt+(s.w5s?.orePilotWages??0)
    +Object.values(s.w5s?.industryWages?.paid??{}).reduce((a,b)=>a+b,0)
    +(s.w5s?.transferPilotWages??0);
  const originalCash=BASE.owners.find(o=>o.id==='w5n_kunden').cash;
  assert.equal(s.owners.w5n_kunden.cash,
    originalCash+income-s.w5n.wasserErlos,
    label+': consumer has ONLY proven wages/dividends, never W5q grant');
  let emitted=0,units=0,prev=0;
  const days=new Set();
  for(const e of q.events){
    assert.equal(e.mode,'station');
    assert.equal(e.amount,e.units*q.rate);
    assert.ok(e.units>=1&&e.units<=10,'real export only');
    assert.ok(e.amount<=q.dayCap,'whole-world daily cap');
    assert.ok(e.tick%1440===0&&e.tick>prev&&e.tick<=s.tick);
    assert.equal(e.tick/1440,e.day);
    assert.ok(!days.has(e.day),'never two export payouts per day');
    days.add(e.day);emitted+=e.amount;units+=e.units;prev=e.tick;
  }
  assert.equal(emitted,q.minted);
  assert.equal(units,q.exported);
  assert.equal(q.events.length,days.size);
  if(save)assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
    label+': old schema JSON Save/Load exact');
}
function stationUntil(s,finish,label,markers=[]){
  const checks={};
  for(let day=Math.floor(s.tick/1440)+1;day<=finish;day++){
    api.advance(s,1440-s.tick%1440,AI);
    if(day%30===0||day===finish)stationAudit(s,label+' d'+day,
      day===finish||day%90===0);
    if(markers.includes(day))checks[day]={
      water:s.w5n.wasserVerbraucht,
      house:s.owners.w5n_kunden.cash,
      exported:s.w5q.exported,minted:s.minted,
      freight:s.w5n.frachtAbgeschlossen,
      factory:s.w5n.fabrikFertig,hash:api.hash(s)};
  }
  return checks;
}
test('W5s-al: existing W5s-ai remains OFF with no external money',()=>{
  for(const seed of alSeeds){
    const s=funded(seed,BASE);
    for(let day=Math.floor(s.tick/1440)+1;day<=365;day++)
      api.advance(s,1440-s.tick%1440,AI);
    assert.equal(s.w5q.mode,'off');
    assert.equal(s.minted,0);
    assert.equal(s.w5q.exported,0);
    assert.equal(s.owners.w5n_kunden.cash,8);
    assert.equal(api.hash(s),expected365[seed]);
    check(s,AI,'W5s-ai unchanged '+seed,true);
  }
});
test('W5s-al: station earns all 7000 ISK against 1000 real water at 7 ISK, BOTH crises until 425d',()=>{
  const hashes365={42:'5e33d6fe68d2328e',7:'f2a82c1b45806cc0'};
  const hashes425={42:'6d34f54a63578807',7:'ebf829230fb85fbe'};
  for(const seed of alSeeds){
    const {s,initial}=stationWorld(seed,7,7000);
    stationUntil(s,365,'station7 '+seed);
    assert.equal(s.w5q.exported,1000);
    assert.equal(s.w5q.minted,7000);
    assert.equal(s.w5q.events.length,100);
    assert.equal(s.w5n.wasserVerbraucht-initial.water,10072);
    assert.equal(s.w5n.fabrikFertig-initial.factory,1108);
    assert.equal(s.w5n.frachtAbgeschlossen-initial.freight,222);
    assert.equal(s.owners.w5n_kunden.cash,1262);
    assert.equal(s.owners.st_nadir.cash,5172);
    assert.ok(s.w5o.divStation>initial.dividend);
    assert.ok(s.w5o.lohnEis+s.w5o.lohnFracht+s.w5o.lohnWasser>initial.wages);
    assert.equal(api.hash(s),hashes365[seed]);
    stationUntil(s,425,'station7 finite '+seed);
    assert.equal(s.w5n.wasserVerbraucht-initial.water,11389);
    assert.equal(s.owners.w5n_kunden.cash,11,
      'end demand eventually stalls; station profit not household money');
    assert.equal(s.w5q.minted,7000,'no recharge at cap');
    assert.equal(s.owners.st_nadir.cash,6673);
    assert.equal(api.hash(s),hashes425[seed]);
    console.log('W5S_AL_STATION7 '+JSON.stringify({seed,
      exports:s.w5q.exported,minted:s.minted,
      waterSold:s.w5n.wasserVerbraucht-initial.water,
      house:s.owners.w5n_kunden.cash,station:s.owners.st_nadir.cash,
      hash:api.hash(s)}));
  }
});
test('W5s-al: 14 ISK per real exported unit spends same 7000 faster and stops earlier',()=>{
  const hashes365={42:'38e90d35d5e8bb7a',7:'66499e5f09c1a469'};
  const hashes425={42:'aee78db10bd85f72',7:'2b7ea4aca76ebe53'};
  for(const seed of alSeeds){
    const {s,initial}=stationWorld(seed,14,7000);
    stationUntil(s,365,'station14 '+seed);
    assert.equal(s.w5q.exported,500);
    assert.equal(s.w5q.minted,7000);
    assert.equal(s.w5q.events.length,50);
    assert.equal(s.w5n.wasserVerbraucht-initial.water,7066);
    assert.equal(s.w5n.fabrikFertig-initial.factory,758);
    assert.equal(s.w5n.frachtAbgeschlossen-initial.freight,152);
    assert.equal(s.owners.st_nadir.cash,6841);
    assert.equal(s.owners.w5n_kunden.cash,3);
    assert.equal(api.hash(s),hashes365[seed]);
    stationUntil(s,425,'station14 finite '+seed);
    assert.equal(s.w5n.wasserVerbraucht-initial.water,7066,
      'no paid production after end demand');
    assert.equal(s.owners.w5n_kunden.cash,3);
    assert.equal(api.hash(s),hashes425[seed]);
  }
});
test('W5s-al: 3500-ISK global cap comparison is real merchandise, not wallet rescue',()=>{
  for(const [rate,units,water,plant,freights,station,hash] of [
    [7,500,6436,695,139,5017,'9a7d65a7ab1c6840'],
    [14,250,4236,450,90,3787,'3cec3c0b677dae75']
  ]){
    const {s,initial}=stationWorld(42,rate,3500);
    stationUntil(s,365,'station cap3500 rate'+rate);
    assert.equal(s.w5q.exported,units);
    assert.equal(s.minted,3500);
    assert.equal(s.w5n.wasserVerbraucht-initial.water,water);
    assert.equal(s.w5n.fabrikFertig-initial.factory,plant);
    assert.equal(s.w5n.frachtAbgeschlossen-initial.freight,freights);
    assert.equal(s.owners.st_nadir.cash,station);
    assert.equal(s.owners.w5n_kunden.cash,7);
    assert.equal(api.hash(s),hash);
  }
});
test('W5s-al: negative controls prohibit double counting, false export, or consumer subsidy',()=>{
  const {s}=stationWorld(42,7,3500);
  stationUntil(s,160,'real first owner export', [160]);
  assert.ok(s.w5q.events.length>=1);
  assert.equal(s.w5q.payout,0);
  const original=api.save(s),hash=api.hash(s);
  for(const corrupt of [
    x=>{x.minted++;},
    x=>{x.w5q.events[0].amount++;},
    x=>{x.w5q.events[0].units++;},
    x=>{x.w5q.events[0].day++;},
    x=>{x.ledger.wasser.exported++;},
    x=>{x.owners.st_nadir.cash++;},
    x=>{x.owners.w5n_kunden.cash++;},
    x=>{x.w5q.payout=7;},
    x=>{x.w5q.stationNet--;}
  ]){
    const x=api.loadW5R(original);corrupt(x);
    assert.equal(api.audit(x).ok,false,'fraud not accepted');
  }
  assert.equal(api.hash(s),hash,'test mutations not applied to production state');
  stationAudit(s,'genuine proofs after independent mutations',true);
  const s2=api.loadW5R(original);
  for(let day=161;day<=180;day++){
    api.advance(s,1440-s.tick%1440,AI);
    api.advance(s2,1440-s2.tick%1440,AI);
  }
  assert.equal(api.hash(s2),api.hash(s),'exact reload continuation');
  stationAudit(s2,'reload exact',true);
});
test('W5s-al: 13×90 days mixed seeds never pay an unearned station-to-customer transfer',()=>{
  for(const seed of seeds){
    const s=api.createW5RState(seed,'full','npc3');
    Object.assign(s.w5q,{mode:'station',rate:7,dayCap:70,totalCap:1400});
    for(let day=1;day<=90;day++){
      api.advance(s,1440,AI);
      if(day%15===0)stationAudit(s,'R32 90d seed '+seed+' d'+day,day===90);
    }
    assert.equal(s.w5q.payout,0,'no household handouts');
    assert.ok(s.minted<=1400);
  }
});
