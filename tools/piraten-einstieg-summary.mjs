// Ausschließlich nach tatsächlich ausgeführter CI erzeugte Messergebnisse.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {BASE,MODES,SEEDS,SHA} from './piraten-einstieg-common.mjs';
const args=process.argv.slice(2);
const datadir=args[0]||'/tmp/piraten-outputs',dest=args[1]||'/tmp/piraten-summary';
assert(args.length<=2);
const rows=[];
const summ=x=>x.reduce((a,b)=>a+b,0);
const median=x=>{const sorted=[...x].sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)];};
for(const seed of SEEDS){
 const a=JSON.parse(fs.readFileSync(path.join(datadir,'seed-'+seed+'.json'),'utf8'));
 assert.equal(a.seed,seed);assert.equal(a.basis,BASE);assert.deepEqual(a.result.map(x=>x.mode),MODES);
 assert(a.result.every(x=>x.initialHash===a.result[0].initialHash));
 for(const x of a.result){assert.equal(x.days,90);assert.equal(x.daily.length,90);assert.equal(x.hours,2160);assert.equal(x.roundtrips,6);}
 rows.push(a);
}
const scenarios=['miner','handel-flotte','station','jagd'];
const cases=[];
for(const k of scenarios){
 const a=JSON.parse(fs.readFileSync(path.join(datadir,k+'.json'),'utf8'));
 assert.equal(a.basis,BASE);assert.equal(a.scenario,k);assert.deepEqual(a.results.map(x=>x.mode),MODES);
 assert(a.results.every(x=>x.initialHash===a.migratedHash));
 for(const x of a.results){
  assert.equal(x.days,275);assert.equal(x.daily.length,275);assert.equal(x.hours,6600);assert.equal(x.roundtrips,12);
  assert.equal(x.checkpoints.at(-1).day,275);
  assert.equal(x.freighterTrade.buys>=0,true);
 }
 cases.push(a);
}
const standard=MODES.map(mode=>{
 const measures=rows.map(r=>r.result.find(x=>x.mode===mode).checkpoints.at(-1));
 const totalShortages=measures.map(x=>x.totalShortage);
 return {mode,medianShortage:median(totalShortages),sumShortage:summ(totalShortages),
  sumTotalTrades:summ(measures.map(x=>x.trades)),sumLosses:summ(measures.map(x=>Object.values(x.losses).reduce((n,o)=>n+summ(Object.values(o)),0))),
  npcFreightersEnd:summ(measures.map(x=>x.ships.npc1.freighters+x.ships.npc2.freighters+x.ships.npc3.freighters)),
  npc3CashMedian:median(measures.map(x=>x.cash.npc3)),npc3MissingMedian:median(measures.map(x=>x.npc3Missing)),
  medianSiliconAldera:median(measures.map(x=>x.stationSilicon)),medianPartsAldera:median(measures.map(x=>x.stationParts)),
  totalMinted:summ(measures.map(x=>x.minted)),totalBurned:summ(measures.map(x=>x.burned)),
  seedRows:measures.map((m,i)=>({seed:SEEDS[i],shortage:m.totalShortage,trades:m.trades,losses:m.losses,npc3Cash:m.cash.npc3,silicon:m.stationSilicon}))};
});
const b1=MODES.map(mode=>{
 const selected=cases.map(x=>({scenario:x.scenario,...x.results.find(v=>v.mode===mode)}));
 return {mode,originalFreightersAlive:selected.filter(x=>x.firstDeath===null).length,
  firstDeaths: selected.map(x=>({scenario:x.scenario,death:x.firstDeath,lifeHours:x.firstLifeHours})),
  npc3GoodsBuysByFreighters:summ(selected.map(x=>x.freighterTrade.buys)),
  npc3GoodsSalesByFreighters:summ(selected.map(x=>x.freighterTrade.sells)),
  npc3FreightCosts:summ(selected.map(x=>x.freighterDue)),
  npc3UnpaidWork:summ(selected.map(x=>x.npc3CostsDue-x.npc3CostsPaid)),
  npc3PirateAttacks:summ(selected.map(x=>x.pirateAttacks.filter(a=>a.owner==='npc3').length)),
  npc3FreighterLosses:summ(selected.map(x=>x.freighterLosses.filter(e=>e.klasse==='frachter').length)),
  npc3MinerLosses:summ(selected.map(x=>x.freighterLosses.filter(e=>e.klasse==='miner').length)),
  siliziumAldera: selected.map(x=>({scenario:x.scenario,value:x.checkpoints.at(-1).stationSilicon})),
  cash: selected.map(x=>({scenario:x.scenario,value:x.checkpoints.at(-1).cash.npc3})),
  details: selected.map(x=>({scenario:x.scenario,firstLifeHours:x.firstLifeHours,
    paidTrades:x.freighterTrade,unpaid:x.npc3CostsDue-x.npc3CostsPaid,
    last:x.checkpoints.at(-1),attackCount:x.pirateAttacks.length,
    lostFreighters:x.freighterLosses.filter(x=>x.klasse==='frachter').length}))};
});
let md='# Piraten-Einstieg – 13×90 Tage und vier B1-Fälle bis Tag 365\n\n';
md+='**[ANALYSE, nur CI-gemessene Daten]** Kein Produktcode, keine Änderung der Geldschöpfung, keine kostenlose Hülle und keine freigegebene Spielregel. Die B1-Tag-90-Zustände werden verlustfrei nach Regel 13 geladen; ihre historische Regel-12-Startidentität wird zuvor gegen den alten Kern geprüft.\n\n';
md+='## Standardwelt – 13 Seeds à 90 Tage\n\n';
md+='| Versuch | Gesamt-Mangelstunden | Handelsvorgänge | Schiffsverluste | NPC-Frachter am Ende (Summe) | NPC3-Kasse Median (ISK) | Silizium Aldera Median | Bauteile Aldera Median |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n';
for(const x of standard)md+='| '+x.mode+' | '+x.sumShortage+' | '+x.sumTotalTrades+' | '+x.sumLosses+' | '+x.npcFreightersEnd+' | '+x.npc3CashMedian+' | '+x.medianSiliconAldera+' | '+x.medianPartsAldera+' |\n';
md+='\n## Aktive B1-Spielerfälle – vier Fälle, je 275 Tage\n\n';
md+='| Versuch | Erster Frachter am Tag 365 lebend | Bezahlte Warenkäufe/-verkäufe durch NPC3-Frachter | NPC3-Frachterverluste | NPC3-Minerverluste | Piratenziel-Auswahl NPC3 | Ungedeckter NPC3-Betrieb (ISK) |\n| --- | ---: | --- | ---: | ---: | ---: | ---: |\n';
for(const x of b1)md+='| '+x.mode+' | '+x.originalFreightersAlive+'/4 | '+x.npc3GoodsBuysByFreighters+' / '+x.npc3GoodsSalesByFreighters+' | '+x.npc3FreighterLosses+' | '+x.npc3MinerLosses+' | '+x.npc3PirateAttacks+' | '+x.npc3UnpaidWork+' |\n';
md+='\n**Messgrenzen:** Dies sind vier deterministische B1-Stressfälle, kein allgemeiner Erfolgsanteil. B1-Warenkäufe/-verkäufe sind tatsächlich ausgeführte Geschäfte **durch** NPC3-Frachter, **keine Käufe/Verkäufe von Frachterhüllen**. Sie beweisen weder Gewinn nach Schiffskosten noch nachhaltige Versorgung. Der Kapitalfilter ist durch Geldausgabe dynamisch abschaltbar; 20 Tage Schonfrist gewährt nicht grundsätzlich dauerhaften Schutz; Aktivität bedeutet im Versuch mindestens drei historische Verkäufe oder Frachtwert ab 500 ISK. Ein weniger angegriffener Frachter kann länger leben und trotzdem nie Ware ausliefern. Weitere 13×90-Spielerfälle und iPad/NAS sind nicht behauptet.\n';
fs.mkdirSync(dest,{recursive:true});
fs.writeFileSync(path.join(dest,'PIRATEN_ERGEBNISSE.md'),md);
fs.writeFileSync(path.join(dest,'piraten-entscheidung.json'),JSON.stringify({base:BASE,modes:MODES,standard,b1,standardRuns:52,b1Runs:16,
 standardDayHashes:4680,b1DayHashes:4400,standardHourlyReplays:112320,b1HourlyReplays:105600},null,2)+'\n');
console.log('PIRATEN_SUMMARY_PASS 13 Seeds × 4 ×90 plus 4 B1 ×4 ×275, 9080 Tageshashes');
console.log(md);
