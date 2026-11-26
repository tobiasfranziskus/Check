'use strict';
// Independent verification of the published #651 local investment reports.
// Run the original research driver, not a second simulation implementation.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {investitionsprobe}=require('./w6-geldumlauf-investition.cjs');
const arm=process.argv[2];
const expected={
 kontrolle:{hashes:['a760a95c654e1c3a','9ce544c9e7005230','1334c2d8d310cdce','77aae111ae5163df','182e7175c374dfcb'],f4:1100,w3:22,wasser:54870,haus:19146,aldera:1100,alderaWasser:0},
 frachter:{hashes:['ad3aa8b6d2bada6f','ab64707120d4ce7f','57d6c9d575968967','0ffc3b51e897f35c','68a1bcebef3a62b9'],f4:1119,w3:22,wasser:55820,haus:19626,aldera:644,alderaWasser:73},
 miner:{hashes:['4f1f8adcd3620403','552aaaab70237068','b329c8194abe4081','fb65d8e8453af203','3e0622c8bef7d210'],f4:1118,w3:22,wasser:55780,haus:19707,aldera:517,alderaWasser:86}
};
assert.ok(Object.hasOwn(expected,arm));
const e=expected[arm], result=investitionsprobe(42,605,arm);
assert.equal(result.ausgang.hash,'197255bedbdf6f93');
assert.equal(result.ausgang.auftraege.eisfrachten,1100);
assert.equal(result.ausgang.produktion.wasserProduziert,54870);
assert.equal(result.arme.length,1);
const a=result.arme[0];
assert.equal(a.variante,arm);
assert.deepEqual(a.verlauf.map(v=>v.hash),e.hashes);
for(const v of [result.ausgang,...a.verlauf]){
 assert.equal(v.weltgeld,33000);
 assert.equal(v.mint,0);
 assert.equal(v.burn,0);
 assert.equal(v.treuhand,0);
}
if(arm==='kontrolle'){assert.equal(a.kauf,null);assert.equal(a.ueberfuehrung,null);}
else {
 assert.equal(a.kauf.preis,arm==='frachter'?750:600);
 assert.equal(a.kauf.station,arm==='frachter'?'st_nadir':'st_aldera');
 assert.equal(a.kauf.schiff,'sh112');
 if(arm==='frachter') assert.ok(a.ueberfuehrung);
 else assert.equal(a.ueberfuehrung,null);
}
// Day 155 onwards: no additional production, independently of time/hash.
for(const v of a.verlauf.slice(1)){
 assert.equal(v.auftraege.eisfrachten,e.f4);
 assert.equal(v.auftraege.erzfrachten,e.w3);
 assert.equal(v.produktion.wasserProduziert,e.wasser);
 assert.equal(v.kassen.house,e.haus);
 assert.equal(v.kassen.st_aldera,e.aldera);
 assert.equal(v.lager.st_aldera.wasser,e.alderaWasser);
 assert.deepEqual(v.produktion,a.verlauf[1].produktion);
 assert.deepEqual(v.kassen,a.verlauf[1].kassen);
 assert.deepEqual(v.lager,a.verlauf[1].lager);
}
fs.writeFileSync(process.argv[3]||'report.json',JSON.stringify(result,null,2)+'\n');
console.log('W6_INVESTITION_AUDIT '+JSON.stringify({arm,source:result.ausgang.hash,hashes:a.verlauf.map(v=>v.hash),purchase:a.kauf,transfer:a.ueberfuehrung,final:{...e},plateau:true,replay:true}));
