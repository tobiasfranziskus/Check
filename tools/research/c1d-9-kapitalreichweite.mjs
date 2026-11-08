// C1d-9: strictly read-only economic audit of TWO real C1d-8b settlements.
// No gameplay, demand, emission, depreciation or alternate simulation engine.
// This is a cash/stock bridge, NOT an accounting-profit calculation.
const good = n => Number.isSafeInteger(n) && n >= 0;
const money = (s,id) => s.owners?.[id]?.cash ?? 0;
const total = s => Object.values(s.owners || {}).reduce((n,o) => n + o.cash, 0);
const journal = (s,id,key) => s.stats?.konto?.[id]?.[key] ?? 0;
const owned = (s,id,kind) => Object.values(s.ships || {}).filter(x => x.owner === id && x.klasse === kind).length;

export function analyzeC1d9(start,first,second,rules) {
 const issues = [];
 const check = (v,msg) => { if (!v) issues.push(msg); };
 const snapshots = [start,first,second];
 const ids = [...new Set(snapshots.flatMap(s => Object.keys(s.owners || {})))].sort();
 const balances = Object.fromEntries(ids.map(id => [id,{
  start:money(start,id),first:money(first,id),second:money(second,id),
  firstDelta:money(first,id)-money(start,id),
  nextDelta:money(second,id)-money(first,id),
  totalDelta:money(second,id)-money(start,id)
 }]));
 const journals = {};
 for (const id of ['house','export','transport','st_nadir','werft_extern',
  'c1d_pilot','arbeiter_w5b_nadir','arbeitskraefte_nadir']) {
  const revenues = journal(second,id,'erloes')-journal(start,id,'erloes');
  const expenses = journal(second,id,'kosten')-journal(start,id,'kosten');
  const firstNet = journal(first,id,'erloes')-journal(start,id,'erloes')
    -journal(first,id,'kosten')+journal(start,id,'kosten');
  journals[id] = {revenues,expenses,net:revenues-expenses,
   firstNet,secondNet:revenues-expenses-firstNet,
   cashDelta:balances[id]?.totalDelta ?? 0};
  check(journals[id].net === journals[id].cashDelta,'journal/owner mismatch: '+id);
  check(firstNet === (balances[id]?.firstDelta ?? 0),'first journal mismatch: '+id);
  check(journals[id].secondNet === (balances[id]?.nextDelta ?? 0),
   'second journal mismatch: '+id);
 }
 check(rules?.rulesVersion === 3313 &&
  start.c1b?.profile === 'aphros-research:C1d-8b:second-paid-delivery-v1' &&
  snapshots.every(s => s.c1b?.profile === start.c1b?.profile),'profile/rule');
 check(start.tick === 0 && first.tick === 592 && second.tick === 1302,'tick boundaries');
 for (const [i,s] of snapshots.entries()) {
  check(s.initialSupply === 33000 && total(s) === 33000 &&
    s.minted === 0 && s.burned === 0 && s.w5q?.minted === 0 &&
    Object.values(s.owners || {}).every(x => good(x.cash)),
    'money conservation at snapshot '+i);
 }
 check(ids.reduce((n,id) => n+balances[id].totalDelta,0) === 0,
  'full world owner bridge');
 const expected = {
  house:[3000,2740,3572], export:[20000,18180,16460],
  st_nadir:[1700,1688,1676], transport:[1250,1430,1610],
  werft_extern:[1350,2550,2550]
 };
 for(const [id,three] of Object.entries(expected)) {
  check(three.every((v,i) => money(snapshots[i],id) === v),
   'measured principal bridge: '+id);
 }
 const sales = (second.c1f?.accepted ?? 0)+(second.c1f?.secondAccepted ?? 0);
 const price = rules?.c1f?.unitPrice;
 const buyerPayments = sales*price;
 const buyerTradeNet = balances.export.totalDelta + buyerPayments;
 check(price === 430 && sales === 8 && buyerPayments === 3440 &&
  second.c1f?.order?.id === 'C1D4-0001' &&
  second.c1f?.secondOrder?.id === 'C1D8B-0002' &&
  second.c1f?.order?.status === 'accepted' &&
  second.c1f?.secondOrder?.status === 'accepted' &&
  second.c1f?.settled === 1380 &&
  second.c1f?.secondSettled === 1380 &&
  buyerTradeNet === -100,'actual finite end-buyer payments and trade');
 check(second.c1d?.completed === 1 && second.c1d?.second?.completed === 1 &&
  second.c1d?.second?.job?.id === 'C1D8B-FREIGHT-0002' &&
  second.c1d?.feePaid === 300 && second.c1d?.second?.feePaid === 300 &&
  second.c1d?.pilotPaid === 240 && second.c1d?.second?.pilotPaid === 240,
  'both physically settled paid capital freight jobs');
 for(const id of ['c1f_kaufrest_escrow','c1d_pilot_escrow','c1d_freight_escrow'])
  check(money(first,id) === 0 && money(second,id) === 0,'open end escrow '+id);
 const q = {
  oreMined:second.ledger?.erz?.mined,oreDelivered:second.w3?.geliefert,
  oreRefined:second.w4?.erzVerbraucht,
  materialMade:second.w4?.materialErzeugt,
  materialConsumed:second.w5b?.materialVerbraucht,
  siliconMined:second.w5b?.siliziumAbgebaut,
  siliconConsumed:second.w5b?.siliziumVerbraucht,
  partsMade:second.w5b?.bauteilFertig*2,
  partsUsed:second.w5b?.bauteilVerbraucht,
  storageMade:second.ledger?.lager?.produced,
  storageSold:second.ledger?.lager?.exported,
  rawOreAtNadir:second.stations?.st_nadir?.lager?.erz,
  storageAtNadir:second.stations?.st_nadir?.lager?.lager,
  storageAtMeridian:second.stations?.st_meridian?.lager?.lager
 };
 for(const [key,value] of Object.entries({
  oreMined:124,oreDelivered:100,oreRefined:80,materialMade:32,
  materialConsumed:32,siliconMined:16,siliconConsumed:16,
  partsMade:16,partsUsed:16,storageMade:8,storageSold:8,
  rawOreAtNadir:20,storageAtNadir:0,storageAtMeridian:0
 }))check(q[key] === value,'physical inventory: '+key);
 check(second.w5b?.bauteilTitel?.length === 8 &&
  second.w5b.bauteilTitel.every((x,i) => x.owner === 'house' &&
   x.custodian === 'st_nadir' && x.units === 2 && x.usedUnits === 2 &&
   x.usedBy === 'C1D5-LAGER-'+String(i+1).padStart(4,'0')),
  'eight original owned and consumed components');
 const capital = {
  paidMiners:(owned(second,'house','miner')-owned(start,'house','miner'))*600,
  retainedMiners:owned(second,'house','miner'),
  cashChange:balances.house.totalDelta,
  operatingCashBeforeCapital:balances.house.totalDelta +
   (owned(second,'house','miner')-owned(start,'house','miner'))*600
 };
 check(capital.paidMiners === 1200 && capital.retainedMiners === 2 &&
  capital.cashChange === 572 && capital.operatingCashBeforeCapital === 1772,
  'manufacturer cash and retained purchased ships');
 const directlyPaid = {
  components:second.w5b?.vorproduktKauf,
  siliconLabor:second.w5b?.siliziumLohnBezahlt,
  assemblyLabor:second.w5b?.fabrikLohnBezahlt,
  moduleFreight:second.c1d?.feePaid+second.c1d?.second?.feePaid,
  oreMiningLabor:q.oreMined*2,
  oreTransportLabor:second.w3?.arbeitsKosten,
  modulePilotLabor:second.c1d?.pilotPaid+second.c1d?.second?.pilotPaid,
  refineryLabor:second.w4?.gezahlt
 };
 const manufacturerDirectOutlay = directlyPaid.components + directlyPaid.siliconLabor +
  directlyPaid.assemblyLabor + directlyPaid.moduleFreight;
 const manufacturerContributionBeforeOtherCosts = buyerPayments - manufacturerDirectOutlay;
 check(directlyPaid.components === 1920 && directlyPaid.siliconLabor === 160 &&
  directlyPaid.assemblyLabor === 224 && directlyPaid.moduleFreight === 600 &&
  directlyPaid.oreMiningLabor === 248 && directlyPaid.oreTransportLabor === 240 &&
  directlyPaid.modulePilotLabor === 480 && directlyPaid.refineryLabor === 80 &&
  manufacturerDirectOutlay === 2904 && manufacturerContributionBeforeOtherCosts === 536,
  'fully settled directly measured costs');
 const carrierExpectedCashChange = second.w3.frachtUmsatz -
  second.w3.arbeitsKosten + directlyPaid.moduleFreight - directlyPaid.modulePilotLabor;
 check(second.w3?.frachtUmsatz === 480 &&
  carrierExpectedCashChange === 360 && balances.transport.totalDelta === 360,
  'carrier margin from four actually paid jobs');
 const demand = {
  buyerStart:money(start,'export'),buyerAfterFirst:money(first,'export'),
  buyerAfterSecond:money(second,'export'),
  salesPaid:buyerPayments,otherBuyerCashNet:buyerTradeNet,
  nextContractAllowed:false,
  buyerCashOnlyFourUnitLots:Math.floor(money(second,'export') / 1720),
  remainingAuthorizedLots:0
 };
 check(demand.buyerAfterSecond === 16460 && demand.buyerCashOnlyFourUnitLots === 9,
  'cash-only upper bound (NOT an entitlement or future buyer income)');
 return {
  ok:issues.length === 0,issues,
  profile:second.c1b?.profile,ticks:snapshots.map(s=>s.tick),
  supply:snapshots.map(total),balances,journals,quantities:q,capital,
  cost:{
   buyerPayments,manufacturerDirectOutlay,manufacturerContributionBeforeOtherCosts,
   carrierCashChange:balances.transport.totalDelta,
   stationCashChange:balances.st_nadir.totalDelta,
   retainedOreWithoutFairValue:q.oreMined-q.oreRefined,
   directlyPaid
  },
  demand,
  conclusion:'Two funded sales; no recurring terminal revenue, third authorization, or audited net profit. Cash-only runway is not a forecast.'
 };
}
