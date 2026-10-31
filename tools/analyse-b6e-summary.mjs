// B6e-P0 – unabhängige Regression und Kreditvergabe im realen Produktkern.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const [input,output]=process.argv.slice(2);assert(input&&output);
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const cases={miner:42,'handel-flotte':42,station:1234,jagd:98765};
const modes=['control','credit'],sum=a=>a.reduce((x,y)=>x+y,0);
const read=(id,mode)=>JSON.parse(fs.readFileSync(path.join(input,id+'-'+mode+'.json'),'utf8'));
const groups={standard:seeds.map(seed=>({id:'standard-'+seed,seed,scenario:'standard',days:90})),
crisis:Object.entries(cases).map(([scenario,seed])=>({id:scenario+'-'+seed,seed,scenario,days:275}))};
const keys=['shortage','recipes','traderSales','followUps','unpaid','due','paid','freighters','silicon','parts','hulls','losses',
  'loans','lent','repaid','unfunded','noHull','deliveryContracts','principalOutstanding','principalDefaultRisk'];
const rows=Object.fromEntries(Object.entries(groups).map(([k,tests])=>[k,tests.map(t=>{
const [control,credit]=modes.map(mode=>read(t.id,mode));
for(const [x,m] of [[control,'control'],[credit,'credit']]){
 assert.equal(x.mode,m);assert.equal(x.version,14);assert.equal(x.seed,t.seed);
 assert.equal(x.scenario,t.scenario);assert.equal(x.days,t.days);assert.equal(x.hours,t.days*24);
 assert.equal(x.daily.length,t.days);assert(x.roundtrips>=12);assert.equal(x.commands,control.commands);
 assert.equal(x.sourceSha256,control.sourceSha256);assert.equal(x.initialLegacyHash,control.initialLegacyHash);
 assert.equal(x.initialHash,control.initialHash);assert(x.unpaid>=0);
 assert(x.credit.loans>=0&&x.credit.lent>=x.credit.repaid);
 assert.equal(x.credit.lent-x.credit.repaid,sum(Object.values(x.contracts).map(c=>c.outstanding)));
 assert.equal(x.credit.loans,Object.keys(x.contracts).length);
 for(const [borrower,c] of Object.entries(x.contracts)){
  assert(['npc1','npc2'].includes(borrower));assert(c.lender.startsWith('st_'));
  assert.equal(c.principal,c.repaid+c.outstanding);
  assert(c.firstDelivery===null||c.firstDelivery>=c.issued);
  assert(c.delivered>0||c.repaid===0);
 }
}
assert.equal(control.credit.loans,0);assert.deepEqual(control.contracts,{});
assert.equal(control.variantSha256,control.sourceSha256,'kontrolle muss main-Quelle behalten');
assert.notEqual(credit.variantSha256,control.sourceSha256,'Experiment muss isoliert modifiziert sein');
const compact=x=>{
 const cs=Object.values(x.contracts);
 return {
 shortage:x.final.shortage,recipes:x.final.recipes,traderSales:x.traderSales,
 followUps:x.followUpPurchases,unpaid:x.unpaid,due:x.due,paid:x.paid,
 freighters:x.final.npc.npc1.freighters+x.final.npc.npc2.freighters,
 npcCash:{npc1:x.final.npc.npc1.cash,npc2:x.final.npc.npc2.cash},
 silicon:x.final.siliconAldera,parts:x.final.partsAldera,
 hulls:x.hulls.length,losses:x.losses.length,
 loans:x.credit.loans,lent:x.credit.lent,repaid:x.credit.repaid,
 unfunded:x.credit.unfunded,noHull:x.credit.noHull,
 deliveryContracts:cs.filter(c=>c.delivered>0).length,
 principalOutstanding:sum(cs.map(c=>c.outstanding)),
 principalDefaultRisk:sum(cs.filter(c=>c.delivered===0).map(c=>c.outstanding)),
 originalFreighterAlive:x.originalFreighterAlive,
 contracts:x.contracts,hash:x.final.hash
 };
};
return {scenario:t.scenario,seed:t.seed,control:compact(control),credit:compact(credit)};
})]));
const aggregate=Object.fromEntries(Object.entries(rows).map(([k,values])=>[k,Object.fromEntries(modes.map(mode=>[
 mode,Object.fromEntries(keys.map(key=>[key,sum(values.map(v=>v[mode][key]))]))
]))]));
assert.equal(aggregate.standard.control.shortage,791);
assert.equal(aggregate.standard.control.traderSales,310058);
assert.equal(aggregate.standard.control.unpaid,16090);
assert.equal(aggregate.crisis.control.traderSales,0);
assert.equal(aggregate.crisis.control.unpaid,4450);
const all=Object.values(groups).flat().flatMap(t=>modes.map(mode=>read(t.id,mode)));
const report={mode:'B6e-P0 [ANALYSE/DRAFT] nur ein zweckgebundener Kredit je Trader',
runs:all.length,days:sum(all.map(x=>x.days)),hours:sum(all.map(x=>x.hours)),
roundtrips:sum(all.map(x=>x.roundtrips)),aggregate,rows};
assert.equal(report.runs,34);assert.equal(report.days,4540);assert.equal(report.hours,108960);
const fmt=x=>x.toLocaleString('de-DE');
let md='# B6e-P0 – Einzelstation finanziert reale erste Frachterhülle mit Rückzahlungsverpflichtung\n\n';
md+='**[ANALYSE]** Die experimentelle Kreditregel gilt nur für vollständig schiffslose NPC1/2 mit weiterhin vorgesehener Frachter-Sollflotte und tatsächlich fertiger Hülle in Aldera. Eine einzige noch neutrale Station zahlt aus ihrer vorhandenen Kasse, **mindestens 2.500 ISK verbleiben**. Darlehen: tatsächlicher Hüllenkauf inkl. Marktgebühr plus 600 ISK Startbudget, abzüglich noch eigener NPC-Kasse. Maximal **ein Vertrag je NPC**. Vollständig bezahlte Hülle entsteht nur durch den unveränderten regulären Werfthandel. Das Darlehen ist eine echte Forderung, nicht Ertrag, und wird nach tatsächlichen Lieferungen anteilig aus verfügbaren Mitteln getilgt, bei mindestens 750 ISK Restkasse. Keine Zuschüsse, neuen Schiffe oder neuen ISK, keine Spielersteuer und keine weiteren NPC-Gehälter.\n\n';
md+='**Analyse-Only Save-Warnung:** Das zusätzliche Testfeld b6eContracts speichert Forderung, Schuldner, Gläubiger, Tilgung und Lieferung auf dem Versuchszustand. Die bestehende v14-Serialisierung kann es als JSON roundtripen, dies ist **keine genehmigte Produktmigration**. Ein produktiver Kredit erfordert eine explizite neue Regelversion und Validierung alter/neuer Saves. Ungezahlte Kredite sind keine Vernichtung von ISK, aber ein möglicher realer Vermögensverlust der Station.\n\n';
md+='34 vollständige Simulationen, '+fmt(report.days)+' Tageshashes, '+fmt(report.hours)+' stündliche unabhängige Audits/Replays, '+fmt(report.roundtrips)+' Save/Load-Roundtrips.\n\n';
md+='| Welt | Modus | Mangelstunden | Rezepte | Traderverkäufe | Ungedeckte Arbeit ISK | Ausgereichte Kredite / ISK | Getilgt ISK | Ohne erste Lieferung ausstehend ISK | NPC1/2 Frachter Ende | Aldera Silizium / Bauteile Ende |\n';
md+='| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- |\n';
for(const group of ['standard','crisis'])for(const m of modes){let x=aggregate[group][m];md+='| '+(group==='standard'?'13 ×90':'4 ×275')+' | '+m+' | '+fmt(x.shortage)+' | '+fmt(x.recipes)+' | '+fmt(x.traderSales)+' | '+fmt(x.unpaid)+' | '+fmt(x.loans)+' / '+fmt(x.lent)+' | '+fmt(x.repaid)+' | '+fmt(x.principalDefaultRisk)+' | '+fmt(x.freighters)+' | '+fmt(x.silicon)+' / '+fmt(x.parts)+' |\n';}
md+='\n## Vier aktive historische Spielerkrisen (Tag 365)\n\n';
md+='| Fall | Variante | NPC-Traderverkäufe | Verfügbare NPC1/2 Frachter | Ausgeliehene ISK | Getilgt ISK | Nicht rückgezahlt ISK | Aldera Silizium/Bauteile | Überlebender ursprünglicher Spielerfrachter? |\n';
md+='| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |\n';
for(const row of rows.crisis)for(const m of modes){const x=row[m];md+='| '+row.scenario+' | '+m+' | '+fmt(x.traderSales)+' | '+fmt(x.freighters)+' | '+fmt(x.lent)+' | '+fmt(x.repaid)+' | '+fmt(x.principalOutstanding)+' | '+fmt(x.silicon)+' / '+fmt(x.parts)+' | '+(x.originalFreighterAlive?'ja':'nein')+' |\n';}
md+='\n## Entscheidungsschranken\n\nErfolgreiche Darlehensauszahlung ist nur der Anfang: Was zählt, sind tatsächlich gekaufte Hüllen, echte Warentransfers, aus eigenen Erlösen zahlbare Arbeit und zweite Lieferungen, Tilgung sowie dauerhaft finanzierbare Stationsversorgung. Falls kein einzelner neutraler Gläubiger 2.500 ISK Reserve plus Einstand bereitstellen kann, sind aggregierte Stationskassen kein Ersatz. Ein Kredit ohne Tilgung ist kein nachhaltiger Ertrag. Die exakte Hüllenverfügbarkeit und Marktgebühren sind aus dem bestehenden Core entnommen. Kein Merge oder Deployment.\n';
fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'b6e-p0-gesamt.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(output,'B6E_P0_AUSWERTUNG.md'),md);
console.log('B6E_P0_SUMMARY_PASS '+JSON.stringify({runs:report.runs,days:report.days,hours:report.hours,roundtrips:report.roundtrips,aggregate}));
console.log(md);
