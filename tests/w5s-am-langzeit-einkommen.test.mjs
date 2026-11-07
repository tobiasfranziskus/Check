import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Existing and unchanged R32 core. No second simulator, no cash injection.
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
const AH={...ON,w5s:{...ON.w5s,autoTransferWageHousehold:true}};
const AI={...AH,w5s:{...AH.w5s,successorResolvedHullRelease:true}};
function income(s){
  const paid=Object.values(s.w5s?.industryWages?.paid??{}).reduce((n,x)=>n+x,0);
  return s.w5o.ausgezahlt+(s.w5s?.orePilotWages??0)
    +paid+(s.w5s?.transferPilotWages??0);
}
function check(s,tag){
  const a=api.audit(s);
  assert.equal(a.ok,true,tag+': core '+JSON.stringify(Object.keys(a).filter(k=>a[k]?.ok===false)));
  assert.equal(api.w5sFinanzStatus(s,AI).ok,true,tag+': ownership/work');
  const q=s.w5q;
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000+q.minted);
  assert.equal(s.minted,q.minted);
  assert.equal(s.burned,0);
  assert.equal(q.mode,'station');
  assert.equal(q.payout,0,'no household export gift');
  assert.equal(q.stationNet,q.minted,'only station owns sale income');
  assert.ok(q.minted<=q.totalCap,'one-off global research budget');
  assert.equal(s.ledger.wasser.exported,q.exported);
  assert.equal(s.stations.st_nadir.lager.wasser,
    s.w5n.wasserProduziert-s.w5n.wasserVerbraucht-q.exported);
  assert.equal(s.owners.w5n_kunden.cash,1400+income(s)-s.w5n.wasserErlos,
    'household income must be wages/earned profit, not export gift');
}
function startup(seed){
  const s=api.createW5RState(seed,'full','npc3');
  for(let d=0;d<120;d++)api.advance(s,1440,BASE);
  for(const [type,owner,fields] of [
    ['stationRefine','st_nadir',{station:'st_nadir'}],
    ['stationBuildShip','werft_extern',{station:'st_nadir'}],
    ['shipFoundCarrier','export',{}],
    ['shipBuy','w5s_carrier2',{station:'st_nadir',klasse:'frachter'}]
  ]){
    const out=api.execute(s,{type,owner,...fields},BASE);
    assert.equal(out.ok,true,type+': '+out.reason);
    while(s.w4.auftrag||s.w5.auftrag)api.advance(s,1,BASE);
  }
  for(let d=0;d<35;d++)api.advance(s,1440,BASE);
  assert.equal(api.execute(s,{type:'shipPrepayNewCarrier',owner:'export'},BASE).ok,true);
  for(let n=0;n<600&&s.w5s.newCarrierOrder.stage!=='hull_ready';n++)
    api.advance(s,1,BASE);
  assert.equal(s.w5s.newCarrierOrder.stage,'hull_ready');
  assert.equal(api.execute(s,{type:'shipClaimNewCarrier',owner:'export'},BASE).ok,true);
  assert.equal(api.execute(s,{type:'shipReposition',owner:'w5s_carrier3',
    schiff:s.w5s.newCarrierOrder.ship},BASE).ok,true);
  api.advance(s,60,BASE);
  assert.equal(s.w5s.newCarrierOrder.stage,'arrived');
  assert.equal(api.audit(s).ok,true);
  assert.equal(s.minted,0);
  Object.assign(s.w5q,{mode:'station',rate:7,dayCap:70,totalCap:7000});
  return s;
}
function snapshot(s){
  return {day:Math.floor(s.tick/1440),exportWater:s.w5q.exported,
    exportISK:s.w5q.minted,soldWater:s.w5n.wasserVerbraucht,
    waterMade:s.w5n.wasserProduziert,batches:s.w5n.fabrikFertig,
    iceFreights:s.w5n.frachtAbgeschlossen,stationISK:s.owners.st_nadir.cash,
    householdISK:s.owners.w5n_kunden.cash,
    realEarnedIncome:income(s),w5oSalary:s.w5o.lohnEis+s.w5o.lohnFracht+s.w5o.lohnWasser,
    industrySalary:Object.values(s.w5s.industryWages?.paid??{}).reduce((n,x)=>n+x,0),
    pilotSalary:(s.w5s.orePilotWages??0)+(s.w5s.transferPilotWages??0),
    dividends:s.w5o.divMine+s.w5o.divFracht+s.w5o.divStation,
    stationDividend:s.w5o.divStation,hash:api.hash(s)};
}
function run(s,until,seed,points){
  for(let day=Math.floor(s.tick/1440)+1;day<=until;day++){
    api.advance(s,1440-s.tick%1440,AI);
    if(day%30===0||day===until)check(s,'seed'+seed+' d'+day);
    if([365,425,550,730].includes(day)){
      assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),'JSON stable d'+day);
      points.push(snapshot(s));
    }
  }
}
test('W5s-am: real export owner, income flow and physical supply audited until day730 for crisis seeds 42/7',()=>{
  for(const seed of [42,7]){
    const s=startup(seed),before=snapshot(s),points=[];
    run(s,425,seed,points);
    const d365=points.find(p=>p.day===365),d425=points.find(p=>p.day===425);
    assert.equal(d365.exportWater,1000);
    assert.equal(d365.exportISK,7000);
    assert.equal(d365.soldWater-before.soldWater,10072,'same W5s-al reference world');
    assert.equal(d425.soldWater-before.soldWater,11389);
    assert.equal(d425.householdISK,11,'end-demand shortage is not a wallet defect');
    const reloaded=api.loadW5R(api.save(s));
    run(s,730,seed,points);
    run(reloaded,730,seed,[]);
    assert.equal(api.hash(reloaded),api.hash(s),'long-term Save/Load deterministic continuation');
    assert.equal(s.w5q.exported,1000,'exported stock never counted twice');
    assert.equal(s.w5q.minted,7000,'never auto-refill finite emission limit');
    assert.equal(s.w5q.payout,0);
    console.log('W5S_AM_PROFILE '+JSON.stringify({seed,startingDay:before.day,
      checkpoints:points.map(p=>({...p,additionalWater:p.soldWater-before.soldWater,
        additionalBatches:p.batches-before.batches,
        additionalFreights:p.iceFreights-before.iceFreights}))}));
  }
});
test('W5s-am: cash-conserving but unearned household gift, fictitious goods, fictitious dividend are rejected',()=>{
  const s=startup(42);
  run(s,425,42,[]);
  const before=api.hash(s),clone=()=>api.loadW5R(api.save(s));
  const gift=clone();
  gift.owners.st_nadir.cash-=1;gift.owners.w5n_kunden.cash+=1;
  assert.equal(Object.values(gift.owners).reduce((n,o)=>n+o.cash,0),40000);
  assert.equal(api.audit(gift).ok,false,'balance is insufficient without entitlement');
  const fakeGoods=clone();fakeGoods.w5n.wasserProduziert++;
  assert.equal(api.audit(fakeGoods).ok,false,'no water without real production');
  const fakeDividend=clone();fakeDividend.w5o.divStation++;
  assert.equal(api.audit(fakeDividend).ok,false,'no dividend absent documented earnings');
  assert.equal(api.hash(s),before,'no negative test alters audited research state');
});