// B5b: Regel 14 gegen unabhängige historische 13×90-v12-Fixture, eigene 14er-Hashes.
// Keine Fixture-Änderung, keine zweite Wirtschaftsberechnung.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const BASE='e0c27a3762d9d6e75d8bcc30ed47621eff2f152b';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const golden=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-priority-v12.json',import.meta.url),'utf8'));
assert.equal(golden.provenance.sourceRun,41026155660);
const source=x=>x.slice(x.indexOf('<script>')+8,x.indexOf('const m_data_oberflaeche'));
const oldHtml=execFileSync('git',['show',BASE+':index.html'],{encoding:'utf8',maxBuffer:10*1024*1024});
const digest=x=>createHash('sha256').update(x).digest('hex');
assert(oldHtml.includes('schema: 8, rulesVersion: 13,'),'gepinntes Regel-13-Original');
const old=new Function(source(oldHtml)+';return {c:m_core_index,r:m_data_rules.RULES,h:m_core_handel};')();
assert.equal(old.r.rulesVersion,13);
const current=source(html);
const trade="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
const cost="const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
assert.equal(current.split(trade).length,2);
assert.equal(current.split(cost).length,2);
const hooked=current.replace(cost,
 "if(['npc1','npc2','npc3'].includes(s.owner))watchCost(s.owner,Math.max(0,kosten-besitzer.cash));\n    "+cost)
 .replace(trade,"buche(state, schiff.owner, 'kosten', fee);\n  watchTrade(state,schiff,kauf);\n  return true;");
const instrumented=new Function('watchCost','watchTrade',hooked+';return {c:m_core_index,r:m_data_rules.RULES};');
const plain=new Function(current+';return {c:m_core_index,r:m_data_rules.RULES,h:m_core_handel};')();
assert.equal(plain.r.rulesVersion,14);
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
assert.deepEqual(golden.results.map(x=>x.seed),seeds);
const sum=a=>a.reduce((v,n)=>v+n,0);
function independentAudit(s){
 let money=0;
 for(const o of Object.values(s.owners)){assert(Number.isSafeInteger(o.cash)&&o.cash>=0);money+=o.cash;}
 assert.equal(money,s.initialSupply+s.minted-s.burned,'unabhängige Geldsumme');
 const stock={};
 for(const st of Object.values(s.stations))for(const [w,n] of Object.entries(st.lager)){assert(Number.isSafeInteger(n)&&n>=0);stock[w]=(stock[w]||0)+n;}
 for(const sh of Object.values(s.ships))for(const [w,n] of Object.entries(sh.ladung)){assert(Number.isSafeInteger(n)&&n>=0);stock[w]=(stock[w]||0)+n;}
 for(const [w,l] of Object.entries(s.ledger)){
  const expect=l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported;
  assert.equal(stock[w]||0,expect,'unabhängiger Warenbeleg '+w);
 }
}
const runResults=[];
for(const base of golden.results){
 const debt={npc1:0,npc2:0,npc3:0};let traderSales=0;
 const {c,r}=instrumented((owner,n)=>{debt[owner]+=n;},(s,sh,buy)=>{
   if(!buy&&sh.klasse==='frachter'&&s.owners[sh.owner].kind==='trader')traderSales++;
 });
 const s=c.createState(base.seed,r),replay=plain.c.createState(base.seed,plain.r),points=[];
 assert.equal(c.hash(s),plain.c.hash(replay));
 for(let tick=1;tick<=129600;tick++){
  c.step(s,r);plain.c.step(replay,plain.r);
  if(tick%60===0){assert(c.audit(s).ok,'v14 hourly audit');independentAudit(s);assert.equal(c.hash(s),plain.c.hash(replay),'hourly deterministic replay');}
  if(tick%1440===0)points.push({tick,hash:c.hash(s)});
  if(tick%1440===0&&[3,30,90].includes(tick/1440)){
   const saved=c.save(s),rest=c.load(saved,undefined,r);
   assert.equal(c.hash(rest),c.hash(s),'save/load '+base.seed+'/'+tick);
   assert.equal(plain.c.hash(plain.c.load(plain.c.save(replay),undefined,plain.r)),plain.c.hash(replay));
  }
 }
 const shortage={};
 for(const row of Object.values(s.stats.mangel))for(const [ware,n] of Object.entries(row))
  shortage[ware]=(shortage[ware]||0)+n;
 const byKind={station:0,fund:0,trader:0};
 for(const x of Object.values(s.owners))if(Object.hasOwn(byKind,x.kind))byKind[x.kind]+=x.cash;
 const measured={seed:base.seed,totalShortage:sum(Object.values(shortage)),foodShortage:shortage.nahrung||0,
  partsShortage:shortage.bauteil||0,medicineShortage:shortage.medikamente||0,
  foodAldera:s.stats.mangel.st_aldera.nahrung,foodDravos:s.stats.mangel.st_dravos.nahrung,
  traderSales,npc1Unpaid:debt.npc1,npc2Unpaid:debt.npc2,
  stationsCash:byKind.station,fundCash:byKind.fund,traderCash:byKind.trader,
  civilianLosses:sum(['npc1','npc2','npc3'].map(o=>sum(Object.values(s.stats.verluste[o]||{})))),
  minted:s.minted,burned:s.burned};
 assert.deepEqual(measured,base,'v14 Standardwelt gegen unabhängige v12-Goldenwerte Seed '+base.seed);
 runResults.push({seed:base.seed,dayHashes:points,summary:measured});
 console.log('B5B_SEED_PASS '+JSON.stringify({seed:base.seed,days:90,hashes:points.length,shortage:measured.totalShortage}));
}
const totals={seeds:seeds.length,days:90,dailyHashes:seeds.length*90,
 totalShortage:sum(runResults.map(x=>x.summary.totalShortage)),
 traderSales:sum(runResults.map(x=>x.summary.traderSales)),
 paidNpc1Unpaid:sum(runResults.map(x=>x.summary.npc1Unpaid))};
assert.equal(totals.totalShortage,791,'historische Fehlstunden unverändert');
const out=process.argv[2];
if(out)fs.writeFileSync(out,JSON.stringify({base:BASE,rule:14,fixtureRun:golden.provenance.sourceRun,...totals,results:runResults},null,2)+'\n');
console.log('B5B_90D_PASS '+JSON.stringify(totals));
