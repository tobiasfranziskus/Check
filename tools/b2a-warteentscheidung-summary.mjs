import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2),input=args[0]||'/tmp/b2a-warten',dest=args[1]||'/tmp/b2a-bericht';
assert(args.length<=2);
const source=fs.readFileSync(new URL('./b2a-warteentscheidung.mjs',import.meta.url));
const sha=createHash('sha256').update(source).digest('hex');
const cases=['miner','handel-flotte','station','jagd'].map(x=>JSON.parse(fs.readFileSync(path.join(input,x+'.json'),'utf8')));
let md='# B2a – Zufällige Leerfahrt versus Warten am Dock\n\n[ANALYSE] Aus realen Simulationsdaten dieser CI erzeugt; kein Produktstatus.\n\n';
md+='| Fall | Modus | Leben (Stunden) | Handelskäufe/-verkäufe | Leere Abflüge | Netto Betrieb vor Hülle (ISK) | Ungedeckter Konzernbetrieb (ISK) | NPC3-Kasse Tag 365 |\n| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |\n';
const expectedReserve={miner:'5d8219f0d9cc6e21','handel-flotte':'016211add41aff8e',station:'8613b35ecc413697',jagd:'4b5c2c433bb15d69'};
const results=[];
for(const v of cases){
 assert.equal(v.toolSha256,sha,'Tool-Hash');
 assert.deepEqual(v.results.map(x=>x.mode),['control','wait','reserve_control','reserve_wait']);
 assert(v.results.every(x=>x.initialHash===v.results[0].initialHash));
 assert.equal(v.results[2].hashes.at(-1).hash,expectedReserve[v.scenario],'PR #37 Reserve-Referenz');
 assert.notEqual(v.results[0].sourceSha256,v.results[1].sourceSha256);
 assert.notEqual(v.results[2].sourceSha256,v.results[3].sourceSha256);
 const list=[];
 for(const x of v.results){
  assert.equal(x.hashes.length,275);
  assert.equal(x.roundtrips,12);
  const last=x.points.at(-1);
  const leer=x.life.filter(e=>e.kind==='departure'&&Object.values(e.cargo||{}).reduce((a,b)=>a+b,0)===0).length;
  const row={mode:x.mode,birth:x.birth,death:x.death,aliveHours:x.aliveHours,emptyDepartures:leer,buy:x.totals?.buys??last.totals.buys,sales:last.totals.sales,netOperating:last.netOperating,unpaid:last.companyCosts.unpaid,cash:last.budget.cash,finalHash:last.hash,roundtrips:x.roundtrips,hashCount:x.hashes.length,life:x.life};
  list.push(row);
  md+='| '+v.scenario+' | '+x.mode+' | '+((x.death??(x.commands[0].tick-1+x.points.at(-1).day*1440))-(x.birth??0))/60+' | '+row.buy+' / '+row.sales+' | '+row.emptyDepartures+' | '+Math.round(row.netOperating)+' | '+row.unpaid+' | '+row.cash+' |\n';
 }
 results.push({scenario:v.scenario,seed:v.seed,initialHash:v.results[0].initialHash,variants:list});
}
fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'B2A_ERGEBNISSE.md'),md);fs.writeFileSync(path.join(dest,'b2a-kurzfassung.json'),JSON.stringify({basis:cases[0].basis,toolSha256:sha,results},null,2)+'\n');
console.log('B2A_SUMMARY_PASS '+cases.length+' Fälle, 16 reproduzierte Läufe, 4400 Tageshashes');
console.log(md);
