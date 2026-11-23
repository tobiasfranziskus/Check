'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {SZENARIEN}=require('../tools/w6-szenarien.cjs');
const {simulation,leerstornoProbe}=require('../tools/m4-u9d-langzeit.cjs');
const {ausgang}=require('../tools/m4-u9c-folgeauftraege.cjs');
test('U9e empty cancellation cannot settle the original loaded case',()=>{
 const {welt, original, settled}=ausgang();
 for(const json of [original,settled]){
  const s=welt.load(json);
  assert.equal(leerstornoProbe(welt,s).ok,false);
  assert.equal(welt.save(s),json);
 }
});
test('U9e exact previous 90-day empty NPC contract and lawful original cancellation',()=>{
 const sz=SZENARIEN.find(x=>x.id==='S02');
 const control=simulation(sz,90,42,'kombiniert');
 assert.equal(control.ende.hash,'857f885bf2a25827');
 assert.equal(control.ende.aktiveAuftraege.w3.industrieMiner,'sh040');
 assert.equal(control.ende.aktiveAuftraege.w3.schiff,'sh079');
 const mi=control.ende.huellen.find(x=>x.id==='sh040');
 assert.equal(mi.stillgelegt,true);assert.equal(Object.values(mi.ladung).some(x=>x!==0),false);
 const result=simulation(sz,90,42,'leerstorno');
 assert.ok(result.stats.leerstorno>0);
 assert.ok(result.stats.belege.some(x=>x.typ==='leerstorno'&&x.miner==='sh040'&&x.carrier==='transport'&&x.freigegeben===1390));
 assert.deepEqual(simulation(sz,90,42,'leerstorno'),result);
 console.log('U9E_90',JSON.stringify({control:control.verlauf,result:result.verlauf,stats:result.stats,ende:result.ende}));
});
