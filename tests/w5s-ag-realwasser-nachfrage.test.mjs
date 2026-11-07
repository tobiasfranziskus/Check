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
test('W5s-ag: OFF means original 60/24 behavior, no phantom demand',()=>{
  for(const seed of [42,7]){
    const s=funded(seed,BASE);
    const oldHash=api.hash(s);
    assert.equal(api.w5sNewCarrierFreight(s,BASE).command??null,null);
    assert.equal(api.hash(s),oldHash);
    assert.equal(s.w5s.newCarrierOrder.trips||0,0);
    assert.equal(s.w5n.frachtauftrag,null);
    check(s,BASE,'OFF '+seed,true);
  }
});
test('W5s-ag: paid consumer and actual physical stock create a real original ice contract',()=>{
  for(const seed of [42,7]){
    const s=funded(seed,BASE); // no new demand until AFTER honest paid startup
    const original=api.w5sNewCarrierFreight(s,BASE);
    assert.equal(original.command??null,null);
    const stock=s.stations.st_nadir.lager;
    const before={house:s.owners.w5n_kunden.cash,station:s.owners.st_nadir.cash,
      source:s.stations.st_aldera.lager.eis,ice:stock.eis,water:stock.wasser,
      totalWater:s.w5n.wasserVerbraucht,factory:s.w5n.fabrikFertig};
    assert.ok(before.house>=28&&before.source>=50&&before.ice+50<=100);
    assert.equal(before.ice+before.water,71);
    // A purely read-only 40h / 20h physical buffer. Money is not projected.
    const hash=api.hash(s),offer=api.w5sNewCarrierFreight(s,ON);
    assert.equal(api.hash(s),hash,'plan creates neither funds nor goods');
    assert.equal(offer.command?.type,'shipFreightIce',JSON.stringify(offer));
    assert.equal(offer.command?.owner,'w5s_carrier3');
    const start=api.execute(s,offer.command,ON);
    assert.equal(start.ok,true,start.reason);
    assert.equal(s.owners.st_nadir.cash,before.station-490);
    assert.equal(s.owners.w5s_carrier3.cash,0);
    assert.equal(s.owners.w5n_fracht_kauf.cash,490);
    assert.equal(s.owners.w5n_fracht_arbeit.cash,120);
    assert.equal(s.stations.st_aldera.lager.eis,before.source-50);
    check(s,ON,'paid departure '+seed,true);
    api.advance(s,120,ON);
    check(s,ON,'real ice return '+seed,true);
    assert.equal(s.w5s.newCarrierOrder.trips,1);
    assert.equal(s.w5s.newCarrierOrder.freightRevenue,240);
    assert.equal(s.w5s.newCarrierOrder.workPaid,120);
    assert.equal(s.owners.w5s_carrier3.cash,240);
    assert.ok(s.w5n.fabrikFertig>before.factory,'station water made from real ice');
    assert.ok(s.w5n.wasserVerbraucht>before.totalWater,
      'real household water consumption paid');
    assert.equal(s.owners.w5s_carrier2.cash,720,'other carrier untouched');
    console.log('W5S_AG_FIRST '+JSON.stringify({seed,iceTrips:s.w5s.newCarrierOrder.trips,
      waterJobs:s.w5n.fabrikFertig-before.factory,
      paidWater:s.w5n.wasserVerbraucht-before.totalWater,
      carrierCash:s.owners.w5s_carrier3.cash,
      cash:money(s),hash:api.hash(s)}));
  }
});
test('W5s-ag: absent buyer, ice, or work money never becomes a free third order',()=>{
  const s=funded(42,BASE),hash=api.hash(s);
  for(const [owner,value] of [['w5n_kunden',27],['st_nadir',489],
    ['w5s_carrier3',119]]){
    const old=s.owners[owner].cash;s.owners[owner].cash=value;
    assert.equal(api.w5sNewCarrierFreight(s,ON).command??null,null,
      'not funded by '+owner);
    s.owners[owner].cash=old;
  }
  const ice=s.stations.st_aldera.lager.eis;
  s.stations.st_aldera.lager.eis=49;
  assert.equal(api.w5sNewCarrierFreight(s,ON).command??null,null,'no ice');
  s.stations.st_aldera.lager.eis=ice;
  assert.equal(api.hash(s),hash,'probes restore unchanged audited world');
  check(s,BASE,'tamper probes restored',true);
});
test('W5s-ag: 35d actual second-stage paid water factory, work, revenue, no endless phantom demand',()=>{
  for(const seed of [42,7]){
    const s=funded(seed,BASE),w=s.w5n,o=s.w5s.newCarrierOrder;
    const initial={fabrik:w.fabrikFertig,water:w.wasserVerbraucht,
      iceFreight:w.frachtAbgeschlossen,trips:o.trips||0,
      cash:s.owners.w5s_carrier3.cash};
    for(let day=1;day<=35;day++){
      api.advance(s,1440,ON);
      check(s,ON,'paid water '+seed+' day '+day,day===35);
    }
    const result={seed,iceTrips:o.trips||0,oreTrips:o.oreTrips||0,
      started:o.autoOrders?.length||0,newOriginalIceFreight:w.frachtAbgeschlossen-initial.iceFreight,
      realFactory:w.fabrikFertig-initial.fabrik,
      paidConsumption:w.wasserVerbraucht-initial.water,
      ownerIncome:(o.freightRevenue||0)+(o.oreFreightRevenue||0),
      carrierCash:s.owners.w5s_carrier3.cash,
      originalIncome:s.w5n.wasserErlos,retired:o.stage==='retired',
      cash:money(s),hash:api.hash(s)};
    assert.ok(result.iceTrips+result.oreTrips>=1,
      'third carrier completes a genuinely paid W3 or W5n contract');
    assert.ok(w.frachtAbgeschlossen>initial.iceFreight,
      'existing higher-priority W5o carrier supplies actual paid new ice');
    assert.ok(result.realFactory>=2,'repeated original ice-to-water production');
    assert.ok(result.paidConsumption>0,'no fake purchases');
    assert.equal(result.ownerIncome,result.iceTrips*240+
      (o.oreFreightRevenue||0),'original cash ledger revenues');
    assert.equal(result.carrierCash,initial.cash+result.ownerIncome
      -(o.workPaid||0)-(o.oreWorkPaid||0),'every freight minute paid');
    assert.ok(s.w5.fertig-(s.w5.minerFertig||0)-o.baseline>=2,
      'later separately paid W5 hull remains physically auditable');
    assert.equal(s.w5.schiffIds[o.baseline],o.ship,
      'original chronological W5 sale anchors third-owner provenance');
    for(const fakeBaseline of [o.baseline-1,o.baseline+1]){
      const forged=api.loadW5R(api.save(s));
      forged.w5s.newCarrierOrder.baseline=fakeBaseline;
      assert.equal(api.audit(forged).ok,false,
        'later real W5 production must not disguise forged initial baseline');
    }
    const forgedShip=api.loadW5R(api.save(s));
    forgedShip.w5s.newCarrierOrder.ship='shFORGED';
    assert.equal(api.audit(forgedShip).ok,false,'third-owner W5 ship ID must be real');
    console.log('W5S_AG_35D '+JSON.stringify(result));
  }
});
test('W5s-ag: thirteen 90d worlds without financed company remain unchanged',()=>{
  for(const seed of seeds){
    const s=api.createW5RState(seed,'full','npc3');
    for(let day=1;day<=90;day++){
      api.advance(s,1440,ON);
      if(day%30===0)check(s,ON,'13 seed '+seed+' day '+day,day===90);
    }
    assert.equal(s.w5s.newCarrierOrder,undefined,'no buyer conjured');
    assert.equal(s.owners.w5s_carrier3,undefined,'no firm conjured');
  }
});
test('W5s-ag: seed42/7 365d daily financed ownership, production and Save/Load',()=>{
  for(const seed of [42,7]){
    const s=funded(seed,BASE),o=s.w5s.newCarrierOrder;
    for(let day=Math.floor(s.tick/1440)+1;day<=365;day++){
      api.advance(s,1440-(s.tick%1440),ON);
      check(s,ON,'365d '+seed+' day '+day,day%30===0||day===365);
    }
    assert.equal(o.stage,'retired','real 30d loss never rescued');
    assert.equal(s.ships[o.ship],undefined);
    console.log('W5S_AG_365 '+JSON.stringify({seed,iceTrips:o.trips||0,
      oreTrips:o.oreTrips||0,realWaterJobs:s.w5n.fabrikFertig,
      paidConsumerUnits:s.w5n.wasserVerbraucht,
      companyCash:s.owners.w5s_carrier3.cash,
      worldMoney:money(s),hash:api.hash(s)}));
  }
});
