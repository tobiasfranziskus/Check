import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vorhandeneModule} from '../prototypes/w5-frachter/m_ui_frachter_core.mjs';
const src=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {api}=vorhandeneModule(src);

test('W5m UI: independently startable, real Core commands only, touch controls',()=>{
 const h=readFileSync(new URL('../prototypes/w5-mining/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/w5-mining/w5m.mjs',import.meta.url),'utf8');
 assert.match(h,/name="viewport"/);
 assert.match(h,/min-height:48px/);
 assert.match(h,/data-action="fitHouse"/);
 assert.match(h,/data-action="fitNpc"/);
 assert.match(h,/data-action="freight"/);
 assert.match(h,/data-action="export"/);
 assert.match(h,/id="import"/);
 assert.match(js,/vorhandeneModule/);
 assert.match(js,/api\.createW5MState/);
 assert.match(js,/api\.loadW5M/);
 assert.match(js,/api\.pilotW5MStand/);
 assert.match(js,/api\.audit/);
 assert.match(js,/api\.execute/);
 assert.match(js,/shipUpgradeMiner/);
 assert.doesNotMatch(js,/localStorage|indexedDB|\.cash\s*(?:\+\+|--|\+=|-=|=)/);
 assert.doesNotMatch(js,/innerHTML|Math\.random|setInterval/);
});

test('W5m UI: repeated read-only ROI projections preserve hash, saves isolated',()=>{
 const s=api.createW5MState(42),h=api.hash(s);
 for(let i=0;i<150;i++){
   const v=api.pilotW5MStand(s);
   assert.equal(v.regel,28);
   assert.equal(v.audit.ok,true);
   assert.equal(v.unternehmen.house.amortisierterSaldo,0);
   assert.equal(v.unternehmen.npc3.amortisierterSaldo,-600);
 }
 assert.equal(api.hash(s),h);
 assert.equal(api.hash(api.loadW5M(api.save(s))),h);
 assert.throws(()=>api.loadW5L(api.save(s)),/inkompatibel/);
});
