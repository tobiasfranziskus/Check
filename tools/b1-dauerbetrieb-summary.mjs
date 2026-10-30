import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2),input=args[0]||'/tmp/b1-dauer',dest=args[1]||'docs';assert(args.length<=2);
const cases=['miner','handel-flotte','station','jagd'].map(x=>JSON.parse(fs.readFileSync(path.join(input,x+'.json'),'utf8')));
const sha=createHash('sha256').update(fs.readFileSync(new URL('./b1-dauerbetrieb.mjs',import.meta.url))).digest('hex');
const compact=[];let md='# B1-Folgeanalyse – vollständige Frachter-Lebensläufe der Kontrolle\n\n[ANALYSE] Maschinell aus den neu ausgeführten Kontrollläufen erzeugt; kein Produktlog. Jede Abfahrt, jeder Warenkauf/-verkauf, jede Kostenabrechnung und jeder Kampf des B1-Frachters wird aufgeführt. Vollständige Zahlen einschließlich aller Varianten stehen in den Messdaten, die stündliche Budgetserie im CI-Rohartefakt.\n\n';
const fmt=o=>Object.entries(o||{}).map(([k,v])=>k+'='+v).join(', ')||'leer';
for(const data of cases){
 assert.equal(data.toolSha256,sha);assert.equal(data.results.length,3);assert.deepEqual(data.results.map(x=>x.mode),['control','operating','replacement']);
 compact.push({...data,results:data.results.map(({balances,...x})=>({...x,budgetExtrema:{minFree:Math.min(...balances.map(b=>b.freeAfterCommitments)),maxHullGap:Math.max(...balances.map(b=>b.extraHullGap))}}))});
 const x=data.results[0],hull=x.events.find(e=>e.kind==='trade'&&e.ware==='frachter'&&e.buy);
 md+='## '+data.scenario+' / Seed '+data.seed+' / '+x.id+'\n\n';
 md+='Reale Hülle: '+hull.value+' + '+hull.fee+' ISK an Tick '+hull.tick+'. Geburt '+x.birth+', Verlust '+x.death+'.\n\n';
 md+='| Tick | Vorgang | Route / Ware / Kosten / Ergebnis | Konzernkasse / Ersatzfähigkeit |\n| --- | --- | --- | --- |\n';
 for(const e of x.life){let desc='',cash='';
  if(e.kind==='birth'){desc='Aktivierung, '+e.ship.system+', Fracht '+fmt(e.ship.ladung);cash='Cash '+e.budget.cash+', freie Mittel nach Verpflichtungen '+e.budget.freeAfterCommitments;}
  if(e.kind==='departure'){desc=e.station+' → '+e.ziel+'; '+e.route.weg.join(' → ')+'; '+e.route.zeit+' Ticks; Fracht '+fmt(e.cargo);cash=String(e.cash);}
  if(e.kind==='trade'){desc=(e.buy?'Kauf ':'Verkauf ')+e.n+' '+e.ware+' in '+e.station+'; Warenwert '+e.value+', Gebühr '+e.fee;cash=String(e.cash);}
  if(e.kind==='cost'){desc='Soll '+e.due+', bezahlt '+e.paid+', ungedeckt '+(e.due-e.paid)+' in '+e.system;cash='vor Abbuchung '+e.cashBefore;}
  if(e.kind==='combat'){desc='Ziel '+(e.target||e.originSystem)+' ('+e.phase+'); Angreifer '+e.pirates.map(p=>p.id+':'+p.klasse).join(', ')+'; Fracht '+fmt(e.cargo)+'; eigene HP nach Kampf '+e.result.a.join(',')+'; Piraten-HP '+e.result.b.join(',')+'; Runden '+e.result.runden;cash='Cash '+e.budget.cash+', fehlende Miner '+e.budget.missingMiners+', neue Hülle '+e.budget.hull+', Budgetlücke '+e.budget.extraHullGap;}
  if(e.kind==='loss'){desc='Schiff entfernt; verlorener FIFO-Frachtwert '+e.lostInventoryCost;cash='Cash '+e.budget.cash+', Hüllenbestand '+e.budget.hullStock+', registrierte Frachter '+e.budget.registeredFreighters+', freie Mittel '+e.budget.freeAfterCommitments;}
  md+='| '+e.tick+' | '+e.kind+' | '+desc+' | '+cash+' |\n';
 }
}
fs.mkdirSync(path.join(dest,'data'),{recursive:true});fs.writeFileSync(path.join(dest,'data/b1-dauerbetrieb-v12.json'),JSON.stringify({status:'ANALYSE, Messdaten statt Goldenwerte',cases:compact})+'\n');fs.writeFileSync(path.join(dest,'B1_FRACHTER_LEBENSLAEUFE.md'),md);
console.log('DURATION_SUMMARY_PASS '+cases.length+' Fälle, 12 Variantenläufe, vollständige Kontroll-Lebensläufe');
