'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {ausgang,folgelauf}=require('../tools/m4-u9c-folgeauftraege.cjs');
test('U9c: exact blocked and settled worlds, equivalent manager decisions, financed follow-up and replay',()=>{
 const {welt,original,settled}=ausgang();
 const control=folgelauf(welt,original,7,false);
 const rescue=folgelauf(welt,settled,7,false);
 const replacement=folgelauf(welt,settled,7,true);
 assert.equal(control.beginn.hash,'478696c8bbb0c153');
 assert.equal(control.beginn.gebunden,1390);
 assert.equal(rescue.beginn.hash,'71414d11cf071dda');
 assert.equal(rescue.beginn.gebunden,0);
 assert.deepEqual(folgelauf(welt,original,7,false),control);
 assert.deepEqual(folgelauf(welt,settled,7,false),rescue);
 assert.deepEqual(folgelauf(welt,settled,7,true),replacement);
 assert.ok(replacement.kaeufe.filter(x=>x.ok).length<=1);
 assert.equal(welt.save(welt.load(original)),original);
 assert.equal(welt.save(welt.load(settled)),settled);
 const compact=x=>({status:x.status,delta:x.delta,kaeufe:x.kaeufe,
   neueHuellen:x.neueHuellen,belege:x.belege,
   endHash:x.ende.hash,gebunden:x.ende.gebunden,
   angebot:x.ende.angebot,aktiveAuftraege:x.ende.aktiveAuftraege,
   kassen:x.ende.kassen,lager:x.ende.lager,entscheidungen:x.entscheidungen});
 console.log('U9C_FOLGE',JSON.stringify({control:compact(control),rescue:compact(rescue),
   replacement:compact(replacement)}));
});
