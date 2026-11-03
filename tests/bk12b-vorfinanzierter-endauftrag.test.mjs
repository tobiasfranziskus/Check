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
  const orders=[],deliveries=[],rejections=[];
  const q=()=>m.api.sourceTrace();
  const fees=()=>m.log.payments.filter(x=>x.kind==='fee'&&x.to===fund);
  const feeIncome=()=>sum(fees().map(x=>x.isk));
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
    const receipt='leistung:bk12b:nadir:'+state.tick;
    assert(m.core.vertrag.bezahlen(state,order.id,receipt,lot.cost),
      'existing contract pays only actually delivered verified costs');
    assert(m.core.vertrag.abschliessen(state,order.id));
    state.stats.konto[fund].kosten+=lot.cost;
    state.stats.konto[id].erloes+=lot.cost;
    deliveries.push({tick:state.tick,contract:order.id,cost:lot.cost,
      inputISK:order.inputISK,wageISK:WAGE,spot,refund:order.budget-lot.cost,
      feeIncomeAtDelivery:feeIncome(),fundCashAfter:state.owners[fund].cash,
      actualBuyer:fund,qty:1});
    order=null;
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
  assert(deliveries.every(x=>x.cost===x.inputISK+x.wageISK));
  assert.equal(s.initialSupply+s.minted-s.burned,
    sum(Object.values(capital(s))));
  const feeRows=fees();
  return {seed,policy,days:minutes/1440,hash:m.core.hash(s),openingFund,
    fundEnd:s.owners[fund].cash,stationEnd:s.owners[NADIR].cash,
    totalOrders:orders.length,delivered:deliveries.length,
    paidISK:totalPaid(),refundedISK:sum(deliveries.map(x=>x.refund)),
    inputISK:sum(deliveries.map(x=>x.inputISK)),
    wageISK:sum(deliveries.map(x=>x.wageISK)),
    consumerSpotReferenceISK:sum(deliveries.map(x=>x.spot)),
    feeIncome:feeIncome(),feeEvents:feeRows.length,
    otherFundChanges:capital(s)[fund]-openingFund+totalPaid()-feeIncome(),
    shortageHours:s.stats.mangel[NADIR].nahrung-initial.stats.mangel[NADIR].nahrung,
    buyerFreeAtEnd:s.owners[fund].cash,
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
test('B-K12b: seven-day repeated reservations separate inherited cash from recurring earned buyer income',()=>{
  for(const policy of ['stock','earned-only']){
    const r=run(42,policy,10080);
    assert.equal(r.dayHashes.length,7);
    assert(r.delivered>0);
    assert(r.delivered<=r.totalOrders);
    if(policy==='earned-only')assert(r.totalOrders<=2,
      'without independent recurring buyer income, no unbacked orders');
    console.log('BK12B_SEVEN_DAYS '+JSON.stringify(r));
  }
});
