import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2),dir=args[0]||'/tmp/b2b-umpositionierung',dest=args[1]||'/tmp/b2b-bericht';
assert(args.length<=2);
const sha=createHash('sha256').update(fs.readFileSync(new URL('./b2b-umpositionierung.mjs',import.meta.url))).digest('hex');
const referenz={
 miner:'7889e90735e24668',
 'handel-flotte':'0661ed4ef38540f0',
 station:'6ecd0b7f19ab8e75',
 jagd:'bf54698979aacb49'
};
const cases=['miner','handel-flotte','station','jagd'].map(x=>JSON.parse(fs.readFileSync(path.join(dir,x+'.json'),'utf8')));
let md='# B2b – Bezahlte Umpositionierung statt Dauerwarten\n\n[ANALYSE] Vergleich am unveränderten Produktionskern, B2a-Reserve-Warten als Referenz. Keine neuen Regeln.\n\n';
md+='| Fall | Variante | Leben (Stunden) | Käufe/Verkäufe | Leerabflüge | Frachter-Netto vor Hülle (ISK) | Ungedeckter NPC3-Betrieb (ISK) | Kasse Tag 365 |\n| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |\n';
const result=[];
for(const data of cases){
 assert.equal(data.toolSha256,sha);
 assert.deepEqual(data.results.map(x=>x.mode),['wait','reposition','riskguard']);
 assert(data.results.every(x=>x.initialHash===data.results[0].initialHash));
 assert.equal(data.results[0].hashes.at(-1).hash,referenz[data.scenario],'B2a-Endhash');
 const rows=[];
 for(const x of data.results){
  assert.equal(x.hashes.length,275);
  assert.equal(x.roundtrips,12);
  const end=x.points.at(-1);
  const depart=x.life.filter(e=>e.kind==='departure'&&Object.values(e.cargo||{}).reduce((a,b)=>a+b,0)===0);
  const lifetime=(x.death??(x.commands[0].tick-1+end.day*1440))-x.birth;
  const row={mode:x.mode,birth:x.birth,death:x.death,aliveAt365:x.death===null,
   lifeHours:lifetime/60,buys:end.totals.buys,sales:end.totals.sales,unitsBuy:end.totals.unitsBuy,
   unitsSell:end.totals.unitsSell,emptyDepartures:depart.length,netOperating:end.netOperating,
   unpaid:end.companyCosts.unpaid,cash:end.budget.cash,hash:end.hash,
   life:x.life,commands:x.commands,hashes:x.hashes,points:x.points};
  rows.push(row);
  md+='| '+data.scenario+' | '+x.mode+' | '+row.lifeHours.toFixed(2)+' | '+row.buys+'/'+row.sales+
   ' | '+row.emptyDepartures+' | '+Math.round(row.netOperating)+' | '+row.unpaid+' | '+row.cash+' |\n';
 }
 assert.notEqual(data.results[0].sourceSha256,data.results[1].sourceSha256);
 assert.notEqual(data.results[1].sourceSha256,data.results[2].sourceSha256);
 result.push({scenario:data.scenario,seed:data.seed,initialHash:data.results[0].initialHash,variants:rows});
}
fs.mkdirSync(dest,{recursive:true});
fs.writeFileSync(path.join(dest,'B2B_ERGEBNISSE.md'),md);
fs.writeFileSync(path.join(dest,'b2b-auswertung.json'),JSON.stringify({basis:cases[0].basis,toolSha256:sha,results:result},null,2)+'\n');
console.log('B2B_SUMMARY_PASS 4 Fälle, 12 Fortsetzungen, 3300 Tageshashes, #38-Wartereferenz');
console.log(md);
