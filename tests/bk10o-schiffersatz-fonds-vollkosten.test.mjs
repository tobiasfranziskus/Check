// B-K10o [ANALYSE] Reale Ersatzkaeufe/Fonds-Zuschuesse und kein Rettungspfad.
// Produktcode, Preis, Fonds und NPC-Auftraege werden NICHT geaendert.
// Counterfactual: ein boolescher Test-only-Schalter in einer kompilierten Kopie.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const begin=html.indexOf('const m_data_systeme ='),end=html.indexOf('const m_data_oberflaeche =');
assert(begin>=0&&end>begin);
let js=html.slice(begin,end);
const once=(old,neu)=>{
  assert.equal(js.split(old).length,2,'eindeutiger Original-Core-Anker: '+old.slice(0,52));
  js=js.replace(old,neu);
};
once("  f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n; return n;",
  "  __bk10o_rescue(state,owner,n);"+
  "  f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n; return n;");
once("      if (leer) zuschuss(state, rules, owner, bedarf);",
  "      if (leer && __bk10o_allow) zuschuss(state, rules, owner, bedarf);");
once("      delete s.ladung[x.klasse]; state.ledger[x.klasse].consumed += 1;",
  "      __bk10o_buy(state,owner,x.klasse,p,bedarf,leer);"+
  "      delete s.ladung[x.klasse]; state.ledger[x.klasse].consumed += 1;");
const logs={};
let nextLog=null;
const rescue=(s,owner,n)=>{
  assert(nextLog,'Logger nur bei originalem Event');
  assert(n>0&&s.owners['fonds_aldera'].cash>=n);
  nextLog.rescues.push({tick:s.tick,owner,isk:n});
};
const buy=(s,owner,klasse,p,full,leer)=>{
  assert(nextLog,'Logger nur beim ausgefuehrten Kauf');
  assert(s.owners[owner].cash>=0,'Kauf mit echten vorhandenen ISK');
  nextLog.buy.push({tick:s.tick,owner,klasse,price:p,fee:full-p,
    total:full,fromEmpty:leer});
};
const build=new Function('__bk10o_allow','__bk10o_rescue','__bk10o_buy',js+
  ';return {core:m_core_index,base:m_data_rules.RULES};');
const yes=build(true,rescue,buy),no=build(false,rescue,buy);
assert.equal(yes.base.schema,8);
assert.equal(yes.base.rulesVersion,14);
const rules={...yes.base,schema:9,rulesVersion:15,world:{...yes.base.world,
  produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true}};
const owners=['npc1','npc2','npc3'];
const sum=xs=>xs.reduce((a,b)=>a+b,0);
function audit(s,core){
  const free=sum(Object.values(s.owners).map(x=>x.cash));
  const locked=sum(Object.values(s.vertraege.eintraege).map(x=>x.rest));
  assert.equal(free+locked,s.initialSupply+s.minted-s.burned,'unabhaengige ISK-Bilanz');
  for(const [ware,l] of Object.entries(s.ledger)){
    const physical=sum(Object.values(s.stations).map(x=>x.lager[ware]||0))+
      sum(Object.values(s.ships).map(x=>x.ladung[ware]||0));
    assert.equal(physical,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      'Original-Warenledger: '+ware);
  }
  assert(core.audit(s).ok,'Original-Core-Audit');
}
function stats(s,core,log){
  const counts=Object.fromEntries(owners.map(owner=>[owner,
    Object.values(s.ships).filter(x=>x.owner===owner).length]));
  return {
    tick:s.tick,counts,ownerCash:Object.fromEntries(owners.map(o=>[o,s.owners[o].cash])),
    yardCash:s.owners.st_aldera.cash,yardFund:s.owners.fonds_aldera.cash,
    yardFrachter:s.stations.st_aldera.lager.frachter,
    yardMiner:s.stations.st_aldera.lager.miner,
    repurchases:log.buy.length,
    repurchasesISK:sum(log.buy.map(x=>x.total)),
    directRescueISK:sum(log.rescues.map(x=>x.isk)),
    directRescueCount:log.rescues.length,
    foodConsumption:Object.fromEntries(['st_nadir','st_cyris','st_veldra'].map(id=>[
      id,{new:s.stats.haushaltskauf[id].menge,missing:s.stats.mangel[id].nahrung||0}
    ])),
    funds:s.stats.zuschuss,losses:JSON.parse(JSON.stringify(s.stats.verluste)),
    newShips:JSON.parse(JSON.stringify(s.stats.indienst)),
    minted:s.minted,burned:s.burned,
    globalISK:s.initialSupply+s.minted-s.burned,
    hash:core.hash(s)
  };
}
function run(seed,days,allow,setup=null){
  const {core}=allow?yes:no;
  const s=core.createState(seed,rules);
  if(setup)setup(s);
  const log={buy:[],rescues:[]};
  nextLog=log;audit(s,core);
  const points=[];
  for(let i=0;i<days*1440;i++){
    core.step(s,rules);
    if(s.tick===60){
      audit(s,core);
      points.push(stats(s,core,log));
    }
    if(s.tick%1440===0){
      audit(s,core);
      const restored=core.load(core.save(s),undefined,rules);
      assert.equal(core.hash(restored),core.hash(s),'deterministisches Original-Save/Load');
      audit(restored,core);
      if([1,3,7,14,30].includes(s.tick/1440))points.push(stats(s,core,log));
    }
  }
  const last=stats(s,core,log);
  const result={seed,days,allow,points,last,events:log};
  nextLog=null;return result;
}
function compare(seed,days){
  const enabled=run(seed,days,true),disabled=run(seed,days,false);
  assert.equal(enabled.last.globalISK,disabled.last.globalISK,
    'keine Veraenderung an Emission/Senke oder der Welt-Geldsumme im gepaarten Versuch');
  if(enabled.events.rescues.length===0){
    assert.equal(enabled.last.hash,disabled.last.hash,
      'ohne originale Rettung muss test-only Abschalten exakt identisch verlaufen');
  }
  assert.equal(enabled.last.directRescueISK,
    sum(enabled.events.rescues.map(x=>x.isk)));
  assert.equal(disabled.last.directRescueISK,0,'kein verdeckter individueller Schiffszuschuss');
  return {seed,days,original:enabled,without:disabled,
    equal:enabled.last.hash===disabled.last.hash};
}
test('B-K10o: 13 autonome 72h-Normalwelten - echte Fonds-/Werft-Ersatzereignisse',()=>{
  const seeds=[1,2,7,11,13,17,42,99,1234,2026,65535,98765,314159];
  const rows=seeds.map(seed=>run(seed,3,true));
  assert.equal(rows.length,13);
  assert.equal(sum(rows.map(x=>x.last.directRescueISK)),0,
    'im originalen 13×72h Normalmarkt keine individuelle NPC-Leerflottenrettung');
  assert.equal(sum(rows.map(x=>x.last.repurchases)),160,
    '160 mit echten Originalwaren und realen Werftkonten finanzierte Ersatzkaeufe');
  for(const x of rows){
    assert(x.last.globalISK>0);
    assert(x.last.repurchasesISK>=0);
    assert.equal(x.last.directRescueISK,
      sum(x.events.rescues.map(e=>e.isk)));
  }
  const report={seeds:rows.length,days:3,
    origRescueISK:sum(rows.map(x=>x.last.directRescueISK)),
    replaced:sum(rows.map(x=>x.last.repurchases)),
    perSeed:rows.map(x=>({seed:x.seed,
      rescues:x.last.directRescueISK,
      bought:x.last.repurchases,
      merchantA:x.last.counts.npc1,
      merchantB:x.last.counts.npc2,
      merchantC:x.last.counts.npc3
    }))};
  console.log('B-K10o dreizehn Normalwelten drei Tage',JSON.stringify(report));
});
test('B-K10o: Seed42/7 je 14 Tage mit und ohne NPC-Sonderrettung',()=>{
  const rows=[42,7].map(seed=>compare(seed,14));
  const report=rows.map(x=>({
    seed:x.seed,
    resOrig:x.original.last.directRescueISK,
    resNo:x.without.last.directRescueISK,
    fleetsOrig:x.original.last.counts,
    fleetsNo:x.without.last.counts,
    merchantBalanceOrig:x.original.last.ownerCash,
    merchantBalanceNo:x.without.last.ownerCash,
    warehouseShipsOrig:[x.original.last.yardFrachter,x.original.last.yardMiner],
    actualPurchases:x.original.events.buy,
    actualRescues:x.original.events.rescues,
    newFoodOrig:x.original.last.foodConsumption,
    newFoodNo:x.without.last.foodConsumption,equal:x.equal}));
  assert(rows.every(x=>x.without.last.directRescueISK===0));
  assert(rows.every(x=>x.original.last.directRescueISK===0));
  assert(rows.every(x=>x.equal),'ohne Rescue-Ereignis sind alle Originalzustaende exakt gleich');
  assert.equal(rows[0].original.last.counts.npc2,0,
    'Seed42 NPC2 kann auch mit bestehender Fondsrettung komplett ausfallen');
  assert.equal(rows[0].original.last.yardFrachter,0,
    'Seed42 trotz Eigentuemerkasse ohne Werft-Neufrachter am Tag14');
  console.log('B-K10o vierzehn Tage reale NPC-Krisen',JSON.stringify(report));
});
function preparedCrisis(s){
  // Synthetische, vollstaendig GELDBILANZIERTE Ausgangskrise zur Erreichbarkeit:
  // Ein NPC verliert beide leeren Anfangsfrachter. Seine 3000 ISK gehen
  // testseitig als neutraler Geldtransfer zum existierenden Spieler (kein Mint).
  // Kein Auftrag, kein Warenbestand, kein Vertrag wird erzeugt.
  const o='npc2',ids=Object.keys(s.ships).filter(id=>s.ships[id].owner===o);
  assert(ids.length>0);
  for(const id of ids){
    const sh=s.ships[id];
    assert.equal(Object.keys(sh.ladung).length,0,'kein Schiff mit Fracht loeschen');
    assert(!sh.vertrag,'kein Vertrag darf ohne Storno verschwinden');
    delete s.ships[id];delete s.stats.verkaeufe[id];
    (s.stats.verluste[o] ||= {})[sh.klasse]=((s.stats.verluste[o]||{})[sh.klasse]||0)+1;
  }
  const amount=s.owners[o].cash;
  s.owners[o].cash=0;s.owners.house.cash+=amount;
  assert(s.owners.fonds_aldera.cash>=780,'Original-Fonds muss echten Ersatzkauf decken koennen');
  assert(s.stations.st_aldera.lager.frachter>=1);
}
test('B-K10o: finanzierte synthetische Vollflottenkrise aktiviert Original-Sonderzuschuss, kein kostenloses Schiff',()=>{
  const a=run(42,1,true,preparedCrisis),
    b=run(42,1,false,preparedCrisis);
  assert(a.events.rescues.length>=1);
  assert.equal(a.events.rescues[0].owner,'npc2');
  assert.equal(a.events.rescues[0].isk,780);
  assert(a.events.buy.some(x=>x.owner==='npc2'&&x.fromEmpty&&x.total===780));
  assert.equal(a.points[0].counts.npc2,1,'mit dem einmaligen Zuschuss ist im ersten Stundenendstand wirklich ein neues Schiff vorhanden');
  assert.equal(b.points[0].counts.npc2,0,'ohne Zuschuss ist im ersten Stundenendstand kein Frachter vorhanden');
  assert.equal(b.events.rescues.length,0);
  assert.equal(b.events.buy.filter(x=>x.owner==='npc2').length,0);
  // Es wurde niemals ein Schiff erfunden: Originalwerft-Lager bezahlt.
  assert(a.last.globalISK>0&&b.last.globalISK>0);
  console.log('B-K10o nachgestellte voll bilanzierte NPC-Leerflotte',JSON.stringify({
    crisis:'zwei anfangs leere Frachter und vorhandene NPC-ISK testweise umverteilt',
    origRescue:a.events.rescues,origPaidShips:a.events.buy.filter(x=>x.owner==='npc2'),
    withoutRescue:b.events.rescues,withoutPaidShips:b.events.buy.filter(x=>x.owner==='npc2'),
    shipsAfterHourOne:[a.points[0].counts.npc2,b.points[0].counts.npc2],
    originalShips:a.last.counts,withoutShips:b.last.counts,
    cashA:a.last.ownerCash,cashB:b.last.ownerCash}));
});
test('B-K10o: echte Werft-Listenpreise und Kapitalreserve der B-K10k-24er-Kette',()=>{
  const {core}=yes,s=core.createState(42,rules),werft=rules.world.werft;
  const hulls={};
  for(const type of ['frachter','miner']){
    const p=core.preis(s,werft,type,rules);
    const f=core.gebuehr(s,rules,werft,p);
    hulls[type]={price:p,fee:f,total:p+f,available:s.stations[werft].lager[type]};
  }
  assert.deepEqual([hulls.frachter.total,hulls.miner.total],[780,624]);
  // B-K10k 24er-Lieferung: 1296 Endumsatz, 120 bezahlte Minerarbeit,
  // 576 Fabriklohn, 499 Flug, 72 Gebuehren -> 29 ISK Vor-Huellen-Beitrag.
  const chain={endCustomer:1296,minerActualFor48Ice:120,productionActual:576,
    paidFlights:499,originalFees:72};
  const margin=chain.endCustomer-chain.minerActualFor48Ice-
    chain.productionActual-chain.paidFlights-chain.originalFees;
  assert.equal(margin,29);
  const minTripsForOneHull=Math.ceil(hulls.frachter.total/margin);
  const minTripsForPairedHull=Math.ceil((hulls.frachter.total+hulls.miner.total)/margin);
  // Abbildung der in normalem Seed42 beobachteten spaeteren Marktpreise
  // 1050+42 Frachter bzw. 840+33 Miner: ausschliesslich Sensitivitaet,
  // kein Beweis gleicher Realmarge bei veraendertem Markt.
  const latePair=1092+873;
  const lateMinShipments=Math.ceil(latePair/margin);
  assert.equal(minTripsForOneHull,27);
  assert.equal(minTripsForPairedHull,49);
  assert.equal(lateMinShipments,68);
  console.log('B-K10o originaler Werft-Ersatzpreis und 24er-Grenze',
    JSON.stringify({hulls,chain,margin,
      minCompleted24ShipmentsOnlyOneFreighter:minTripsForOneHull,
      minCompleted24ShipmentsForFreighterAndMiner:minTripsForPairedHull,
      lateShipPrices:{freighter:1092,miner:873,combined:latePair},
      lateMinShipmentsIfMarginUnchanged:lateMinShipments,
      caveat:'arithmetische Grenze in exakt einer Testkette, nicht reale Schiff-Lebensdauer oder normales Handelsvolumen'}));
});
