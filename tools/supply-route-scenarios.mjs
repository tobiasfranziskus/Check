// Nur Analyse: bewertet bestehende profitable NPC-Routen bei realem Warenmangel.
// Keine Produktionsänderung; keine neuen Kosten, Geldquellen, Befehle, Waren oder RNG.
// node tools/supply-route-scenarios.mjs
import fs from 'node:fs';
import { v11CoreSource } from './v11-core-source.mjs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const original=v11CoreSource(html);
const fixed=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-geography-v11.json',import.meta.url),'utf8'));
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
assert.deepEqual(fixed.results.map(r=>r.seed),seeds);
const sum=a=>a.reduce((s,v)=>s+v,0);
const tradeAnchor="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
const routeAnchor="if (!best || besser(gewinn, r.zeit, best.gewinn, best.zeit)) best = { ware, ziel, menge, gewinn, zeit: r.zeit };";
const costAnchor="const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
for(const anchor of [tradeAnchor,routeAnchor,costAnchor])
 assert.equal(original.split(anchor).length,2,'Core-Anker nicht eindeutig');
let instrumented=original.replace(tradeAnchor,
 "buche(state, schiff.owner, 'kosten', fee);\n  observeTrade(state,schiff,station,ware,menge,kauf,p,fee);\n  return true;");
instrumented=instrumented.replace(routeAnchor,[
 "const bedarf=w.stations[ziel].verbrauch[ware]||0;",
 "      const zielbestand=w.stations[ziel].ziel[ware]||0;",
 "      const knapp=Math.max(0,zielbestand-(state.stations[ziel].lager[ware]||0));",
 "      const zulaessig=bedarf>0 && (priorityScope==='bedarf'||ware==='nahrung');",
 "      const bonus=zulaessig&&zielbestand>0?Math.floor(priorityBasis*knapp/zielbestand):0;",
 "      const score=gewinn*(1000+bonus);",
 "      if (!best || besser(score, r.zeit, best.score, best.zeit))",
 "        best = { ware, ziel, menge, gewinn, score, zeit: r.zeit };"
].join("\n      "));
// Original behavior when basis 0: exact same score and strict comparison/tie break.
instrumented=instrumented.replace(costAnchor,
 "if (['npc1','npc2','npc3'].includes(s.owner)) observeDue(s.owner,Math.max(0,kosten-besitzer.cash));\n    "+costAnchor);
const factory=new Function('observeTrade','observeDue','priorityBasis','priorityScope',
 instrumented+';return {core:m_core_index,rules:m_data_rules.RULES};');
const cases=[
 {id:'basis30',food:30,basis:0,scope:'nahrung'},
 {id:'preis42',food:42,basis:0,scope:'nahrung'},
 {id:'preis50',food:50,basis:0,scope:'nahrung'},
 {id:'routeN50',food:30,basis:500,scope:'nahrung'},
 {id:'routeN100',food:30,basis:1000,scope:'nahrung'},
 {id:'routeN200',food:30,basis:2000,scope:'nahrung'},
 {id:'routeBedarf100',food:30,basis:1000,scope:'bedarf'},
 {id:'preis42_routeN100',food:42,basis:1000,scope:'nahrung'},
 {id:'preis42_routeN200',food:42,basis:2000,scope:'nahrung'},
];
const totalsWanted=['totalShortage','foodShortage','partsShortage','medicineShortage',
 'foodAldera','foodDravos','foodOrion','foodDeliveredAldera','foodDeliveredDravos',
 'foodPickedAldera','foodPickedDravos','traderFoodSales','traderSales',
 'foodProduced','foodConsumed','foodImported','foodExported',
 'stationsCash','fundCash','traderCash','minerCash','npc1Cash','npc2Cash',
 'npc1Unpaid','npc2Unpaid','npc3Unpaid','zeroNpc1Hours','zeroNpc2Hours',
 'underMinStationHours','minted','burned','civilianLosses','pirateLosses',
 'civilianReplacementShips','pirateReplacementShips'];
const report={world:'v11 Nadir',ruleVersion:11,days:90,seeds:seeds.length,scenarios:{},
 notes:[
  'Routenpriorität nur auf profitablen, tatsächlich handelbaren Angeboten; Preisformeln und Handelskosten unverändert',
  'Score = Nettogewinn * (1000 + bonus), bonus = Faktor * relativer Zielbestandsmangel, nur reale Verbrauchsgüter/Stationen',
  'Basis 0 muss die fixierten v11-Hashes und vorher gemessenen Mangelwerte reproduzieren',
  'Die ursprüngliche Gewinn-pro-Reisezeit-Rangfolge gilt bei gleichem Bonus weiterhin',
  'Kein neues Geld und keine neue Ware, auch keine Pilotenlöhne, Reparaturen oder Module',
 ]};
function loss(state,owner){return sum(Object.values(state.stats.verluste[owner]||{}));}
function replaced(state,owner){return sum(Object.values(state.stats.indienst[owner]||{}));}
for(const variant of cases){
 const rows=[];
 for(const seed of seeds){
  const traded={};
  const events={traderFoodSales:0,traderSales:0};
  const debt={npc1:0,npc2:0,npc3:0};
  const observeTrade=(s,sh,st,ware,amount,buy,p,fee)=>{
   if(sh.klasse!=='frachter'||!['npc1','npc2','npc3'].includes(sh.owner))return;
   if(!buy)events.traderSales++;
   if(ware!=='nahrung')return;
   traded[st] ||= {delivered:0,picked:0};
   if(buy)traded[st].picked+=amount;
   else{traded[st].delivered+=amount;events.traderFoodSales++;}
  };
  const observeDue=(owner,n)=>{debt[owner]+=n;};
  const {core,rules:sourceRules}=factory(observeTrade,observeDue,variant.basis,variant.scope);
  const r=structuredClone(sourceRules);r.economy.waren.nahrung.basis=variant.food;
  const s=core.createState(seed,r),points=[];
  let zeroNpc1Hours=0,zeroNpc2Hours=0,underMinStationHours=0;
  for(let t=1;t<=129600;t++){
   core.step(s,r);
   if(t%60===0){
    const audit=core.audit(s);
    assert(audit.ok,'Audit '+variant.id+'/'+seed+'/'+t+JSON.stringify(audit));
    if(s.owners.npc1.cash===0)zeroNpc1Hours++;
    if(s.owners.npc2.cash===0)zeroNpc2Hours++;
    for(const st of Object.keys(s.stations))
     if(s.owners[st].cash<r.world.mindeststand)underMinStationHours++;
   }
   if([4320,43200,129600].includes(t))points.push({tick:t,hash:core.hash(s)});
  }
  assert.equal(core.hash(core.load(core.save(s),undefined,r)),core.hash(s),'Save/Load '+variant.id+'/'+seed);
  if(variant.id==='basis30')assert.deepEqual(points,fixed.results.find(x=>x.seed===seed).points,'Fixierte v11-Hashes');
  const shortage=s.stats.mangel;
  const agg={};
  for(const row of Object.values(shortage))for(const [good,n] of Object.entries(row))
   agg[good]=(agg[good]||0)+n;
  const cash={station:0,fund:0,trader:0,miner:0};
  for(const owner of Object.values(s.owners))if(Object.hasOwn(cash,owner.kind))cash[owner.kind]+=owner.cash;
  const result={
   totalShortage:sum(Object.values(agg)),foodShortage:agg.nahrung||0,
   partsShortage:agg.bauteil||0,medicineShortage:agg.medikamente||0,
   foodAldera:shortage.st_aldera.nahrung||0,
   foodDravos:shortage.st_dravos.nahrung||0,foodOrion:shortage.st_orion.nahrung||0,
   foodDeliveredAldera:traded.st_aldera?.delivered||0,
   foodDeliveredDravos:traded.st_dravos?.delivered||0,
   foodPickedAldera:traded.st_aldera?.picked||0,
   foodPickedDravos:traded.st_dravos?.picked||0,
   traderFoodSales:events.traderFoodSales,traderSales:events.traderSales,
   foodProduced:s.ledger.nahrung.produced,foodConsumed:s.ledger.nahrung.consumed,
   foodImported:s.ledger.nahrung.imported,foodExported:s.ledger.nahrung.exported,
   stationsCash:cash.station,fundCash:cash.fund,traderCash:cash.trader,minerCash:cash.miner,
   npc1Cash:s.owners.npc1.cash,npc2Cash:s.owners.npc2.cash,
   npc1Unpaid:debt.npc1,npc2Unpaid:debt.npc2,npc3Unpaid:debt.npc3,
   zeroNpc1Hours,zeroNpc2Hours,underMinStationHours,
   minted:s.minted,burned:s.burned,
   civilianLosses:loss(s,'npc1')+loss(s,'npc2')+loss(s,'npc3'),
   pirateLosses:loss(s,'pirates'),
   civilianReplacementShips:replaced(s,'npc1')+replaced(s,'npc2')+replaced(s,'npc3'),
   pirateReplacementShips:s.stats.piratenErsatz,
  };
  if(variant.id==='basis30'){
   const prior=fixed.results.find(x=>x.seed===seed).final;
   assert.equal(result.totalShortage,prior.totalShortage);
   assert.equal(result.minted,prior.minted);
   assert.equal(result.burned,prior.burned);
   assert.equal(result.traderSales,prior.sales);
  }
  rows.push(result);
  console.log('SUPPLY_ROUTE_RUN '+JSON.stringify({seed,variant:variant.id,stats:result}));
 }
 const metrics={};
 for(const name of totalsWanted){
  const values=rows.map(row=>row[name]);
  assert(values.every(Number.isSafeInteger),'noninteger '+name);
  metrics[name]={sum:sum(values),min:Math.min(...values),max:Math.max(...values)};
 }
 report.scenarios[variant.id]={params:variant,metrics};
}
const b=report.scenarios.basis30.metrics,p42=report.scenarios.preis42.metrics,p50=report.scenarios.preis50.metrics;
assert.equal(b.totalShortage.sum,4204);
assert.equal(b.foodShortage.sum,3981);
assert.equal(p42.totalShortage.sum,1730);
assert.equal(p50.totalShortage.sum,1120);
console.log('SUPPLY_ROUTE_SUMMARY '+JSON.stringify(report));
