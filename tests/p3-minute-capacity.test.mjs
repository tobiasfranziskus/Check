import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {run}=require('./p3-minute-capacity.cjs');

test('P3: 1-minute original Rule204 corridor occupancy does not hide a payable second-ferry offer',()=>{
 const r=run();
 assert.equal(r.start,3160);
 assert.equal(r.end,4600);
 assert.equal(r.checks,1441);
 assert.equal(r.first,'sh004');
 assert.equal(r.second,'sh010');
 assert.equal(r.worldMoney,33000);
 assert.equal(r.rounds,9);
 assert.equal(r.freeQuoteCount,0);
 assert.equal(r.occupancy.none,0);
 assert.equal(r.hash,'2454761bd83b9c95');
 console.log('P3_MINUTE_CAPACITY '+JSON.stringify(r));
});
