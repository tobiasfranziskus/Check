import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();

test('W5o UI: standalone touch controls, five modes, protected save/import',()=>{
 const html=readFileSync(new URL('../prototypes/w5-haushalte/index.html',import.meta.url),'utf8');
 const script=readFileSync(new URL('../prototypes/w5-haushalte/w5o.mjs',import.meta.url),'utf8');
 assert.match(html,/name="viewport"/);
 assert.match(html,/min-height:48px/);
 for(const mode of ['full:npc3','wages:npc3','npcSave:npc3','full:house','none:npc3'])
   assert.ok(html.includes('value="'+mode+'"'),'mode missing '+mode);
 for(const action of ['start','day','week','month','export'])
   assert.ok(html.includes('data-act="'+action+'"'),'missing '+action);
 assert.match(script,/vorhandeneModule/);
 assert.match(script,/api\.createW5OState/);
 assert.match(script,/api\.pilotW5OStand/);
 assert.match(script,/api\.loadW5O/);
 assert.match(script,/api\.advance/);
 assert.match(script,/api\.audit/);
 assert.match(script,/requestAnimationFrame/);
 assert.doesNotMatch(script,/localStorage|indexedDB|Math\.random|innerHTML|setInterval/);
 assert.doesNotMatch(script,/\.cash\s*(?:\+\+|--|\+=|-=|=)/);
});
test('W5o UI: read-only snapshot cannot change money, goods, save hash',()=>{
 const state=api.createW5OState(42,'full','npc3');
 const original=api.hash(state);
 for(let i=0;i<100;i++){
  const projection=api.pilotW5OStand(state);
  assert.equal(projection.ok,true);
  assert.equal(projection.geld,33000);
  assert.equal(projection.haushalt,1400);
 }
 assert.equal(api.hash(state),original);
 const recovered=api.loadW5O(api.save(state));
 assert.equal(api.hash(recovered),original);
 assert.throws(()=>api.loadW5N(api.save(state)),/inkompatibel/);
});
