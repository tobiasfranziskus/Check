'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {SZENARIEN}=require('../tools/w6-szenarien.cjs');
const {simulation}=require('../tools/m4-u9d-langzeit.cjs');
test('U9d: exact S02 old baseline and original U9a prevention reproduced',()=>{
 const sz=SZENARIEN.find(x=>x.id==='S02');
 const original=simulation(sz,30,42,'original');
 const vorsorge=simulation(sz,30,42,'vorsorge');
 assert.equal(original.ende.hash,'478696c8bbb0c153');
 assert.equal(original.verlauf.at(-1).gebunden,1390);
 assert.equal(vorsorge.ende.hash,'68882ecfc58324a9');
 assert.equal(vorsorge.verlauf.at(-1).eis,334);
 assert.equal(vorsorge.stats.vorsorge,1);
 const kombiniert=simulation(sz,30,42,'kombiniert');
 assert.deepEqual(simulation(sz,30,42,'kombiniert'),kombiniert);
 console.log('U9D_S02',JSON.stringify({original:original.verlauf,
   vorsorge:vorsorge.verlauf,kombiniert:kombiniert.verlauf,stats:kombiniert.stats}));
});