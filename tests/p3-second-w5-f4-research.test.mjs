import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {run}=require('./p3-second-w5-f4-research.cjs');

test('P3: second bought W5 hull completes a genuine paid, audited F4 round after funded ferry',()=>{
 const v=run();
 assert.equal(v.status,'paid-second-f4-completed');
 assert.equal(v.first,'sh004');
 assert.equal(v.second,'sh010');
 assert.equal(v.currentRounds,10);
 assert.equal(v.worldMoney,33000);
 assert.ok(v.extraIceDelivered>=50,'NPC cargo can also arrive during 120 original minutes');
 assert.equal(v.paidPlayerWage,120,'exact player-specific original labor ledger');
 assert.equal(v.paidPlayerFreight,240,'exact player-specific original freight ledger');
 assert.equal(v.closed.fracht,240);
 assert.equal(v.closed.arbeit,120);
});
