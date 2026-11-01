// B-K4: echte Produktregel 15 vs historischer 14-Pfad desselben
// Originalcores, ohne weitere produktive Änderungen oder Geldschöpfung.
// Test: 13 Seeds ×90 Tage passiv, zwei aktive Spieler-Miner-Krisen ×90 Tage.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const legacy=src.replace('schema: 8, rulesVersion: 15,','schema: 8, rulesVersion: 14,');
assert.notEqual(legacy,src);
const needle="const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
const trade="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
const paid="const wert = n * p;\n        if (wert > 0) {";
function engine(source,watch){
 assert.equal(source.split(needle).length,2);
 assert.equal(source.split(trade).length,2);
 assert.equal(source.split(paid).length,2);
 const code=source.replace(needle,
  "if(['npc1','npc2','npc3'].includes(s.owner)) watch.unpaid(s.owner,Math.max(0,kosten-besitzer.cash));\n    "+needle)
  .replace(trade,"buche(state, schiff.owner, 'kosten', fee);\n  watch.trade(schiff.owner,schiff.klasse,kauf);\n  return true;")
  .replace(paid,"const wert = n * p;\n        if (wert > 0) watch.buy(id,ware,n,wert);\n        if (wert > 0) {");
 return new Function('watch',code+';return {core:m_core_index,rules:m_data_rules.RULES};')(watch);
}
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
function independent(s){
 let cash=0;
 for(const o of Object.values(s.owners)){
  assert(Number.isSafeInteger(o.cash)&&o.cash>=0);
  cash+=o.cash;
 }
 assert.equal(cash,s.initialSupply+s.minted-s.burned,'unabhaengiges Geld-Audit');
 const stock={};
 for(const st of Object.values(s.stations))
  for(const [w,v] of Object.entries(st.lager)){
   assert(Number.isSafeInteger(v)&&v>=0);
   stock[w]=(stock[w]||0)+v;
  }
 for(const sh of Object.values(s.ships))
  for(const [w,v] of Object.entries(sh.ladung)){
   assert(Number.isSafeInteger(v)&&v>=0);
   stock[w]=(stock[w]||0)+v;
  }
 for(const [w,l] of Object.entries(s.ledger))
  assert.equal(stock[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,'Ware '+w);
}
function run(source,seed,playerMiner=false){
 const unpaid={npc1:0,npc2:0,npc3:0},sales={npc1:0,npc2:0},bought={nahrung:0,medikamente:0},spent={nahrung:0,medikamente:0};
 const watch={
  unpaid:(owner,n)=>{unpaid[owner]+=n;},
  trade:(owner,klasse,kauf)=>{if(!kauf&&klasse==='frachter'&&Object.hasOwn(sales,owner))sales[owner]++;},
  buy:(station,ware,n,wert)=>{
   assert(['nahrung','medikamente'].includes(ware));
   assert(n>0&&wert>0);
   bought[ware]+=n;spent[ware]+=wert;
  }
 };
 const {core,rules}=engine(source,watch),s=core.createState(seed,rules);
 if(playerMiner){
  const sh=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  assert(sh,'player miner fehlt');
  const moved=core.execute(s,{type:'shipMine',owner:'house',schiff:sh.id,ware:'erz'},rules);
  assert(moved.ok,moved.reason);
 }
 const initialMoney=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
 for(let tick=1;tick<=129600;tick++){
  core.step(s,rules);
  if(tick%60===0)assert(core.audit(s).ok,'Stundenaudit '+seed+'/'+tick);
  if(tick%1440===0)independent(s);
  if([4320,43200,129600].includes(tick))
   assert.equal(core.hash(core.load(core.save(s),undefined,rules)),core.hash(s),'Save/Load');
 }
 const sum=a=>a.reduce((v,n)=>v+n,0);
 const tekort={};
 for(const r of Object.values(s.stats.mangel))
  for(const [w,v] of Object.entries(r))tekort[w]=(tekort[w]||0)+v;
 const fondos=Object.values(s.owners).filter(x=>x.kind==='fund');
 return {seed,rule:rules.rulesVersion,playerMiner,initialMoney,
  shortage:sum(Object.values(tekort)),foodShortage:tekort.nahrung||0,medShortage:tekort.medikamente||0,
  bought,spent,sales:sum(Object.values(sales)),unpaid,
  stationCash:sum(Object.values(s.owners).filter(x=>x.kind==='station').map(x=>x.cash)),
  fundCash:sum(fondos.map(x=>x.cash)),traderCash:s.owners.npc1.cash+s.owners.npc2.cash,
  losses:sum(['npc1','npc2','npc3'].flatMap(o=>Object.values(s.stats.verluste[o]||{}))),
  minted:s.minted,burned:s.burned};
}
const rows=[];
for(const seed of seeds){
 const old=run(legacy,seed),neu=run(src,seed);
 rows.push({mode:'passiv',seed,old,neu});
 console.log('BK4_SEED_90D '+JSON.stringify({seed,shortage:[old.shortage,neu.shortage],
  food:[old.foodShortage,neu.foodShortage],med:[old.medShortage,neu.medShortage],
  traderSales:[old.sales,neu.sales],unpaid:[old.unpaid,neu.unpaid],
  funds:[old.fundCash,neu.fundCash],stationen:[old.stationCash,neu.stationCash],
  cash:[old.traderCash,neu.traderCash],losses:[old.losses,neu.losses],
  paid:neu.spent,qty:neu.bought}));
}
for(const seed of [7,42]){
 const old=run(legacy,seed,true),neu=run(src,seed,true);
 rows.push({mode:'spielerminer',seed,old,neu});
 console.log('BK4_SPIELER_90D '+JSON.stringify({seed,shortage:[old.shortage,neu.shortage],
  food:[old.foodShortage,neu.foodShortage],med:[old.medShortage,neu.medShortage],
  traderSales:[old.sales,neu.sales],unpaid:[old.unpaid,neu.unpaid],
  funds:[old.fundCash,neu.fundCash],stationen:[old.stationCash,neu.stationCash],
  cash:[old.traderCash,neu.traderCash],losses:[old.losses,neu.losses],
  paid:neu.spent,qty:neu.bought}));
}
for(const mode of ['passiv','spielerminer']){
 const relevant=rows.filter(x=>x.mode===mode);
 const sum=(which,key)=>relevant.reduce((a,x)=>a+x[which][key],0);
 console.log('BK4_TOTAL_90D '+JSON.stringify({mode,n:relevant.length,
  shortage:[sum('old','shortage'),sum('neu','shortage')],
  food:[sum('old','foodShortage'),sum('neu','foodShortage')],
  meds:[sum('old','medShortage'),sum('neu','medShortage')],
  sales:[sum('old','sales'),sum('neu','sales')],
  losses:[sum('old','losses'),sum('neu','losses')],
  paidFood:sum('neu','spent')}));
}
assert.equal(rows.length,15);
console.log('BK4_ACCOUNTING_PASS '+JSON.stringify({seeds:seeds.length,days:90,playerSeeds:[7,42],
  note:'Erfolg nur fuer auditierte Buchungen, Wirtschaftsergebnis getrennt bewerten'}));
