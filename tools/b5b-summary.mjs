// B5b: ausschliesslich auditierten B1-Zweiervergleich aus CI verdichten.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {BASE,MODES} from './b5b-common.mjs';
const args=process.argv.slice(2),indir=args[0]||'/tmp/b5b-b1',outdir=args[1]||'/tmp/b5b-bericht';
assert(args.length<=2);
const cases=['miner','handel-flotte','station','jagd'];
const rows=[],sum=a=>a.reduce((x,y)=>x+y,0);
for(const scenario of cases){
 const d=JSON.parse(fs.readFileSync(path.join(indir,scenario+'.json'),'utf8'));
 assert.equal(d.basis,BASE);
 assert.equal(d.scenario,scenario);
 assert.deepEqual(d.results.map(x=>x.mode),MODES);
 assert.notEqual(d.initialHashes.v13,d.initialHashes.v14);
 assert.equal(d.results[0].initialHash,d.initialHashes.v13);
 assert.equal(d.results[1].initialHash,d.initialHashes.v14);
 const [prev,next]=d.results;
 assert.equal(prev.afterDelivery.fehlendesNadirSilizium,1,'alte Warenidentität verliert Sollplatz');
 assert.equal(next.afterDelivery.fehlendesNadirSilizium,0,'neue dauerhafte Zuordnung hält Slot');
 assert(Number.isSafeInteger(next.afterDelivery.sollplatz),'übernommener Sollplatz vorhanden');
 assert.equal(next.afterDelivery.ware,null);
 assert.equal(prev.afterDelivery.ware,null);
 for(const v of d.results){
  assert.equal(v.days,275);assert.equal(v.daily.length,275);
  assert.equal(v.hours,6600);assert.equal(v.roundtrips,12);
  assert.equal(v.checkpoints.at(-1).day,275);
  assert(v.realMinerReplacements>=0);
  assert(v.npc3CostsDue>=v.npc3CostsPaid);
  assert(v.freighterDue>=v.freighterPaid);
 }
 rows.push(d);
}
const totals=MODES.map(mode=>{
 const r=rows.map(d=>({scenario:d.scenario,...d.results.find(x=>x.mode===mode)}));
 const last=r.map(x=>x.checkpoints.at(-1));
 return {mode,
  realMinerReplacements:sum(r.map(x=>x.realMinerReplacements)),
  realFrachterGoodsBuys:sum(r.map(x=>x.freighterTrade.buys)),
  realFrachterGoodsSales:sum(r.map(x=>x.freighterTrade.sells)),
  unpaidNpc3Work:sum(r.map(x=>x.npc3CostsDue-x.npc3CostsPaid)),
  npc3MinersEnd:sum(last.map(x=>x.ships.npc3.miners)),
  npc3FreightersEnd:sum(last.map(x=>x.ships.npc3.freighters)),
  npc3CashEnd:sum(last.map(x=>x.cash.npc3)),
  firstFreighterSurvivors:r.filter(x=>x.firstDeath===null).length,
  nadirMissingOnDelivery:r.map(x=>({case:x.scenario,missing:x.afterDelivery.fehlendesNadirSilizium})),
  siliconAlderaEnd:last.map(x=>x.stationSilicon),
  partsAlderaEnd:last.map(x=>x.stationParts),
  missingMinersEnd:last.map(x=>x.npc3Missing),
  cases:r.map(x=>({case:x.scenario,
   replacements:x.realMinerReplacements,npc3CashEnd:x.checkpoints.at(-1).cash.npc3,
   minerEnd:x.checkpoints.at(-1).ships.npc3.miners,
   slotMissingEnd:x.checkpoints.at(-1).npc3Missing,
   trades:x.freighterTrade.sells,unpaid:x.npc3CostsDue-x.npc3CostsPaid,
   totalShortage:x.checkpoints.at(-1).totalShortage,
   endHash:x.daily.at(-1).hash}))};
});
let markdown='# B5b: Dauerhafte Miner-Sollrollen – B1-Langzeitvergleich\n\n';
markdown+='**[ANALYSE/DRAFT – tatsächlich ausgeführte CI]** Vier ursprüngliche B1-Spielerstarts, jeweils identische validierte Befehle, historischer Regel-13-Kern gegenüber Regel 14. Regel 12 wird am ursprünglichen v12-Start verifiziert, dann nach 13 beziehungsweise 14 migriert. Alle Werte sind Simulationsergebnisse, keine produktive Integration.\n\n';
markdown+='| Version | Falsche Nadir-Siliziumlücken direkt nach Ankunft | Bezahlt gekaufte Minerhüllen | Endbestand NPC3-Miner | NPC3-Frachterwarenverkäufe | Ungedeckter NPC3-Betrieb (ISK) | Ursprüngliche Frachter überlebt |\n';
markdown+='| --- | --- | ---: | ---: | ---: | ---: | ---: |\n';
for(const x of totals)markdown+='| '+x.mode+' | '+x.nadirMissingOnDelivery.map(a=>a.missing).join(' / ')+' | '+x.realMinerReplacements+' | '+x.npc3MinersEnd+' | '+x.realFrachterGoodsSales+' | '+x.unpaidNpc3Work+' | '+x.firstFreighterSurvivors+'/4 |\n';
markdown+='\n### Fallbezogene Ergebnisse\n\n';
markdown+='| Fall | Regel | Echte Minerersatzkäufe | NPC3-Endkasse | NPC3-Miner-Endbestand | Fehlende Miner-Sollplätze | Warenverkäufe durch NPC3-Frachter | Ungedeckte NPC3-Kosten |\n';
markdown+='| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |\n';
for(const t of totals)for(const x of t.cases)markdown+='| '+x.case+' | '+t.mode+' | '+x.replacements+' | '+x.npc3CashEnd+' | '+x.minerEnd+' | '+x.slotMissingEnd+' | '+x.trades+' | '+x.unpaid+' |\n';
markdown+='\n**Interpretation:** Eine weggefallene Phantom-Sollrolle ist ein notwendiger Identitätsfix, aber keine automatische Rückreise und keine garantierte Gesamtförderung. Bei echtem Piratenverlust bleibt eine Sollrolle offen und erfordert real bezahlte Hülle. Warenumsätze sind nicht Netto-Ertrag; B5a-Kosten gelten weiter. Produktfreigabe erst zusammen mit 13×90-Standardwelt, Save-/Migration, iPad-/NAS- und separater Liquiditätsbewertung.\n';
fs.mkdirSync(outdir,{recursive:true});
fs.writeFileSync(path.join(outdir,'B5B_ERGEBNISSE.md'),markdown);
fs.writeFileSync(path.join(outdir,'b5b-b1.json'),JSON.stringify({base:BASE,cases,totals,dayHashes:2200,hourlyAuditPoints:52800},null,2)+'\n');
console.log('B5B_SUMMARY_PASS 4 Fälle × 2 Varianten × 275 Tage = 2200 Tageshashes');
console.log(markdown);
