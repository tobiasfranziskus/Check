import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const R={...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,autoNpcOre:true,
  prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,retainFleetEarnings:true,
  carrierWorkingCapital:true,autoOreSettlement:true,autoTakeover:true,autoNpcVenture:true,
  autoOreWageHousehold:true,autoIndustryWages:true,onDemandMaintenance:true,
  independentSuccessor:true,successorFreight:true,successorOperations:true,
  successorOreFreight:true,successorNewOrder:true,successorNewPurchase:true
}};
const withoutPurchase={...R,w5s:{...R.w5s,successorNewPurchase:false}};
const audit=(s,title)=>{
  const w=api.audit(s),z=api.w5sFinanzStatus(s,R);
  assert.equal(w.ok,true,title+': '+Object.entries(w).filter(([,p])=>p?.ok===false).map(([k])=>k));
  assert.equal(z.ok,true,title+': old and new company ledgers');
  assert.equal(z.successor.ok,true,title+': old successor company');
  assert.equal(z.successorNewOrder.ok,true,title+': new private purchase contract');
  assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000,title+': global money');
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),title+': save/load');
};
function original(seed,r=R){
  const s=api.createW5RState(seed,'full','npc3');
  for(let day=1;day<=120;day++)api.advance(s,1440,r);
  for(const [type,owner,extra] of [
    ['stationRefine','st_nadir',{station:'st_nadir'}],
    ['stationBuildShip','werft_extern',{station:'st_nadir'}],
    ['shipFoundCarrier','export',{}],
    ['shipBuy','w5s_carrier2',{station:'st_nadir',klasse:'frachter'}]
  ]){
    const res=api.execute(s,{type,owner,...extra},r);
    assert.equal(res.ok,true,type+': '+res.reason);
    while(s.w4.auftrag||s.w5.auftrag)api.advance(s,1,r);
  }
  for(let d=1;d<=35;d++)api.advance(s,1440,r);
  assert.equal(s.w5s.successor.retired?.reason,'verschleiss');
  assert.equal(s.owners.w5s_carrier2.cash,720);
  assert.equal(s.stations.st_nadir.lager.frachter,0);
  return s;
}
function prepared(seed){
  const s=original(seed);
  const pre=api.execute(s,{type:'shipPrepayNewCarrier',owner:'export'},R);
  assert.equal(pre.ok,true,pre.reason);
  let n=0;
  while(s.w5s.newCarrierOrder.stage!=='hull_ready'&&n<600){
    api.advance(s,1,R);n++;
  }
  assert.ok(n>0&&n<600,'full paid W4/W5 new hull');
  assert.equal(s.stations.st_nadir.lager.frachter,1);
  assert.equal(s.owners.w5s_new_carrier_reserved.cash,930);
  audit(s,'prepared financed hull');
  return s;
}
function purchased(seed,fly=true){
  const s=prepared(seed),o=s.w5s.newCarrierOrder;
  const old=s.w5s.successor.ship,oldMoney=s.owners.w5s_carrier2.cash,
    worker=s.owners.werft_extern.cash,investor=s.owners.export.cash,
    made=s.w5.fertig,sold=s.w5.verkauft;
  assert.equal(api.execute(s,{type:'shipBuy',owner:R.w5.kaeufer,
    station:'st_nadir',klasse:'frachter'},R).ok,false,'no foreign theft');
  const buy=api.execute(s,{type:'shipClaimNewCarrier',owner:'export'},R);
  assert.equal(buy.ok,true,'new ship purchase: '+buy.reason);
  assert.equal(o.stage,'bought');
  assert.ok(o.ship&&s.ships[o.ship]);
  assert.notEqual(o.ship,old,'new physical ID');
  assert.equal(s.ships[o.ship].owner,'w5s_carrier3');
  assert.equal(s.ships[o.ship].system,'nadir');
  assert.equal(s.owners.w5s_carrier3.cash,180);
  assert.equal(s.owners.werft_extern.cash,worker+750);
  assert.equal(s.owners.w5s_new_carrier_reserved.cash,0);
  assert.equal(s.owners.export.cash,investor);
  assert.equal(s.owners.w5s_carrier2.cash,oldMoney);
  assert.equal(s.w5.fertig,made,'sell does not generate hull');
  assert.equal(s.w5.verkauft,sold+1,'W5 legal purchase ledger');
  assert.equal(s.stations.st_nadir.lager.frachter,0);
  assert.equal(s.stats.konto.w5s_carrier3.kosten,750);
  assert.equal(s.stats.konto.werft_extern.erloes>750,true);
  assert.equal(api.execute(s,{type:'shipClaimNewCarrier',owner:'export'},R).ok,
    false,'no double capital and hull');
  assert.equal(api.execute(s,{type:'shipClaimNewCarrier',owner:'house'},R).ok,
    false,'no unapproved investor');
  audit(s,'paid title to carrier3');
  if(fly){
    const fl=api.execute(s,{type:'shipReposition',owner:'w5s_carrier3',
      schiff:o.ship},R);
    assert.equal(fl.ok,true,fl.reason);
    assert.equal(o.stage,'inflight');
    assert.equal(s.owners.w5s_carrier3.cash,120,'pilot wage prepaid before travel');
    assert.equal(s.owners.w5s_transfer_reserved.cash,60);
    audit(s,'prepaid 60 ISK reposition');
    for(let i=1;i<=60;i++){
      api.advance(s,1,R);
      assert.equal(o.flightPaid,i,'one actually paid pilot minute per game minute');
      if(i%15===0) audit(s,'inflight '+i);
    }
    assert.equal(o.stage,'arrived');
    assert.equal(o.flightAllocated,60);
    assert.equal(o.flightPaid,60);
    assert.equal(s.owners.w5s_transfer_reserved.cash,0);
    assert.equal(s.owners.w5s_carrier3.cash,120,'untouched operating capital');
    assert.equal(s.ships[o.ship].system,'aldera');
    assert.equal(s.ships[o.ship].phase,'dock');
    assert.equal(s.stats.konto.w5s_carrier3.kosten,810);
    assert.equal(s.owners.w5s_carrier2.cash,oldMoney);
    audit(s,'paid ownership and arrival');
  }
  console.log('W5S_AA_PAID '+JSON.stringify({seed,ship:o.ship,
    hash:api.hash(s),stage:o.stage,oldCash:oldMoney,
    companyCash:s.owners.w5s_carrier3.cash,price:o.pricePaid,
    flight:o.flightPaid,escrow:s.owners.w5s_new_carrier_reserved.cash,
    made:s.w5.fertig,sold:s.w5.verkauft}));
  return s;
}
test('W5s-aa: Seed42+7 real private buyer, full W5 sale and 60 paid flight minutes',()=>{
  purchased(42);purchased(7);
});
test('W5s-aa: deterministic replay and save/load after real transfer',()=>{
  const a=purchased(42),b=purchased(42);
  assert.equal(api.hash(a),api.hash(b));
  assert.deepEqual(api.w5sNewCarrierOrder(a,R),api.w5sNewCarrierOrder(b,R));
});
test('W5s-aa: cannot spend reserved money before original W4/W5 construction or when flag is off',()=>{
  const s=original(42);
  assert.equal(api.execute(s,{type:'shipClaimNewCarrier',owner:'export'},R).ok,false);
  assert.equal(api.execute(s,{type:'shipPrepayNewCarrier',owner:'export'},R).ok,true);
  assert.equal(api.execute(s,{type:'shipClaimNewCarrier',owner:'export'},R).ok,false);
  assert.equal(api.execute(s,{type:'shipBuy',owner:'w5s_carrier2',
    station:'st_nadir',klasse:'frachter'},R).ok,false);
  const t=prepared(7);
  assert.equal(api.execute(t,{type:'shipClaimNewCarrier',owner:'export'},
    withoutPurchase).ok,false);
  assert.equal(api.audit(t).ok,true);
});
test('W5s-aa: forged receipt, owner, price and escrow are rejected',()=>{
  const s=purchased(7);
  const changes=[
    t=>{t.w5s.newCarrierOrder.pricePaid++},
    t=>{t.w5s.newCarrierOrder.ship=t.w5s.successor.ship},
    t=>{t.owners.w5s_carrier3.cash+=120;t.owners.export.cash-=120},
    t=>{t.w5s.newCarrierOrder.flightAllocated=0},
    t=>{t.w5s.newCarrierOrder.flightPaid=0},
    t=>{t.w5s.newCarrierOrder.stage='bought'},
    t=>{t.w5s.newCarrierOrder.capital++},
    t=>{t.stats.konto.w5s_carrier3.kosten--},
    t=>{t.ships[t.w5s.newCarrierOrder.ship].owner='w5s_carrier2'}
  ];
  for(const [i,change] of changes.entries()){
    const t=api.loadW5R(api.save(s));change(t);
    assert.equal(api.audit(t).ok,false,'full audit must reject forged ownership '+i);
  }
  assert.equal(api.audit(s).ok,true);
});
test('W5s-aa: Seed42 and Seed7 purchased/paid ships survive audited 365d',()=>{
  for(const seed of [42,7]){
    const s=purchased(seed),o=s.w5s.newCarrierOrder;
    for(let day=Math.floor(s.tick/1440)+1;day<=365;day++){
      const rest=1440-(s.tick%1440);
      api.advance(s,rest,R);
      audit(s,'seed '+seed+' day '+day);
    }
    assert.equal(o.stage,'arrived');
    assert.equal(s.owners.w5s_carrier2.cash,720);
    assert.equal(s.owners.w5s_carrier3.cash,120);
    assert.equal(o.pricePaid,750);assert.equal(o.flightPaid,60);
    assert.equal(s.ships[o.ship]?.owner,'w5s_carrier3');
    console.log('W5S_AA_365 '+JSON.stringify({seed,hash:api.hash(s),
      day:Math.floor(s.tick/1440),ship:o.ship,oldCash:720,newCash:120,
      escrow:s.owners.w5s_new_carrier_reserved.cash}));
  }
});
