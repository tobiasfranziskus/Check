// B6b-P1: zwei isolierte Varianten auf denselben 17 Startfaellen vergleichen.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const [input,output]=process.argv.slice(2);
assert(input&&output,'B6b summary input output');
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const cases={miner:42,'handel-flotte':42,station:1234,jagd:98765};
const sum=a=>a.reduce((x,y)=>x+y,0);
const read=(base,mode)=>JSON.parse(fs.readFileSync(path.join(input,base+'-'+mode+'.json'),'utf8'));
const key=(s,seed)=>s+'-'+seed;
const groups={
 passive:seeds.map(s=>({id:key('standard',s),seed:s,scenario:'standard',days:90})),
 crisis:Object.entries(cases).map(([s,seed])=>({id:key(s,seed),seed,scenario:s,days:275}))
};
const owners=['npc1','npc2','npc3'], modes=['control','p1'];
const pairs=Object.fromEntries(Object.entries(groups).map(([group,tests])=>[group,tests.map(t=>{
 const [control,p1]=modes.map(mode=>read(t.id,mode));
 for(const [x,mode] of [[control,'control'],[p1,'p1']]){
  assert.equal(x.mode,mode);assert.equal(x.seed,t.seed);assert.equal(x.scenario,t.scenario);
  assert.equal(x.days,t.days);assert.equal(x.hours,t.days*24);assert.equal(x.daily.length,t.days);
  assert(x.roundtrips>=12);assert.equal(x.commands,control.commands);
  assert.equal(x.sourceSha256,control.sourceSha256);
  assert.equal(x.initialLegacyHash,control.initialLegacyHash);
  assert.equal(x.initialHash,control.initialHash);
  assert(x.unpaid>=0);
 }
 assert.equal(control.sourceSha256,control.variantSha256,'Kontrolle muss byte-identischer Produktkern sein');
 assert.notEqual(p1.sourceSha256,p1.variantSha256,'P1 muss isoliert veraenderte Regel enthalten');
 if(t.scenario!=='standard')assert.equal(p1.initialLegacyHash,control.initialLegacyHash);
 const compress=x=>({
  shortage:x.final.shortage,recipes:x.final.recipes,tradeSales:x.traderSales,
  followUps:x.followUpPurchases,unpaid:x.unpaid,due:x.due,paid:x.paid,
  cash:Object.fromEntries(owners.map(o=>[o,x.final.npc[o].cash])),
  freighters:Object.fromEntries(owners.map(o=>[o,x.final.npc[o].freighters])),
  miners:Object.fromEntries(owners.map(o=>[o,x.final.npc[o].miners])),
  silicon:x.final.siliconAldera,parts:x.final.partsAldera,
  boughtHulls:x.hulls.length,losses:x.losses.length,pauses:x.pauses,
  firstFreighterAlive:x.originalFreighterAlive,endHash:x.final.hash
 });
 return {id:t.id,scenario:t.scenario,seed:t.seed,control:compress(control),p1:compress(p1)};
})]));
const sumK=(rows,mode,key)=>sum(rows.map(r=>r[mode][key]));
const aggregate=Object.fromEntries(Object.entries(pairs).map(([group,rows])=>[group,
 Object.fromEntries(modes.map(mode=>[mode,{
  shortage:sumK(rows,mode,'shortage'),
  recipes:sumK(rows,mode,'recipes'),traderSales:sumK(rows,mode,'tradeSales'),
  followUps:sumK(rows,mode,'followUps'),due:sumK(rows,mode,'due'),
  paid:sumK(rows,mode,'paid'),unpaid:sumK(rows,mode,'unpaid'),
  pauses:{frachter:sum(rows.map(r=>r[mode].pauses.frachter)),
          miner:sum(rows.map(r=>r[mode].pauses.miner))},
  firstFreighterSurvivors:rows.filter(r=>r[mode].firstFreighterAlive).length,
  allTraderFreightersAtEnd:sum(rows.map(r=>r[mode].freighters.npc1+r[mode].freighters.npc2)),
  aldSiliconAtEnd:sumK(rows,mode,'silicon'),aldPartsAtEnd:sumK(rows,mode,'parts'),
  losses:sumK(rows,mode,'losses'),boughtHulls:sumK(rows,mode,'boughtHulls')
 }]))]));
assert.equal(aggregate.passive.control.shortage,791);
assert.equal(aggregate.passive.control.traderSales,310058);
assert.equal(aggregate.crisis.control.traderSales,0);
assert.equal(aggregate.crisis.control.unpaid,4450);
assert.equal(aggregate.passive.control.unpaid,16090);
assert.equal(aggregate.crisis.control.firstFreighterSurvivors,0);
assert.deepEqual(aggregate.passive.control.pauses,{frachter:0,miner:0});
const totalDays=2*(seeds.length*90+4*275);
const totalHours=totalDays*24;
const all=[...groups.passive,...groups.crisis].flatMap(x=>modes.map(mode=>read(x.id,mode)));
const saves=sum(all.map(x=>x.roundtrips));
const result={status:'ANALYSE – P1 keine Produktregel',sourceSha256:all[0].sourceSha256,
 modes,runs:34,days:totalDays,hourlyHashesAndAudits:totalHours,saveLoadRounds:saves,
 aggregate,pairs};
const fmt=n=>n.toLocaleString('de-DE');
let md='# B6b-P1 – Kostenreserve vor neuer NPC-Arbeit\n\n';
md+='**[ANALYSE]** Identische Anfangszustände und Spielerbefehle, isolierter Kontroll-/P1-Kern mit unabhängig auditierten Geldern/Waren. Kein Produktmerge oder Spielstandsversionswechsel.\n\n';
md+='34 Läufe, '+fmt(totalDays)+' Tageshashes, '+fmt(totalHours)+' stündliche Audits/Replay-Hashes, '+fmt(saves)+' Save/Load-Roundtrips.\n\n';
md+='| Gruppe | Modus | Fehlstunden | Rezepte | Trader-Verkäufe | Ungedeckte NPC-Arbeit ISK | Verhinderte Starts / Miner-Arbeitsminuten | NPC1/2-Frachter Ende | Silizium / Bauteile Aldera Ende (summiert) |\n';
md+='| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |\n';
for(const group of ['passive','crisis'])for(const mode of modes){
 const d=aggregate[group][mode];
 md+='| '+(group==='passive'?'13 × 90':'4 × 275')+' | '+mode+' | '+fmt(d.shortage)+' | '+fmt(d.recipes)+' | '+fmt(d.traderSales)+' | '+fmt(d.unpaid)+' | '+fmt(d.pauses.frachter)+' / '+fmt(d.pauses.miner)+' | '+fmt(d.allTraderFreightersAtEnd)+' | '+fmt(d.aldSiliconAtEnd)+' / '+fmt(d.aldPartsAtEnd)+' |\n';
}
md+='\n## Krisenfälle\n\n| Spielerfall | Modus | NPC1/2/3-Frachter | Aldera Silizium/Bauteile | Unterdeckung ISK | Erste Frachterhülle lebt | Endhash |\n| --- | --- | --- | --- | ---: | --- | --- |\n';
for(const row of pairs.crisis)for(const mode of modes){
 const v=row[mode];md+='| '+row.scenario+' | '+mode+' | '+owners.map(id=>v.freighters[id]).join('/')+' | '+v.silicon+'/'+v.parts+' | '+fmt(v.unpaid)+' | '+(v.firstFreighterAlive?'ja':'nein')+' | '+v.endHash+' |\n';
}
md+='\n## Urteil und Reichweite\n\nP1 verlangt nur vor einem NPC-Frachterabflug die **berechenbare vollständige Fahrzeitarbeit plus aktuell geplanten Ladungskauf samt Kaufgebühr**. Ein NPC-Miner beginnt unter 150 ISK Kassenstand keine neue Förderminute. Tatsächlich ausgeführte Arbeit bleibt im bestehenden Kern bezahlt bzw. bei mangelnder Kasse wie zuvor teilweise unterdeckt; Geld wird weder reserviert noch geschöpft und es entstehen keine kostenlosen Flugminuten. Kostenkonkurrenz innerhalb derselben Kasse während des Flugs, zufällige künftige Käuferausfälle, Piraterie und Hüllenersatz werden **nicht** durch P1 abgesichert. Negative/positive Kennzahlen dürfen daher nicht als Beweis vollständiger Lohn- oder Zyklusdeckung gelten.\n\n';
md+='**Nächste Entscheidung:** Nur bei besseren Krisen- und Standardweltkennzahlen eine strikter gebundene Reservierung als separaten produktionsnahen Prototyp untersuchen. Bei stagnierendem Wiederanlauf die Option P1 nicht integrieren und zuerst Kapital-/Warenverfügbarkeit für eine vollständig bezahlte Erstfahrt prüfen.\n';
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'b6b-p1-gesamt.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(output,'B6B_P1_AUSWERTUNG.md'),md);
console.log('B6B_P1_SUMMARY_PASS '+JSON.stringify({runs:34,totalDays,totalHours,saves,aggregate}));
console.log(md);
