import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vorhandeneModule} from '../prototypes/w5-frachter/m_ui_frachter_core.mjs';
import {weltSicht} from '../prototypes/w5-welt/m_ui_welt_core.mjs';
import {w5fSitzung,w5fSicht} from '../prototypes/w5-welt/m_ui_w5f_core.mjs';
import {DATENBANK,SLOT} from '../prototypes/w5-welt/m_ui_w5f_speicher.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {api}=vorhandeneModule(html);
test('W5f UI: 100 detached views do not advance or mutate the sole core',()=>{
 const s=w5fSitzung(api,api.createW5FState(42));
 const original=api.hash(s.lesen());
 for(let i=0;i<100;i++){
   const v=w5fSicht(api,s.lesen());
   assert.equal(v.version,'W5fSichtV1');
   assert.equal(v.hash,original);
   assert.equal(v.pilot.cash,0);
   assert.equal(v.laser.gefertigt,0);
   assert.equal(v.laser.vollkosten,api.pilotW5FVollkosten());
   assert.equal(v.audit.ok,true);
   assert.ok(Object.isFrozen(v.pilot));
   assert.ok(Object.isFrozen(v.canvas.entities));
 }
 assert.equal(api.hash(s.lesen()),original);
 s.schritt(50);assert.equal(s.lesen().tick,50);
 assert.notEqual(api.hash(s.lesen()),original);
});
test('W5f UI: R22 and R23 projections remain different valid research saves',()=>{
 const old=api.createW5DState(42),s=w5fSitzung(api,api.createW5FState(42));
 assert.equal(weltSicht(api,old).version,'W5dGemeinsameWeltV1');
 assert.equal(w5fSicht(api,s.lesen()).version,'W5fSichtV1');
 const good=s.export(),hash=api.hash(s.lesen());
 assert.throws(()=>s.import(api.save(old)),/inkompatibel/);
 assert.equal(s.export(),good);assert.equal(api.hash(s.lesen()),hash);
 assert.equal(api.hash(api.loadW5F(good)),hash);
});
test('W5f UI: dedicated browser namespace, explicit save and no main DB write',()=>{
 assert.equal(DATENBANK,'aphros-void-forschungswelt-w5f');
 assert.equal(SLOT,'regel23-pilot-laser-v1');
 assert.notEqual(DATENBANK,'aphros-void');
 assert.notEqual(DATENBANK,'aphros-void-forschungswelt-w5d');
 const page=readFileSync(new URL('../prototypes/w5-welt/w5f.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/w5-welt/w5f.mjs',import.meta.url),'utf8');
 for(const action of ['laserbau','laserkauf','lasereinbau','jagd','transport'])
   assert.match(page,new RegExp('data-aktion="'+action+'"'));
 assert.match(page,/w5f.mjs/);
 assert.match(js,/api\.loadW5F/);
 assert.match(js,/last\?\?session\.export\(\)/);
 assert.doesNotMatch(js,/aphros-void['"]/);
});
test('W5f UI: corrupt and future saves do not replace current state',()=>{
 const session=w5fSitzung(api),old=session.export();
 assert.throws(()=>session.import('{not json'));
 const tampered=JSON.parse(old);tampered.owners.pilot_npc3.cash=800;
 assert.throws(()=>session.import(JSON.stringify(tampered)));
 assert.equal(session.export(),old);
 assert.throws(()=>session.neu(0));
 assert.throws(()=>session.schritt(1440));
 assert.equal(session.export(),old);
});
