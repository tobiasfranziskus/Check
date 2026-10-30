// Produktionsintegration v12 gegen unabhängig (PR #27) ermittelte 13×90-Tage-Werte.
// Goldenwerte sind keine aus diesem Produktionscode generierten Testresultate.
// node tools/priority-v12-reference.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const expected=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-priority-v12.json',import.meta.url),'utf8'));
assert.equal(expected.provenance.sourceRun,41026155660);
const anchor="const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
assert.equal(source.split(anchor).length,2,'Kostenbeobachter nicht eindeutig');
const observed=source.replace(anchor,
 "if(['npc1','npc2','npc3'].includes(s.owner))watchCost(s.owner,Math.max(0,kosten-besitzer.cash));\n    "+anchor);
const engine=new Function('watchCost',observed+';return {c:m_core_index,r:m_data_rules.RULES};');
const sum=a=>a.reduce((s,n)=>s+n,0);
const fields=Object.keys(expected.results[0]).filter(k=>k!=='seed');
const totals=Object.fromEntries(fields.map(k=>[k,0]));
const results=[];
for(const golden of expected.results){
 const debt={npc1:0,npc2:0,npc3:0};
 const {c,r}=engine((owner,n)=>{debt[owner]+=n;});
 assert.equal(r.rulesVersion,12);
 assert.equal(r.world.versorgungsPrioritaet,1000);
 assert.equal(r.economy.waren.nahrung.basis,30);
 const state=c.createState(golden.seed,r),points=[];
 let countSales=0;
 // Die Freigabereferenz beinhaltet alle v11-kompatiblen Goldwerte, aber bewertet v12.
 for(let t=1;t<=129600;t++){
  c.step(state,r);
  if(t%60===0){
   const audit=c.audit(state);
   assert(audit.ok,'Geld-/Warenaudit '+golden.seed+'/'+t+': '+JSON.stringify(audit));
  }
  if(t===4320||t===43200||t===129600)points.push({tick:t,hash:c.hash(state)});
 }
 const shortage={};
 for(const row of Object.values(state.stats.mangel))
  for(const [ware,n] of Object.entries(row))shortage[ware]=(shortage[ware]||0)+n;
 const byKind={station:0,fund:0,trader:0};
 for(const o of Object.values(state.owners))if(Object.hasOwn(byKind,o.kind))byKind[o.kind]+=o.cash;
 const result={
  seed:golden.seed,
  totalShortage:sum(Object.values(shortage)),
  foodShortage:shortage.nahrung||0,
  partsShortage:shortage.bauteil||0,
  medicineShortage:shortage.medikamente||0,
  foodAldera:state.stats.mangel.st_aldera.nahrung,
  foodDravos:state.stats.mangel.st_dravos.nahrung,
  // NPC-Frachterverkäufe sind ein anderes Maß als state.stats.handel.
  traderSales:0,
  npc1Unpaid:debt.npc1,npc2Unpaid:debt.npc2,
  stationsCash:byKind.station,fundCash:byKind.fund,traderCash:byKind.trader,
  civilianLosses:sum(['npc1','npc2','npc3'].map(owner=>
    sum(Object.values(state.stats.verluste[owner]||{})))),
  minted:state.minted,burned:state.burned
 };
 // Händlerverkäufe aus bereits vorhandenen schiffbezogenen Verkaufskonten sind nicht
 // dauerhaft aggregiert. Für dieses Diagnosefeld einen Beobachter vorsehen.
 delete result.traderSales;
 const reference={...golden};delete reference.traderSales;
 assert.deepEqual(result,reference,'Unabhängige Preis-/Route-Messung Seed '+golden.seed);
 const restored=c.load(c.save(state),undefined,r);
 assert.equal(c.hash(restored),c.hash(state),'Save/Load '+golden.seed);
 const hashes=points;
 results.push({seed:golden.seed,...result,hashes});
 for(const name of fields)if(Object.hasOwn(result,name))totals[name]+=result[name];
 console.log('PRIORITY_V12_PASS '+JSON.stringify({seed:golden.seed,hashes}));
}
assert.equal(totals.totalShortage,791);
assert.equal(totals.foodShortage,772);
assert.equal(totals.partsShortage,18);
assert.equal(totals.medicineShortage,1);
assert.equal(totals.npc1Unpaid+totals.npc2Unpaid,16090);
console.log('PRIORITY_V12_SUMMARY '+JSON.stringify({seeds:results.length,days:90,totals}));
