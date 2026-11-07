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
  successorNewFreight:true,successorNewAuto:true,successorNewWear:true,
  successorNewIce:true}};
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
const SEEDS=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];
function desc(s,r){
 const o=s.w5s.newCarrierOrder,n=r.w5n,st=s.stations[n.zielStation].lager;
 const market=api.w5sNewCarrierFreight(s,r);
 return {tick:s.tick,market:market.stage,reasonOre:market.erzGrund||null,
   reasonIce:market.eisGrund||null,household:s.owners[n.kunde].cash,
   nadir:s.owners[n.zielStation].cash,
   sourceIce:s.stations[n.quellStation].lager.eis,
   destinationIce:st.eis,water:st.wasser,
   oreAtYard:s.stations.st_nadir.lager.erz,
   oldCompany:s.owners.w5s_carrier2.cash,
   thirdCompany:s.owners[o.buyer].cash,
   newIceTrips:o.trips||0,newOreTrips:o.oreTrips||0,
   originalIceTrips:s.w5n.frachtAbgeschlossen,spentWork:
   (o.oreWorkPaid||0)+(o.workPaid||0),
   paidTurnover:(o.oreFreightRevenue||0)+(o.freightRevenue||0)};
}
test('W5s-ad: gespeicherte rechtliche Eigentumsbelege und beide Nachfragearten bleiben extern finanziert',()=>{
 for(const seed of [42,7]){
   const s=build(seed),id=s.w5s.newCarrierOrder.ship;
   const before=api.hash(s);
   const p=api.w5sNewCarrierFreight(s,RULES);
   assert.equal(api.hash(s),before,'the market projection never books cash or goods');
   assert.equal(s.ships[id].owner,'w5s_carrier3');
   assert.equal(s.owners.w5s_carrier3.cash,120);
   const direct=api.execute(s,{type:'shipFreightIce',
     owner:'w5s_carrier3',schiff:id},RULES);
   if(direct.ok){
     assert.equal(s.w5n.frachtauftrag.owner,'w5s_carrier3');
     assert.equal(s.owners.w5n_fracht_kauf.cash,490);
     assert.equal(s.owners.w5n_fracht_arbeit.cash,120);
     assert.equal(s.owners.w5s_carrier3.cash,0);
     proof(s,RULES,'real paid ice job seed '+seed);
     api.advance(s,120,RULES);
     assert.equal(s.w5s.newCarrierOrder.trips,1);
     assert.equal(s.w5s.newCarrierOrder.freightRevenue,240);
     assert.equal(s.w5s.newCarrierOrder.workPaid,120);
     assert.equal(s.owners.w5s_carrier3.cash,240);
   }else{
     assert.notEqual(p.command?.type,'shipFreightIce',
       'the original core cannot decline a promised paid ice contract');
     assert.equal(s.w5s.newCarrierOrder.trips||0,0);
     assert.equal(s.owners.w5s_carrier3.cash,120);
   }
   proof(s,RULES,'after original customer check '+seed);
   console.log('W5S_AD_MARKET '+JSON.stringify({seed,accepted:direct.ok,...desc(s,RULES)}));
 }
});
test('W5s-ae: 2 independent real histories, hourly dispatch, money/ship/working audits 35d',()=>{
 for(const seed of [42,7]){
   const s=build(seed),start=s.tick;
   const o=s.w5s.newCarrierOrder;
   let licenses=0,unpaid=0;
   for(let hour=1;hour<=35*24;hour++){
     const p=api.w5sNewCarrierFreight(s,RULES);
     if(p.command)licenses++;
     else unpaid++;
     api.advance(s,60,RULES);
     if(hour%24===0)proof(s,RULES,'third-freight '+seed+' hour '+hour,false);
   }
   assert.ok(s.tick>start);
   assert.equal(o.retired?.reason,'verschleiss');
   assert.equal(s.owners.w5s_carrier2.cash,720);
   assert.equal(api.audit(s).ok,true);
   assert.ok((o.trips||0)+(o.oreTrips||0)<=(o.autoOrders||[]).length);
   console.log('W5S_AE_CONTRACTS '+JSON.stringify({seed,licenses,unpaid,
     trackedOrders:(o.autoOrders||[]).length,...desc(s,RULES),hash:api.hash(s)}));
 }
});
test('W5s-af: 13×90d silent opt-in leaves original world money and all core audits intact',()=>{
 for(const seed of SEEDS){
   const s=api.createW5RState(seed,'full','npc3');
   for(let day=1;day<=90;day++){
     api.advance(s,1440,RULES);
     if(day%10===0)proof(s,RULES,'no new company '+seed+' day '+day,false);
   }
   assert.equal(s.w5s.newCarrierOrder,undefined,'no phantom buyer');
   assert.equal(s.owners.w5s_carrier3,undefined,'no free firm');
   assert.equal(s.minted,0);
 }
});
test('W5s-af: founded seeds42/7 audited 365d, save/load and no unauthorized rescue',()=>{
 for(const seed of [42,7]){
   const s=build(seed);
   const o=s.w5s.newCarrierOrder;
   let monthly=[];
   for(let day=Math.floor(s.tick/1440)+1;day<=365;day++){
     api.advance(s,1440-(s.tick%1440),RULES);
     proof(s,RULES,'funded third '+seed+' day '+day,
       day%30===0||day===365);
     if(day%30===0)monthly.push(desc(s,RULES));
   }
   assert.equal(o.stage,'retired','real lost third ship');
   assert.equal(s.ships[o.ship],undefined,'no resurrection');
   assert.equal(s.owners.w5s_carrier2.cash,720,'old successor not rescued');
   assert.equal(allCash(s),33000);
   console.log('W5S_AF_365 '+JSON.stringify({
     seed,hash:api.hash(s),iceTrips:o.trips||0,oreTrips:o.oreTrips||0,
     companyCash:s.owners[o.buyer].cash,monthly:monthly.map(x=>({
       market:x.market,household:x.household,sourceIce:x.sourceIce,
       destinationIce:x.destinationIce,water:x.water,thirdCompany:x.thirdCompany
     }))}));
 }
});
test('W5s-af: false third revenues, work, and mixed automatic order types fail proof',()=>{
 const s=build(42);
 for(let day=0;day<35;day++)api.advance(s,1440,RULES);
 proof(s,RULES,'intact third');
 const changes=[
  t=>t.w5s.newCarrierOrder.trips=1,
  t=>t.w5s.newCarrierOrder.workPaid=120,
  t=>t.w5s.newCarrierOrder.workReserved=120,
  t=>t.w5s.newCarrierOrder.freightRevenue=240,
  t=>t.w5s.newCarrierOrder.autoOrders=[{
   type:'shipFreightIce',ship:'shFAKE',tick:t.tick-1440}]
 ];
 for(const [i,change] of changes.entries()){
  const t=api.loadW5R(api.save(s));change(t);
  assert.equal(api.audit(t).ok,false,'fake income or freight blocked '+i);
 }
});

test('W5s-ad: positiver ORIGINAL-W5n-Vertrag im getrennten 80er-Sicherheitsbestand-Gegenversuch',()=>{
  // Dies ist ein ausdrücklich isolierter RESEARCH-Szenariovergleich, keine
  // Produkt-Nachfrageregel. Ursprünglich 60 Einheiten, hier 80. Die
  // 50 Eis, der zahlende Haushalt und alle ISK stammen aus der REALEN Welt.
  const s=build(42);
  const ship=s.w5s.newCarrierOrder.ship;
  const normal=api.w5sNewCarrierFreight(s,RULES);
  assert.equal(RULES.w5o.versorgungZiel,60);
  assert.equal(normal.command??null,null,'Originalwelt hat keinen neuen Bedarf');
  const CONTROL={...RULES,w5o:{...RULES.w5o,versorgungZiel:80}};
  const source=s.stations.st_aldera.lager.eis;
  const target=s.stations.st_nadir.lager.eis;
  const money=allCash(s);
  const customer=s.owners.st_nadir.cash;
  const worker=s.owners.w5s_carrier3.cash;
  const household=s.owners.w5n_kunden.cash;
  assert.ok(source>=50,'50 reale Eis vorhanden');
  assert.ok(target+50<=100,'belegter Lagerplatz; kein physisches Fiktivgut');
  assert.ok(household>=CONTROL.w5n.wasserPreis*CONTROL.w5n.verbrauchStunde);
  const offer=api.w5sNewCarrierFreight(s,CONTROL);
  assert.equal(offer.command?.type,'shipFreightIce',JSON.stringify(offer));
  assert.equal(offer.command?.schiff,ship);
  const started=api.execute(s,offer.command,CONTROL);
  assert.equal(started.ok,true,started.reason);
  assert.equal(s.w5n.frachtauftrag?.owner,'w5s_carrier3','echter Eigentümer');
  assert.equal(s.stations.st_aldera.lager.eis,source-50);
  assert.equal(s.owners.st_nadir.cash,customer-490,'490 ISK wirklich gebunden');
  assert.equal(s.owners.w5n_fracht_kauf.cash,490);
  assert.equal(s.owners.w5n_fracht_arbeit.cash,120);
  assert.equal(s.owners.w5s_carrier3.cash,worker-120);
  assert.equal(allCash(s),money);
  proof(s,CONTROL,'financed ICE contract immediately after departure');
  for(let minute=1;minute<=120;minute++){
    api.advance(s,1,CONTROL);
    if(minute%30===0)proof(s,CONTROL,'real ICE minute '+minute);
  }
  assert.equal(s.w5n.frachtauftrag,null);
  assert.equal(s.stations.st_nadir.lager.eis,target+50,'real delivery to Nadir');
  assert.equal(s.w5s.newCarrierOrder.workPaid,120);
  assert.equal(s.w5s.newCarrierOrder.workReserved,120);
  assert.equal(s.w5s.newCarrierOrder.freightRevenue,240);
  assert.equal(s.w5s.newCarrierOrder.trips,1);
  assert.equal(s.owners.w5s_carrier3.cash,worker-120+240);
  assert.equal(s.owners.w5n_fracht_kauf.cash,0);
  assert.equal(s.owners.w5n_fracht_arbeit.cash,0);
  assert.equal(s.owners.w5s_carrier2.cash,720,'kein Fremdeinkommen');
  assert.equal(allCash(s),money);
  proof(s,CONTROL,'original ICE contract after fully paid return');
  console.log('W5S_AD_PAID_ICE_COUNTERFACTUAL '+JSON.stringify({
    seed:42,originalTarget:60,testTarget:80,ship,iceDelivered:50,
    actualPilotWork:120,paidClient:490,freightRevenue:240,
    companyCash:s.owners.w5s_carrier3.cash,minted:s.minted,
    hash:api.hash(s)}));
});
