import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const RULES={...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,autoNpcOre:true,
  prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,retainFleetEarnings:true,
  carrierWorkingCapital:true,autoOreSettlement:true,autoTakeover:true,autoNpcVenture:true,
  autoOreWageHousehold:true,autoIndustryWages:true,onDemandMaintenance:true,
  independentSuccessor:true,successorFreight:true,successorOperations:true,
  successorOreFreight:true
}};
function start(seed){
  const s=api.createW5RState(seed,'full','npc3');
  for(let day=1;day<=120;day++)api.advance(s,1440,RULES);
  for(const [type,owner,extra] of [
    ['stationRefine','st_nadir',{station:'st_nadir'}],
    ['stationBuildShip','werft_extern',{station:'st_nadir'}],
    ['shipFoundCarrier','export',{}],
    ['shipBuy','w5s_carrier2',{station:'st_nadir',klasse:'frachter'}]]){
    const res=api.execute(s,{type,owner,...extra},RULES);
    assert.equal(res.ok,true,type+': '+res.reason);
    while(s.w4.auftrag||s.w5.auftrag)api.advance(s,1,RULES);
  }
  assert.equal(api.audit(s).ok,true);
  return s;
}
const top=m=>Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,12);
test('W5s-y: reale Angebots- und Bedarfsgrenzen in Seed42 und 7 bestimmen',()=>{
  for(const seed of [42,7]){
    const s=start(seed);
    const stages={},yards={},ore={},first=[],events=[];
    let lastTrips=0,lastCash=0;
    for(let hour=0;hour<35*24;hour++){
      api.advance(s,60,RULES);
      const f=api.w5sFinanzStatus(s,RULES),p=f.successorOperations;
      stages[p.stage]=(stages[p.stage]||0)+1;
      yards[f.yardPlan.stage]=(yards[f.yardPlan.stage]||0)+1;
      ore[f.orePlan.stage]=(ore[f.orePlan.stage]||0)+1;
      const z=s.w5s.successor;
      if((z.oreTrips||0)!==lastTrips||s.owners[z.owner].cash!==lastCash&&(hour%24===0)){
        events.push({hour:hour+1,trips:z.oreTrips||0,cash:s.owners[z.owner].cash,
          yard:f.yardPlan.stage,ore:f.orePlan.stage,market:p.stage,
          oreAtDest:s.stations.st_nadir.lager.erz,oreSource:s.w5h.bestand});
        lastTrips=z.oreTrips||0;lastCash=s.owners[z.owner].cash;
      }
      if(hour%24===0){
        first.push({day:Math.floor(hour/24)+1,cash:s.owners[z.owner].cash,
          actualTrips:z.oreTrips||0,oldFreighterCash:s.owners.transport.cash,
          buyerCash:s.owners.st_nadir.cash,oreSource:s.w5h.bestand,
          oreDest:s.stations.st_nadir.lager.erz,
          freeYardHulls:s.stations.st_nadir.lager.frachter,
          yard:f.yardPlan.stage,ore:f.orePlan.stage,market:p.stage});
      }
      if((hour+1)%24===0)assert.equal(api.audit(s).ok,true,'Core-Audit Seed'+seed+' Tag'+(hour+1)/24);
    }
    const z=s.w5s.successor;
    console.log('W5S_Y_CAPITAL '+JSON.stringify({seed,investor:z.investor,
      investorCash:s.owners[z.investor]?.cash,
      yardCash:s.owners[RULES.w5.werft]?.cash,
      buyerCash:s.owners[RULES.w3.kunde]?.cash,
      shipyardMaterials:s.stations[RULES.w5.station]?.lager.material,
      oreAtYard:s.stations[RULES.w5.station]?.lager.erz,
      refineryCash:s.owners[RULES.w4.station]?.cash,
      materialPrice:api.W5R_RULES?.economy.waren.material?.basis,
      successorCash:s.owners[z.owner]?.cash,
      oldCarrierCash:s.owners[RULES.w3.spedition]?.cash,
      hullPrice:z.hull,flight:z.flight,working:z.working,
      w5Made:s.w5.fertig,w5Sold:s.w5.verkauft,
      w5Plan:api.w5sFinanzStatus(s,RULES).yardPlan.stage
    }));
    console.log('W5S_Y_DIAG '+JSON.stringify({seed,trips:z.oreTrips,
      cash:s.owners[z.owner].cash,stages:top(stages),yards:top(yards),
      ore:top(ore),events:events.slice(0,25),
      days:first.filter((_,i)=>i%5===0||i>27)}));
    assert.equal(z.oreTrips,5);
    assert.equal(s.owners[z.owner].cash,720);
    assert.equal(api.audit(s).ok,true);
  }
});
