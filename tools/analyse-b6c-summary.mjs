// B6c – statische Momentaufnahme: Handelskapital, Waren, bezahlte Huelle.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const [input,output]=process.argv.slice(2);
assert(input&&output);
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const cases={miner:42,'handel-flotte':42,station:1234,jagd:98765};
const sum=a=>a.reduce((x,y)=>x+y,0);
const all=[...seeds.map(seed=>({scenario:'standard',seed,days:90})),
  ...Object.entries(cases).map(([scenario,seed])=>({scenario,seed,days:275}))];
const rows=all.map(x=>{
 const data=JSON.parse(fs.readFileSync(path.join(input,x.scenario+'-'+x.seed+'.json'),'utf8'));
 assert.equal(data.days,x.days);assert.equal(data.hours,x.days*24);assert.equal(data.version,14);
 assert.equal(data.scans.length,x.scenario==='standard'?4:6);
 assert.equal(data.scans[0].day,x.scenario==='standard'?0:90);
 assert.equal(data.scans.at(-1).day,x.scenario==='standard'?90:365);
 assert.equal(data.scans.at(-1).hash,data.final.hash);
 assert(data.roundtrips>=12);assert.equal(data.unpaid,data.due-data.paid);
 for(const scan of data.scans){
  assert.equal(sum(Object.values(scan.cashGroups)),sum(Object.values(scan.ownerCash)),
    'jede Kasse muss erfasst werden');
  assert.equal(scan.hullPurchase,scan.registry.npc1.hullPurchase);
  for(const id of ['npc1','npc2']){
   const a=scan.registry[id];
   assert.equal(a.cash,scan.ownerCash[id]);
   assert(a.missingFreighters>=0&&a.hullPurchase>0);
   if(a.bestOne){
    assert(a.bestOne.net>0&&a.bestOne.quantity>0);
    assert.equal(a.bestOne.net,a.bestOne.sell-a.bestOne.buy-a.bestOne.travelCost);
    assert.equal(a.bestOne.lack,Math.max(0,a.bestOne.upfront-a.cash));
   }
   if(a.bestTwo){
    assert(a.bestTwo.firstNet>0&&a.bestTwo.secondNet>0);
    assert.equal(a.bestTwo.lack,Math.max(0,a.bestTwo.requirement-a.cash));
   }
  }
 }
 if(x.scenario==='standard'){
  const fixture=JSON.parse(fs.readFileSync('tests/fixtures/economy-priority-v12.json','utf8'))
    .results.find(v=>v.seed===x.seed);
  assert.equal(data.final.shortage,fixture.totalShortage);
  assert.equal(data.traderSales,fixture.traderSales);
 }else{
  assert(data.initialLegacyHash);assert.equal(data.traderSales,0);
 }
 return {...x,roundtrips:data.roundtrips,paid:data.paid,due:data.due,
  unpaid:data.unpaid,traderSales:data.traderSales,shortage:data.final.shortage,
  initialHash:data.initialHash,scans:data.scans};
});
assert.equal(rows.length,17);
const pass=rows.filter(x=>x.scenario==='standard'),crisis=rows.filter(x=>x.scenario!=='standard');
assert.equal(sum(pass.map(x=>x.shortage)),791);
assert.equal(sum(pass.map(x=>x.traderSales)),310058);
assert.equal(sum(crisis.map(x=>x.unpaid)),4450);
const compact=scan=>({
 day:scan.day,hash:scan.hash,cashGroups:scan.cashGroups,
 hulls:scan.hullInYard,hullPurchase:scan.hullPurchase,
 aldera:scan.stationStatus.st_aldera,
 sources:Object.entries(scan.stationStatus).map(([id,s])=>({
  id,silicon:s.sellable.silizium,parts:s.sellable.bauteil,
  cash:s.cash,buySilicon:s.buyable.silizium,buyParts:s.buyable.bauteil
 })),
 owners:Object.fromEntries(['npc1','npc2'].map(id=>{
  const s=scan.registry[id];
  return [id,{cash:s.cash,planned:s.plannedFreighters,
   hulls:s.freighters,free:s.freeHullCount,missing:s.missingFreighters,
   subsidyPossible:s.subsidyPossible,viableHull:s.viableHull,
   marketEdges:s.sourceTargetPairs,positiveMargins:s.positiveMargins,
   afterWork:s.profitableOptions,canPay:s.affordableOptions,
   staticTwoLegOptions:s.staticTwoLegOptions,bestOne:s.bestOne,bestTwo:s.bestTwo}];
 }))
});
const summary={
 verdict:'ANALYSE – statische Untergrenzen, keine Produktregel',
 runs:17,days:sum(rows.map(x=>x.days)),hours:sum(rows.map(x=>x.days*24)),
 saves:sum(rows.map(x=>x.roundtrips)),
 control:{shortage:sum(pass.map(x=>x.shortage)),
 traderSales:sum(pass.map(x=>x.traderSales)),
 crisisUnpaid:sum(crisis.map(x=>x.unpaid))},
 passive:pass.map(x=>({
  seed:x.seed,checkpoints:x.scans.map(s=>({day:s.day,owners:Object.fromEntries(['npc1','npc2']
    .map(id=>[id,{cash:s.registry[id].cash,oneGap:s.registry[id].bestOne?.lack??null,
      twoGap:s.registry[id].bestTwo?.lack??null,actualHulls:s.registry[id].freighters}]))}))
 })),
 crises:crisis.map(x=>({scenario:x.scenario,seed:x.seed,initialHash:x.initialHash,
  checkpoints:x.scans.map(compact)}))
};
const fmt=n=>n==null?'–':n.toLocaleString('de-DE');
let md='# B6c – Wer kann die naechste reale Handelsfahrt finanzieren?\n\n';
md+='**[ANALYSE]** Originaler Regel-14-Kern ohne Produkt-Eingriff; statische Momentaufnahme, keine ausgefuehrte oder garantierte profitable Fahrt. Bei gleicher Rueckmeldung der Kern-Audits bestaetigen 13 Standardwelten und vier originale B1-Spielerkrisen Kontrollwerte.\n\n';
md+='**Tests:** 17 Laeufe, '+fmt(summary.days)+' Tageshashes, '+fmt(summary.hours)+' stündliche Geld-/Warenaudits, Replays und '+fmt(summary.saves)+' Save/Load-Roundtrips; '+fmt(summary.control.shortage)+' Mangelstunden und '+fmt(summary.control.traderSales)+' NPC-Trader-Verkaeufe im Standard; '+fmt(summary.control.crisisUnpaid)+' ISK ungedeckte NPC-Arbeit in den vier Krisen.\n\n';
md+='## Krisen – Anfang Tag 90 und Ende Tag 365\n\n';
md+='| Krise | Tag | Spieler | NPC1/NPC2 | Stationen/Fonds | Hüllen NPC1/NPC2 | Werftbestand | Hüllenkauf inkl. Gebühr | Kapitalfehlbetrag erste Fahrt NPC1/NPC2 | Kapitalfehlbetrag zweite Fahrt NPC1/NPC2 | Aldera Silizium/Bauteile |\n';
md+='| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |\n';
for(const row of summary.crises)for(const s of [row.checkpoints[0],row.checkpoints.at(-1)]){
 const a=s.owners.npc1,b=s.owners.npc2,ca=s.cashGroups;
 md+='| '+row.scenario+' | '+fmt(s.day)+' | '+fmt(ca.player)+' | '+fmt(a.cash)+'/'+fmt(b.cash)+
  ' | '+fmt(ca.stations)+'/'+fmt(ca.funds)+' | '+a.hulls+'/'+b.hulls+' | '+
  fmt(s.hulls)+' | '+fmt(s.hullPurchase)+' | '+fmt(a.bestOne?.lack)+'/'+fmt(b.bestOne?.lack)+
  ' | '+fmt(a.bestTwo?.lack)+'/'+fmt(b.bestTwo?.lack)+
  ' | '+fmt(s.aldera.inventory.silizium)+'/'+fmt(s.aldera.inventory.bauteil)+' |\n';
}
md+='\n**0 ISK** heisst nur, dass unter unveraenderten Marktpreisen eine hypothetische profitable Erstfahrt kapitalmaessig machbar erscheint. **–** heisst, dass keine geeignete Option bei aktueller verkaeuflicher Ware, Stationskaufkraft und Hullensituation gefunden wurde, nicht dass kein Geld helfen koennte. Die zweite Fahrt beruecksichtigt den modellierten Erlos nach der ersten, aber **keine** realisierten Markt- und Bestandsbewegungen.\n\n';
md+='## Krisen – bestes statisches Erstfahrtsangebot am Endtag\n\n';
md+='| Krise | NPC | Kasse | Frachter / fehlend | Profitable Menge/Routen | Hypothetische erste Fahrt | Kauf inkl. Gebühr | Arbeit | Fähre + Hülle | Nettomarge | Kapitaldefizit |\n';
md+='| --- | --- | ---: | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |\n';
for(const row of summary.crises){const s=row.checkpoints.at(-1);
 for(const [owner,a] of Object.entries(s.owners)){const t=a.bestOne;
 md+='| '+row.scenario+' | '+owner+' | '+fmt(a.cash)+' | '+a.hulls+'/'+a.missing+
  ' | '+fmt(a.afterWork)+' | '+(t?t.from+' → '+t.to+' / '+t.ware+' × '+t.quantity:'–')+
  ' | '+fmt(t?.buy)+' | '+fmt(t?.travelCost)+' | '+(t?fmt(t.ferry+t.fixed):'–')+
  ' | '+fmt(t?.net)+' | '+fmt(t?.lack)+' |\n';
}}
md+='\n## Auslegung und Grenzen\n\nVorbedingungen fuer jede Option: real existierender freier Frachter **oder** explizit gepruefter freier Sollplatz und Lagerbestand in der einzigen Werft, bezahlter Schiffskauf inklusive Gebuehr, kalkulierte Anfahrt, reale source-Reserve, aktuelle Zielstationskaufkraft und Platz. Positive Nettomarge zieht vollstaendige kalkulierte Reise-Arbeit ab. Ein Fonds-Zuschuss bei leerem NPC wird separat dokumentiert, niemals automatisch als freie Einnahme eingeplant. **Statische** Zweitfahrt rechnet mit Kontostand nach hypothetischem ersten Verkauf, nicht mit einem fortgeschriebenen Spielstand.\n\nDie Rechnung ist eine **Kapital-Untergrenze**, keine Freigabe: Kein Schutz vor Piraten, nicht alle konkurrierenden Zahlungen, kein Verkaufspreissprung nach Markttransaktionen, kein garantierter Käufer in Zukunft, kein automatischer Handelstart und keine eventuell spaeter produzierten Frachter; laufende bisherige Arbeitsminuten/Schiffe koennen mehr kosten. Bei Schiffen in Reisephase ist die Wartezeit nicht als neuer Kosteneingriff ausgefuehrt. Keine neuen Geldquellen, kein Eingriff in Spieler-Geld, kein Merge oder Deployment.\n';
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'b6c-finanzpfad.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(output,'B6C_FINANZPFAD.md'),md);
console.log('B6C_FINANZPFAD_PASS '+JSON.stringify({runs:summary.runs,days:summary.days,hours:summary.hours,saves:summary.saves,golden:summary.control}));
console.log(md);
