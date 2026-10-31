// B6a: 13 passive Seeds plus vier historische B1-Spielerfaelle zusammenfassen.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const [indir,outdir]=process.argv.slice(2);
assert(indir&&outdir);
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const scenarios={miner:42,'handel-flotte':42,station:1234,jagd:98765};
const read=name=>JSON.parse(fs.readFileSync(path.join(indir,name+'.json'),'utf8'));
const passive=seeds.map(s=>read('standard-'+s));
const active=Object.entries(scenarios).map(([k,s])=>read(k+'-'+s));
assert(passive.every((x,i)=>x.seed===seeds[i]&&x.scenario==='standard'&&x.days===90&&x.hours===2160));
assert(active.every((x,i)=>x.scenario===Object.keys(scenarios)[i]&&x.days===275&&x.hours===6600&&x.commands>0));
assert(new Set([...passive,...active].map(x=>x.sourceSha256)).size===1,'Kernversion weicht ab');
const sum=a=>a.reduce((p,x)=>p+x,0);
const total=(arr,field)=>sum(arr.map(x=>x[field]));
const mk=x=>({scenario:x.scenario,seed:x.seed,days:x.days,
  tradeSales:x.traderSales,closedGoodsLots:x.closeouts,followUpPurchases:x.followUpPurchases,
  due:x.due,paid:x.paid,unpaid:x.unpaid,
  npc1Cash:x.final.npc.npc1.cash,npc2Cash:x.final.npc.npc2.cash,
  npc3Cash:x.final.npc.npc3.cash,npc1Freighters:x.final.npc.npc1.freighters,
  npc2Freighters:x.final.npc.npc2.freighters,npc3Freighters:x.final.npc.npc3.freighters,
  shortage:x.final.shortage,recipes:x.final.recipes,
  siliconAldera:x.final.siliconAldera,partsAldera:x.final.partsAldera,
  originalFreighterAlive:x.originalFreighterAlive});
const rows=[...passive,...active].map(mk);
const result={status:'ANALYSE - read-only, kein Gegenregel-Test',
  sourceSha256:passive[0].sourceSha256,runs:rows.length,
  dailyHashes:total(passive,'days')+total(active,'days'),
  hourlyAuditAndReplay:total(passive,'hours')+total(active,'hours'),
  roundtrips:total([...passive,...active],'roundtrips'),
  passive:{runs:13,totalShortage:sum(passive.map(x=>x.final.shortage)),
    traderSales:total(passive,'traderSales'),npcDue:total(passive,'due'),
    npcPaid:total(passive,'paid'),npcUnpaid:total(passive,'unpaid'),
    fullLots:total(passive,'closeouts'),followUpBuys:total(passive,'followUpPurchases')},
  crisis:{runs:4,daysPerRun:275,traderSales:total(active,'traderSales'),
    npcDue:total(active,'due'),npcPaid:total(active,'paid'),
    npcUnpaid:total(active,'unpaid'),fullLots:total(active,'closeouts'),
    followUpBuys:total(active,'followUpPurchases'),
    firstFreighterSurvivors:active.filter(x=>x.originalFreighterAlive).length},
  rows};
assert.equal(result.passive.totalShortage,791,'historische v14-Mangelgoldenwerte');
assert.equal(result.passive.traderSales,310058,'historische v14-Frachtergoldenwerte');
const fmt=n=>Number(n).toLocaleString('de-DE');
let md='# B6a – Tatsächliche Handelszyklusfinanzierung (Regel 14)\n\n';
md+='**[ANALYSE]** Gepinnter v0.12.5-Produktkern. Nur Beobachter-Hooks; bit-identische Replays, unabhängige Geld-/Warenaudits und Save/Load. Keine Änderung an Spielcode, Save-Regeln, Wirtschaft oder Goldenwerten.\n\n';
md+='13 passive Seeds × 90 Tage sowie vier originale B1-Krisenstarts ab Tag 90 × 275 Tage. Insgesamt '+fmt(result.dailyHashes)+' Tageshashes, '+fmt(result.hourlyAuditAndReplay)+' stündliche Audit-/Replayzeitpunkte und '+fmt(result.roundtrips)+' Save/Load-Prüfungen.\n\n';
md+='| Gruppe | Frachter-Warenverkäufe | Kauf nach Verkauf derselben Schiff-ID | Soll-Arbeit (ISK) | Bezahlt (ISK) | Unterdeckung (ISK) |\n| --- | ---: | ---: | ---: | ---: | ---: |\n';
for(const [name,d] of [['13 × 90 Tage, passiv',result.passive],['4 × 275 Tage, Spieler-Krisen',result.crisis]])
 md+='| '+name+' | '+fmt(d.traderSales)+' | '+fmt(d.followUpBuys)+' | '+fmt(d.npcDue)+' | '+fmt(d.npcPaid)+' | '+fmt(d.npcUnpaid)+' |\n';
md+='\n**Grenzen:** Folgekäufe sind eine notwendige, aber keine hinreichende Bedingung für einen profitablen Gesamtzyklus. FIFO-Abschlusslose und reale Hüllen-/Warenkäufe sind in den JSON-Artefakten dokumentiert. Käuferliquidität, Kostenunterdeckung und verfügbare Werfthüllen müssen gemeinsam bewertet werden. Nicht getestete Gegenregeln bleiben [OPTION].\n\n';
md+='## Vier Krisenfälle\n\n| Fall | NPC1-/NPC2-Frachter Ende | NPC3-Frachter Ende | Arbeit ungedeckt (ISK) | Folgekäufe | Silizium/Bauteile Aldera | Ursprünglicher B1-Frachter überlebt |\n| --- | --- | ---: | ---: | ---: | --- | --- |\n';
for(const x of rows.filter(x=>x.scenario!=='standard'))
 md+='| '+x.scenario+' | '+x.npc1Freighters+'/'+x.npc2Freighters+' | '+x.npc3Freighters+' | '+fmt(x.unpaid)+' | '+fmt(x.followUpPurchases)+' | '+x.siliconAldera+'/'+x.partsAldera+' | '+(x.originalFreighterAlive?'ja':'nein')+' |\n';
md+='\n## Nächster Entscheidungstest\n\nIsoliert gegentesten: (A) Arbeit bei ungedeckten Kosten pausieren; (B) echte begrenzte Verbindlichkeiten; (C) finanzierte Insolvenz/Übernahme mit vorhandenen Hüllen, Waren und ausreichend Kapital für den Folgezyklus. Keine zusätzliche Geldquelle oder pauschale Spielerabgabe freigegeben.\n';
fs.mkdirSync(outdir,{recursive:true});
fs.writeFileSync(path.join(outdir,'b6a-gesamt.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(outdir,'B6A_AUSWERTUNG.md'),md);
console.log('B6_SUMMARY_PASS '+JSON.stringify({runs:17,dailyHashes:result.dailyHashes,hours:result.hourlyAuditAndReplay,
 passive:result.passive,crisis:result.crisis}));
console.log(md);
