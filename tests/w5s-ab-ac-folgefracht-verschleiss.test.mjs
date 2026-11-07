import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const BASE={...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,autoNpcOre:true,
  prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,retainFleetEarnings:true,
  carrierWorkingCapital:true,autoOreSettlement:true,autoTakeover:true,autoNpcVenture:true,
  autoOreWageHousehold:true,autoIndustryWages:true,onDemandMaintenance:true,
  independentSuccessor:true,successorFreight:true,successorOperations:true,
  successorOreFreight:true,successorNewOrder:true,successorNewPurchase:true
}};
const RULES={...BASE,w5s:{...BASE.w5s,
  successorNewFreight:true,successorNewAuto:true,successorNewWear:true}};
const OFF={...BASE,w5s:{...BASE.w5s,successorNewFreight:false,
  successorNewAuto:false,successorNewWear:false}};
const allCash=s=>Object.values(s.owners).reduce((n,x)=>n+x.cash,0);
function proof(s,r,label,save=true){
  const a=api.audit(s),f=api.w5sFinanzStatus(s,r);
  assert.equal(a.ok,true,label+': original core audit '+JSON.stringify(
    Object.fromEntries(Object.entries(a).filter(([,v])=>v?.ok===false).map(([k])=>[k,false]))));
  assert.equal(f.ok,true,label+': finances');
  assert.equal(a.w5s?.newCarrierOrder?.ok,true,label+': true third owner');
  assert.equal(allCash(s),33000,label+': money conservation');
  assert.equal(s.minted,0,label+': no emission');assert.equal(s.burned,0,label+': no burn');
  if(save)assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),label+': save/load');
}
function build(seed,r=RULES){
  const s=api.createW5RState(seed,'full','npc3');
  for(let day=1;day<=120;day++)api.advance(s,1440,r);
  for(const [type,owner,fields] of [
    ['stationRefine','st_nadir',{station:'st_nadir'}],
    ['stationBuildShip','werft_extern',{station:'st_nadir'}],
    ['shipFoundCarrier','export',{}],
    ['shipBuy','w5s_carrier2',{station:'st_nadir',klasse:'frachter'}]
  ]){
    const a=api.execute(s,{type,owner,...fields},r);
    assert.equal(a.ok,true,type+': '+a.reason);
    while(s.w4.auftrag||s.w5.auftrag)api.advance(s,1,r);
  }
  for(let d=1;d<=35;d++)api.advance(s,1440,r);
  assert.equal(s.owners.w5s_carrier2.cash,720,'old separate company not helped');
  const pre=api.execute(s,{type:'shipPrepayNewCarrier',owner:'export'},r);
  assert.equal(pre.ok,true,'real buyer prepay '+pre.reason);
  for(let i=0;i<600&&s.w5s.newCarrierOrder.stage!=='hull_ready';i++)
    api.advance(s,1,r);
  assert.equal(s.w5s.newCarrierOrder.stage,'hull_ready','original W4/W5 physical hull');
  const buy=api.execute(s,{type:'shipClaimNewCarrier',owner:'export'},r);
  assert.equal(buy.ok,true,'real buyer original W5 purchase '+buy.reason);
  const id=s.w5s.newCarrierOrder.ship;
  const trip=api.execute(s,{type:'shipReposition',owner:'w5s_carrier3',schiff:id},r);
  assert.equal(trip.ok,true,'original 60-ISK-pilot flight '+trip.reason);
  api.advance(s,60,r);
  assert.equal(s.w5s.newCarrierOrder.stage,'arrived');
  assert.equal(s.owners.w5s_carrier3.cash,120);
  assert.equal(s.ships[id]?.system,'aldera');
  proof(s,r,'new owner has paid hull/flight');
  return s;
}
test('W5s-ab: two original paid carriers, no third-company free W3/ore customer',()=>{
 for(const seed of [42,7]){
  const s=build(seed),o=s.w5s.newCarrierOrder,old=s.w5s.successor;
  const p=api.w5sNewCarrierFreight(s,RULES);
  const offer=api.execute(s,{type:'shipFreight',owner:o.buyer,schiff:o.ship},RULES);
  assert.equal(offer.ok,!!p.command,'only validated original W3 freight');
  if(offer.ok){
    assert.equal(s.w3.auftrag.owner,o.buyer);
    assert.equal(s.owners.w3_arbeit_treuhand.cash,120,'real wages escrow');
    assert.equal(s.owners.w3_kauf_treuhand.cash,640,'real buyer upfront');
    api.advance(s,120,RULES);
    assert.equal(o.oreTrips,1,'real W3 roundtrip');
    assert.equal(o.oreFreightRevenue,240,'receipt after delivery and return');
    assert.equal(o.oreWorkPaid,120,'120 real pilot minutes');
  }else{
    assert.equal(p.command,null,'no fabricated demand/route');
    assert.equal(s.w3.auftrag,null);
    assert.equal(o.oreTrips||0,0,'no phantom trip');
    assert.equal(s.owners[o.buyer].cash,120,'cash cannot change without work');
  }
  assert.equal(s.owners[old.owner].cash,720,'old firm not subsidized');
  proof(s,RULES,'seed '+seed+' real offer and authentic rejection');
  console.log('W5S_AB_REAL '+JSON.stringify({seed,license:p.stage,
    reason:p.grund??null,ship:o.ship,cash:s.owners[o.buyer].cash,
    realTrips:o.oreTrips||0,hash:api.hash(s)}));
 }
});
test('W5s-ac: physical 30d wear of new independent carrier, no rescue (42/7)',()=>{
 for(const seed of [42,7]){
  const s=build(seed),o=s.w5s.newCarrierOrder,id=o.ship,bought=o.bought;
  let retiredAt=null;
  for(let d=1;d<=35;d++){
    api.advance(s,1440,RULES);
    proof(s,RULES,'wear seed '+seed+' day '+d,d%7===0||d===35);
    if(o.retired&&!retiredAt)retiredAt=o.retired.tick;
  }
  assert.equal(o.stage,'retired','no immortal hull');
  assert.equal(o.retired?.reason,'verschleiss','genuine wear cause');
  assert.ok(retiredAt>=bought+30*1440,'not before 30 game days');
  assert.equal(retiredAt%1440,0,'never while flying and never mid-day');
  assert.equal(s.ships[id],undefined,'physically removed new ship');
  assert.equal(s.owners.w5s_carrier2.cash,720,'no rescue of first successor');
  assert.equal(s.owners.w5s_new_carrier_reserved.cash,0,'no duplicate reserve');
  assert.equal(api.execute(s,{type:'shipFreight',owner:o.buyer,schiff:id},RULES).ok,
    false,'retired ship does not work');
  assert.equal(api.w5sNewCarrierFreight(s,RULES).command,undefined);
  console.log('W5S_AC_WEAR '+JSON.stringify({seed,ship:id,retiredAt,bought,
    realTrips:o.oreTrips||0,cash:s.owners[o.buyer].cash,hash:api.hash(s)}));
 }
});
test('W5s-ab/ac: opt-out remains pure W5s-aa, 30d old/new owners distinct',()=>{
 const s=build(42,OFF),o=s.w5s.newCarrierOrder,id=o.ship;
 const plan=api.w5sNewCarrierFreight(s,OFF);
 assert.equal(plan.stage,'inaktiv');
 assert.equal(api.execute(s,{type:'shipFreight',owner:o.buyer,schiff:id},OFF).ok,false);
 api.advance(s,35*1440,OFF);
 assert.equal(o.stage,'arrived','unapproved wear not silently activated');
 assert.equal(s.ships[id]?.owner,o.buyer);
 assert.equal(s.owners[o.buyer].cash,120);
 proof(s,OFF,'flag-off reference');
});
test('W5s-ac: 365d fully ledger-audited successors, save/load and replay',()=>{
 for(const seed of [42,7]){
  const s=build(seed),start=Math.floor(s.tick/1440);
  for(let day=start+1;day<=365;day++){
    const rem=1440-(s.tick%1440);
    api.advance(s,rem,RULES);
    proof(s,RULES,'day '+day+' seed '+seed,day%30===0||day===365);
  }
  assert.equal(s.w5s.newCarrierOrder.stage,'retired');
  assert.equal(s.owners.w5s_carrier2.cash,720);
  assert.equal(api.audit(s).goods.ok,true);
  console.log('W5S_AB_AC_365 '+JSON.stringify({seed,hash:api.hash(s),
    paidTrips:s.w5s.newCarrierOrder.oreTrips||0,
    newCash:s.owners.w5s_carrier3.cash,oldCash:s.owners.w5s_carrier2.cash,
    day:Math.floor(s.tick/1440),minted:s.minted}));
 }
});
test('W5s-ab/ac: falsified ship loss, margins and fictional freight fail audit',()=>{
 const s=build(42),o=s.w5s.newCarrierOrder;
 api.advance(s,35*1440,RULES);
 proof(s,RULES,'before tampering');
 const mutations=[
  t=>t.w5s.newCarrierOrder.retired.tick-=1440*5,
  t=>t.w5s.newCarrierOrder.retired.id='shFAKE',
  t=>t.w5s.newCarrierOrder.oreTrips=1,
  t=>t.w5s.newCarrierOrder.oreWorkPaid=120,
  t=>t.w5s.newCarrierOrder.oreFreightRevenue=240,
  t=>t.w5s.newCarrierOrder.autoOrders=[{type:'shipFreight',ship:'shFAKE',tick:t.tick}]
 ];
 for(const [i,change] of mutations.entries()){
  const t=api.loadW5R(api.save(s));change(t);
  assert.equal(api.audit(t).ok,false,'tampering rejected '+i);
 }
});
