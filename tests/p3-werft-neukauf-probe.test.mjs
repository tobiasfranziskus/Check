import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {pruefen}=require('../tools/p3-werft-neukauf-probe.cjs');

test('P3: after nine real W5 freight receipts, only a legally available future hull or miner can be bought',()=>{
 const result=pruefen();
 assert.equal(result.window.start,2220);
 assert.equal(result.window.worldCash,33000);
 assert.equal(result.window.mint,0);assert.equal(result.window.burn,0);
 assert.ok(result.observedCount<=145);
 assert.ok(result.window.end<=3660);
 if(result.firstPaid){
  assert.ok(['frachter','miner'].includes(result.firstPaid.type));
  assert.ok(result.firstPaid.price>0&&result.firstPaid.remaining>=0);
  assert.equal(result.firstPaid.value,result.firstPaid.price);
 }else{
  assert.equal(result.window.end,3660);
  assert.equal(result.observedCount,145);
 }
 console.log('P3_WERFT_NEUKAUF_GRENZE '+JSON.stringify(result));
});
