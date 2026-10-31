// B6d-C0 – echte Nachlieferungszahlungen gegen unveraenderten Regel-14-Kern.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const [input,output]=process.argv.slice(2);assert(input&&output);
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const cases={miner:42,'handel-flotte':42,station:1234,jagd:98765};
const modes=['control','postpay'];
const sum=a=>a.reduce((s,x)=>s+x,0);
const groups={passive:seeds.map(seed=>({scenario:'standard',seed,days:90})),
 crisis:Object.entries(cases).map(([scenario,seed])=>({scenario,seed,days:275}))};
const fmt=x=>x.toLocaleString('de-DE');
const pairs={};
for(const [group,rows] of Object.entries(groups)){
 pairs[group]=rows.map(r=>{
  const id=r.scenario+'-'+r.seed;
  const [control,postpay]=modes.map(mode=>JSON.parse(fs.readFileSync(path.join(input,id+'-'+mode+'.json'),'utf8')));
  for(const [x,m] of [[control,'control'],[postpay,'postpay']]){
   assert.equal(x.mode,m);assert.equal(x.version,14);assert.equal(x.scenario,r.scenario);
   assert.equal(x.seed,r.seed);assert.equal(x.days,r.days);assert.equal(x.hours,r.days*24);
   assert.equal(x.daily.length,r.days);assert(x.roundtrips>=12);
   assert.equal(x.initialHash,control.initialHash);assert.equal(x.initialLegacyHash,control.initialLegacyHash);
   assert.equal(x.sourceSha256,control.sourceSha256);
   assert(x.service.eligible<=x.service.delivered);
   assert(x.unpaid>=0);assert(x.service.paid>=0);
  }
  assert.equal(control.service.paid,0);
  assert.equal(control.traderSales,control.service.delivered);
  assert.equal(postpay.traderSales,postpay.service.delivered);
  assert.equal(control.commands,postpay.commands);
  return {id,control,postpay};
 });
}
const measure=(x)=>({
 shortage:x.final.shortage,recipes:x.final.recipes,traderSales:x.traderSales,
 followUpPurchases:x.followUpPurchases,due:x.due,paidWork:x.paid,unpaid:x.unpaid,
 freightFeePaid:x.service.paid,freightDeliveries:x.service.delivered,
 failuresToPayFee:x.service.unpaid,
 cashNpc1:x.final.npc.npc1.cash,cashNpc2:x.final.npc.npc2.cash,
 freightNpc1:x.final.npc.npc1.freighters,freightNpc2:x.final.npc.npc2.freighters,
 silicon:x.final.siliconAldera,parts:x.final.partsAldera,
 hulls:x.hulls.length,losses:x.losses.length,
 firstFreighterAlive:x.originalFreighterAlive,hash:x.final.hash
});
const details=Object.fromEntries(Object.entries(pairs).map(([group,rows])=>[
 group,rows.map(r=>({id:r.id,control:measure(r.control),postpay:measure(r.postpay)}))
]));
const keys=['shortage','recipes','traderSales','followUpPurchases','due','paidWork','unpaid',
 'freightFeePaid','freightDeliveries','failuresToPayFee','freightNpc1','freightNpc2','silicon','parts','hulls','losses'];
const aggregate=Object.fromEntries(Object.entries(details).map(([group,rows])=>[
 group,Object.fromEntries(modes.map(mode=>[mode,Object.fromEntries(keys.map(k=>[
 k,sum(rows.map(r=>r[mode][k]))
 ]))]))
]));
assert.equal(aggregate.passive.control.shortage,791);
assert.equal(aggregate.passive.control.traderSales,310058);
assert.equal(aggregate.passive.control.unpaid,16090);
assert.equal(aggregate.crisis.control.unpaid,4450);
assert.equal(aggregate.crisis.control.traderSales,0);
assert.equal(aggregate.passive.control.freightFeePaid,0);
assert.equal(aggregate.crisis.control.freightFeePaid,0);
const all=Object.values(pairs).flat().flatMap(p=>modes.map(m=>p[m]));
const report={status:'[ANALYSE/DRAFT] nicht integrierte C0-Variante',
 runs:all.length,days:sum(all.map(x=>x.days)),hours:sum(all.map(x=>x.hours)),
 roundtrips:sum(all.map(x=>x.roundtrips)),aggregate,details};
assert.equal(report.runs,34);assert.equal(report.days,4540);assert.equal(report.hours,108960);
let md='# B6d-C0 – Stationshonorar ausschliesslich nach echter Frachterlieferung\n\n';
md+='[ANALYSE] Keine Vorfinanzierung. Nach realem NPC1/2-Frachterverkauf zahlt die neutrale Station bis zu 10 % des gekauften Warenwerts als separates Transporthonorar, nur aus der realen Kasse oberhalb 500 ISK. Der Kern bucht beide Stats und das Geld. Keine neuen Schiffe oder Spielerabgaben. Kuenftige Stationskaufkraft kann leiden.\n\n';
md+='34 Simulationen, '+fmt(report.days)+' Tageshashes, '+fmt(report.hours)+' Stunden-Audits und identische Replays, '+fmt(report.roundtrips)+' Save/Load-Roundtrips.\n\n';
md+='| Gruppe | Modus | Mangelstunden | Rezepte | NPC-Frachterverkäufe | Transporthonorar ISK | Kostenunterdeckung ISK | NPC1/2 Frachter am Ende | Aldera Silizium/Bauteile |\n';
md+='| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |\n';
for(const group of ['passive','crisis'])for(const m of modes){
 const x=aggregate[group][m];md+='| '+(group==='passive'?'13 × 90':'4 × 275')+' | '+m+
 ' | '+fmt(x.shortage)+' | '+fmt(x.recipes)+' | '+fmt(x.traderSales)+' | '+fmt(x.freightFeePaid)+
 ' | '+fmt(x.unpaid)+' | '+fmt(x.freightNpc1+x.freightNpc2)+
 ' | '+fmt(x.silicon)+' / '+fmt(x.parts)+' |\n';
}
md+='\n## Krisen (Tag 365)\n\n';
md+='| Fall | Kontrolle NPC1/NPC2 Frachter | C0 NPC1/NPC2 Frachter | Trader-Lieferungen Kontrolle / C0 | Honorar C0 | Aldera Silizium/Bauteile Kontrolle / C0 |\n';
md+='| --- | --- | --- | --- | ---: | --- |\n';
for(const r of details.crisis){
 const a=r.control,b=r.postpay;
 md+='| '+r.id+' | '+a.freightNpc1+'/'+a.freightNpc2+' | '+b.freightNpc1+'/'+b.freightNpc2+
 ' | '+a.traderSales+'/'+b.traderSales+' | '+fmt(b.freightFeePaid)+
 ' | '+a.silicon+'/'+a.parts+' ↔ '+b.silicon+'/'+b.parts+' |\n';
}
md+='\n## Kausalgrenze\n\n';
md+='Die Verguetung ist erst nach realer Frachtuebergabe faellig und wird bewusst nicht vorfinanziert. Sie kann weder eine fehlende Huelle noch den allerersten Einkauf bezahlen. Positive Messwirkungen beziehen sich nur auf Transaktionen, die tatsaechlich stattfinden. Der feste 10-Prozent-Tarif und die 500-ISK-Untergrenze sind Testparameter, keine bewiesenen optimalen Werte und keine Produktfreigabe. Kein Merge oder Deployment.\n';
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'b6d-c0-summary.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(output,'B6D_C0_AUSWERTUNG.md'),md);
console.log('B6D_C0_SUMMARY_PASS '+JSON.stringify({runs:report.runs,days:report.days,hours:report.hours,roundtrips:report.roundtrips,aggregate}));
console.log(md);
