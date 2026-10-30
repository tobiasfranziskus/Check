// Reproduzierbarer 13-Seed-Vergleich: PR #19 vor/Nach Sicherheitsgeografie.
// Basis ist der unveränderte PR-#19-Commit 3cff288; nur Entwicklungswerkzeug.
// Aufruf im Git-Checkout: node tools/sicherheitsgeografie-simulation.mjs
import fs from 'node:fs';
import { v11CoreSource } from './v11-core-source.mjs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const baselineSha='3cff288aa75c2c072c210298e9f81fb7b92a4ec7';
const baselineHtml=execFileSync('git',['show',baselineSha+':index.html'],{encoding:'utf8',maxBuffer:10*1024*1024});
const currentHtml=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const common=['st_aldera','st_cyris','st_dravos','st_meridian','st_orion','st_veldra'];
const tradeAnchor="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
const costAnchor="const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
function extract(html){
 const start=html.indexOf('<script>')+8, stop=html.indexOf('const m_data_oberflaeche');
 assert(start>7&&stop>start,'Engine-Schnittstelle');
 return v11CoreSource(html);
}
function engine(html,watchTrade=()=>{},watchCost=()=>{}){
 const text=extract(html);
 assert(text.includes(tradeAnchor)&&text.includes(costAnchor),'Beobachter-Anker');
 const observed=text.replace(tradeAnchor,
  "buche(state, schiff.owner, 'kosten', fee);\n  watchTrade(state,schiff,menge,kauf);\n  return true;")
  .replace(costAnchor,
   "if (s.owner === 'npc1' || s.owner === 'npc2' || s.owner === 'npc3') watchCost(s.owner,Math.max(0,kosten-besitzer.cash));\n    "+costAnchor);
 return new Function('watchTrade','watchCost',observed+';return m_core_index;')(watchTrade,watchCost);
}
const sum=a=>a.reduce((x,y)=>x+y,0);
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
function shortage(s,ids){return sum(ids.map(id=>sum(Object.values(s.stats.mangel[id]||{}))))}
function loss(s,owner){return sum(Object.values(s.stats.verluste[owner]||{}))}
function run(html,seed,repeat){
 let sales=0,unpaidNpc1=0,unpaidNpc2=0,unpaidNpc3=0,zeroNpc1=0,longNoSale=0,noSale=0,prevSales=0;
 const c=engine(html,(s,sh,n,buy)=>{if(!buy&&sh.klasse==='frachter'&&s.owners[sh.owner].kind==='trader')sales++},
 (owner,short)=>{if(owner==='npc1')unpaidNpc1+=short;else if(owner==='npc2')unpaidNpc2+=short;else unpaidNpc3+=short;});
 const state=c.createState(seed),points=[];
 for(let tick=1;tick<=129600;tick++){
  c.step(state);
  if(tick%60===0){
   assert(c.audit(state).ok,'Audit '+seed+' Tick '+tick);
   if(tick>=10080&&state.owners.npc1.cash===0)zeroNpc1++;
   noSale=sales===prevSales?noSale+1:0;
   longNoSale=Math.max(longNoSale,noSale);
   prevSales=sales;
  }
  if(tick===4320||tick===43200||tick===129600)points.push({tick,hash:c.hash(state)});
 }
 assert.equal(c.hash(c.load(c.save(state))),c.hash(state),'Save/Load '+seed);
 if(repeat){
  const verify=engine(html),other=verify.createState(seed);
  for(const p of points){
   while(other.tick<p.tick)verify.advance(other,Math.min(10000,p.tick-other.tick));
   assert.equal(verify.hash(other),p.hash,'Reproduktion '+seed+' Tick '+p.tick);
   assert(verify.audit(other).ok,'Repro-Audit '+seed);
  }
 }
 return {seed,points,commonShortage:shortage(state,common),
  totalShortage:shortage(state,Object.keys(state.stations)),
  nadirShortage:shortage(state,['st_nadir']),
  sales,unpaidNpc1,unpaidNpc2,unpaidNpc3,zeroNpc1,longNoSale,
  lossNpc1:loss(state,'npc1'),lossNpc2:loss(state,'npc2'),lossNpc3:loss(state,'npc3'),
  lossPirates:loss(state,'pirates'),lossSecurity:loss(state,'security'),
  siliconMined:state.ledger.silizium.mined,siliconConsumed:state.ledger.silizium.consumed,
  foodProduced:state.ledger.nahrung.produced,
  cashNpc1:state.owners.npc1.cash,cashNpc3:state.owners.npc3.cash,
  minted:state.minted,burned:state.burned,initialSupply:state.initialSupply};
}
const metrics=['commonShortage','totalShortage','sales','unpaidNpc1','unpaidNpc2','unpaidNpc3','zeroNpc1','longNoSale','lossNpc1','lossNpc2','lossNpc3','lossPirates','lossSecurity','siliconMined','siliconConsumed','foodProduced','minted','burned'];
const pairs=[];
for(const seed of seeds){
 const before=run(baselineHtml,seed,false);
 const after=run(currentHtml,seed,true);
 assert.equal(before.points.length,3);
 assert.equal(after.points.length,3);
 console.log('GEO_PAIR '+JSON.stringify({seed,before,after}));
 pairs.push({before,after});
}
const summary={baselineSha,seeds:pairs.length,metrics:{}};
for(const k of metrics){
 const a=pairs.map(p=>p.before[k]),b=pairs.map(p=>p.after[k]);
 summary.metrics[k]={beforeMedian:median(a),afterMedian:median(b),beforeSum:sum(a),afterSum:sum(b),
  improvedSeeds:sum(pairs.map(p=>Number(p.after[k]<p.before[k]))),
  increasedSeeds:sum(pairs.map(p=>Number(p.after[k]>p.before[k])))};
}
summary.nadirShortageMedian=median(pairs.map(p=>p.after.nadirShortage));
console.log('GEO_SUMMARY '+JSON.stringify(summary));
