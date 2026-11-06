// Dev-only, explicit read-only reference HTML argument. Never loaded by preview.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {project}=createRequire(import.meta.url)('../prototypes/legacy-hub/core-adapter.js');
const html=readFileSync(process.argv[2],'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='))+';return m_core_index;')();
for(const seed of [42,7]){
 const s=api.createW5RState(seed,'full','npc3');
 for(const minutes of [0,60,120,1440]){
  api.advance(s,minutes,api.W5R_RULES);
  const saved=api.save(s),hash=api.hash(s),loaded=api.loadW5R(saved);
  const b=project(s,{ownerId:'transport'});
  assert.deepEqual(b,project(loaded,{ownerId:'transport'}));
  assert.deepEqual(b,project(saved,{ownerId:'transport'}));
  assert.equal(api.hash(s),hash);assert.equal(api.save(s),saved);assert.equal(api.audit(s).ok,true);
 }
 console.log('PASS pinned R32 reference: seed',seed,'4 Save/Load/read-only checkpoints');
}
// Real paid construction/positioning, then two live freight slots from #205.
for(const seed of [42,7]){
 const s=api.createW5RState(seed,'full','npc3'),r=api.W5R_RULES;
 const oreFirst={...r,w5s:{},w5o:{...r.w5o,versorgungZiel:-1}},dual={...r,w5s:{concurrent:true}};
 const cmd=(type,owner,args={})=>assert.equal(api.execute(s,{type,owner,...args},oreFirst).ok,true);
 cmd('shipBuy','house',{station:'st_aldera',klasse:'miner'});
 const miner=Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner').id;
 const old=Object.values(s.ships).find(sh=>sh.owner==='transport').id;
 cmd('shipMine','house',{schiff:miner,ware:'erz'});api.advance(s,60,oreFirst);
 cmd('shipFreight','transport',{schiff:old});api.advance(s,120,oreFirst);
 cmd('stationRefine','st_nadir',{station:'st_nadir'});api.advance(s,20,oreFirst);
 cmd('stationBuildShip','werft_extern',{station:'st_nadir'});api.advance(s,30,oreFirst);
 const next='sh'+String(s.nextShip).padStart(3,'0');
 cmd('shipBuy','transport',{station:'st_nadir',klasse:'frachter'});
 cmd('shipReposition','transport',{schiff:next});api.advance(s,60,oreFirst);
 cmd('shipMine','house',{schiff:miner,ware:'erz'});api.advance(s,100,oreFirst);
 for(let n=0;n<600&&!(s.w3.auftrag&&s.w5n.frachtauftrag);n++)api.advance(s,1,dual);
 assert.ok(s.w3.auftrag&&s.w5n.frachtauftrag);
 const saved=api.save(s),b=project(s,{ownerId:'transport'});
 assert.equal(b.freightOrders.length,2);assert.notEqual(b.freightOrders[0].shipId,b.freightOrders[1].shipId);
 assert.equal(b.station.stations.flatMap(st=>st.ships).filter(sh=>[old,next].includes(sh.id)).length,0);
 assert.deepEqual(b,project(api.loadW5R(saved),{ownerId:'transport'}));assert.equal(api.save(s),saved);
 assert.equal(api.audit(s).ok,true);
 console.log('PASS pinned W5s-c dual freight: seed',seed,'tick',s.tick,'Save/Load, ownership and unchanged state');
}
