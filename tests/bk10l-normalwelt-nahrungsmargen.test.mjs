// B-K10l [ANALYSE/DRAFT]: unveraenderte aktive R15-Versuchswelt.
// Echte Core-Zahlungen und Initialbestand als UNBEKANNTE Kostenbasis trennen.
// Keine Produktregeln, keine Preise/Loehne/Fonds/Saves veraendert.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let js=html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='));
const unique=(old,neu)=>{
  assert.equal(js.split(old).length,2,'eindeutiger Core-Journalpunkt: '+old.slice(0,45));
  js=js.replace(old,neu);
};
unique("  buche(state, schiff.owner, 'kosten', fee);",
  "  buche(state, schiff.owner, 'kosten', fee);\n"+
  "  __bk10l_trade(state,schiff,station,ware,menge,kauf,wert,fee);");
unique("      for (const ware of ids(r.ein)) { st.lager[ware] -= r.ein[ware]; state.ledger[ware].consumed += r.ein[ware]; }",
  "      if(id==='st_nadir'&&linie.rezept==='r_nahrung') __bk10l_start(state,r,index);\n"+
  "      for (const ware of ids(r.ein)) { st.lager[ware] -= r.ein[ware]; state.ledger[ware].consumed += r.ein[ware]; }");
unique("          if (r.aus.nahrung) m_core_herkunft.erzeugen(state, rules, id, r.aus.nahrung);",
  "          if (r.aus.nahrung) m_core_herkunft.erzeugen(state, rules, id, r.aus.nahrung);\n"+
  "          if(id==='st_nadir'&&linie.rezept==='r_nahrung') __bk10l_finish(state,index);");
unique("      st.lager[ware] = da - n; state.ledger[ware].consumed += n;",
  "      if(id==='st_nadir'&&ware==='nahrung'&&n) __bk10l_consume(state,n);\n"+
  "      st.lager[ware] = da - n; state.ledger[ware].consumed += n;");
unique("    f.cash -= n; o[id].cash += n;",
  "    __bk10l_fond(state,id,n,'mindest');\n"+
  "    f.cash -= n; o[id].cash += n;");
unique("    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;",
  "    __bk10l_fond(state,arm,f.cash-w.fondsObergrenze,'ueberschuss');\n"+
  "    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;");

const sum=arr=>arr.reduce((n,x)=>n+x,0);
const world={};
let current=null;
const rec=(type)=>({art:type,count:0,umsatz:0,iceCost:0,prodWage:0,margin:0,
  loss:0,positive:0,negative:0,unknownCount:0,
  cashByOwner:{},prices:{}});
function reportLot(aggregate,lot,receipt){
  aggregate.count++;aggregate.umsatz+=receipt;
  if(lot.typ==='produziert'){
    aggregate.prodWage+=lot.wage;
    if(lot.iceKnown){
      aggregate.iceCost+=lot.iceCost;
      const m=receipt-lot.wage-lot.iceCost;aggregate.margin+=m;
      if(m<0){aggregate.negative++;aggregate.loss+=m}
      else if(m>0)aggregate.positive++;
    }else aggregate.unknownCount++;
  }else aggregate.unknownCount++;
}
function begin(seed,core,rules){
  const s=core.createState(seed,rules),id='st_nadir';
  const t={
    ice:Array.from({length:s.stations[id].lager.eis},()=>({typ:'anfang',cash:null})),
    food:Array.from({length:s.stations[id].lager.nahrung},()=>({typ:'anfang',wage:null})),
    opened:new Map(),production:0,productionFromBoughtIce:0,
    foodSold:rec('station_verkauf'),foodConsumed:rec('lokal_verbrauch'),
    paidIce:{units:0,isk:0,fromMinerUnits:0,fromMinerISK:0,fromTradersUnits:0,fromTradersISK:0},
    initialIceUsed:0,producedCostKnown:0,producedCostUnknown:0,
    purchasedFoodUnits:0,purchasedFoodISK:0,
    foodOutByShip:{},fondsMindest:0,fondsMehr:0,tradeFees:0,
    localLastPaid:0,localLastISK:0,localLastAlt:0,initialIce:s.stations[id].lager.eis,
    initialFood:s.stations[id].lager.nahrung,
    initialGlobalSupply:s.initialSupply,realEvents:0
  };
  return {s,t};
}
function trade(s,ship,station,ware,menge,kauf,wert,fee){
  if(!current||station!=='st_nadir')return;
  const t=current,ppu=wert/menge;
  assert(Number.isSafeInteger(ppu),'Originalverkaufsblock mit ganzzahligem Preis');
  t.tradeFees+=fee;t.realEvents++;
  if(ware==='eis'){
    if(kauf){
      for(let i=0;i<menge;i++)assert(t.ice.shift(),'Eisverkauf ohne Rohstoff');
    }else{
      const miner=ship.klasse==='miner'&&ship.owner==='npc3';
      for(let i=0;i<menge;i++)t.ice.push({typ:miner?'miner':'fremd',cash:ppu});
      t.paidIce.units+=menge;t.paidIce.isk+=wert;
      if(miner){t.paidIce.fromMinerUnits+=menge;t.paidIce.fromMinerISK+=wert}
      else{t.paidIce.fromTradersUnits+=menge;t.paidIce.fromTradersISK+=wert}
    }
  }else if(ware==='nahrung'){
    if(kauf){
      assert(t.food.length>=menge);
      for(let i=0;i<menge;i++){
        const lot=t.food.shift();
        reportLot(t.foodSold,lot,ppu);
        const owner=ship.owner;
        (t.foodOutByShip[owner] ||= {units:0,isk:0}).units++;
        t.foodOutByShip[owner].isk+=ppu;
      }
    }else{
      for(let i=0;i<menge;i++)t.food.push({typ:'extern',cash:ppu});
      t.purchasedFoodUnits+=menge;t.purchasedFoodISK+=wert;
    }
  }
}
function start(s,r,index){
  const t=current;
  assert(t&&!t.opened.has(index));
  const taken=[];
  for(let k=0;k<r.ein.eis;k++){
    assert(t.ice.length,'Originalproduktion ohne laengst vorhandenes Eis');
    taken.push(t.ice.shift());
  }
  const known=taken.every(x=>x.cash!==null);
  if(known)t.producedCostKnown++;
  else{t.producedCostUnknown++;t.initialIceUsed+=taken.filter(x=>x.cash===null).length}
  t.opened.set(index,{typ:'produziert',iceKnown:known,
    iceCost:known?sum(taken.map(x=>x.cash)):null,wage:r.dauer*4,
    start:s.tick,iceOrigins:taken.map(x=>x.typ)});
}
function finish(s,index){
  const t=current,lot=t.opened.get(index);
  assert(lot&&lot.start<s.tick);
  t.opened.delete(index);t.food.push(lot);t.production++;
}
function consume(s,n){
  const t=current,stat=s.stats.haushaltskauf.st_nadir;
  const paid=stat.menge-t.localLastPaid;
  const isk=stat.isk-t.localLastISK;
  const alt=stat.alt-t.localLastAlt;
  assert.equal(paid+alt,n,'Originalverbrauch bezahlt oder Anfangsbestand');
  assert(t.food.length>=n,'Nadir Nahrungslager-Herkunft vollstaendig');
  const p=paid?isk/paid:0;assert(!paid||Number.isSafeInteger(p));
  for(let i=0;i<n;i++){
    const lot=t.food.shift();
    const receipt=i<alt?0:p;
    reportLot(t.foodConsumed,lot,receipt);
  }
  t.localLastPaid=stat.menge;t.localLastISK=stat.isk;t.localLastAlt=stat.alt;
}
function fonds(s,id,n,art){
  if(!current||id!=='st_nadir')return;
  if(art==='mindest')current.fondsMindest+=n;
  else current.fondsMehr+=n;
}
const {core,base}=new Function('__bk10l_trade','__bk10l_start',
  '__bk10l_finish','__bk10l_consume','__bk10l_fond',js+
  ';return {core:m_core_index,base:m_data_rules.RULES};')(
    trade,start,finish,consume,fonds);
assert.equal(base.schema,8);assert.equal(base.rulesVersion,14);
const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
  produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true}};
function audit(s,t){
  const frei=sum(Object.values(s.owners).map(x=>x.cash));
  const gebunden=sum(Object.values(s.vertraege.eintraege).map(x=>x.rest));
  assert.equal(frei+gebunden,s.initialSupply+s.minted-s.burned);
  for(const [ware,l] of Object.entries(s.ledger)){
    const wareImMarkt=sum(Object.values(s.stations).map(x=>x.lager[ware]||0))+
      sum(Object.values(s.ships).map(x=>x.ladung[ware]||0));
    assert.equal(wareImMarkt,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      'Original-Ledger Ware '+ware);
  }
  assert.equal(t.ice.length,s.stations.st_nadir.lager.eis,'Eis FIFO gleich Core');
  assert.equal(t.food.length,s.stations.st_nadir.lager.nahrung,'Nahrung FIFO gleich Core');
  assert.equal(t.production,s.stats.rezepte.st_nadir,'Original Nadir-Nahrungszyklen');
  assert.equal(t.production+t.opened.size,t.producedCostKnown+t.producedCostUnknown,
    'begonnene, noch offene und abgeschlossene Nahrungszyklen exakt zugeordnet');
  assert(core.audit(s).ok);
}
function run(seed,durationHours=72,ausgabe=true){
  const {s,t}=begin(seed,core,rules);current=t;
  assert.equal(s.stations.st_nadir.lager.eis,100);
  assert.equal(s.stations.st_nadir.lager.nahrung,52);
  assert(Object.values(s.ships).some(x=>x.klasse==='frachter'&&x.auftrag==='handeln'),
    'autonome Haendler sind aktiv');
  const originalIcePreis=core.preis(s,'st_nadir','eis',rules);
  const originalFoodPreis=core.preis(s,'st_nadir','nahrung',rules);
  for(let i=0;i<durationHours*60;i++){
    core.step(s,rules);
    if(s.tick%60===0)audit(s,t);
    if(s.tick%1440===0){
      const loaded=core.load(core.save(s),undefined,rules);
      assert.equal(core.hash(loaded),core.hash(s),'Save/Load t='+s.tick);
      audit(loaded,t);
    }
  }
  const sold=t.foodSold,cons=t.foodConsumed;
  const res={seed,hours:durationHours,iceStartOriginal:100,foodStartOriginal:52,
    firstIceMarketPrice:originalIcePreis,firstFoodMarketPrice:originalFoodPreis,
    lastIceMarketPrice:core.preis(s,'st_nadir','eis',rules),
    lastFoodMarketPrice:core.preis(s,'st_nadir','nahrung',rules),
    foodProduced:t.production,foodProducedFromPaidIce:t.producedCostKnown,
    foodProducedWithUnpricedInitialIce:t.producedCostUnknown,
    usedUnpricedInitialIce:t.initialIceUsed,
    iceOriginalTransactions:t.paidIce,foodExternalBoughtUnits:t.purchasedFoodUnits,
    foodExternalBoughtISK:t.purchasedFoodISK,
    foodSold:sold,foodConsumed:cons,
    foodSalesByOwner:t.foodOutByShip,
    originalFondsToNadir:t.fondsMindest+t.fondsMehr,
    foodProductionWages:24*t.production,
    foodProducedStillOnStation:t.food.filter(x=>x.typ==='produziert').length,
    producedLotsWithKnownCostSoldOrConsumed:
      sold.count-sold.unknownCount+cons.count-cons.unknownCount,
    stationISK:s.owners.st_nadir.cash,householdISK:s.owners.hh_st_nadir.cash,
    iceStock:s.stations.st_nadir.lager.eis,foodStock:s.stations.st_nadir.lager.nahrung,
    localFoodPaid:s.stats.haushaltskauf.st_nadir,
    minted:s.minted,burned:s.burned,globalMoney:s.initialSupply+s.minted-s.burned,
    hash:core.hash(s)};
  assert(t.realEvents>0,'echter NPC-Handel muss ausgefuehrt sein');
  assert(t.paidIce.fromMinerUnits>0,'wirklicher Miner verkauft Eis');
  assert(t.production>0,'wirkliche bezahlte Nahrung produziert');
  assert(t.fondsMindest>0,'echte Fondszahlungen dokumentiert');
  if(ausgabe)console.log('B-K10l unveraenderte Autonomwelt Eis-Nahrung',JSON.stringify(res));
  current=null;return res;
}
test('B-K10l: originale vollautonome Welt mit Anfangsware und tatsaechlicher FIFO-Herkunft Seeds42/7 72h',()=>{
  for(const seed of [42,7])run(seed);
});
test('B-K10l: unveraenderte Seed42-Welt 24h reproduzierbar, Save-/Hash-/Geld-/Warenaudit',()=>{
  assert.deepEqual(run(42,24,false),run(42,24,false));
});
