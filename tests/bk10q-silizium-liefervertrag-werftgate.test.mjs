// B-K10q [ANALYSE/DRAFT] echter Siliziumtransport, bezahlte Leistung,
// Original-Fabriklinien und negativer Werft-Abschlussbeleg.
// Ausschliesslich Testjournal + bestehende Original-Core-Aufrufe.
// Kein Kredit, kein eigener Produktions-/Schiffbau-Code, keine ISK-Emission.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let source=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
function hook(old,neu){
  assert.equal(source.split(old).length,2,'Originalanker eindeutig '+old.slice(0,60));
  source=source.replace(old,neu);
}
hook("  buche(state, schiff.owner, 'kosten', fee);",
 "  buche(state, schiff.owner, 'kosten', fee);"+
 "  __bk10q_trade(state,schiff,station,ware,menge,kauf,wert,fee);");
hook("      linie.rest = r.dauer;",
 "      __bk10q_prod(state,id,linie.rezept,'start');"+
 "      linie.rest = r.dauer;");
hook("          if (r.aus.nahrung) m_core_herkunft.erzeugen(state, rules, id, r.aus.nahrung);",
 "          __bk10q_prod(state,id,linie.rezept,'finish');"+
 "          if (r.aus.nahrung) m_core_herkunft.erzeugen(state, rules, id, r.aus.nahrung);");
let events=null;
function trade(state,sh,station,ware,num,buy,isk,fee){
  if(!events)return;
  if(sh.id==='sh002'&&ware==='silizium')
    events.silicon.push({tick:state.tick,owner:sh.owner,station,buy,
      quantity:num,isk,fee,phase:sh.phase});
}
function prod(state,station,recipe,phase){
  if(!events||station!=='st_aldera')return;
  if(['r_bauteil','r_miner','r_frachter','r_jaeger'].includes(recipe))
    events.production.push({tick:state.tick,recipe,phase});
}
const {core,base}=new Function('__bk10q_trade','__bk10q_prod',
 source+';return {core:m_core_index,base:m_data_rules.RULES};')(trade,prod);
assert.equal(base.schema,8);
assert.equal(base.rulesVersion,14);
const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
 produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true}};
const sum=x=>x.reduce((a,b)=>a+b,0);
function audit(s){
  const cash=sum(Object.values(s.owners).map(o=>o.cash));
  const escrow=sum(Object.values(s.vertraege.eintraege).map(c=>c.rest));
  assert.equal(cash+escrow,s.initialSupply+s.minted-s.burned,
    'keine erzeugten/verlorenen ISK durch Testvertrag');
  for(const [ware,l] of Object.entries(s.ledger)){
    const physical=sum(Object.values(s.stations).map(y=>y.lager[ware]||0))+
      sum(Object.values(s.ships).map(y=>y.ladung[ware]||0));
    assert.equal(physical,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      'keine erfundene/verlorene Warenmenge '+ware);
  }
  assert(core.audit(s).ok,'Original-Core-Audit');
}
const initial=core.createState(42,rules);
assert.equal(initial.owners.house.cash,2000);
for(let j=0;j<14*1440;j++){
  core.step(initial,rules);
  if(initial.tick%1440===0){
    audit(initial);
    const loaded=core.load(core.save(initial),undefined,rules);
    assert.equal(core.hash(loaded),core.hash(initial),'Tagesspeicher deterministisch');
  }
}
assert.equal(initial.tick,20160);
const fixture=core.save(initial),fixtureHash=core.hash(initial);
const restore=()=>core.load(fixture,undefined,rules);
assert.equal(core.hash(restore()),fixtureHash);
function drive(s,station){
  const result=core.execute(s,{type:'shipMove',owner:'house',schiff:'sh002',
    ziel:station},rules);
  assert(result.ok,'Original-Flug startet nur mit tatsaechlicher Reserve: '+JSON.stringify(result));
  let n=0;
  while(s.ships.sh002.phase==='reise'||s.ships.sh002.vertrag){
    assert(n++<180,'Original-Flug muss bezahlt, physisch angekommen und stundenabgerechnet sein');
    core.step(s,rules);
    if(s.tick%60===0)audit(s);
  }
  assert.equal(s.ships.sh002.system,rules.world.stations[station].system);
  assert(!s.ships.sh002.vertrag,'kein verlorener/verwaister Fahrvertrag');
  audit(s);
}
function scenario(quantity,prepaidFreight){
  const s=restore(),start=s.tick;
  events={silicon:[],production:[]};
  const log=events;
  const consumer='npc2',carrier='house',yard='st_aldera';
  assert.equal(s.stations[yard].lager.silizium,0);
  assert.equal(s.stations[yard].lager.bauteil,0);
  assert.equal(s.stations[yard].lager.frachter,0);
  assert.equal(s.owners[consumer].cash,2792);
  assert.equal(s.owners[carrier].cash,2000);
  const before={consumerCash:s.owners[consumer].cash,
    carrierCash:s.owners[carrier].cash,
    yardCash:s.owners[yard].cash,
    yardFreighters:s.stations[yard].lager.frachter,
    npc2Fleet:Object.values(s.ships).filter(x=>x.owner===consumer).length,
    indienst:s.stats.indienst[consumer]?.frachter||0,
    made:s.stats.rezepte[yard],minted:s.minted,burned:s.burned};
  const flightOrder=prepaidFreight?core.vertrag.reservieren(s,consumer,carrier,168):null;
  if(prepaidFreight)assert(flightOrder,'echte 168-ISK-Bestellung nur aus zahlungsfaehiger NPC2-Kasse');
  audit(s);
  drive(s,'st_dravos');
  const prePurchase=core.preis(s,'st_dravos','silizium',rules);
  const bought=core.execute(s,{type:'shipTrade',owner:carrier,schiff:'sh002',
    ware:'silizium',menge:quantity,kauf:true},rules);
  assert(bought.ok,'Original-Dock-Kauf gegen realen Vorrat und vorhandene Spieler-ISK');
  assert.equal(s.ships.sh002.ladung.silizium,quantity);
  audit(s);
  drive(s,yard);
  // Ankunft entlaedt original bereits bei Tick-Ankunft. Zweiter shipTrade
  // waere eine Doppelzahlung oder ein falsches Leerverkauf-Event.
  const purchased=log.silicon.filter(x=>x.buy&&x.station==='st_dravos');
  const delivered=log.silicon.filter(x=>!x.buy&&x.station===yard);
  assert.equal(purchased.length,1);
  assert.equal(purchased[0].quantity,quantity);
  assert(delivered.length>=1,'Original-automatische Entladung muss wirklich bezahlt sein');
  const deliveredN=sum(delivered.map(x=>x.quantity));
  assert(deliveredN>0&&deliveredN<=quantity);
  assert.equal(s.ships.sh002.ladung.silizium||0,quantity-deliveredN,
    'alle Frachtpositionen physisch auf Station oder Schiff, kein Phantomverkauf');
  assert(delivered.every(x=>x.owner===carrier),'nur Originaleigentums-Belege');
  const wasPaid=delivered.some(x=>x.quantity>0);
  if(prepaidFreight&&wasPaid){
    const serviceReceipt='leistung:frachter:dr-aldera:'+start+':'+s.tick;
    assert(core.vertrag.bezahlen(s,flightOrder,serviceReceipt,168),
      'Zusatzvergütung nur gegen echte bereits belegte Transportleistung');
    assert(core.vertrag.abschliessen(s,flightOrder),'kein ungenutzter offener Escrow');
  }
  audit(s);
  const afterUnload={tick:s.tick,shipStock:s.ships.sh002.ladung.silizium||0,
    yardSilicon:s.stations[yard].lager.silizium,
    parts:s.stations[yard].lager.bauteil,
    consumerCash:s.owners[consumer].cash,
    yardCash:s.owners[yard].cash,
    shipCash:s.owners[carrier].cash,
    receiptISK:sum(delivered.map(x=>x.isk)),
    receiptQuantity:deliveredN,
    sourcePaidISK:sum(purchased.map(x=>x.isk+x.fee)),
    sourcePurchase:purchased,
    arrivingSale:delivered};
  for(let j=0;j<340;j++){
    core.step(s,rules);
    if(s.tick%60===0)audit(s);
  }
  audit(s);
  const a=core.load(core.save(s),undefined,rules);
  assert.equal(core.hash(a),core.hash(s),'Nachlieferung Save/Load/Hash');
  const products=Object.fromEntries(['r_bauteil','r_miner','r_frachter','r_jaeger']
    .map(k=>[k,{
      started:log.production.filter(x=>x.recipe===k&&x.phase==='start').length,
      completed:log.production.filter(x=>x.recipe===k&&x.phase==='finish').length}]));
  const finish={tick:s.tick,silicon:s.stations[yard].lager.silizium,
    parts:s.stations[yard].lager.bauteil,
    freighters:s.stations[yard].lager.frachter,
    npc2Ships:Object.values(s.ships).filter(x=>x.owner===consumer).length,
    npc2NewFrachter:(s.stats.indienst[consumer]?.frachter||0)-before.indienst,
    ownerCash:s.owners[consumer].cash,stationCash:s.owners[yard].cash,
    shipCash:s.owners[carrier].cash,products,
    originalNewShips:s.stats.indienst[consumer]?.frachter||0,
    mintedDelta:s.minted-before.minted,burnedDelta:s.burned-before.burned};
  if(prepaidFreight){
    const v=s.vertraege.eintraege[flightOrder];
    assert.equal(v.budget,168);assert.equal(v.gezahlt,168);
    assert.equal(v.erstattet,0);assert.equal(v.rest,0);assert.equal(v.status,'geschlossen');
  }
  events=null;
  return {quantity,before,afterUnload,finish,serviceFee:prepaidFreight?168:0,
    directContract:flightOrder?true:false,hash:core.hash(s)};
}
test('B-K10q: 8 Silizium wirklich einkaufen, zweifach bezahlt fliegen, automatisch entladen, gebuchten NPC-Auftrag begleichen',()=>{
  const result=scenario(8,true);
  assert.equal(result.afterUnload.receiptQuantity,8);
  assert.equal(result.afterUnload.shipStock,0);
  assert(result.afterUnload.sourcePaidISK>0);
  assert(result.afterUnload.receiptISK>0);
  assert(result.finish.products.r_bauteil.completed>0,
    'Original-Aldera verbraucht das gelieferte Silizium fuer bezahlte Fabrikarbeit');
  assert.equal(result.finish.products.r_frachter.completed,0,
    'acht Einheiten reichen NICHT fuer den Original-Frachterbau unter Konkurrenz der Minerlinie');
  assert.equal(result.finish.npc2NewFrachter,0);
  console.log('B-K10q echte 8er-Transportleistung, noch kein Werftabschluss',JSON.stringify(result));
});
test('B-K10q: Gegenprobe 8/14/16/20/24 mit realen Markt-/Lohnbewegungen, keine Gratiswerft',()=>{
  const rows=[8,14,16,20,24].map(n=>scenario(n,false));
  assert(rows.every(x=>x.afterUnload.receiptQuantity>0));
  assert(rows.every(x=>x.finish.products.r_frachter.completed===0),
    'mehr Rohstoff allein heilt bei gleichem normalen Lohn-/Linienprioritaetsbudget nichts');
  assert(rows.some(x=>x.finish.silicon>0&&x.finish.stationCash<50),
    'bei groesserem Materialeinkauf stoppt die Produktion mit noch liegendem Silizium');
  console.log('B-K10q Originalfabrik Preis-/Mengen-Stresstest',
    JSON.stringify(rows.map(x=>({siliconBought:x.quantity,
      delivered:x.afterUnload.receiptQuantity,
      paidAtSource:x.afterUnload.sourcePaidISK,
      paidByYard:x.afterUnload.receiptISK,
      completedParts:x.finish.products.r_bauteil.completed,
      minerBuild:x.finish.products.r_miner.completed,
      freighterBuild:x.finish.products.r_frachter.completed,
      remainingSilicon:x.finish.silicon,
      cash:x.finish.stationCash}))));
});
test('B-K10q: Nicht gelieferte Dienstleistung – volles Original-Escrow erstattet, keine Phantomware',()=>{
  const s=restore();
  const originalHash=core.hash(s),cash=s.owners.npc2.cash,own=s.owners.house.cash;
  const v=core.vertrag.reservieren(s,'npc2','house',168);
  assert(v);
  assert.equal(s.owners.npc2.cash,cash-168);
  audit(s);
  assert.equal(core.vertrag.abschliessen(s,v),true);
  assert.equal(s.owners.npc2.cash,cash);
  assert.equal(s.owners.house.cash,own);
  const item=s.vertraege.eintraege[v];
  assert.equal(item.gezahlt,0);
  assert.equal(item.erstattet,168);
  assert.equal(item.rest,0);
  assert.equal(item.status,'geschlossen');
  assert.equal(s.stations.st_aldera.lager.silizium,0);
  audit(s);
  assert.equal(core.hash(core.load(core.save(s),undefined,rules)),core.hash(s));
  assert.notEqual(core.hash(s),originalHash,'originales Belegarchiv ist absichtlich auditierbar');
});
