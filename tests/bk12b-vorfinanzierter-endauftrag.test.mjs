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

function run(seed,policy,minutes,traceMiner=false) {
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
  // B-K12d diagnostic observer only: actual Nadir ice miners.
  const nadirSystem=s.stations[NADIR].system;
  const minerIDs=Object.values(s.ships).filter(sh=>sh.klasse==='miner'&&
    sh.system===nadirSystem&&sh.ware==='eis').map(sh=>sh.id).sort();
  const minerSet=new Set(minerIDs);
  const minerOwners=[...new Set(minerIDs.map(id=>s.ships[id].owner))].sort();
  if(traceMiner)assert(minerIDs.length>0,'actual Nadir ice miner required');
  const minerPhase=[],minerHours=[],serviceToNadir=[];
  const originalCost=m.api.cost.bind(m.api);
  m.api.cost=(state,sh,due,paid)=>{
    originalCost(state,sh,due,paid);
    if(!traceMiner)return;
    const costSystem=sh.phase==='reise'?
      m.rules.world.stations[sh.ziel].system:sh.system;
    if(costSystem!==nadirSystem)return;
    serviceToNadir.push({tick:state.tick,ship:sh.id,owner:sh.owner,
      type:sh.klasse,due,paid,
      to:m.rules.world.senkeBesitzer.includes(sh.owner)?'burn':fund,
      cashBefore:state.owners[sh.owner].cash});
  };
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
    // Only a test sensitivity: exact known worst-case 2-ice+work cost,
    // rather than B-K12b's 128-ISK reserve cushion.
    const budget=policy==='cofinance-tight'
      ? CHARGE*sourcePrice+WAGE
      : Math.max(128,CHARGE*sourcePrice+WAGE+24);
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
    const householdPaid=['cofinance','cofinance-tight'].includes(policy)?Math.min(hh.cash,spot,lot.cost):0;
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
    const beforeCaps=capital(state);
    const result=basePhase(name,state,fn,args);
    const afterCaps=capital(state);
    const delta=afterCaps[fund]-beforeCaps[fund];
    if(traceMiner)for(const owner of minerOwners) {
      const change=afterCaps[owner]-beforeCaps[owner];
      if(change)minerPhase.push({tick:state.tick,owner,phase:name,delta:change});
    }
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
      if(traceMiner) {
        const caps=capital(s);
        minerHours.push({tick:s.tick,day:1+Math.floor((s.tick-1)/1440),
          owners:Object.fromEntries(minerOwners.map(id=>[id,caps[id]])),
          stationCash:s.owners[NADIR].cash,stationIce:s.stations[NADIR].lager.eis,
          buyerCash:caps[fund],orders:orders.length,delivered:deliveries.length,
          miners:minerIDs.map(id=>{
            const sh=s.ships[id];
            return {id,exists:!!sh,auftrag:sh?.auftrag||null,
              cargo:sh?.ladung.eis||0,work:sh?.arbeit||0};
          })});
      }
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
  let minerDiagnostic=null;
  if(traceMiner) {
    const sourceSales=m.log.trades.filter(x=>minerSet.has(x.ship)&&
      x.station===NADIR&&x.ware==='eis'&&!x.buy);
    const focusCosts=m.log.costs.filter(x=>minerSet.has(x.ship));
    const fundOperatingPayments=serviceToNadir.filter(x=>x.to===fund);
    const feesFromMiner=m.log.payments.filter(x=>x.kind==='fee'&&
      minerSet.has(x.ship)&&x.to===fund);
    const fundCosts=sum(fundOperatingPayments.map(x=>x.paid));
    assert.equal(fundCosts,
      sum(fundPhaseFlow.filter(x=>x.phase==='betriebskosten').map(x=>x.delta)),
      'every original fund operating-cost receipt has a paying ship');
    const capsOpen=capital(initial),capsEnd=capital(s);
    const ownerOpening=Object.fromEntries(minerOwners.map(id=>[id,capsOpen[id]]));
    const ownerEnding=Object.fromEntries(minerOwners.map(id=>[id,capsEnd[id]]));
    for(const owner of minerOwners)assert.equal(ownerOpening[owner]+
      sum(minerPhase.filter(x=>x.owner===owner).map(x=>x.delta)),ownerEnding[owner],
      'owner final capital must equal ALL original phased transactions');
    const byDay={};
    for(let day=1;day<=minutes/1440;day++) {
      const from=(day-1)*1440,to=day*1440;
      const mcost=focusCosts.filter(x=>x.tick>from&&x.tick<=to);
      const sale=sourceSales.filter(x=>x.tick>from&&x.tick<=to);
      const fees=feesFromMiner.filter(x=>x.tick>from&&x.tick<=to);
      const income=fundOperatingPayments.filter(x=>x.tick>from&&x.tick<=to);
      const snap=minerHours.find(x=>x.tick===to);
      byDay[day]={sales:sale.length,ice:sum(sale.map(x=>x.qty)),
        iceRevenue:sum(sale.map(x=>x.value)),
        miningDue:sum(mcost.map(x=>x.due)),
        miningPaid:sum(mcost.map(x=>x.paid)),
        miningUnpaid:sum(mcost.map(x=>x.due-x.paid)),
        receiptsFromShips:sum(income.map(x=>x.paid)),
        ofWhichFocusMiners:sum(income.filter(x=>minerSet.has(x.ship)).map(x=>x.paid)),
        minerFees:sum(fees.map(x=>x.isk)),
        minerOwnerCapital:snap?.owners,
        stationCash:snap?.stationCash,stationIce:snap?.stationIce,
        fundCash:snap?.buyerCash,
        minerShips:snap?.miners};
    }
    const phaseByOwner=Object.fromEntries(minerOwners.map(owner=>[owner,
      Object.fromEntries([...new Set(minerPhase.filter(x=>x.owner===owner).map(x=>x.phase))]
        .sort().map(phase=>[phase,sum(minerPhase.filter(x=>x.owner===owner&&
          x.phase===phase).map(x=>x.delta))]))]));
    const allFundFees=m.log.payments.filter(x=>x.kind==='fee'&&x.to===fund);
    minerDiagnostic={minerIDs,minerOwners,ownerOpening,ownerEnding,
      sourceSales:{count:sourceSales.length,ice:sum(sourceSales.map(x=>x.qty)),
        gross:sum(sourceSales.map(x=>x.value)),fee:sum(sourceSales.map(x=>x.fee)),
        first:sourceSales[0]||null,last:sourceSales.at(-1)||null},
      focusCosts:{due:sum(focusCosts.map(x=>x.due)),
        paid:sum(focusCosts.map(x=>x.paid)),
        unpaid:sum(focusCosts.map(x=>x.due-x.paid)),
        firstUnpaid:focusCosts.find(x=>x.due>x.paid)||null,
        last:focusCosts.at(-1)||null},
      fundOperating:fundCosts,allFundFees:sum(allFundFees.map(x=>x.isk)),
      focusMinerFees:sum(feesFromMiner.map(x=>x.isk)),
      byPayer:Object.fromEntries([...new Set(fundOperatingPayments.map(x=>x.owner))]
        .sort().map(owner=>[owner,sum(fundOperatingPayments.filter(x=>x.owner===owner)
          .map(x=>x.paid))])),
      ownerPhase:phaseByOwner,byDay,
      firstOwnerZero:minerHours.find(x=>minerOwners.some(id=>x.owners[id]===0))||null,
      lastTwoHours:minerHours.slice(-2)};
  }
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
    ...(traceMiner?{minerDiagnostic}:{}) ,
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

test('B-K12d: Nadir miner cash chain and unpaid work exposed, not mistaken for genuine fund income',()=>{
  for(const seed of [42,7]) {
    const r=run(seed,'cofinance',10080,true),d=r.minerDiagnostic;
    assert.equal(r.dayHashes.length,7);
    assert(d.minerIDs.length>0);
    assert(d.sourceSales.count>0);
    assert.equal(d.sourceSales.ice,2*r.delivered,
      'only actual sold ice appears in true consumed food provenance');
    assert.equal(d.sourceSales.gross,r.inputISK,
      'every raw-input cost credited to real miner receipts');
    assert(d.focusCosts.due>=d.focusCosts.paid);
    assert.equal(d.focusCosts.unpaid,d.focusCosts.due-d.focusCosts.paid);
    assert.equal(d.focusCosts.unpaid,0,
      'in these actual worlds, sh009 is fully paid; do not misdiagnose unpaid work');
    assert(d.ownerEnding.npc3>r.fundEnd&&r.fundEnd<128,
      'working-capital bottleneck is real buyer fund, not npc3 insolvency');
    assert.equal(d.byDay[7].minerShips[0].cargo,100,
      'full physical miner cargo remains available although no funded order');
    assert.equal(d.byDay[7].minerShips[0].auftrag,'foerdern',
      'miner is not bankrupt or halted by its command');
    assert(r.stationEnd>=128,'producer still has liquid working capital');
    const second=d.byDay[2];
    assert(second.sales>0,'verify actual day-two repeat flow');
    assert.equal(second.iceRevenue,44*second.sales,
      'actual per-food raw material transfer from station to miner owner');
    assert.equal(second.miningPaid,5*second.sales,
      'true, fully paid marginal mining service fee');
    assert.equal(second.minerFees,second.sales,
      'exact original fee credited to fund per food batch');
    assert.equal(second.receiptsFromShips,second.miningPaid,
      'no hidden second service funder in marginal day-two flow');
    assert.equal(44*second.sales-second.receiptsFromShips-second.minerFees,
      38*second.sales,'marginal 38 ISK per unit accumulate outside buyer fund');
    for(const day of [4,5,6,7]){
      assert.equal(d.byDay[day].sales,0);
      assert.equal(d.byDay[day].receiptsFromShips,0);
    }
    const pinned={42:{owner:5249,fund:100,units:38,costs:440},
      7:{owner:3411,fund:117,units:48,costs:490}}[seed];
    assert.equal(d.ownerEnding.npc3,pinned.owner);
    assert.equal(r.fundEnd,pinned.fund);
    assert.equal(r.delivered,pinned.units);
    assert.equal(d.focusCosts.due,pinned.costs);
    assert.equal(d.fundOperating+d.allFundFees,r.verifiedServiceIncome,
      'no unassigned source of real system-fund income');
    assert.equal(Object.keys(d.byDay).length,7);
    assert.equal(d.lastTwoHours.length,2);
    console.log('BK12D_MINER_CASH_CHAIN '+JSON.stringify({
      seed,hash:r.hash,delivered:r.delivered,realInputISK:r.inputISK,
      realFundEnd:r.fundEnd,serviceDays:r.serviceIncomeDays,miner:d
    }));
  }
});

test('B-K12d: tighter 68-ISK prior reserve delays but does not cure exhausted buyer income',()=>{
  for(const seed of [42,7]){
    const reference=run(seed,'cofinance',10080);
    const tight=run(seed,'cofinance-tight',10080);
    const expected={42:{delivered:39,finalFund:62,hash:'4a5857e57dd26942'},
      7:{delivered:50,finalFund:41,hash:'1932cd8001738da1'}}[seed];
    assert.equal(tight.delivered,expected.delivered,
      'tight-reserve output must reproduce exact real paid deliveries');
    assert.equal(tight.fundEnd,expected.finalFund);
    assert.equal(tight.hash,expected.hash,'tight reserve deterministic 7-day hash');
    assert(tight.orders.every(x=>x.budget===68),
      'locked amount must be the genuine first-lot full production cost');
    assert(tight.delivered>reference.delivered,
      '128-ISK cushion causes a separate early stop, must not be called insolvency');
    assert(tight.fundEnd<68,'even real fully cost-covered 68-ISK reserve eventually fails');
    assert.equal(tight.householdPaidISK+tight.fundPaidISK,tight.paidISK);
    assert.equal(tight.householdPaidISK,tight.wageISK);
    assert.equal(tight.fundPaidISK,tight.inputISK);
    assert.equal(tight.pending,null,'no unfinished contract confounds the comparison');
    assert.equal(tight.outstandingFood,0);
    assert.equal(tight.outstandingIce,0);
    assert.equal(tight.minted,reference.minted,'no test-side money creation');
    assert.equal(tight.dayHashes.length,7);
    console.log('BK12D_TIGHT_RESERVE '+JSON.stringify({
      seed,reference:{delivered:reference.delivered,finalFund:reference.fundEnd},
      tight:{delivered:tight.delivered,finalFund:tight.fundEnd,
        spentByFund:tight.fundPaidISK,paidByHouseholds:tight.householdPaidISK,
        verifiedServiceIncome:tight.verifiedServiceIncome,
        serviceDays:tight.serviceIncomeDays,hash:tight.hash,
        shortageHours:tight.shortageHours}
    }));
  }
});
