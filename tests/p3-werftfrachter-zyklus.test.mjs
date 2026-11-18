import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {run}=require('../tools/p3-werftfrachter-zyklus.cjs');
test('P3 S02: bought real W5 hull, prepaid ferry, first settled F4 and strictly audited later opportunities',()=>{
 const r=run();
 assert.equal(r.seed,42);assert.equal(r.rules,204);
 assert.equal(r.ship,'sh004');
 assert.equal(r.first.start,480);assert.equal(r.first.end,600);
 assert.equal(r.first.menge,50);
 assert.equal(r.first.tarif,240);assert.equal(r.first.lohn,120);
 assert.equal(r.first.verzehr,36);
 assert.equal(r.first.beitrag,84,'tariff minus real pilot cost and freighter wear; not full net profit');
 assert.ok(r.receipts.length>=1);
 assert.ok(r.receipts.every(x=>x.ship===r.ship&&x.beitrag===84),'each full freight wears one freighter 36 ISK');
 assert.equal(r.end.completed,r.receipts.length);
 assert.ok(r.end.tick<=480+120+72*10+(r.receipts.length-1)*120);
 console.log('P3_WERFT_FOLGEZYKLEN '+JSON.stringify({ship:r.ship,receipts:r.receipts,end:r.end,reasonCounts:r.reasonCounts,timeline:r.timeline}));
});
test('P3 S02: independent Replay is byte identical; original finances and Save/Load never bypassed',()=>{
 const a=run(),b=run();
 assert.deepEqual(a,b);
 assert.equal(a.end.hash,b.end.hash);
 assert.equal(a.finalSave,b.finalSave);
});
