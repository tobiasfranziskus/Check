'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {SZENARIEN}=require('../tools/w6-szenarien.cjs');
const {lauf}=require('../tools/m4-u9h-frachterreserve.cjs');
const sz=SZENARIEN.find(x=>x.id==='S02');
test('U9h observation hook preserves exact U9g reference world',()=>{
 const a=lauf(sz,90,42,60,'control');
 assert.equal(a.report.ende.hash,'5e14d64c83e6e942');
 assert.equal(a.buys.length,0);
 assert.equal(a.report.verlauf.at(-1).eis,1014);
 assert.ok(a.lastFracht&&a.ereignisse.length);
});
test('U9h policy and financed reserve experiment at 90 days, exact replay',()=>{
 const stock=lauf(sz,90,42,60,'vorrat');
 const a=lauf(sz,90,42,60,'reserve');
 assert.deepEqual(lauf(sz,90,42,60,'reserve'),a);
 assert.equal(a.report.verlauf.at(-1).weltgeld,33000);
 for(const b of a.buys){
   assert.ok(b.stock>0&&b.cash>=b.preis+b.transfer+2*b.arbeit);
   assert.notEqual(b.old,b.new);
 }
 console.log('U9H_90',JSON.stringify({
  stock:stock.report.verlauf,reserve:a.report.verlauf,buys:a.buys,rejections:a.rejections
 }));
});
