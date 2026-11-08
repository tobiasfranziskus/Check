// C1d-6 independent, read-only full-capital / cash-flow check.
// Research-only: never registers a simulation rule, modifies saves or creates money.
// Inputs are actual original-core snapshots, not a second game economy.
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const cash=(s,id)=>s.owners?.[id]?.cash??0;
const sum=s=>Object.values(s.owners||{}).reduce((v,o)=>v+o.cash,0);
const stock=(s,station,ware)=>s.stations?.[station]?.lager?.[ware]??0;
const ownShip=(s,owner,kind)=>Object.values(s.ships||{}).filter(x=>x.owner===owner&&x.klasse===kind).length;
const stats=(s,id,what)=>s.stats?.konto?.[id]?.[what]??0;

// Exact independent research-contract decomposition. The Core is authoritative
// for physical production and settlement; a disagreement is a failing audit,
// not an opportunity to update the expected reference.
export function analyzeC1d6(initial,final,rules) {
 const issues=[],expect=(ok,msg)=>{if(!ok)issues.push(msg);};
 const oreUnit=rules.erzpilot?.preis,matUnit=rules.w5b?.materialPreis;
 const siUnit=rules.economy?.waren?.silizium?.basis;
 const buyerUnit=rules.c1f?.unitPrice;
 const oreMade=final.ledger?.erz?.mined??NaN,oreDelivered=final.w3?.geliefert??NaN;
 const oreUsed=final.w4?.erzVerbraucht??NaN;
 const refineryWage=final.w4?.gezahlt??NaN;
 const siliconMade=final.w5b?.siliziumAbgebaut??NaN;
 const siliconWork=final.w5b?.siliziumLohnBezahlt??NaN;
 const factoryWork=final.w5b?.fabrikLohnBezahlt??NaN;
 const moduleCount=final.w5b?.lagerFertig??NaN;
 const unitsAccepted=final.c1f?.accepted??NaN;
 const buyerValue=rules.c1f?.quantity*buyerUnit;
 const oreSale=oreMade*oreUnit;
 const oreBuy=oreDelivered*oreUnit;
 const boughtParts=final.w5b?.vorproduktKauf??NaN;
 const paidOreMinutes=oreMade*2; // measured C1d-5 ore-mining cost: 2 ISK/ore
 const minerCapex=(ownShip(final,'house','miner')-ownShip(initial,'house','miner'))*600;
 const oldFreight=final.w3?.frachtUmsatz??NaN;
 const oldPilot=final.w3?.arbeitsKosten??NaN;
 const newFreight=final.c1d?.feePaid??NaN;
 const newPilot=final.c1d?.pilotPaid??NaN;
 const siliconSale=siliconMade*siUnit;
 const assembly=matUnit*16+siUnit*8;
 const opCash={house:oreSale+siliconSale-boughtParts-paidOreMinutes-siliconWork-factoryWork-newFreight+buyerValue,
  export:-oreSale+oreBuy-buyerValue,
  st_nadir:-oreBuy-oldFreight-refineryWage-siliconSale+boughtParts,
  transport:oldFreight-oldPilot+newFreight-newPilot,
  werft_extern:minerCapex};
 const cashBridge={};
 for(const [id,delta] of Object.entries(opCash)){
  const capital=id==='house'?-minerCapex:0;
  cashBridge[id]={initial:cash(initial,id),deltaOperating:delta,capital,
   expected:cash(initial,id)+delta+capital,actual:cash(final,id)};
  expect(safe(cashBridge[id].actual)&&cashBridge[id].expected===cashBridge[id].actual,
   'Cash bridge '+id);
 }
 const balances=Object.fromEntries(
  [...new Set([...Object.keys(initial.owners||{}),...Object.keys(final.owners||{})])].sort()
   .map(id=>[id,{start:cash(initial,id),end:cash(final,id),delta:cash(final,id)-cash(initial,id)}]));
 const statBridges={};
 for(const id of ['house','npc3','st_nadir','st_aldera','transport','export','werft_extern','w5n_kunden',
  'arbeiter_w5b_nadir','arbeitskraefte_nadir','c1d_pilot']){
  const revenue=stats(final,id,'erloes')-stats(initial,id,'erloes');
  const costs=stats(final,id,'kosten')-stats(initial,id,'kosten');
  const delta=balances[id]?.delta??0;
  statBridges[id]={revenue,costs,net:revenue-costs,cashDelta:delta};
  expect(delta===revenue-costs,'Account journal '+id);
 }
 expect(initial.tick===0&&final.tick===592,'Scenario boundary tick 0→592');
 expect(initial.c1b?.profile===final.c1b?.profile
  &&final.c1b?.profile==='aphros-research:C1d-5:owner-custody-storage-v1'
  &&rules.rulesVersion===3310&&rules.w5b?.directPartsCustody,'C1d-5 profile');
 expect(safe(oreMade)&&oreMade===60&&safe(oreDelivered)&&oreDelivered===50
  &&oreUsed===40&&oreDelivered>=oreUsed,'Ore quantity: mined 60, moved 50, refined 40');
 expect(oreUnit===10&&matUnit===48&&siUnit===24&&buyerUnit===430,'Contract unit prices');
 expect(refineryWage===40&&final.w4?.materialErzeugt===16,'Four real C refinery batches');
 expect(siliconMade===8&&siliconWork===80,'Eight paid silicon with eighty labour ISK');
 expect(final.w5b?.materialVerbraucht===16&&final.w5b?.siliziumVerbraucht===8
  &&final.w5b?.bauteilFertig===4&&final.w5b?.bauteilVerbraucht===8
  &&factoryWork===112&&boughtParts===assembly&&assembly===960,'Parts and assembly cost without second purchase');
 expect(moduleCount===4&&unitsAccepted===4
  &&final.ledger?.lager?.produced===4&&final.ledger?.lager?.exported===4
  &&final.stations?.st_meridian?.lager?.lager===0,'Four real manufactured and paid exported modules');
 expect(final.w5b?.bauteilTitel?.length===4
  &&final.w5b.bauteilTitel.every((x,i)=>x.owner==='house'
     &&x.custodian==='st_nadir'&&x.units===2&&x.usedUnits===2
     &&x.usedBy==='C1D5-LAGER-'+String(i+1).padStart(4,'0')),'Title chain');
 expect(oreMade-oreUsed===20&&oreDelivered-oreUsed===10
  &&stock(final,'st_nadir','erz')===10,'Remaining raw ore inventory');
 expect(oldFreight===240&&oldPilot===120&&newFreight===300&&newPilot===240
  &&final.c1d.completed===1&&final.c1d.delivered===1,'Both fully financed freight legs');
 expect(final.c1f?.settled===1380&&final.c1f?.advanced===340&&buyerValue===1720
  &&final.c1f?.order?.buyerBefore===19900&&final.c1f?.order?.status==='accepted'
  &&cash(final,'c1f_kaufrest_escrow')===0,'End buyer and escrow');
 expect(minerCapex===1200&&ownShip(final,'house','miner')===2
  &&ownShip(initial,'house','miner')===0,'Two retained 600-ISK hulls');
 expect(final.w5n?.wasserVerbraucht===0&&rules.w5n?.verbrauchStunde===0
  &&final.w5o?.ausgezahlt===500,'Separate ice wages do not purchase water');
 expect(initial.initialSupply===33000&&final.initialSupply===33000
  &&initial.minted===0&&final.minted===0&&initial.burned===0&&final.burned===0
  &&sum(initial)===33000&&sum(final)===33000
  &&Object.values(final.owners).every(o=>safe(o.cash)),'ISK completely conserved');
 const realLabour={ore:paidOreMinutes,silicon:siliconWork,refinery:refineryWage,
  partsAndStorage:factoryWork,oreTransport:oldPilot,storageTransport:newPilot};
 const costView={
  contractRevenue:buyerValue,
  manufacturerDirectContractCash:boughtParts+siliconWork+factoryWork+newFreight,
  manufacturerGrossModuleCashSurplus:buyerValue-boughtParts-siliconWork-factoryWork-newFreight,
  manufacturerAllOperatingCashSurplus:opCash.house,
  manufacturerMinersCapital:minerCapex,
  manufacturerNetCashChange:cash(final,'house')-cash(initial,'house'),
  stationCashChange:cash(final,'st_nadir')-cash(initial,'st_nadir'),
  // Historical purchase price for 10 unprocessed ore, NOT audited fair value.
  stationUnconsumedOrePaidCost:10*(oreBuy+oldFreight)/oreDelivered,
  transporterCashChange:cash(final,'transport')-cash(initial,'transport'),
  buyerCashChange:cash(final,'export')-cash(initial,'export'),
  undistributedWaterDemand:final.w5n?.wasserVerbraucht
 };
 const note='Cash-budget bridge, not IFRS profit: retained miners, 20 unused ore, no assessed capital depreciation, future demand, or total owner rights.';
 return {ok:issues.length===0,issues,profile:final.c1b?.profile,
  tick:final.tick,balances,cashBridge,statBridges,quantities:{
   oreMade,oreDelivered,oreUsed,unusedOre:oreMade-oreUsed,
   siliconMade,materialMade:final.w4?.materialErzeugt,
   componentsMade:final.w5b?.bauteilFertig*2,modulesMade:moduleCount,unitsAccepted},
   realLabour,costView,treasuries:{
    aldera:cash(final,'fonds_aldera'),transport:cash(final,'fonds_transport'),
    wageHousehold:cash(final,'w5n_kunden')},supply:{start:sum(initial),end:sum(final)},
   note};
}
