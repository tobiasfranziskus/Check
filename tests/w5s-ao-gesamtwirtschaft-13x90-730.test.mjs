import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Research only. Every minute is advanced by the ONE, original R32 core.
// No independent cash, production, prices, goods or fleet simulations.
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
const AI={...BASE,w5s:{...BASE.w5s,successorDemandLoop:true,
  autoTransferWageHousehold:true,successorResolvedHullRelease:true,
  stationEquityQuote:true}};
const STARTING_MONEY=33000;
const SEEDS=[1,7,17,21,42,58,77,101,202,313,404,777,999];
const CHECKPOINTS=[185,245,365,425,550,730];
const cash=s=>Object.values(s.owners).reduce((a,o)=>a+o.cash,0);
const income=s=>s.w5o.ausgezahlt+(s.w5s?.orePilotWages??0)
  +Object.values(s.w5s?.industryWages?.paid??{}).reduce((a,n)=>a+n,0)
  +(s.w5s?.transferPilotWages??0);
const owners=s=>Object.fromEntries([
  'st_nadir','w5n_kunden','house','npc3','transport','export',
  'werft_extern','st_aldera','w5s_carrier2','w5s_carrier3',
  'fonds_aldera','fonds_transport'
].map(id=>[id,s.owners[id]?.cash??null]));
function verify(s,r,label){
  const a=api.audit(s);
  assert.equal(a.ok,true,label+' core audit failed: '+
    JSON.stringify(Object.keys(a).filter(k=>a[k]&&a[k].ok===false)));
  const b=api.w5sFinanzStatus(s,r);
  assert.equal(b.ok,true,label+' independent finance/audit');
  assert.equal(s.minted,s.w5q.minted,label+' W5q only source');
  assert.equal(s.burned,0,label+' no hidden money sink');
  assert.equal(cash(s),STARTING_MONEY+s.minted,label+' money conservation');
  assert.equal(s.w5q.payout,0,label+' no subsidy to private end consumer');
  assert.equal(s.owners.w5n_kunden.cash,
    1400+income(s)-s.w5n.wasserErlos,label+' earned buyer cash');
  assert.equal(s.stations.st_nadir.lager.wasser,
    s.w5n.wasserProduziert-s.w5n.wasserVerbraucht-s.w5q.exported,
    label+' physically unique produced, exported and consumed water');
  assert.equal(s.w5n.wasserErlos,14*s.w5n.wasserVerbraucht);
}
function snap(s,r){
  const n=s.w5n,o=s.w5o,q=s.w5q,wa=s.w5r,fre=api.w5sFinanzStatus(s,r),
        quote=api.w5sStationEquityQuote(s,r);
  const domesticContribution=n.wasserErlos-
    Math.ceil(n.wasserVerbraucht*590/50);
  assert.ok(o.divStation<=Math.max(0,domesticContribution),
    'old station dividend is bounded by internal original profits');
  assert.equal(quote.authorizedDividends,0,
    'no new shareholder right or dividend must be issued in this research');
  return {
    day:Math.floor(s.tick/1440),
    worldISK:cash(s),minted:s.minted,
    waterExported:q.exported,waterExportIncome:q.minted,
    exportedDirectCost:q.exported*590/50,
    exportContribution:quote.grossMargin??0,
    waterSold:n.wasserVerbraucht,waterRevenue:n.wasserErlos,
    waterMade:n.wasserProduziert,waterBatches:n.fabrikFertig,
    finishedIceShipments:n.frachtAbgeschlossen,
    oreShipments:s.w3.abgeschlossen,oreDelivered:s.w3.geliefert,
    iceMined:n.eisAbgebaut,iceSold:n.mineVerkauft,
    materialsMade:s.w4.abgeschlossen,
    hullsBuilt:s.w5.fertig,shipHullsSold:s.w5.verkauft,
    physicalWater:s.stations.st_nadir.lager.wasser,
    physicalIce:s.stations.st_nadir.lager.eis,
    earnedConsumerIncome:income(s),
    wages:{ice:o.lohnEis,freight:o.lohnFracht,water:o.lohnWasser,
      orePilots:s.w5s?.orePilotWages??0,
      industry:Object.values(s.w5s?.industryWages?.paid??{}).reduce((a,n)=>a+n,0),
      transferPilots:s.w5s?.transferPilotWages??0},
    dividends:{miner:o.divMine,freight:o.divFracht,station:o.divStation,
      investor:s.w5s?.takeover?.dividends??0},
    domesticStationContribution:domesticContribution,
    r32Life:{minerLost:wa.miner.lost,minerReplaced:wa.miner.bought,
      carrierLost:wa.frachter.lost,carrierReplaced:wa.frachter.bought},
    otherCarriers:Object.values(s.ships).filter(x=>x.klasse==='frachter')
      .reduce((a,x)=>(a[x.owner]=(a[x.owner]??0)+1,a),{}),
    bank:owners(s),
    demand:{customerCovered:s.owners.w5n_kunden.cash>=r.w5n.wasserPreis,
      nextUnitPrice:r.w5n.wasserPreis,
      stationService:api.w5sWartungStatus(s,r).stage,
      freightNeed:fre.continuity.replacementNeed,
      freightShortfall:fre.continuity.ownCapitalMissing,
      freeYardHulls:fre.continuity.freeYardHulls,
      freightStage:fre.continuity.stage},
    hash:api.hash(s)
  };
}
function funded(seed){
  const s=api.createW5RState(seed,'full','npc3');
  for(let day=0;day<120;day++)api.advance(s,1440,BASE);
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
  for(let day=0;day<35;day++)api.advance(s,1440,BASE);
  assert.equal(api.execute(s,{type:'shipPrepayNewCarrier',owner:'export'},BASE).ok,true);
  for(let n=0;n<600&&s.w5s.newCarrierOrder.stage!=='hull_ready';n++)
    api.advance(s,1,BASE);
  assert.equal(s.w5s.newCarrierOrder.stage,'hull_ready');
  assert.equal(api.execute(s,{type:'shipClaimNewCarrier',owner:'export'},BASE).ok,true);
  assert.equal(api.execute(s,{type:'shipReposition',owner:'w5s_carrier3',
    schiff:s.w5s.newCarrierOrder.ship},BASE).ok,true);
  api.advance(s,60,BASE);
  assert.equal(s.w5s.newCarrierOrder.stage,'arrived');
  verify(s,AI,'funded start');
  return s;
}
function configExport(s,scenario){
  if(scenario==='off')return;
  const rate=scenario==='station7'?7:14;
  Object.assign(s.w5q,{mode:'station',rate,dayCap:rate*10,totalCap:7000});
}
function profile(s,r,stop,label){
  const checkpoints=[snap(s,r)],last={water:0,batches:0,ice:0,wages:0,dividends:0};
  let prior=snapFast(s),now;
  for(let day=Math.floor(s.tick/1440)+1;day<=stop;day++){
    api.advance(s,1440-s.tick%1440,r);
    if(day%30===0||CHECKPOINTS.includes(day)||day===stop)
      verify(s,r,label+' day'+day);
    now=snapFast(s);
    if(now.water>prior.water)last.water=day;
    if(now.batches>prior.batches)last.batches=day;
    if(now.ice>prior.ice)last.ice=day;
    if(now.wages>prior.wages)last.wages=day;
    if(now.dividends>prior.dividends)last.dividends=day;
    prior=now;
    if(CHECKPOINTS.includes(day)){
      const start=api.hash(s);
      assert.equal(api.hash(api.loadW5R(api.save(s))),start,
        label+' Save/Load day'+day);
      checkpoints.push(snap(s,r));
    }
  }
  return {checkpoints,lastActivityDay:last,
    endHash:api.hash(s),startHash:checkpoints[0].hash};
}
function snapFast(s){
  return {water:s.w5n.wasserVerbraucht,batches:s.w5n.fabrikFertig,
    ice:s.w5n.frachtAbgeschlossen,
    wages:s.w5o.lohnEis+s.w5o.lohnFracht+s.w5o.lohnWasser+
      (s.w5s?.orePilotWages??0)
      +Object.values(s.w5s?.industryWages?.paid??{}).reduce((a,n)=>a+n,0)
      +(s.w5s?.transferPilotWages??0),
    dividends:s.w5o.divMine+s.w5o.divFracht+s.w5o.divStation};
}
test('W5s-ao A: 13 independent R32 seeds x 90 days: cost, cash, goods, owners, actual work',()=>{
  const rows=[];
  for(const seed of SEEDS){
    const s=api.createW5RState(seed,'full','npc3');
    const at0=api.hash(s);
    for(let d=1;d<=90;d++){
      api.advance(s,1440,BASE);
      if(d%30===0)verify(s,BASE,'90d seed'+seed+' day'+d);
    }
    const a=snap(s,{...BASE,w5s:{...BASE.w5s,stationEquityQuote:true}});
    assert.equal(a.worldISK,STARTING_MONEY,'no money without real outside export');
    assert.equal(a.minted,0);
    rows.push({seed,day:90,hash:a.hash,startHash:at0,
      waterSold:a.waterSold,waterMade:a.waterMade,iceTrips:a.finishedIceShipments,
      oreTrips:a.oreShipments,hullsBuilt:a.hullsBuilt,
      consumer:a.bank.w5n_kunden,station:a.bank.st_nadir,
      minerLost:a.r32Life.minerLost,freighterLost:a.r32Life.carrierLost,
      income:a.earnedConsumerIncome});
  }
  assert.equal(new Set(rows.map(x=>x.hash)).size,13,'worlds must remain independently seeded');
  console.log('W5S_AO_13X90 '+JSON.stringify(rows));
});
test('W5s-ao B: 42/7 controlled same initial fleet; off/7/14 paid station exports to 730d',()=>{
  const reports=[];
  for(const seed of [42,7]){
    const base=funded(seed);
    const rootHash=api.hash(base);
    for(const scenario of ['off','station7','station14']){
      const s=api.loadW5R(api.save(base));
      assert.equal(api.hash(s),rootHash,'controlled identical initial capitalization');
      configExport(s,scenario);
      verify(s,AI,'prepared '+seed+' '+scenario);
      const out=profile(s,AI,730,seed+' '+scenario);
      const end=out.checkpoints.at(-1);
      assert.equal(end.day,730);
      assert.equal(end.minted,scenario==='off'?0:7000);
      assert.equal(end.waterExported,
        scenario==='off'?0:scenario==='station7'?1000:500);
      assert.equal(end.bank.w5n_kunden,
        1400+end.earnedConsumerIncome-end.waterRevenue);
      assert.equal(end.dividends.station<=Math.max(0,end.domesticStationContribution),true);
      assert.equal(end.worldISK,STARTING_MONEY+end.minted);
      assert.equal(s.w5q.payout,0);
      assert.equal(api.w5sStationEquityQuote(s,AI).authorizedDividends,0);
      reports.push({seed,scenario,...out});
      console.log('W5S_AO_LONG '+JSON.stringify(reports.at(-1)));
    }
  }
  assert.equal(reports.length,6);
  assert.equal(reports.filter(r=>r.scenario==='off').every(r=>
    r.checkpoints.at(-1).minted===0),true,'never invent outside demand');
});
