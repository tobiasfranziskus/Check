// B-K12b [ANALYSE/DRAFT]: real escrow before input purchase/production.
// Historical R15/Schema9 fixture only; NO game rules, pricing, wages or mint.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture, withoutGrants, model, strictRules, audit, sum, capital}
  from './lib/bk12-analyse.mjs';

const NADIR='st_nadir';
const CHARGE=2;
const WAGE=24; // 6 actual production minutes x unapproved historical R15 test wage 4
const ORIGINAL_AFFORD='const neuKauf = Math.min(neuBedarf, Math.floor(hh.cash / p));';
const ORIGINAL_PAY=String.raw`hh.cash -= geld;
          state.owners[id].cash += geld;
          buche(state, 'hh_' + id, 'kosten', geld);
          buche(state, id, 'erloes', geld);`;
const ORIGINAL_MINER='const m = Math.min(s.ladung[ware], aufnehmbar(state, rules, station, ware));';
const ORIGINAL_PRODUCTION='if (!eingaben || !platz) continue;';
for(const anchor of [ORIGINAL_AFFORD,ORIGINAL_PAY,ORIGINAL_MINER,ORIGINAL_PRODUCTION])
  assert.equal(fixture.split(anchor).length,2,'unique historical source anchor');
const injected=withoutGrants
  .replace(ORIGINAL_AFFORD,'const neuKauf = __bk12.afford(state,id,ware,neuBedarf,p);')
  .replace(ORIGINAL_PAY,'__bk12.settle(state,id,neuKauf,p);')
  .replace(ORIGINAL_MINER,'const m = __bk12.procurement(state,station,ware,Math.min(s.ladung[ware], aufnehmbar(state, rules, station, ware)));')
  .replace(ORIGINAL_PRODUCTION,ORIGINAL_PRODUCTION+
    '\n      if (!__bk12.productionPermit(state,id,linie.rezept)) continue;');
assert.notEqual(injected,withoutGrants);

function run(seed,policy,minutes) {
  const m=model({source:injected,traceSource:true});
  strictRules(m);
  const s=m.core.createState(seed,m.rules);
  // Same honest Nadir test world as B-K12/B-K12a.
  for(const ware of ['eis','nahrung']) {
    s.ledger[ware].initial-=s.stations[NADIR].lager[ware];
    s.stations[NADIR].lager[ware]=0;
  }
  for(const sh of Object.values(s.ships))
    if(sh.klasse==='frachter'&&sh.auftrag==='handeln')sh.auftrag='halten';
  const fund=m.rules.world.systems[s.stations[NADIR].system].fonds;
  const initial=structuredClone(s);
  const openingFund=s.owners[fund].cash;
  let order=null,feeUsed=0;
  const orders=[],deliveries=[],rejections=[],fundPhaseFlow=[];
  const q=()=>m.api.sourceTrace();
  const fees=()=>m.log.payments.filter(x=>x.kind==='fee'&&x.to===fund);
  const feeIncome=()=>sum(fees().map(x=>x.isk));
  const actualServiceIncome=()=>sum(fundPhaseFlow.filter(x=>x.delta>0&&
    ['foerderung','betriebskosten'].includes(x.phase)).map(x=>x.delta));
  const postFirstActualCost=()=>sum(deliveries.slice(1).map(x=>x.cost));
  const totalPaid=()=>sum(deliveries.map(x=>x.cost));
  const allOrders=()=>orders.length;
  // Genuine escrow: a real, conserved R15 contract, locked BEFORE either
  // purchase of the two ice units or starting the 6-minute food recipe.
  function preorder() {
    if(order || s.stations[NADIR].lokalNeuNahrung || q().pending.length)return;
    const sourcePrice=m.core.preis(s,NADIR,'eis',m.rules);
    const budget=Math.max(128,CHARGE*sourcePrice+WAGE+24);
    if(policy==='earned-only'&&allOrders()>0&&feeIncome()-feeUsed<budget) {
      if(rejections.length<20)rejections.push({tick:s.tick,reason:'no verified new fee income',
        feeIncome:feeIncome(),feeUsed,budget,freeCash:s.owners[fund].cash});
      return;
    }
    if(policy==='earned-all'&&allOrders()>0&&
      actualServiceIncome()-postFirstActualCost()<budget) {
      if(rejections.length<20)rejections.push({tick:s.tick,reason:'no verified remaining service-income budget',
        actualServiceIncome:actualServiceIncome(),spentAfterFirst:postFirstActualCost(),budget,
        freeCash:s.owners[fund].cash});
      return;
    }
    const opening=s.owners[fund].cash;
    const contract=m.core.vertrag.reservieren(s,fund,NADIR,budget);
    if(!contract) {
      if(rejections.length<20)rejections.push({tick:s.tick,reason:'no free buyer cash',
        budget,freeCash:opening,feeIncome:feeIncome()});
      return;
    }
    if(policy==='earned-only'&&allOrders()>0)feeUsed+=budget;
    const receipt={id:contract,tick:s.tick,budget,opening,feeIncomeBefore:feeIncome(),
      iceAtReservation:s.stations[NADIR].lager.eis,
      foodAtReservation:s.stations[NADIR].lager.nahrung,procured:0,
      inputISK:0,productionStarted:false};
    assert.equal(receipt.iceAtReservation,0,'no unfinanced input leftovers');
    assert.equal(receipt.foodAtReservation,0,'no unfinanced finished stock');
    order=receipt;orders.push(receipt);
  }
  m.api.procurement=(state,station,ware,n)=>{
    if(station!==NADIR||ware!=='eis')return n;
    if(!order)return 0;
    return Math.min(n,Math.max(0,CHARGE-order.procured));
  };
  // Original transaction remains responsible for the real payment and goods.
  const originalTrade=m.api.trade.bind(m.api);
  m.api.trade=(state,rules,ship,station,ware,qty,buy,value,fee,recipient)=>{
    originalTrade(state,rules,ship,station,ware,qty,buy,value,fee,recipient);
    if(station===NADIR&&ware==='eis'&&!buy) {
      assert(order,'no ice purchased before real buyer reserve');
      assert.equal(state.vertraege.eintraege[order.id].status,'offen');
      order.procured+=qty;order.inputISK+=value;
      assert(order.procured<=CHARGE,'no excess speculative input acquisition');
    }
  };
  m.api.productionPermit=(state,id,recipe)=>{
    if(id!==NADIR||recipe!=='r_nahrung')return true;
    if(!order||order.procured!==CHARGE||order.productionStarted||
       q().pending.length||q().food.length||state.stations[NADIR].lokalNeuNahrung)return false;
    order.productionStarted=true;
    order.startTick=state.tick;
    assert(state.vertraege.eintraege[order.id]?.rest>=WAGE);
    return true;
  };
  m.api.afford=(state,id,ware,need,p)=>{
    if(id!==NADIR||ware!=='nahrung')
      return Math.min(need,Math.floor(state.owners['hh_'+id].cash/p));
    if(!order||!q().food.length)return 0;
    const lot=q().food[0];
    // Reject an underfunded future cost rather than treating the reserve as infinite.
    return need>=1&&order.productionStarted&&lot.cost<=state.vertraege.eintraege[order.id].rest?1:0;
  };
  m.api.settle=(state,id,qty,spot)=>{
    if(id!==NADIR) {
      // Unmodified R15 household transfers everywhere outside test-only Nadir.
      const cash=qty*spot,hh=state.owners['hh_'+id];
      assert(hh.cash>=cash);
      hh.cash-=cash;state.owners[id].cash+=cash;
      state.stats.konto['hh_'+id].kosten+=cash;
      state.stats.konto[id].erloes+=cash;
      return;
    }
    assert.equal(qty,1);
    const lot=q().food[0],c=state.vertraege.eintraege[order.id];
    assert(lot&&c&&c.status==='offen');
    assert.equal(lot.cost,order.inputISK+WAGE,'FIFO actual paid input + worker wage');
    assert(lot.finished<state.tick,'payment only after delivered/consumed food');
    assert(order.tick<order.startTick,'buyer budget locked before production');
    assert(order.tick<lot.inputs[0].tick,'buyer budget locked before first input sale');
    assert(order.tick<lot.inputs[1].tick,'buyer budget locked before second input sale');
    // B-K12c test arm: Household first pays ONLY money it really has
    // (up to the unchanged spot price). The pre-funded fund covers the
    // remaining actual FIFO cost. No loan, grant, mint or forced full-spot sale.
    const hh=state.owners['hh_'+id];
    const householdPaid=policy==='cofinance'?Math.min(hh.cash,spot,lot.cost):0;
    if(householdPaid){
      hh.cash-=householdPaid;
      state.owners[id].cash+=householdPaid;
      state.stats.konto['hh_'+id].kosten+=householdPaid;
      state.stats.konto[id].erloes+=householdPaid;
    }
    const fundPaid=lot.cost-householdPaid;
    assert(fundPaid>0&&fundPaid<=c.rest);
    const receipt='leistung:bk12b:nadir:'+state.tick;
    assert(m.core.vertrag.bezahlen(state,order.id,receipt,fundPaid),
      'existing contract pays only the unpaid actual FIFO cost');
    assert(m.core.vertrag.abschliessen(state,order.id));
    state.stats.konto[fund].kosten+=fundPaid;
    state.stats.konto[id].erloes+=fundPaid;
    deliveries.push({tick:state.tick,contract:order.id,cost:lot.cost,
      householdPaid,fundPaid,
      inputISK:order.inputISK,wageISK:WAGE,spot,refund:order.budget-fundPaid,
      feeIncomeAtDelivery:feeIncome(),fundCashAfter:state.owners[fund].cash,
      householdAfter:hh.cash,actualBuyer:fund,qty:1});
    order=null;
  };
  // Measure ORIGINAL fund cash flows, phase by phase; the order settlement is
  // a negative consumption flow, never a new buyer revenue.
  const basePhase=m.api.phase.bind(m.api);
  m.api.phase=(name,state,fn,args)=>{
    const before=capital(state)[fund];
    const result=basePhase(name,state,fn,args);
    const delta=capital(state)[fund]-before;
    if(delta)fundPhaseFlow.push({tick:state.tick,phase:name,delta});
    return result;
  };
  preorder();
  const dayHashes=[];
  for(let i=0;i<minutes;i++) {
    // Reservations are made between original deterministic Core ticks.
    preorder();
    m.core.step(s,m.rules);
    if(s.tick%60===0) {
      audit(s,m.core,m.provenance);
      assert.equal(q().food.length,s.stations[NADIR].lokalNeuNahrung);
      assert(q().food.length<=1,'cannot produce against nonexistent end order');
      assert(q().ice.length<=2,'cannot stockpile input for uncovered order');
      if(order)assert.equal(s.vertraege.eintraege[order.id]?.status,'offen');
    }
    if(s.tick%1440===0) {
      const save=m.core.save(s),restored=m.core.load(save,undefined,m.rules);
      assert.equal(m.core.hash(restored),m.core.hash(s));
      dayHashes.push(m.core.hash(s));
    }
  }
  audit(s,m.core,m.provenance);
  const realized=q().realized.filter(x=>x.qty>0);
  assert.equal(deliveries.length,sum(realized.map(x=>x.qty)));
  assert.equal(totalPaid(),sum(realized.map(x=>x.cost)));
  assert(deliveries.every(x=>x.cost===x.inputISK+x.wageISK&&
    x.householdPaid+x.fundPaid===x.cost&&x.householdPaid<=x.spot),
    'one actual, fully paid FIFO charge per delivery and no invented co-pay');
  assert.equal(s.initialSupply+s.minted-s.burned,
    sum(Object.values(capital(s))));
  const fundPayments=sum(deliveries.map(x=>x.fundPaid));
  const householdPayments=sum(deliveries.map(x=>x.householdPaid));
  assert.equal(fundPayments+householdPayments,totalPaid(),
    'production costs paid by exactly two existing buyer accounts');
  const feeRows=fees();
  const phaseByDay={};
  for(const f of fundPhaseFlow){
    const day=1+Math.floor((f.tick-1)/1440);
    const row=phaseByDay[day]||=(Object.create(null));
    row[f.phase]=(row[f.phase]||0)+f.delta;
  }
  const minerCosts=m.log.costs.filter(x=>x.klasse==='miner');
  assert.equal(sum(Object.values(phaseByDay).flatMap(Object.values)),
    capital(s)[fund]-openingFund,'original buyer-account cash-flow identity');
  const serviceIncomeDays=Object.keys(phaseByDay).map(Number).filter(day=>
    (phaseByDay[day].betriebskosten||0)+(phaseByDay[day].foerderung||0)>0);
  return {seed,policy,days:minutes/1440,hash:m.core.hash(s),openingFund,
    fundEnd:s.owners[fund].cash,stationEnd:s.owners[NADIR].cash,
    totalOrders:orders.length,delivered:deliveries.length,
    paidISK:totalPaid(),fundPaidISK:fundPayments,
    householdPaidISK:householdPayments,
    refundedISK:sum(deliveries.map(x=>x.refund)),
    inputISK:sum(deliveries.map(x=>x.inputISK)),
    wageISK:sum(deliveries.map(x=>x.wageISK)),
    consumerSpotReferenceISK:sum(deliveries.map(x=>x.spot)),
    feeIncome:feeIncome(),feeEvents:feeRows.length,
    verifiedServiceIncome:actualServiceIncome(),
    actualCostsAfterFirst:postFirstActualCost(),
    otherFundChanges:capital(s)[fund]-openingFund+fundPayments-feeIncome(),
    fundNetByDay:phaseByDay,serviceIncomeDays,
    buyerCashIdentity:openingFund+actualServiceIncome()-fundPayments,
    stationCashAtStart:initial.owners[NADIR].cash,
    householdCashAtStart:initial.owners['hh_'+NADIR].cash,
    householdCashAtEnd:s.owners['hh_'+NADIR].cash,
    localBuyerStats:s.stats.haushaltskauf[NADIR].menge,
    minerWorkDue:sum(minerCosts.map(x=>x.due)),
    minerWorkPaid:sum(minerCosts.map(x=>x.paid)),
    shortageHours:s.stats.mangel[NADIR].nahrung-initial.stats.mangel[NADIR].nahrung,
    buyerFreeAtEnd:s.owners[fund].cash,
    outstandingFood:q().food.length,outstandingIce:q().ice.length,
    pendingProduction:q().pending.length,localNewFood:s.stations[NADIR].lokalNeuNahrung,
    originalStationIce:s.stations[NADIR].lager.eis,
    nextInputPrice:m.core.preis(s,NADIR,'eis',m.rules),
    pending:order&&{id:order.id,tick:order.tick,budget:order.budget,rest:s.vertraege.eintraege[order.id]?.rest},
    minted:s.minted-initial.minted,burned:s.burned-initial.burned,
    orders:orders.slice(0,4),deliveries:deliveries.slice(0,4),
    lastDelivery:deliveries.at(-1)||null,rejections:rejections.slice(0,3),
    dayHashes};
}
test('B-K12b: first funded food order precedes raw ice acquisition and actual paid work (42/7)',()=>{
  for(const seed of [42,7]) {
    const r=run(seed,'stock',1440);
    assert(r.delivered>0);
    assert(r.paidISK>0);
    assert(r.delivered<=r.totalOrders);
    assert(r.feeEvents>0,'real original fee receipts to buyer');
    console.log('BK12B_STOCK_24H '+JSON.stringify(r));
  }
});
test('B-K12b: two seven-day worlds separate inherited cash from recurring earned buyer income',()=>{
  for(const seed of [42,7])for(const policy of ['stock','earned-only','earned-all']){
    const r=run(seed,policy,10080);
    assert.equal(r.dayHashes.length,7);
    const pinned={42:{stock:'a1001b69ad6d11af',
      'earned-only':'c23c0afd71039d70','earned-all':'cc0c5f7714a90433'},
      7:{stock:'4bfab4527db048c9','earned-only':'b58c1626e1a499bd',
        'earned-all':'0d71f7793b28e591'}};
    assert.equal(r.hash,pinned[seed][policy],'historical deterministic outcome');
    assert(r.serviceIncomeDays.every(day=>day<=2),
      'these genuine receipts end after day 1/2; no perpetual income');
    assert(r.delivered>0);
    assert(r.delivered<=r.totalOrders);
    if(policy==='earned-only') {
      assert.equal(r.totalOrders,1,
        'no second 128-ISK reserve justified by actually earned trading fees');
      assert(r.feeIncome<68,
        'even the actual first-lot cost exceeds the proven new fee revenue');
    } else if(policy==='earned-all') {
      assert(r.delivered>1,'genuinely paid original service receipts can fund some repeat orders');
      assert(r.actualCostsAfterFirst<=r.verifiedServiceIncome,
        'all subsequent paid lots must be backed by truly received service transfers');
    } else assert(r.delivered>1,'inherited fund cash can fund repeated real purchases');
    console.log('BK12B_SEVEN_DAYS '+JSON.stringify(r));
  }
});

test('B-K12c: actual wage-funded household contribution recycles ISK before fund pays the gap',()=>{
  for(const seed of [42,7]) {
    const baseline=run(seed,'stock',10080),co=run(seed,'cofinance',10080);
    assert.equal(baseline.householdPaidISK,0,'unchanged B-K12b buyer solely pays');
    assert(co.householdPaidISK>0,'only genuinely available local production wages pay');
    assert(co.delivered>=baseline.delivered,'no loss of funded consumption');
    assert(co.fundPaidISK*baseline.delivered<
      baseline.fundPaidISK*co.delivered,
      'the local fund pays less per actually delivered food unit');
    assert.equal(co.householdPaidISK+co.fundPaidISK,co.paidISK);
    assert.equal(co.householdCashAtStart,0);
    assert.equal(co.householdCashAtEnd,0,
      'household contribution never exceeds verified available wages');
    assert(co.deliveries.every(x=>x.householdPaid<=x.spot&&
      x.householdPaid<=x.wageISK));
    assert.equal(co.localBuyerStats,co.delivered);
    assert.equal(co.pending,null,'no unpaid unfinished order at 7-day endpoint');
    assert.equal(co.outstandingFood,0);
    assert.equal(co.outstandingIce,0);
    assert.equal(co.dayHashes.length,7);
    const expected={42:{hash:'3461775aeb999c23',units:38,days:[1,2],
      fundEnd:100},7:{hash:'4848efbdd3a93e18',units:48,days:[1,2,3],
      fundEnd:117}}[seed];
    assert.equal(co.hash,expected.hash,'deterministic co-payment world hash');
    assert.equal(co.delivered,expected.units,'exact seven-day real purchase count');
    assert.equal(co.fundEnd,expected.fundEnd,'actual cash conservation');
    assert.deepEqual(co.serviceIncomeDays,expected.days,
      'no continuing original service revenue beyond day 2/3');
    assert.equal(co.householdPaidISK,co.wageISK,
      'exactly earned and paid factory wages re-enter food purchases');
    assert.equal(co.fundPaidISK,co.inputISK,
      'fund pays exactly paid ice, no uncovered factory wage');
    assert.equal(co.buyerCashIdentity,co.fundEnd,
      'opening cash plus true service receipts minus real buyer payments');
    assert.equal(co.minted,baseline.minted,
      'co-payment must not introduce new emission');
    console.log('BK12C_COFINANCE '+JSON.stringify({
      seed,baseline:{delivered:baseline.delivered,
        fundPaid:baseline.fundPaidISK,householdPaid:baseline.householdPaidISK,
        fundEnd:baseline.fundEnd,householdEnd:baseline.householdCashAtEnd,
        serviceIncome:baseline.verifiedServiceIncome},
      cofinanced:co
    }));
  }
});
