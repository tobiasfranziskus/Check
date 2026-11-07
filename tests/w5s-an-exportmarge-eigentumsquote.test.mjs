import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Only the unchanged R32 source simulation drives production and money.
// W5s-an adds a read-only quote; it neither issues shares nor pays dividends.
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
const RESEARCH={...AI,w5s:{...AI.w5s,stationEquityQuote:true}};
function financed(seed){
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
  assert.equal(s.minted,0);
  assert.equal(api.audit(s).ok,true);
  return s;
}
function toDay(s,day){
  for(let d=Math.floor(s.tick/1440)+1;d<=day;d++){
    api.advance(s,1440-s.tick%1440,RESEARCH);
    if(d%30===0||d===day){
      assert.equal(api.audit(s).ok,true,'core audit at day '+d);
      assert.equal(api.w5sFinanzStatus(s,RESEARCH).ok,true,'owner audit at day '+d);
    }
  }
}
function readQuote(s,mode='research'){
  const start=api.hash(s),money=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
  const q=api.w5sStationEquityQuote(s,mode==='research'?RESEARCH:AI);
  assert.equal(api.hash(s),start,'quote must not touch the world');
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),money);
  assert.equal(api.hash(api.loadW5R(api.save(s))),start);
  assert.equal(q.authorizedDividends,0,'NO legally earned claim is issued');
  return q;
}
function validateUnitCost(q){
  const c=RESEARCH.w5n,route=api.route(RESEARCH.world,'aldera','nadir');
  const delivery=c.charge*c.eisPreis+2*route.zeit*c.frachtJeMinute;
  const conversion=(c.charge/c.rezeptWasser)*c.fabrikMinuten*c.fabrikLohn;
  assert.equal(delivery,490);
  assert.equal(conversion,100);
  assert.equal(q.costPerLoad,delivery+conversion);
  assert.equal(q.costPerLoad,590);
  assert.equal(q.loadUnits,50);
  assert.equal(q.fullCostPerUnit,11.8);
  assert.equal(q.accountedCost,Math.ceil(q.exported*590/50));
  assert.equal(q.grossMargin,q.revenue-q.accountedCost);
}
test('W5s-an: R32 without opt-in or with OFF export cannot authorize owner shares',()=>{
  const s=financed(42);
  const initial=api.hash(s);
  assert.equal(readQuote(s,'off').stage,'inaktiv');
  assert.equal(api.hash(s),initial);
  assert.equal(api.w5sStationEquityQuote(s,RESEARCH).stage,'kein_stationseigener_export');
  assert.equal(api.audit(s).ok,true);
});
test('W5s-an: real 7 ISK export incurs 4.8 ISK direct LOSS per water; no distributable shareholder profit',()=>{
  for(const seed of [42,7]){
    const s=financed(seed);
    Object.assign(s.w5q,{mode:'station',rate:7,dayCap:70,totalCap:7000});
    toDay(s,365);
    const q=readQuote(s);
    validateUnitCost(q);
    assert.equal(q.exported,1000);
    assert.equal(q.revenue,7000);
    assert.equal(q.accountedCost,11800);
    assert.equal(q.grossMargin,-4800);
    assert.equal(q.earnedDistributableProfit,0);
    assert.equal(q.budgetRemaining,0);
    assert.equal(q.stage,'exportbudget_erschoepft');
    assert.equal(q.existingShareContract,false);
    assert.equal(q.stationCash,5172);
    assert.equal(q.investorCash,1262);
    assert.equal(q.investorLiquidAfterWater,1248);
    const before=api.hash(s);
    toDay(s,425);
    const tail=readQuote(s);
    assert.equal(tail.stationCash,6673);
    assert.equal(tail.investorCash,11);
    assert.equal(tail.investorLiquidAfterWater,0,'do not invest money unavailable for one water purchase');
    assert.equal(tail.grossMargin,-4800);
    assert.equal(tail.authorizedDividends,0);
    assert.notEqual(api.hash(s),before,'time progresses in same core, not a separate ledger');
    console.log('W5S_AN_7 '+JSON.stringify({seed,day:425,
      exported:q.exported,exportRevenue:q.revenue,cost:q.accountedCost,
      grossMargin:q.grossMargin,station:tail.stationCash,buyer:tail.investorCash,
      authorizedDividends:tail.authorizedDividends,hash:api.hash(s)}));
  }
});
test('W5s-an: 14 ISK gives only 1100 ISK gross margin before maintenance; old receipts NEVER vest new shares',()=>{
  for(const seed of [42,7]){
    const s=financed(seed);
    Object.assign(s.w5q,{mode:'station',rate:14,dayCap:140,totalCap:7000});
    toDay(s,365);
    const q=readQuote(s);
    validateUnitCost(q);
    assert.equal(q.exported,500);
    assert.equal(q.revenue,7000);
    assert.equal(q.accountedCost,5900);
    assert.equal(q.grossMargin,1100);
    assert.equal(q.budgetRemaining,0);
    assert.equal(q.possibleUnitsByBudget,0);
    assert.equal(q.earnedDistributableProfit,0,'margin before costs is NOT legally payable');
    assert.equal(q.existingShareContract,false,'there is no signed share issue');
    assert.equal(q.authorizedDividends,0);
    assert.equal(q.stationCash,6841);
    assert.equal(q.investorCash,3);
    assert.equal(q.investorLiquidAfterWater,0);
    console.log('W5S_AN_14 '+JSON.stringify({seed,day:365,
      exported:q.exported,exportRevenue:q.revenue,grossMargin:q.grossMargin,
      station:q.stationCash,buyer:q.investorCash,dividend:q.authorizedDividends,
      hash:api.hash(s)}));
  }
});
test('W5s-an: altered total money/stock entitlement is rejected by original auditor',()=>{
  const s=financed(42);
  Object.assign(s.w5q,{mode:'station',rate:7,dayCap:70,totalCap:7000});
  toDay(s,365);
  const clone=()=>api.loadW5R(api.save(s));
  const gift=clone();
  gift.owners.st_nadir.cash-=1;gift.owners.w5n_kunden.cash+=1;
  assert.equal(api.audit(gift).ok,false,'no private right even with conserved world ISK');
  const forged=clone();forged.w5q.exported++;
  assert.equal(api.audit(forged).ok,false,'no fabricated exported units');
  const fakeDividend=clone();fakeDividend.w5o.divStation++;
  assert.equal(api.audit(fakeDividend).ok,false,'no fictitious prior entitlement');
  assert.equal(api.audit(s).ok,true);
});
