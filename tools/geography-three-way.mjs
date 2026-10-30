// Isolierte Ursachenanalyse: v10-Basis / nur Tor / Tor+Nadir.
// Alle Varianten verwenden denselben unveränderten Core. Nur beim Torversuch
// wird zur Ausführung ein einziger deklarativer gate-Eintrag im v10-Quelltext ergänzt.
// node tools/geography-three-way.mjs (vollständiger Git-Checkout nötig)
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const sha='3cff288aa75c2c072c210298e9f81fb7b92a4ec7';
const originalHtml=execFileSync('git',['show',sha+':index.html'],{encoding:'utf8',maxBuffer:10*1024*1024});
const fullHtml=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const old="id: 'meridian', name: 'Meridian', sicherheit: 'gesetzlos',\n      karte: { x: 880, y: 880 }, region: 1300,\n      gates: [{ to: 'veldra', time: 30 }],";
const modified="id: 'meridian', name: 'Meridian', sicherheit: 'gesetzlos',\n      karte: { x: 880, y: 880 }, region: 1300,\n      gates: [{ to: 'veldra', time: 30 }, { to: 'orion', time: 26 }],";
assert.equal(originalHtml.split(old).length,2,'eindeutiger Tor-Anker v10');
const torHtml=originalHtml.replace(old,modified);
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const sum=a=>a.reduce((x,y)=>x+y,0);
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
const trade="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
const cost="const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
const source=html=>html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
function engine(html,watchTrade,watchCost){
 const src=source(html);
 assert(src.includes(trade)&&src.includes(cost),'Instrumentierungsanker');
 const patched=src.replace(trade,"buche(state, schiff.owner, 'kosten', fee);\n  watchTrade(state,schiff,menge,kauf);\n  return true;")
 .replace(cost,"if(['npc1','npc2','npc3'].includes(s.owner))watchCost(s.owner,Math.max(0,kosten-besitzer.cash));\n    "+cost);
 return new Function('watchTrade','watchCost',patched+';return {c:m_core_index,r:m_data_rules.RULES};')(watchTrade,watchCost);
}
function run(html,seed,variant){
 let sales=0,unpaidNpc1=0,unpaidNpc2=0,unpaidNpc3=0,zeroNpc1=0;
 const {c,r}=engine(html,(s,sh,n,kauf)=>{if(!kauf&&sh.klasse==='frachter'&&s.owners[sh.owner].kind==='trader')sales++},
 (who,n)=>{if(who==='npc1')unpaidNpc1+=n;else if(who==='npc2')unpaidNpc2+=n;else unpaidNpc3+=n});
 const s=c.createState(seed);
 assert.equal(Object.keys(r.world.systems).length,variant==='full'?7:6);
 if(variant==='tor')assert(r.world.gates.some(([a,b])=>(a==='meridian'&&b==='orion')||(a==='orion'&&b==='meridian')));
 if(variant==='base')assert(!r.world.gates.some(([a,b])=>(a==='meridian'&&b==='orion')||(a==='orion'&&b==='meridian')));
 for(let t=1;t<=129600;t++){
  c.step(s);
  if(t%60===0){
   assert(c.audit(s).ok,'Audit '+variant+'/'+seed+'/'+t);
   if(t>=10080&&s.owners.npc1.cash===0)zeroNpc1++;
  }
 }
 const shortage=Object.fromEntries(Object.entries(s.stats.mangel).map(([id,row])=>[id,{...row}]));
 const shortageTotal=sum(Object.values(shortage).flatMap(row=>Object.values(row)));
 const originalSystems=['st_aldera','st_cyris','st_dravos','st_meridian','st_orion','st_veldra'];
 const commonShortage=sum(originalSystems.flatMap(st=>Object.values(shortage[st])));
 const losses=Object.fromEntries(['npc1','npc2','npc3','pirates','security'].map(id=>[id,sum(Object.values(s.stats.verluste[id]||{}))]));
 const totals={seed,variant,shortage,shortageTotal,commonShortage,sales,unpaidNpc1,unpaidNpc2,unpaidNpc3,zeroNpc1,
  losses,siliconMined:s.ledger.silizium.mined,siliconConsumed:s.ledger.silizium.consumed,
  foodProduced:s.ledger.nahrung.produced,initialSupply:s.initialSupply,cashNpc1:s.owners.npc1.cash,
  hash:c.hash(s)};
 assert.equal(c.hash(c.load(c.save(s))),totals.hash,'Save/Load '+variant+' '+seed);
 return totals;
}
const results={base:[],tor:[],full:[]};
for(const seed of seeds){
 const base=run(originalHtml,seed,'base'),tor=run(torHtml,seed,'tor'),full=run(fullHtml,seed,'full');
 for(const [k,v] of Object.entries({base,tor,full}))results[k].push(v);
 console.log('THREE_WAY '+JSON.stringify({seed,base,tor,full}));
}
const keys=['commonShortage','shortageTotal','sales','unpaidNpc1','unpaidNpc2','unpaidNpc3','zeroNpc1','siliconMined','siliconConsumed','foodProduced'];
const summary={sourceSha:sha,seeds:seeds.length,variants:{}};
for(const [name,rows] of Object.entries(results)){
 const totals={};
 for(const key of keys)totals[key]={median:median(rows.map(x=>x[key])),sum:sum(rows.map(x=>x[key]))};
 for(const owner of ['npc1','npc2','npc3','pirates','security'])totals['losses_'+owner]={median:median(rows.map(x=>x.losses[owner])),sum:sum(rows.map(x=>x.losses[owner]))};
 const byStation={};
 for(const row of rows)for(const [station,wares] of Object.entries(row.shortage)){
  for(const [ware,n] of Object.entries(wares)){
   byStation[station]??={};byStation[station][ware]=(byStation[station][ware]||0)+n;
  }
 }
 summary.variants[name]={totals,byStation};
}
console.log('THREE_WAY_SUMMARY '+JSON.stringify(summary));
