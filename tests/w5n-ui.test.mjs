import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();

test('W5n UI: static touch controls and save-safe isolated prototype',()=>{
 const ui=readFileSync(new URL('../prototypes/w5-versorgung/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/w5-versorgung/w5n.mjs',import.meta.url),'utf8');
 assert.match(ui,/name="viewport"/);
 assert.match(ui,/min-height:48px/);
 assert.match(ui,/data-act="ship"/);
 assert.match(ui,/data-act="water"/);
 assert.match(ui,/data-act="mine"/);
 assert.match(ui,/data-act="export"/);
 assert.match(ui,/id="import"/);
 assert.match(js,/vorhandeneModule/);
 assert.match(js,/api\.createW5NState/);
 assert.match(js,/api\.pilotW5NStand/);
 assert.match(js,/api\.execute/);
 assert.match(js,/api\.loadW5N/);
 assert.match(js,/api\.audit/);
 assert.doesNotMatch(js,/localStorage|indexedDB|Math\.random|innerHTML|setInterval/);
 assert.doesNotMatch(js,/\.cash\s*(?:\+\+|--|\+=|-=|=)/);
});

test('W5n UI: read-only market projection stable across repeated reads and load',()=>{
 const s=api.createW5NState(42),before=api.hash(s);
 for(let i=0;i<150;i++){
  const v=api.pilotW5NStand(s);
  assert.equal(v.regel,29);
  assert.equal(v.audit.ok,true);
  assert.equal(v.gefoerdert,0);
  assert.equal(v.kundenRest,1400);
  assert.equal(v.zahlung,0);
 }
 assert.equal(api.hash(s),before);
 assert.equal(api.hash(api.loadW5N(api.save(s))),before);
 assert.throws(()=>api.loadW5N(api.save(api.createW5MState(42))),/inkompatibel/);
});
