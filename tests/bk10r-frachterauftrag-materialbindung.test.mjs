// B-K10r [ANALYSE/DRAFT] Echte Werftbestellung mit test-only-Bauteilbindung.
// Alle Geld-/Warenbewegungen und Schiffverluste vom Original-Core.
// Nicht produktiver, NICHT savefester Materialfilter; kein Gratis-Schiff.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let js=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
function one(old,neu) {
  assert.equal(js.split(old).length,2,'eindeutiger Originalanker '+old.slice(0,54));
  js=js.replace(old,neu);
}
one("      const eingaben = ids(r.ein).every((w) => anzahl(st.lager, w) >= r.ein[w]);",
    "      const eingaben = ids(r.ein).every((w) => anzahl(st.lager, w) >= r.ein[w])"+
    " && __bk10r_gate(state,id,linie.rezept,r,st);");
one("      linie.rest = r.dauer;",
    "      __bk10r_start(state,id,linie.rezept,st);"+
    "      linie.rest = r.dauer;");
one("          if (r.aus.nahrung) m_core_herkunft.erzeugen(state, rules, id, r.aus.nahrung);",
    "          __bk10r_finish(state,id,linie.rezept,st);"+
    "          if (r.aus.nahrung) m_core_herkunft.erzeugen(state, rules, id, r.aus.nahrung);");
one("  buche(state, schiff.owner, 'kosten', fee);",
    "  buche(state, schiff.owner, 'kosten', fee);"+
    "  __bk10r_trade(state,schiff,station,ware,menge,kauf,wert,fee);");
one("  delete state.ships[s.id];",
    "  __bk10r_loss(state,s);"+
    "  delete state.ships[s.id];");

let active=null,core;
function material(state,id,recipe,r,station) {
  if(!active||!active.reserve||!active.materialLocked
    ||id!=='st_aldera'||recipe==='r_frachter'||!r.ein.bauteil)return true;
  const free=station.lager.bauteil-8;
  if(free<r.ein.bauteil){
    active.denials++;
    return false;
  }
  return true;
}
function start(state,id,recipe,st) {
  if(!active||id!=='st_aldera')return;
  if(recipe==='r_bauteil')active.partsStarted++;
  if(recipe==='r_frachter'){
    active.freighterStarted++;
    active.materialLocked=false;
    active.milestones.push({type:'frachterStart',tick:state.tick,
      partsAfterOriginalConsumption:st.lager.bauteil,
      originalWageReserve:36*4});
  }
}
function finish(state,id,recipe,st) {
  if(!active||id!=='st_aldera')return;
  if(recipe==='r_bauteil')active.partsFinished++;
  if(recipe==='r_frachter'){
    active.freighterFinished++;
    const purchasePrice=core.preis(state,id,'frachter',rules);
    const fee=core.gebuehr(state,rules,id,purchasePrice);
    assert(st.lager.frachter>=1,'Original-Frachter erst nach echter Herstellung');
    assert(purchasePrice+fee<=active.buyerBudget,
      'prepaid buyer escrow must fully cover the actual hull price plus fee');
    assert(active.order,'original funds actually reserved for buyer');
    const v=state.vertraege.eintraege[active.order];
    assert.equal(v.status,'offen');
    assert.equal(v.rest,active.buyerBudget);
    // Original-Escrow erstatten an den Besteller, der den Original-
    // Ersatzkauf danach SELBST aus seiner Wallet zum echten Preis bezahlt.
    assert(core.vertrag.abschliessen(state,active.order));
    active.milestones.push({type:'frachterFertig',tick:state.tick,
      physicalHull:st.lager.frachter,
      priceQuote:purchasePrice+fee,escrowRefunded:active.buyerBudget});
    active.orderReleased=true;
  }
}
function trade(state,ship,station,ware,qty,buy,price,fee) {
  if(!active)return;
  if(ship.id==='sh002'&&ware==='silizium')
    active.silicon.push({tick:state.tick,station,qty,buy,price,fee});
  if(ship.owner==='npc2'&&station==='st_aldera'&&ware==='frachter'&&buy)
    active.purchases.push({tick:state.tick,ship:ship.id,
      price,fee,actualPaid:price+fee,ownerCash:state.owners.npc2.cash});
}
function loss(state,ship) {
  if(active&&ship.owner==='npc2'&&active.purchases.some(x=>x.ship===ship.id))
    active.losses.push({tick:state.tick,id:ship.id,system:ship.system,
      phase:ship.phase,load:JSON.parse(JSON.stringify(ship.ladung)),
      source:'Original m_core_sicherheit.entfernen / zerstoeren'});
}
const parsed=new Function('__bk10r_gate','__bk10r_start','__bk10r_finish',
  '__bk10r_trade','__bk10r_loss',
  js+';return {core:m_core_index,base:m_data_rules.RULES};')(
  material,start,finish,trade,loss);
core=parsed.core;
const base=parsed.base;
assert.equal(base.schema,8);assert.equal(base.rulesVersion,14);
const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
  produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true}};
const sum=x=>x.reduce((a,b)=>a+b,0);
function audit(s) {
  const cash=sum(Object.values(s.owners).map(x=>x.cash));
  const escrow=sum(Object.values(s.vertraege.eintraege).map(x=>x.rest));
  assert.equal(cash+escrow,s.initialSupply+s.minted-s.burned,
    'unabhaengiger Echtgeld-/Escrow-Audit');
  for(const [ware,l] of Object.entries(s.ledger)){
    const phys=sum(Object.values(s.stations).map(x=>x.lager[ware]||0))+
      sum(Object.values(s.ships).map(x=>x.ladung[ware]||0));
    assert.equal(phys,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      'unabhaengige Ware: '+ware);
  }
  assert(core.audit(s).ok,'Core-Audit muss beide Geld-/Warenpruefungen bestehen');
}
function roundTrip(s) {
  const copy=core.load(core.save(s),undefined,rules);
  assert.equal(core.hash(copy),core.hash(s),'Originalsave und Hash');
  audit(copy);
}
let initial=core.createState(42,rules);
for(let t=0;t<14*1440;t++){
  core.step(initial,rules);
  if(initial.tick%1440===0){audit(initial);roundTrip(initial);}
}
assert.equal(initial.tick,20160);
assert.equal(initial.owners.npc2.cash,2792);
assert.equal(initial.owners.house.cash,2000);
assert.equal(initial.stations.st_aldera.lager.silizium,0);
assert.equal(initial.stations.st_aldera.lager.bauteil,0);
assert.equal(initial.stations.st_aldera.lager.frachter,0);
const fixture=core.save(initial);
function fly(s,dest){
  const x=core.execute(s,{type:'shipMove',owner:'house',schiff:'sh002',ziel:dest},rules);
  assert(x.ok,'original paid flight must start: '+JSON.stringify(x));
  let n=0;
  while(s.ships.sh002.phase==='reise'||s.ships.sh002.vertrag){
    assert(n++<120,'keine unendliche Fahrt oder offene Reserve');
    core.step(s,rules);
    if(s.tick%60===0)audit(s);
  }
  assert.equal(s.ships.sh002.system,rules.world.stations[dest].system);
  assert(!s.ships.sh002.vertrag);
  audit(s);
}
function order(qty,reserve=true,buyerBudget=1600) {
  const s=core.load(fixture,undefined,rules);
  active={reserve,materialLocked:reserve,order:null,buyerBudget,
    orderReleased:false,partsStarted:0,partsFinished:0,
    freighterStarted:0,freighterFinished:0,denials:0,
    silicon:[],purchases:[],losses:[],milestones:[]};
  const track=active,baseCash=s.owners.npc2.cash;
  track.order=core.vertrag.reservieren(s,'npc2','st_aldera',buyerBudget);
  assert(track.order,'echter schiffskaufgebundener NPC2-ISK-Vorbehalt');
  const service=core.vertrag.reservieren(s,'npc2','house',168);
  assert(service,'eigene 168 ISK Fracht-Service-Reserve');
  assert.equal(s.owners.npc2.cash,baseCash-buyerBudget-168);
  audit(s);
  fly(s,'st_dravos');
  const bought=core.execute(s,{type:'shipTrade',owner:'house',schiff:'sh002',
    ware:'silizium',menge:qty,kauf:true},rules);
  assert(bought.ok,'originales Silizium physisch aus Dravos gekauft');
  assert.equal(s.ships.sh002.ladung.silizium,qty);
  fly(s,'st_aldera');
  const purchases=track.silicon.filter(x=>x.buy&&x.station==='st_dravos');
  const sold=track.silicon.filter(x=>!x.buy&&x.station==='st_aldera');
  assert.equal(purchases.length,1);
  assert.equal(sum(sold.map(x=>x.qty)),qty,
    'originale automatische Ankunft muss die ganze Charge wirklich abnehmen');
  assert.equal(s.ships.sh002.ladung.silizium||0,0);
  assert(core.vertrag.bezahlen(s,service,'leistung:transport:silizium:'+s.tick,168));
  assert(core.vertrag.abschliessen(s,service));
  const actual={sourcePaid:sum(purchases.map(x=>x.price+x.fee)),
    destinationPaid:sum(sold.map(x=>x.price)),destFees:sum(sold.map(x=>x.fee)),
    servicePaid:168};
  audit(s);roundTrip(s);
  const firstTick=s.tick;
  // Zeitfenster schliesst wirklichen Originalbau, bezahlten Kauf und
  // nachgelagerten Piraten-/Betriebsverlust ein, ohne ihn zu verhindern.
  for(let j=0;j<350;j++){
    core.step(s,rules);
    if(s.tick%60===0){audit(s);roundTrip(s);}
  }
  if(!track.orderReleased){
    // Kunde hat NIE eine fertige Schiffshuelle erhalten:
    // echten, noch gebundenen Kaufbetrag VOLLSTAENDIG erstatten.
    assert(core.vertrag.abschliessen(s,track.order));
  }
  audit(s);roundTrip(s);
  const e=s.vertraege.eintraege[track.order];
  assert(e);
  assert.equal(e.erstattet,buyerBudget);
  assert.equal(e.gezahlt,0,'die produktive Original-Werft verdient erst durch Original-Schiffverkauf');
  assert.equal(e.rest,0);
  assert.equal(e.status,'geschlossen');
  const r={qty,reserve,buyerBudget,startTick:20160,
    afterArrivalTick:firstTick,payments:actual,
    lockedDenials:track.denials,
    partsStarted:track.partsStarted,partsFinished:track.partsFinished,
    freighterStarted:track.freighterStarted,
    freighterFinished:track.freighterFinished,
    orderReleased:track.orderReleased,
    milestones:track.milestones,
    purchases:track.purchases,losses:track.losses,
    npc2Ships:Object.values(s.ships).filter(x=>x.owner==='npc2').length,
    npc2CashEnd:s.owners.npc2.cash,stationCashEnd:s.owners.st_aldera.cash,
    shipStockEnd:s.stations.st_aldera.lager.frachter,
    siliconStockEnd:s.stations.st_aldera.lager.silizium,
    originalProduced:s.ledger.frachter.produced,
    originalConsumed:s.ledger.frachter.consumed,
    buyPrice:track.purchases[0]?.actualPaid||0,
    cashNoMint:s.initialSupply+s.minted-s.burned,
    hash:core.hash(s)};
  active=null;
  return r;
}
test('B-K10r: 10er-Rohstoff mit acht gebundenen Bauteilen wird realer NPC2-Frachter',()=>{
  const x=order(10,true);
  assert(x.lockedDenials>0,'konkurrierende Werft-/Modullinien verlieren nur Zugriff auf gebundene Bauteile');
  assert.equal(x.freighterStarted,1);
  assert.equal(x.freighterFinished,1);
  assert(x.partsFinished>=8,'mindestens acht wirklich bezahlte Bauteile hergestellt');
  assert.equal(x.purchases.length,1,'exakt ein original bezahlter NPC2-Ersatzfrachter');
  assert.equal(x.buyPrice,1092,'Originalkauf zum echten dynamischen Marktpreis');
  assert(x.milestones.some(e=>e.type==='frachterFertig'&&e.escrowRefunded===1600),
    'Kaeufergeld erst nach fertiger physischer Huelle aus Escrow freigegeben');
  assert.equal(x.payments.servicePaid,168);
  assert.equal(x.losses.length,1,'nachfolgender Original-Verlust wird nicht versteckt');
  assert.equal(x.losses[0].id,x.purchases[0].ship);
  assert.equal(x.npc2Ships,0,'einmalig echter Schiffskauf ist keine Langzeitrettung');
  console.log('B-K10r Vollkosten- und Werftauftrag Einmal-Kauf',JSON.stringify(x));
});
test('B-K10r: kein Materialkontingent oder falsche Charge => kein NPC2-Kauf, Kaeuferescrow zurueck',()=>{
  const without=order(10,false);
  const less=order(8,true);
  const over=order(12,true);
  for(const x of [without,less,over]){
    assert.equal(x.freighterFinished,0,
      'weder nur Warenmenge noch nur Kontogeld garantiert ein bestimmtes Schiff');
    assert.equal(x.purchases.length,0);
    assert.equal(x.orderReleased,false);
    assert.equal(x.npc2Ships,0);
  }
  console.log('B-K10r Gegenproben kein Schiff trotz bezahlter Rohstofffahrt',
    JSON.stringify([without,less,over]));
});
test('B-K10r: Determinismus der durchfinanzierten Einzelbestellung, Kauf-und-Verlustbelege identisch',()=>{
  const a=order(10,true),b=order(10,true);
  assert.deepEqual(a,b,'gleicher Anfangsseed, gleiche Test-Order und gleicher Original-RNG');
  assert(a.losses[0].tick>a.purchases[0].tick);
});
test('B-K10r: ohne Materialherstellung wird echte NPC2-Bestellreserve ohne Auszahlung erstattet',()=>{
  const s=core.load(fixture,undefined,rules);
  const original=s.owners.npc2.cash;
  const v=core.vertrag.reservieren(s,'npc2','st_aldera',1600);
  assert(v);audit(s);
  assert.equal(s.stations.st_aldera.lager.frachter,0);
  assert(core.vertrag.abschliessen(s,v));
  assert.equal(s.owners.npc2.cash,original);
  assert.equal(s.vertraege.eintraege[v].gezahlt,0);
  assert.equal(s.vertraege.eintraege[v].erstattet,1600);
  assert.equal(s.vertraege.eintraege[v].rest,0);
  audit(s);roundTrip(s);
});
