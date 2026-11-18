import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {run,expire}=require('./p3-fair-ferry-research.cjs');

test('P3 research: bounded queued player reaches original paid ferry then NPC route resumes, never deployed',()=>{
 const r=run();
 const replay=run();
 assert.deepEqual(replay,r,'repeat same financed world and exact queue must replay bit-identically');
 assert.equal(r.status,'completed-original-ferry-in-research-only-world');
 assert.equal(r.second,'sh010');
 assert.equal(r.grant.kosten,60);
 assert.equal(r.completion.receipt.owner,'house');
 assert.equal(r.money,33000);
 assert.equal(r.mint,0);assert.equal(r.burn,0);
 assert.equal(r.intactPaidPlayerFreights,9);
 console.log('P3_FAIR_FERRY_RESEARCH '+JSON.stringify(r));
});
test('P3 research: a short idle queue expires without money transfer, ship grants or old-save mutation',()=>{
 const r=expire();
 assert.equal(r.status,'expired-without-reservation');
 assert.equal(r.ship,'sh010');
 console.log('P3_FAIR_FERRY_EXPIRY '+JSON.stringify(r));
});
