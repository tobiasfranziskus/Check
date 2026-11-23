'use strict';
const assert=require('node:assert/strict');
const {SZENARIEN}=require('./w6-szenarien.cjs');
const {lauf}=require('./m4-u9i-reserve-kaufzeitfenster.cjs');
const [mode,days]=process.argv.slice(2);
assert.ok(['control','routefree','purchase'].includes(mode));
assert.ok([365,730].includes(+days));
const sz=SZENARIEN.find(x=>x.id==='S02');
const run=()=>lauf(sz,+days,42,60,mode);
const a=run();
assert.deepEqual(run(),a,'exact independent replay');
const expected=mode==='control'&&+days===730?'35e809440b315ae4':null;
if(expected)assert.equal(a.report.ende.hash,expected);
assert.equal(a.report.verlauf.at(-1).weltgeld,33000);
assert.ok(a.buys.every(x=>x.stock>0&&x.cash>=x.preis+x.transfer+2*x.arbeit));
if(mode==='control')assert.equal(a.buys.length,0);
if(mode==='routefree')assert.ok(a.buys.every(x=>!x.routeBusy));
const end=a.report.verlauf.at(-1);
const active=a.endfenster.filter(x=>x.klasse==='frachter');
const summary={mode,days:+days,seed:42,hash:end.hash,checkpoints:a.report.verlauf,
 reserveBuys:a.buys.length,reservePurchasePayments:a.buys.reduce((sum,x)=>sum+x.preis,0),
 buysWhileBusy:a.buys.filter(x=>x.routeBusy).length,
 gates:a.gates,rejections:a.rejections,lastFracht:a.lastFracht,zeroSince:a.zeroSince,
 activeCarriers:active,activeContracts:a.report.ende.aktiveAuftraege,
 endCash:{transport:a.report.ende.kassen.transport,werft:a.report.ende.kassen.werft_extern,
 house:a.report.ende.kassen.house},lastEvents:a.ereignisse.slice(-5),replay:true};
console.log('U9I_LONG',JSON.stringify(summary));
