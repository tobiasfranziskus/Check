// B-Analyse: Nur CI-Ergebnisse aus unabhängigen, vollständigen Einzeljobs verdichten.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {BASE,MODES,SEEDS} from './analyse-r3-liquiditaet-common.mjs';

const indir=process.argv[2]||'/tmp/r3-cases',outdir=process.argv[3]||'/tmp/r3-summary';
const cases=[];
for(const seed of SEEDS)cases.push({filename:'standard-'+seed+'.json',type:'standard',seed});
for(const type of ['player-miner','player-auto'])for(const seed of [1,2,3,4])cases.push({filename:type+'-'+seed+'.json',type,seed});
for(const [scenario,seed] of [['miner',42],['handel-flotte',42],['station',1234],['jagd',98765]])
 cases.push({filename:'b1-'+scenario+'-'+seed+'.json',type:'b1',seed,scenario});
assert.equal(cases.length,25);
const rows=[],sum=a=>a.reduce((x,y)=>x+y,0);
for(const cfg of cases){
 const d=JSON.parse(fs.readFileSync(path.join(indir,cfg.filename),'utf8'));
 assert.equal(d.base,BASE);assert.equal(d.rule,14);assert.equal(d.type,cfg.type);assert.equal(d.seed,cfg.seed);
 assert.deepEqual(d.results.map(x=>x.mode),MODES);
 assert.equal(d.initialHash,d.results[0].initialHash);
 assert.equal(d.results[0].initialHash,d.results[1].initialHash);
 for(const r of d.results){
  assert.equal(r.days,cfg.type==='b1'?275:90);
  assert.equal(r.daily.length,r.days);assert.equal(r.hours,r.days*24);
  assert.equal(r.roundtrips,cfg.type==='b1'?14:12);
  assert.equal(r.points.at(-1).relativeDay,r.days);
  for(const [owner,due] of Object.entries(r.extra.due))
   assert(due>=r.extra.paid[owner],'Kosten fällig >= bezahlt');
 }
 rows.push(d);
}
const total=(r,fn)=>sum(r.map(fn));
const median=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)];
const q=x=>Number.isFinite(x)?Number(x.toFixed(3)):null;
const summary={base:BASE,rule:14,cases:25,runs:50,dayHashes:5980,hourlyAuditReplayPoints:143520,
 saveLoadRoundtrips:616,groups:{}};
for(const type of ['standard','player-miner','player-auto','b1']){
 summary.groups[type]={};
 for(const mode of MODES){
  const r=rows.filter(x=>x.type===type).map(x=>({seed:x.seed,scenario:x.b1Case,
   ...x.results.find(y=>y.mode===mode)}));
  const end=r.map(x=>x.points.at(-1)),d60=r.map(x=>x.points.find(p=>p.relativeDay===60));
  const compact={
   count:r.length,mode,shortage:total(end,x=>x.shortage),recipes:total(end,x=>x.recipes),
   houseMedian:median(end.map(x=>x.cash.house)),houseMedian60:median(d60.map(x=>x.cash.house)),
   npcCash:total(end,x=>(x.cash.npc1||0)+(x.cash.npc2||0)+(x.cash.npc3||0)),
   stationCash:total(end,x=>x.cashByKind.station||0),fundCash:total(end,x=>x.cashByKind.fund||0),
   zeroStationCases:end.filter(x=>x.zeroStations.length>0).length,
   rawNearCapMean:q(total(r,x=>x.extra.rawNearCapRatio)/r.length),
   fullCargoMinerMean:q(total(r,x=>x.extra.fullMinerHoursRatio)/r.length),
   alderaErzFactorMean:q(total(r,x=>x.extra.alderaErzFactor)/r.length),
   npc3Unpaid:total(r,x=>x.extra.unpaid.npc3||0),
   npcTraderSales:total(r,x=>(x.extra.trade.npc1?.byClass.frachter?.sells||0)+(x.extra.trade.npc2?.byClass.frachter?.sells||0)),
   npc3FreighterSales:total(r,x=>x.extra.trade.npc3?.byClass.frachter?.sells||0),
   completedBuySellPairs:total(r,x=>x.extra.cycles.completed),
   repeatBuysAfterSale:total(r,x=>x.extra.cycles.repeatBuys),
   alderaSiliconEnd:end.map(x=>x.aldera.silizium),alderaPartsEnd:end.map(x=>x.aldera.bauteil),
   perCase:r.map((x,i)=>({seed:x.seed,scenario:x.scenario,house:end[i].cash.house,
    recipes:end[i].recipes,shortage:end[i].shortage,npc3Unpaid:x.extra.unpaid.npc3||0,
    npcTraderSales:(x.extra.trade.npc1?.byClass.frachter?.sells||0)+(x.extra.trade.npc2?.byClass.frachter?.sells||0),
    pairs:x.extra.cycles.completed,followups:x.extra.cycles.repeatBuys,
    aldera:end[i].aldera,endHash:x.daily.at(-1).hash}))};
  summary.groups[type][mode]=compact;
 }
}
const fmt=n=>typeof n==='number'?n.toLocaleString('de-DE',{maximumFractionDigits:3}):String(n);
let md='# R3-Förderziel und NPC-Liquidität – reproduzierbare Analyse Regel 14\n\n';
md+='[ANALYSE / ausgeführte CI] Produktbasis '+BASE+', Spiel v0.12.5, Regel 14 / Schema 8. Kontrolle hat unveränderten Kern; R3 begrenzt ausschließlich die Abgabe voller Miner-Ladungen auf die freie Menge bis zum Zielbestand. **Keine Änderung an index.html** oder Spielregel und **keine pauschale Spielerabgabe**.\n\n';
md+='Messumfang: 13 Seeds ohne Spieler ×90 Tage, 4 Seed-Fälle nur Spieler-Miner ×90 Tage, 4 Seeds Spieler-Miner plus Auto-Frachter ×90 Tage, vier bekannte B1-Krisenfälle ×275 Tage ab Tag 90. Je zwei Varianten: **50 Läufe, 5.980 Tageshashes, 143.520 stündliche Audit- und Replayzeitpunkte, 616 Save/Load-Roundtrips**.\n\n';
md+='| Fall (Anzahl Seeds) | Variante | Mangel gesamt | Rezepte gesamt | Spieler-Kasse Median | NPC3-Arbeit ungedeckt | NPC-Frachter-Warenverkäufe | Rohstoffbestände nahe Obergrenze | Erzpreisfaktor Aldera |\n';
md+='| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n';
for(const type of Object.keys(summary.groups))for(const mode of MODES){
 const a=summary.groups[type][mode];
 md+='| '+type+' ('+a.count+') | '+mode+' | '+fmt(a.shortage)+' | '+fmt(a.recipes)+' | '+fmt(a.houseMedian)+' | '+fmt(a.npc3Unpaid)+' | '+fmt(a.npcTraderSales)+' | '+fmt(a.rawNearCapMean)+' | '+fmt(a.alderaErzFactorMean)+' |\n';
}
md+='\nDie Rohstoffstauquote zählt alle Markt/Rohstoff/Stunden-Paare mit Lagerbestand von mindestens 95 % der tatsächlichen Obergrenze und ist nicht als identische Definition zu Claudes Quote belegt. Wareverkäufe sind **keine Schiffsverkäufe**. Die erfasste tatsächliche Kauf-Verkauf-Folge derselben Schiff-ID ist **kein** vollständiger Profit- oder Kostendeckungsbeweis. Zusätzliche NPC-/Stations-/Fonds-Kassen und fällige gegenüber bezahlten Schiffskosten stehen in den JSON-Rohbelegen.\n\n';
md+='### Krisenfälle bis Spieltag 365\n\n';
md+='| Fall | Regel | Ungedeckte NPC3-Kosten | Silizium / Bauteile Aldera | Nach tatsächlichem Verkauf erfolgte weitere Einkäufe aller Schiffe |\n';
md+='| --- | --- | ---: | ---: | ---: |\n';
for(const mode of MODES)for(const x of summary.groups.b1[mode].perCase)
 md+='| '+x.scenario+' | '+mode+' | '+fmt(x.npc3Unpaid)+' ISK | '+x.aldera.silizium+' / '+x.aldera.bauteil+' | '+x.followups+' |\n';
md+='\n**Bewertungsgrenze:** Die R3-Hypothese ist nur wirtschaftlich interessant, wenn die gesamte Versorgung, Spieler-Sparfreiheit, real bezahlte Waren-/Folgekäufe, Liquidität und Kostenunterdeckung zusammen besser werden. Eine bessere Lagerquote allein rechtfertigt keinen Merge. Noch keine Geld-/Insolvenz-/Piratenregel beschlossen.\n';
fs.mkdirSync(outdir,{recursive:true});
fs.writeFileSync(path.join(outdir,'R3_BEFUNDE.md'),md);
fs.writeFileSync(path.join(outdir,'r3-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log('R3_SUMMARY_PASS '+JSON.stringify({cases:25,runs:50,hashes:5980,audit:143520,saveLoad:616}));
console.log(md);
