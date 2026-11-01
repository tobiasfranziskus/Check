// B-K3: Original-Core Regel 14 (eingefroren per Version-Gate) gegen Produktregel 15.
// Keine Produktmutation: beide Varianten nutzen exakt denselben index.html-Quellcode.
// 13 x 90 Tage passiv; 2 x 90 Tage aktiv sparender Miner; unabhängige Audits.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const oldSource=source.replace('schema: 8, rulesVersion: 15,','schema: 8, rulesVersion: 14,');
assert.notEqual(oldSource,source,'Regel 15 muss installiert sein');
const cost="const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
const fly="        abflug(state, rules, s, station, andere[rngInt(state, andere.length)], null, 0);";
const trade="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
function engine(src,watch){
 assert.equal(src.split(cost).length,2,'urspruenglicher Lohnpfad');
 assert.equal(src.split(fly).length,2,'nur automatische Leerpositionierung');
 assert.equal(src.split(trade).length,2,'Original-Handelstransaktion');
 const audited=src.replace(cost,
   "if (['npc1','npc2','npc3'].includes(s.owner)) watch.unpaid(s.owner,Math.max(0,kosten-besitzer.cash));\n    "+cost)
  .replace(fly,"        (watch.empty(s.owner), abflug(state, rules, s, station, andere[rngInt(state, andere.length)], null, 0));")
  .replace(trade,"buche(state, schiff.owner, 'kosten', fee);\n  watch.trade(schiff.owner,schiff.klasse,kauf);\n  return true;");
 return new Function('watch',audited+
  ';return {core:m_core_index,rules:m_data_rules.RULES};')(watch);
}
const n=a=>a.reduce((x,y)=>x+y,0),seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
function externalAudit(s){
 let cash=0;
 for(const o of Object.values(s.owners)){assert(Number.isSafeInteger(o.cash)&&o.cash>=0);cash+=o.cash;}
 assert.equal(cash,s.initialSupply+s.minted-s.burned,'unabhaengiger ISK-Beleg');
 const actual={};
 for(const st of Object.values(s.stations))
  for(const [w,k] of Object.entries(st.lager)){assert(Number.isSafeInteger(k)&&k>=0);actual[w]=(actual[w]||0)+k;}
 for(const sh of Object.values(s.ships))
  for(const [w,k] of Object.entries(sh.ladung)){assert(Number.isSafeInteger(k)&&k>=0);actual[w]=(actual[w]||0)+k;}
 for(const [w,l] of Object.entries(s.ledger))
  assert.equal(actual[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,'Ware '+w);
}
function run(src,seed,playerMiner=false){
 const unpaid={npc1:0,npc2:0,npc3:0};let empty=0,traderSales=0,emptyByOwner={};
 const watch={unpaid:(owner,n)=>unpaid[owner]+=n,
  empty:(owner)=>{empty++;emptyByOwner[owner]=(emptyByOwner[owner]||0)+1;},
  trade:(owner,klasse,kauf)=>{if(!kauf&&klasse==='frachter'&&(owner==='npc1'||owner==='npc2'))traderSales++;}};
 const {core,rules}=engine(src,watch),s=core.createState(seed,rules);
 if(playerMiner){
  const sh=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  assert(sh,'Player-Miner vorhanden');
  const cmd=core.execute(s,{type:'shipMine',owner:'house',schiff:sh.id,ware:'erz'},rules);
  assert(cmd.ok,cmd.reason);
 }
 const before=core.hash(s);
 for(let tick=1;tick<=129600;tick++){
   core.step(s,rules);
   if(tick%60===0)assert(core.audit(s).ok,'Core-Audit');
   if(tick%1440===0)externalAudit(s);
   if(tick===43200||tick===129600){
    const loaded=core.load(core.save(s),undefined,rules);
    assert.equal(core.hash(loaded),core.hash(s),'Save/Load');
   }
 }
 const shortage=n(Object.values(s.stats.mangel).flatMap(y=>Object.values(y)));
 const food=n(Object.values(s.stats.mangel).map(x=>x.nahrung||0));
 const sales=n(Object.entries(s.stats.verkaeufe).map(([id,count])=>{
  const ship=s.ships[id];
  // Historische Ausfaelle behalten ihre Verkaufszahl in der Statistik.
  // Daher konsistent mit dem übergeordneten Handelstotal auswerten.
  return count;
 }));
 const ownerTotal={};
 for(const x of ['npc1','npc2','npc3','house'])ownerTotal[x]=s.owners[x].cash;
 const losses=n(['npc1','npc2','npc3'].flatMap(o=>Object.values(s.stats.verluste[o]||{})));
 return {seed,version:rules.rulesVersion,playerMiner,initialHash:before,finalHash:core.hash(s),
  shortage,food,sales,traderSales,empty,emptyByOwner,unpaid,
  owners:ownerTotal,losses,minted:s.minted,burned:s.burned};
}
const results=[];
for(const seed of seeds){
 const a=run(oldSource,seed),b=run(source,seed);
 assert.equal(a.version,14);assert.equal(b.version,15);
 assert.equal(a.shortage>=0,true);assert.equal(b.shortage>=0,true);
 results.push({type:'passiv',seed,old:a,neu:b});
 console.log('BK3_SEED_90D '+JSON.stringify({
  seed,shortage:[a.shortage,b.shortage],food:[a.food,b.food],
  empty:[a.empty,b.empty],unpaid:[a.unpaid,b.unpaid],
  allSales:[a.sales,b.sales],traderSales:[a.traderSales,b.traderSales],losses:[a.losses,b.losses],
  traderCash:[a.owners.npc1+a.owners.npc2,b.owners.npc1+b.owners.npc2]}));
}
for(const seed of [7,42]){
 const a=run(oldSource,seed,true),b=run(source,seed,true);
 results.push({type:'spieler-miner',seed,old:a,neu:b});
 console.log('BK3_SPIELER_90D '+JSON.stringify({
  seed,shortage:[a.shortage,b.shortage],food:[a.food,b.food],
  empty:[a.empty,b.empty],unpaid:[a.unpaid,b.unpaid],
  allSales:[a.sales,b.sales],traderSales:[a.traderSales,b.traderSales],losses:[a.losses,b.losses],
  traderCash:[a.owners.npc1+a.owners.npc2,b.owners.npc1+b.owners.npc2]}));
}
const total=(type,v,key)=>n(results.filter(x=>x.type===type).map(x=>x[v][key]));
for(const type of ['passiv','spieler-miner'])
 console.log('BK3_V15_BILANZ '+JSON.stringify({type,varianten:results.filter(x=>x.type===type).length,
  mangel:[total(type,'old','shortage'),total(type,'neu','shortage')],
  nahrungMangel:[total(type,'old','food'),total(type,'neu','food')],
  leerfahrten:[total(type,'old','empty'),total(type,'neu','empty')],
  schiffsverluste:[total(type,'old','losses'),total(type,'neu','losses')],
  npc1_2_frachterVerkaeufe:[total(type,'old','traderSales'),total(type,'neu','traderSales')],
  alleSchiffVerkaufsereignisse:[total(type,'old','sales'),total(type,'neu','sales')]}));
assert.equal(results.length,15);
console.log('BK3_90D_GATES_PASS '+JSON.stringify({seeds:13,days:90,activePlayerSeeds:[7,42],
 comment:'Technisches Gate bestanden; Wirtschaftsverbesserung erst nach Auswertung der Kennzahlen.'}));
