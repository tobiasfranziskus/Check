import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const RULES=Object.freeze({...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,autoNpcOre:true,
  prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,retainFleetEarnings:true,
  carrierWorkingCapital:true,autoOreSettlement:true,autoTakeover:true,autoNpcVenture:true,
  autoOreWageHousehold:true,autoIndustryWages:true,onDemandMaintenance:true,
  independentSuccessor:true,successorFreight:true,successorOperations:true
}});
function fundAndBuy(seed){
  const s=api.createW5RState(seed,'full','npc3');
  for(let day=1;day<=120;day++)api.advance(s,1440,RULES);
  let a=api.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'},RULES);
  assert.equal(a.ok,true,'W4 aus vorhandenem Erz');
  while(s.w4.auftrag)api.advance(s,1,RULES);
  a=api.execute(s,{type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'},RULES);
  assert.equal(a.ok,true,'W5 aus wirklicher Raffinerie-Charge');
  while(s.w5.auftrag)api.advance(s,1,RULES);
  a=api.execute(s,{type:'shipFoundCarrier',owner:'export'},RULES);
  assert.equal(a.ok,true,'930 ISK echtes privates Eigenkapital');
  a=api.execute(s,{type:'shipBuy',owner:'w5s_carrier2',
    station:'st_nadir',klasse:'frachter'},RULES);
  assert.equal(a.ok,true,'750 ISK realer Werftverkauf');
  assert.equal(api.audit(s).ok,true);
  return s;
}
function run35(seed){
  const s=fundAndBuy(seed);
  const start=api.w5sNachfolgeMarkt(s,RULES);
  assert.equal(start.stage,'beobachtet');
  assert.equal(start.freightRevenue,240);
  assert.equal(start.pilotCost,120);
  assert.equal(start.netContribution,120,'nur Nettobeitrag zaehlt');
  assert.equal(start.initialOperatingCash,120);
  assert.equal(start.capitalNeeded,930);
  assert.equal(start.totalTripsNeeded,7,
    'sieben abgeschlossene bezahlte Fahrten vor Verlust waeren noetig');
  assert.equal(start.cash,180);
  assert.equal(start.extraTripsNeeded,7);
  assert.equal(start.replacementStage,'alter_frachter_noch_im_betrieb');
  const initialHash=api.hash(s);
  assert.equal(api.hash(s),initialHash);
  let oversupplied=0,fullyFundedHours=0,sharedBusy=0;
  for(let hour=1;hour<=35*24;hour++){
    api.advance(s,60,RULES);
    const before=api.hash(s);
    const diag=api.w5sNachfolgeMarkt(s,RULES);
    assert.equal(Object.isFrozen(diag),true,'rein lesendes und unveraenderbares Ergebnis');
    assert.equal(api.hash(s),before,'Marktprognose darf keinen Tick buchen');
    if(!diag.demand)oversupplied++;
    if(diag.marketGate==='marktfenster_voll_finanzierbar')fullyFundedHours++;
    if(!diag.escrowFree)sharedBusy++;
    if(hour%24===0){
      assert.equal(api.audit(s).ok,true,'unabhaengiger Kern-Audit Tag '+hour/24);
      assert.equal(api.w5sFinanzStatus(s,RULES).successorMarket.stage,'beobachtet');
      assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
      assert.equal(s.minted,0,'keine Geldemission');
      assert.equal(api.hash(api.loadW5R(api.save(s))),before,'Save/Load jeden Tag');
    }
  }
  const z=s.w5s.successor,diag=api.w5sNachfolgeMarkt(s,RULES);
  assert.equal(z.trips,1);
  assert.equal(z.freightRevenue,240);
  assert.equal(z.workPaid,120);
  assert.equal(z.retired?.reason,'verschleiss');
  assert.equal(s.ships[z.ship],undefined);
  assert.equal(s.owners.w5s_carrier2.cash,240);
  assert.equal(diag.retired,true);
  assert.equal(diag.hoursToWear,0);
  assert.equal(diag.capitalNeeded,930);
  assert.equal(diag.missing,690);
  assert.equal(diag.extraTripsNeeded,6);
  assert.equal(diag.totalTripsNeeded,7);
  assert.equal(diag.realHull,false,'kein fertiges Ersatzschiff erfunden');
  assert.equal(diag.replacementStage,'ersatz_aus_eigenkapital_unfinanziert');
  assert.equal(diag.dispatcher,'frachter_verschlissen');
  assert.ok(oversupplied>600,
    'mehrheitlich versorgte Station statt kuenstlich begrenzter Miningangebote');
  const oldHash=api.hash(s);
  assert.equal(api.execute(s,{type:'shipBuy',owner:z.owner,station:'st_nadir',
    klasse:'frachter'},RULES).ok,false,'kein unfinanzierter Folge-Kauf');
  assert.equal(api.hash(s),oldHash,'abgelehnter Kauf ohne Mutation');
  assert.equal(api.audit(s).ok,true);
  console.log('W5S_W_REAL '+JSON.stringify({seed,hash:oldHash,overstockHours:oversupplied,
    fundedHours:fullyFundedHours,sharedEscrowHours:sharedBusy,
    shipments:z.trips,margin:diag.netContribution,missing:diag.missing,
    additionalTripsNeeded:diag.extraTripsNeeded,realHull:diag.realHull}));
  return {hash:oldHash,oversupplied,fullyFundedHours,sharedBusy};
}
test('W5s-w: echte 35-Tage-Fahrt und Ersatzdeckung in Seeds 42 und 7',()=>{
  run35(42);
  run35(7);
});
test('W5s-w: identischer Seed ergibt identische Marktfenster und Hash',()=>{
  assert.deepEqual(run35(42),run35(42));
});
test('W5s-w: keine Gruendung/abgeschaltetes Profil fuehrt niemals zu Ersatzausgaben',()=>{
  const s=api.createW5RState(42,'full','npc3'),before=api.hash(s);
  assert.equal(api.w5sNachfolgeMarkt(s,RULES).stage,'keine_rechtmaessige_gruendung');
  const off={...RULES,w5s:{...RULES.w5s,successorOperations:false}};
  assert.equal(api.w5sNachfolgeMarkt(s,off).stage,'inaktiv');
  assert.equal(api.hash(s),before);
  assert.equal(api.audit(s).ok,true);
});
