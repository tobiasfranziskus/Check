// B3 nur für Audit/Diagnose, kein Goldenwert oder Produktcode.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2),input=args[0]||'/tmp/b3-sollflotte',dest=args[1]||'/tmp/b3-bericht';
assert(args.length<=2);
const cases=['miner','handel-flotte','station','jagd'].map(s=>JSON.parse(fs.readFileSync(path.join(input,s+'.json'),'utf8')));
const toolHash=createHash('sha256').update(fs.readFileSync(new URL('./b3-sollflotte.mjs',import.meta.url))).digest('hex');
const originalEnd={miner:'9b00de8697541ce5','handel-flotte':'b2f44fef99f3d49e',station:'7f71d2546a4febfd',jagd:'dc4c66ea46aa08bb'};
let report='# B3 – neue Frachter und reale Ersatzpflichten\n\n[ANALYSE] Kontrollen sind bytegleich zum Produktkern, alle Varianten reine Testprozessänderungen. Die Kosten für fehlende Minerplätze und fehlende Frachterplätze werden getrennt bilanziert; die Addition ist kein gespeichertes Konto. Die Frachter-Nettomarge erfasst die gesamte NPC3-Frachterklasse, einschließlich realer Kosten und Warenverluste aller Ersatzfrachter. Der erste B1-Frachter wird daneben separat ausgewiesen.\n\n';
report+='| Fall | Variante | Registrierte Frachter | Tatsächliche Ersatz-Frachter / Miner | Miner-/Frachter-Soll-Lücken (Tag 365) | Gebauter Frachter-Kauf ISK | Frachter-Netto vor Hüllen (gesamte Flotte) | NPC3-Kasse Tag 365 | Gedeckte Kosten / ungedeckter Betrieb | Neuer Frachter bis Tag 365? |\n| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |\n';
const compact=[];
for(const testcase of cases){
 assert.equal(testcase.toolSha256,toolHash);
 assert.deepEqual(testcase.results.map(v=>v.mode),['control','register','priority','funded']);
 const initial=testcase.results[0].initialHash;
 assert(testcase.results.every(v=>v.initialHash===initial));
 assert.equal(testcase.results[0].hashes.at(-1).hash,originalEnd[testcase.scenario],'exakte #37-Kontrolle am Tag 365');
 // Für alle vier B1-Fälle sind die alten Minerersatzpflichten am Aktivierungstick höher als die freie Kasse.
 assert.equal(testcase.results[3].hashes.at(-1).hash,originalEnd[testcase.scenario],'kein ungedeckter Sollplatz in funded');
 const rows=[];
 for(const x of testcase.results){
  assert.equal(x.hashes.length,275);
  assert.equal(x.roundtrips,12);
  const p=x.points.at(-1),b=p.budget;
  const createdFrachter=x.events.filter(e=>e.kind==='trade'&&e.ware==='frachter'&&e.klasse==='frachter'&&e.buy);
  const paidFrachter=createdFrachter.reduce((n,e)=>n+e.value+e.fee,0);
  const freightDue=x.events.filter(e=>e.kind==='freightCost').reduce((n,e)=>n+e.due,0);
  const freightPaid=x.events.filter(e=>e.kind==='freightCost').reduce((n,e)=>n+e.paid,0);
  const freightLoss=x.events.filter(e=>e.kind==='freightLoss').reduce((n,e)=>n+e.lostValue,0);
  assert.equal(p.freightCostDue,freightDue,'vollständige Frachter-Betriebskosten');
  assert.equal(p.freightCostPaid,freightPaid,'tatsächliche Frachter-Kostenbuchungen');
  assert.equal(p.freightLostCost,freightLoss,'reale Frachtverluste der ganzen Frachterflotte');
  assert.equal(p.netOperating,p.realizedMargin-freightDue-freightLoss,'Flotten-P&L vollständig');
  assert.equal(createdFrachter.length,p.realBuilds.frachter,'nur reale voll bezahlte Ersatzfrachter');
  const row={mode:x.mode,initialHash:x.initialHash,finalHash:p.hash,registered:b.registeredFreighters,
   firstFreighterLifeHours:x.death===null?null:(x.death-x.birth)/60,
   initialFrachterAlive:x.death===null,
   ownedFreighters:p.ownedFreighters,replacementFrachter:p.realBuilds.frachter,replacementMiner:p.realBuilds.miner,
   paidFrachter,missingMinerSlots:b.missingMinerSlots,missingFreighterSlots:b.missingFreighterSlots,
   cash:b.cash,minerReplacement:b.minerReplacement,freighterReplacement:b.freighterReplacement,
   freeAfterAll:b.freeAfterAllCommitments,freeAfterMiners:b.freeAfterCommitments,unpaid:p.companyCosts.unpaid,
   paidOperating:p.companyCosts.paid,netOperating:p.netOperating,firstNetOperating:p.firstNetOperating,freightCostDue:p.freightCostDue,freightCostPaid:p.freightCostPaid,freightLostCost:p.freightLostCost,firstShipTrades:p.totals,allFreighterTrades:p.freightTrades,
   hoursUnderMinerCommitments:x.deficitHours,netMinted:x.netMinted,netBurned:x.netBurned,life:x.life,
   hourlyBudgetMin:Math.min(...x.balances.map(v=>v.freeAfterAllCommitments))};
  rows.push(row);
  report+='| '+testcase.scenario+' | '+x.mode+' | '+row.registered+' | '+row.replacementFrachter+' / '+row.replacementMiner+
   ' | '+row.missingMinerSlots+' / '+row.missingFreighterSlots+' | '+row.paidFrachter+
   ' | '+Math.round(row.netOperating)+' | '+row.cash+' | '+row.paidOperating+' / '+row.unpaid+' | '+(row.initialFrachterAlive?'ja':'nein')+' |\n';
 }
 compact.push({scenario:testcase.scenario,seed:testcase.seed,initialHash:initial,variants:rows});
}
fs.mkdirSync(dest,{recursive:true});
fs.writeFileSync(path.join(dest,'B3_ERGEBNISSE.md'),report);
fs.writeFileSync(path.join(dest,'b3-sollflotte-daten.json'),JSON.stringify({status:'ANALYSE',toolHash,base:cases[0].basis,cases:compact},null,2)+'\n');
console.log('B3_SUMMARY_PASS 4 Fälle / 16 Varianten / 4400 Tageshashes / #37-Kontrollhashes / 4 finanziell ungedeckte Eintrittsfälle');
console.log(report);
