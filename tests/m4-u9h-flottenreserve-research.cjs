'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {SZENARIEN}=require('../tools/w6-szenarien.cjs');
const {versuch}=require('../tools/m4-u9h-flottenreserve.cjs');
const sz=SZENARIEN.find(x=>x.id==='S02');
test('U9h: actual last-freighter depletion and independent management counterfactual',()=>{
 const control=versuch(sz,560,42,'kontrolle');
 const last=control.report.verlauf.at(-1);
 assert.equal(last.eis,6269);
 assert.equal(last.erz,115);
 assert.equal(last.gebunden,0);
 assert.equal(last.lager.st_nadir.frachter,0);
 assert.equal(control.report.ende.huellen.filter(x=>x.klasse==='frachter'&&!x.stillgelegt).length,0);
 const actual=control.report.ende.folgefahrten.filter(x=>x.schiff==='sh575'&&x.ware==='eis');
 assert.equal(actual.length,21);assert.equal(actual.at(-1).ende,796620);
 const a=versuch(sz,560,42,'reserve');
 assert.ok(a.counts.reserve>0,'reserve decision never exercised');
 const b=versuch(sz,560,42,'kombiniert');
 for(const x of [a,b]){
   assert.equal(x.report.verlauf.at(-1).weltgeld,33000);
   assert.ok(x.belege.filter(z=>z.typ==='reserve').every(z=>z.rest<2*z.dauer));
 }
 console.log('U9H_560',JSON.stringify({control:control.report.verlauf,
   reserve:{verlauf:a.report.verlauf,counts:a.counts,belege:a.belege},
   kombiniert:{verlauf:b.report.verlauf,counts:b.counts,belege:b.belege}}));
});
