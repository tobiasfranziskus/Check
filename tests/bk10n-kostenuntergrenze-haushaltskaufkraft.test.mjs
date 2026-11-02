// B-K10n [ANALYSE/DRAFT]: drei Stationen, Originalmarkt und aktuelle Haushalts-Kaufkraft.
// Nur testseitiges Journal; keinerlei Modifikation von Spielregeln und index.html.
// Achtung: Historische Eis-/Nahrung-Anfangsbestände haben UNBEKANNTE Kosten.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let js=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const once=(old,neu)=>{
  assert.equal(js.split(old).length,2,'Testinstrumentierung eindeutiger Core-Anker: '+old.slice(0,55));
  js=js.replace(old,neu);
};
once("  buche(state, schiff.owner, 'kosten', fee);",
  "  buche(state, schiff.owner, 'kosten', fee);\n"+
  "  __bk10n_handel(state,schiff,station,ware,menge,kauf,wert,fee);");
once("      for (const ware of ids(r.ein)) { st.lager[ware] -= r.ein[ware]; state.ledger[ware].consumed += r.ein[ware]; }",
  "      if (linie.rezept==='r_nahrung') __bk10n_start(state,id,r,index);\n"+
  "      for (const ware of ids(r.ein)) { st.lager[ware] -= r.ein[ware]; state.ledger[ware].consumed += r.ein[ware]; }");
once("          if (r.aus.nahrung) m_core_herkunft.erzeugen(state, rules, id, r.aus.nahrung);",
  "          if (r.aus.nahrung) m_core_herkunft.erzeugen(state, rules, id, r.aus.nahrung);\n"+
  "          if (linie.rezept==='r_nahrung') __bk10n_fertig(state,id,index);");
once("    for (const ware of ids(bedarf)) {\n      const da = anzahl(st.lager, ware);",
  "    for (const ware of ids(bedarf)) {\n      const da = anzahl(st.lager, ware);\n"+
  "      if(ware==='nahrung') __bk10n_preisVor(state,id,preis(state,id,ware,rules));");
once("      st.lager[ware] = da - n; state.ledger[ware].consumed += n;",
  "      if (ware==='nahrung'&&n) __bk10n_verzehr(state,id,n);\n"+
  "      st.lager[ware] = da - n; state.ledger[ware].consumed += n;");
once("    f.cash -= n; o[id].cash += n;",
  "    __bk10n_fonds(state,id,n,'minimum');\n"+
  "    f.cash -= n; o[id].cash += n;");
once("    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;",
  "    __bk10n_fonds(state,arm,f.cash-w.fondsObergrenze,'excess');\n"+
  "    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;");

const TARGETS=['st_nadir','st_cyris','st_veldra'],SEEDS=[1,2,7,11,13,17,42,99,1234,2026,65535,98765,314159];
const sum=arr=>arr.reduce((acc,x)=>acc+x,0);
const book=()=>({count:0,known:0,unknown:0,old:0,foreign:0,domesticUnknown:0,
  receipts:0,knownReceipts:0,knownIce:0,knownWages:0,margin:0,
  positive:0,negative:0,zero:0,
  importedOldUnits:0,importedOldPaidISK:0,importedOldRevenueISK:0,
  importedNewUnits:0,importedNewPaidISK:0,importedNewRevenueISK:0});
const empty=()=>({
  ice:[],old:[],neu:[],unfinished:new Map(),
  startedFood:0,production:0,knownFoodProduced:0,unknownFoodProduced:0,
  icePaid:{quantity:0,isk:0,minerQuantity:0,minerISK:0,traderQuantity:0,traderISK:0},
  foodInbound:{quantity:0,isk:0,neu:0},sold:book(),consumed:book(),
  localPrev:{quantity:0,isk:0,old:0},
  stationFees:0,fondsMindest:0,fondsExcess:0,pre:null,
  budget:{hours:0,foodAvailable:0,originalConsumed:0,originalPaid:0,
    floorForActualFood:0,extraForActualFood:0,
    attainableHours:0,unattainableHours:0,
    demand:0,instantAffordable:0,instantUnfunded:0,
    projectedMarketISK:0,projectedFloorISK:0,
    extraOnDomestic:0,extraOnImportedOld:0,
    chargingImportedOld:0,importedOldActualSpend:0,
    shortageBaseline:0,originUnknown:0,chargeableInitial:0,
    cashShortfallForFullDemandISK:0},
  foodShipSales:{},iceOriginUnknownUsed:0,realTrades:0
});
let active=null;
function tracked(st){return active&&active[st]||null;}
function account(b,lot,receipt){
  b.count++;b.receipts+=receipt;
  if(lot.kind==='importedOld'){
    b.importedOldUnits++;b.importedOldPaidISK+=lot.paid;
    b.importedOldRevenueISK+=receipt;
  }else if(lot.kind==='importedNew'){
    b.importedNewUnits++;b.importedNewPaidISK+=lot.paid;
    b.importedNewRevenueISK+=receipt;
  }
  if(lot.kind==='domestic'){
    if(lot.known){
      b.known++;b.knownReceipts+=receipt;b.knownIce+=lot.ice;
      b.knownWages+=lot.wages;
      const m=receipt-lot.ice-lot.wages;b.margin+=m;
      if(m>0)b.positive++;else if(m<0)b.negative++;else b.zero++;
    }else{b.unknown++;b.domesticUnknown++}
  }else{
    b.unknown++;
    if(lot.kind==='initial')b.old++;else b.foreign++;
  }
}
const foodTake=(t,num)=>{
  const got=[];
  for(let i=0;i<num;i++){
    const l=t.old.length?t.old.shift():t.neu.shift();
    assert(l,'Nahrungsbuchung ohne eigenes Herkunftslos');got.push(l);
  }
  return got;
};
function handel(state,ship,station,ware,menge,kauf,wert,fee){
  const t=tracked(station);if(!t)return;
  assert.equal(wert%menge,0,'Preisblock wird tatsaechlich in ganzen ISK bezahlt');
  const p=wert/menge;
  t.stationFees+=fee;t.realTrades++;
  if(ware==='eis'){
    if(kauf){
      for(let i=0;i<menge;i++)assert(t.ice.shift(),'Eisverkauf ohne Lagerlos');
    }else{
      const miner=ship.klasse==='miner';
      for(let i=0;i<menge;i++)t.ice.push({kind:miner?'miner':'trader',price:p});
      t.icePaid.quantity+=menge;t.icePaid.isk+=wert;
      if(miner){t.icePaid.minerQuantity+=menge;t.icePaid.minerISK+=wert}
      else{t.icePaid.traderQuantity+=menge;t.icePaid.traderISK+=wert}
    }
  }else if(ware==='nahrung'){
    if(kauf){
      const lots=foodTake(t,menge);
      for(const l of lots)account(t.sold,l,p);
      const id=ship.owner;
      const own=t.foodShipSales[id]||{units:0,isk:0};
      own.units+=menge;own.isk+=wert;t.foodShipSales[id]=own;
    }else{
      // Bei Original-Handel kann Nahrung entweder alt oder als gesicherte
      // transportierte Neuware einlaufen. Der Original-Core hat bereits
      // die gelieferte Neu-Provenienz gebucht.
      const knownNeu=t.neu.length;
      const shouldNeu=state.stations[station].lokalNeuNahrung;
      const incomingNeu=shouldNeu-knownNeu;
      assert(incomingNeu>=0&&incomingNeu<=menge,'Original-New-Provenienz exakt abgeglichen');
      for(let i=0;i<menge-incomingNeu;i++)t.old.push({kind:'importedOld',paid:p});
      for(let i=0;i<incomingNeu;i++)t.neu.push({kind:'importedNew',paid:p});
      t.foodInbound.quantity+=menge;t.foodInbound.isk+=wert;
      t.foodInbound.neu+=incomingNeu;
    }
  }
}
function start(state,id,r,index){
  const t=tracked(id);if(!t)return;
  assert(!t.unfinished.has(index),'kein doppelter Original-Fabrikauftrag');
  assert.equal(r.ein.eis,2);
  const input=[t.ice.shift(),t.ice.shift()];
  assert(input.every(Boolean),'Fabrik greift auf vorhandene Eislose zu');
  const known=input.every(x=>Number.isSafeInteger(x.price));
  t.iceOriginUnknownUsed+=input.filter(x=>x.price===undefined).length;
  t.startedFood++;
  t.unfinished.set(index,{kind:'domestic',known,ice:known?sum(input.map(x=>x.price)):null,
    wages:r.dauer*4,minute:state.tick,origin:input.map(x=>x.kind)});
}
function fertig(state,id,index){
  const t=tracked(id);if(!t)return;
  const l=t.unfinished.get(index);
  assert(l&&l.minute<state.tick,'Original-Fabrikabschluss zum bezahlten Arbeitsauftrag');
  t.unfinished.delete(index);t.neu.push(l);
  t.production++;if(l.known)t.knownFoodProduced++;else t.unknownFoodProduced++;
}
function preisVor(state,id,p){
  const t=tracked(id);if(!t)return;
  assert(p>0&&Number.isSafeInteger(p));
  assert(!t.pre,'nur einmal Preisvorschau je Original-Stunde');
  t.pre={market:p,cash:state.owners['hh_'+id].cash,
    food:state.stations[id].lager.nahrung,
    demand:rules.world.stations[id].verbrauch.nahrung,
    minute:state.tick};
}
function floor(l,market){
  if(l.kind==='domestic'&&l.known)return Math.max(market,l.ice+l.wages);
  if(l.kind==='importedOld'||l.kind==='importedNew')
    return Math.max(market,l.paid);
  if(l.kind==='initial')return 0; // bestaetigte Startware, keine Nachberechnung
  return market; // eigene Start-Eis-Kosten unbekannt, nicht als Nullwert ansetzen
}
function shadow(state,id,n,paid,isk,alt){
  const t=tracked(id),b=t.budget,pre=t.pre;assert(pre);
  assert.equal(pre.minute,state.tick);
  assert.equal(pre.cash, state.owners['hh_'+id].cash+isk,
    'Kassenwert vor Originalkauf mit tatsaechlich abgezogenem Geld belegt');
  assert.equal(isk,paid*pre.market,'Original-Core-Nahrungspreis zum Stundenkauf');
  assert.equal(alt+paid,n);
  const available=Math.min(pre.food,pre.demand);
  const oldN=Math.min(t.old.length,available);
  const newN=available-oldN;
  assert(newN<=t.neu.length);
  const expected=t.old.slice(0,oldN).concat(t.neu.slice(0,newN));
  const consumed=t.old.slice(0,alt).concat(t.neu.slice(0,paid));
  const charge=consumed.reduce((x,l)=>x+floor(l,pre.market),0);
  assert(charge>=isk,'Originalzahlung ist hoechstens die minimale Vollkostenzahlung');
  const incremental=charge-isk;
  b.hours++;b.foodAvailable+=available;
  b.originalConsumed+=n;b.originalPaid+=isk;
  b.floorForActualFood+=charge;b.extraForActualFood+=incremental;
  b.demand+=pre.demand;
  b.shortageBaseline+=pre.demand-n;
  b.projectedMarketISK+=expected.reduce((x,l)=>x+(l.kind==='initial'?0:pre.market),0);
  b.projectedFloorISK+=expected.reduce((x,l)=>x+floor(l,pre.market),0);
  b.originUnknown+=consumed.filter(l=>l.kind==='domestic'&&!l.known).length;
  b.chargeableInitial+=consumed.filter(l=>l.kind==='initial').length;
  for(const l of consumed){
    if(l.kind==='domestic'&&l.known)b.extraOnDomestic+=
      Math.max(0,l.ice+l.wages-pre.market);
    if(l.kind==='importedOld'){
      b.extraOnImportedOld+=floor(l,pre.market);
      b.chargingImportedOld++;
    }
  }
  if(pre.cash>=charge)b.attainableHours++;else b.unattainableHours++;
  b.cashShortfallForFullDemandISK+=Math.max(0,
    expected.reduce((x,l)=>x+floor(l,pre.market),0)-pre.cash);
  let left=pre.cash,affordable=0;
  for(const l of expected){
    const price=floor(l,pre.market);
    if(price>left)break; // keine Kreditaufnahme, erste unfinanzierte Einheit stoppt
    left-=price;affordable++;
  }
  b.instantAffordable+=affordable;
  b.instantUnfunded+=available-affordable;
  t.pre=null;
}
function verzehr(state,id,n){
  const t=tracked(id);if(!t)return;
  const stat=state.stats.haushaltskauf[id],before=t.localPrev;
  const paid=stat.menge-before.quantity,isk=stat.isk-before.isk,
    alt=stat.alt-before.old;
  assert.equal(paid+alt,n,'Original-Stundenkonsum bezahlt oder als Altware erfasst');
  shadow(state,id,n,paid,isk,alt);
  assert(alt<=t.old.length,'Originalkonsum zuerst Alt-/Import-Nahrung');
  assert(paid<=t.neu.length,'Originalkonsum nur lokaler oder importierter Neuware');
  assert.equal(paid===0?0:isk%paid,0);
  const unit=paid?isk/paid:0;
  for(let i=0;i<alt;i++)account(t.consumed,t.old.shift(),0);
  for(let i=0;i<paid;i++)account(t.consumed,t.neu.shift(),unit);
  assert.equal(t.consumed.importedOldRevenueISK,0,
    'Originalmodell verschenkt nur die tatsächlich als Altware klassifizierten Fremdimporte');
  t.localPrev={quantity:stat.menge,isk:stat.isk,old:stat.alt};
}
function fonds(_state,id,n,source){
  const t=tracked(id);if(!t)return;
  assert(Number.isSafeInteger(n)&&n>0);
  if(source==='minimum')t.fondsMindest+=n;else t.fondsExcess+=n;
}
const {core,base}=new Function('__bk10n_handel','__bk10n_start',
  '__bk10n_fertig','__bk10n_verzehr','__bk10n_fonds','__bk10n_preisVor',js+
  ';return {core:m_core_index,base:m_data_rules.RULES};')(
    handel,start,fertig,verzehr,fonds,preisVor);
assert.equal(base.schema,8);assert.equal(base.rulesVersion,14);
const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
  produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true}};
function invariant(s){
  const available=sum(Object.values(s.owners).map(o=>o.cash));
  const escrow=sum(Object.values(s.vertraege.eintraege).map(c=>c.rest));
  assert.equal(available+escrow,s.initialSupply+s.minted-s.burned,'unabhaengige ISK Bilanz');
  for(const [ware,l] of Object.entries(s.ledger)){
    const stock=sum(Object.values(s.stations).map(x=>x.lager[ware]||0))+
      sum(Object.values(s.ships).map(x=>x.ladung[ware]||0));
    assert.equal(stock,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      'unabhaengige Bilanz fuer '+ware);
  }
  for(const id of TARGETS){
    const t=active[id],st=s.stations[id];
    // Test-only Monatskonto bleibt unberuehrt: keine Geld- oder Warenmutation.
    assert(t.budget.instantAffordable<=t.budget.foodAvailable);
    assert.equal(t.ice.length,st.lager.eis,id+': Eisbestand der Buchungs-FIFO');
    assert.equal(t.old.length+t.neu.length,st.lager.nahrung,id+': Nahrungsbestand FIFO');
    assert.equal(t.neu.length,st.lokalNeuNahrung,id+': Neunahrung laut Original');
    assert.equal(t.production,t.knownFoodProduced+t.unknownFoodProduced,id+': alle Produktionsabschluesse');
    assert.equal(t.startedFood,t.production+t.unfinished.size,
      id+': jede gestartete Nahrungsproduktion entweder laufend oder bezahlt abgeschlossen');
    for(const b of [t.sold,t.consumed]){
      assert.equal(b.known+b.unknown,b.count,id+': jede Transaktion zugeordnet');
      assert.equal(b.knownReceipts-b.knownIce-b.knownWages,b.margin,id+': echte Einstandsrechnung');
      assert.equal(b.positive+b.negative+b.zero,b.known,id+': jede Vollkostencharge klassifiziert');
    }
  }
  assert(core.audit(s).ok,'Original-Core-Geld/Waren-Audit');
}
function run(seed,hours=72,output=true){
  const s=core.createState(seed,rules);
  assert(Object.values(s.ships).some(sh=>sh.klasse==='frachter'&&sh.auftrag==='handeln'),
    'NPC-Handelsflotten laufen original autonom');
  active={};
  for(const id of TARGETS){
    const st=s.stations[id];
    assert(st.linien.some(line=>line.rezept==='r_nahrung'));
    const t=empty();
    t.ice=Array.from({length:st.lager.eis},()=>({kind:'start'}));
    t.old=Array.from({length:st.lager.nahrung},()=>({kind:'initial'}));
    active[id]=t;
  }
  const first={};
  for(const id of TARGETS)first[id]={ice:core.preis(s,id,'eis',rules),
    food:core.preis(s,id,'nahrung',rules),
    startIce:s.stations[id].lager.eis,startFood:s.stations[id].lager.nahrung};
  invariant(s);
  for(let i=0;i<hours*60;i++){
    core.step(s,rules);
    if(s.tick%60===0)invariant(s);
    if(s.tick%1440===0){
      const saved=core.save(s),loaded=core.load(saved,undefined,rules);
      assert.equal(core.hash(loaded),core.hash(s),'originales Save/Load/Hash');
      invariant(loaded);
    }
  }
  const results={seed,hours,globalISK:s.initialSupply+s.minted-s.burned,
    minted:s.minted,burned:s.burned,hash:core.hash(s),stationen:{}};
  for(const id of TARGETS){
    const t=active[id],st=s.stations[id],sold=t.sold,local=t.consumed;
    results.stationen[id]={
      originalStart: first[id],
      production:t.production,knownProduction:t.knownFoodProduced,
      unknownProduction:t.unknownFoodProduced,remainingIce:t.ice.length,
      remainingFood:st.lager.nahrung,remainingNew:t.neu.length,
      icePurchases:t.icePaid,iceFromUnknownStart:t.iceOriginUnknownUsed,
      foodInbound:t.foodInbound,sold,local,foodShipSales:t.foodShipSales,
      fondstoStation:t.fondsMindest+t.fondsExcess,
      foodWages:t.production*24,tradeFeeTotal:t.stationFees,budget:t.budget,
      stationCash:s.owners[id].cash,householdCash:s.owners['hh_'+id].cash,
      endIcePrice:core.preis(s,id,'eis',rules),
      endFoodPrice:core.preis(s,id,'nahrung',rules),
      localHouseholds:s.stats.haushaltskauf[id],
      costedFoodInStock:t.neu.filter(x=>x.kind==='domestic'&&x.known).length};
    assert(t.production>0,id+': eigenstaendige Produktion pruefen');
  }
  if(output)console.log('B-K10n reale Cyris Veldra Normalwelt',JSON.stringify(results));
  active=null;return results;
}
test('B-K10n: Nadir/Cyris/Veldra unveraenderte Seed42/7 Normalwelt 72h mit Haushalts-Kaufkraft',()=>{
  for(const seed of [42,7])run(seed);
});
test('B-K10n: Seed42 nach 24h reproduzierbar bei mehrteiligen Fabriklinien',()=>{
  assert.deepEqual(run(42,24,false),run(42,24,false));
});
test('B-K10n: 13 autonome Seeds je 72h; 3 Hersteller und begrenzte reale Kaufkraft',()=>{
  const rows=SEEDS.map(seed=>run(seed,72,false));
  const zusammen={seeds:rows.length,stations:{}};
  for(const id of TARGETS){
    const values=rows.map(x=>({seed:x.seed,...x.stationen[id]}));
    const sold=values.map(x=>x.sold),local=values.map(x=>x.local);
    const acc={produced:sum(values.map(x=>x.production)),
      knownManufactured:sum(values.map(x=>x.knownProduction)),
      iceBought:sum(values.map(x=>x.icePurchases.quantity)),
      iceBoughtISK:sum(values.map(x=>x.icePurchases.isk)),
      iceMiner:sum(values.map(x=>x.icePurchases.minerQuantity)),
      iceTraders:sum(values.map(x=>x.icePurchases.traderQuantity)),
      foodFromOtherShips:sum(values.map(x=>x.foodInbound.quantity)),
      unpaidImportedOldConsumed:sum(local.map(x=>x.importedOldUnits)),
      unpaidImportedOldProcurementISK:sum(local.map(x=>x.importedOldPaidISK)),
      importedOldResold:sum(sold.map(x=>x.importedOldUnits)),
      importedNewConsumed:sum(local.map(x=>x.importedNewUnits)),
      importedNewConsumerRevenueISK:sum(local.map(x=>x.importedNewRevenueISK)),
      knownSold:sum(sold.map(x=>x.known)),soldMargin:sum(sold.map(x=>x.margin)),
      soldLossSeedCount:sold.filter(x=>x.known>0&&x.margin<0).length,
      soldPositiveSeedCount:sold.filter(x=>x.known>0&&x.margin>0).length,
      knownConsumed:sum(local.map(x=>x.known)),consumedMargin:sum(local.map(x=>x.margin)),
      localLossSeedCount:local.filter(x=>x.known>0&&x.margin<0).length,
      localPositiveSeedCount:local.filter(x=>x.known>0&&x.margin>0).length,
      fundTransfers:sum(values.map(x=>x.fondstoStation)),
      budget:{foodAvailable:sum(values.map(x=>x.budget.foodAvailable)),
        factualConsumed:sum(values.map(x=>x.budget.originalConsumed)),
        factualPaidISK:sum(values.map(x=>x.budget.originalPaid)),
        floorForActualFoodISK:sum(values.map(x=>x.budget.floorForActualFood)),
        extraForActualFoodISK:sum(values.map(x=>x.budget.extraForActualFood)),
        estimatedInstantUnfundedUnits:sum(values.map(x=>x.budget.instantUnfunded)),
        supplyConstrainedBaselineUnits:sum(values.map(x=>x.budget.shortageBaseline)),
        totalDemand:sum(values.map(x=>x.budget.demand)),
        unaffordableOriginalHourCount:sum(values.map(x=>x.budget.unattainableHours)),
        instantCashGapISK:sum(values.map(x=>x.budget.cashShortfallForFullDemandISK)),
        paidImportedOldToCharge:sum(values.map(x=>x.budget.chargingImportedOld))},
      noKnownCosts:values.filter(x=>x.knownProduction===0).map(x=>x.seed)};
    zusammen.stations[id]=acc;
    assert(acc.produced>0);
  }
  assert.equal(rows.length,13);
  assert(Object.keys(zusammen.stations).length===3,'alle Nahrungshersteller ohne Ausnahmen');
  assert.equal(zusammen.stations.st_cyris.soldLossSeedCount,13,
    'Cyris 13/13 mit negativem belegten Exportbeitrag');
  assert.equal(zusammen.stations.st_veldra.soldLossSeedCount,13,
    'Veldra 13/13 mit negativem belegten Exportbeitrag');
  assert.equal(zusammen.stations.st_veldra.localLossSeedCount,13);
  assert(zusammen.stations.st_cyris.localLossSeedCount>=12);
  assert(zusammen.stations.st_cyris.iceMiner>0,
    'Cyris kauft direkt vom bezahlten Original-Miner');
  assert.equal(zusammen.stations.st_veldra.iceMiner,0,
    'Veldra verfuegt nicht ueber eigenes Original-Eisfeld');
  assert(zusammen.stations.st_veldra.iceTraders>0,
    'Veldra muss wirklich Rohstoffe von Haendlern kaufen');
  for(const id of TARGETS){
    assert(zusammen.stations[id].unpaidImportedOldConsumed>0,
      id+': importierte alte Nahrung wird in der Original-Stundenregel unbezahlt gegessen');
    assert(zusammen.stations[id].unpaidImportedOldProcurementISK>0,
      id+': Station hat die kostenlos gegessene Importware wirklich bezahlt');
  }
  console.log('B-K10n 13 Seed Herstellervergleich',JSON.stringify(zusammen));
});
