import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {run}=require('./p3-werft-zweitbetrieb.cjs');
test('P3: second original bought hull completes genuine W5ac and F4 or documents an audited signed-capacity denial',()=>{
 const r=run();
 assert.equal(r.first,'sh004');
 assert.equal(r.second,'sh010');
 assert.equal(r.worldMoney,33000);
 if(r.status==='completed'){
  assert.equal(r.ferry.quote.kosten,60);
  assert.equal(r.freight.quote.ok,true);
  assert.equal(r.freight.menge,50);
  assert.equal(r.freight.tarif,240);
  assert.equal(r.freight.lohn,120);
  assert.equal(r.roundCount,10);
  assert.equal(r.bookValueSecond,696);
  assert.equal(r.homeSecond,'nadir');
  assert.ok(r.shipsOwned.includes(r.first));
  assert.ok(r.shipsOwned.includes(r.second));
  console.log('P3_ZWEITFRACHT_OK '+JSON.stringify(r));
 }else{
  assert.equal(r.status,'blocked','never record an unproven completed transport');
  assert.equal(r.roundCount,9,'historical first-ship F4 contracts remain intact');
  assert.ok(r.ferry?.blockers?.length||r.freight?.blockers?.length);
  assert.equal(r.tick<=3160+2*1440+60,true);
  assert.ok(r.cash>=0);
  console.log('P3_ZWEITFRACHT_BLOCKED '+JSON.stringify(r));
 }
});
