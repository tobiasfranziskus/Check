import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {project}=createRequire(import.meta.url)('../prototypes/legacy-hub/core-adapter.js');
const saved=readFileSync(new URL('fixtures/w5t/r32-seed42.json',import.meta.url),'utf8');
const state=()=>JSON.parse(saved),options={ownerId:'transport'};
test('authoritative accounts, ownership, IDs and one snapshot',()=>{
 const b=project(saved,options);
 assert.equal(b.corporation.company.availableCapital,1250);
 assert.equal(b.corporation.company.expenses,750);
 assert.deepEqual(b.corporation.ships.map(s=>s.id),['sh002']);
 assert.equal(b.station.stations[0].ships.length,2);
 assert.equal(b.station.stations[0].storage[0].owner,null);
 assert.equal(b.corporation.inventory,null);
 assert.equal(b.corporation.company.result,null);assert.equal(b.financialEvidence.journal,null);
 const s=state();s.tick=99;s.owners.transport.cash=17;
 const next=project(s,options);assert.equal(next.tick,99);assert.equal(next.corporation.company.availableCapital,17);
 assert.equal(b.tick,0);assert.equal(b.corporation.company.availableCapital,1250);
});
test('missing fields remain unknown; real zero and empty lists survive',()=>{
 const s=state();delete s.ships;delete s.stations;delete s.stats;delete s.owners.transport.cash;
 const b=project(s,options);assert.equal(b.corporation.ships,null);assert.equal(b.station.stations,null);
 assert.equal(b.corporation.company.income,null);assert.equal(b.corporation.company.availableCapital,null);
 assert.equal(project(saved,{ownerId:'house'}).corporation.company.income,0);
});
test('wrong IDs and dangling ownership/order references are rejected',()=>{
 assert.throws(()=>project(saved,{ownerId:'fake'}));
 for(const change of [s=>s.ships.sh001.id='sh002',s=>s.owners.transport.id='house',
 s=>s.ships.sh001.owner='fake',s=>s.stations.st_aldera.eigentum='fake',
 s=>s.ships.sh001.system='fake',s=>s.systems.aldera.station='fake',s=>s.w3.auftrag={schiff:'fake'}]){const s=state();change(s);assert.throws(()=>project(s,options));}
});
test('stations only contain docked ships; cargo ownership and availability stay unknown',()=>{
 const s=state();s.ships.sh002.phase='reise';s.ships.sh002.ladung={eis:50};
 s.w5n.frachtauftrag={schiff:'sh002',phase:'hin',menge:50,arbeit:120};
 const b=project(s,options);assert.equal(b.station.stations[0].ships.length,1);
 assert.equal(b.corporation.ships[0].cargo[0].owner,null);
 assert.equal(b.corporation.ships[0].cargo[0].available,null);
 assert.equal(b.freightOrders[0].core.menge,50);assert.equal(b.corporation.orders[0].funding,null);
});
test('deep immutable output, detached source, no mutation of Save JSON',()=>{
 const s=state(),before=JSON.stringify(s),b=project(s,options);
 assert.equal(JSON.stringify(s),before);assert.equal(JSON.stringify(JSON.parse(saved)),before);
 assert.throws(()=>{b.accounts[0].cash=1;});s.owners.transport.cash=2;
 assert.equal(b.corporation.company.availableCapital,1250);
 assert.deepEqual(project(JSON.stringify(s),options),project(s,options));
});
test('no getter execution, invalid JSON, future schemas and non-JSON rejected',()=>{
 const s=state();let called=false;Object.defineProperty(s,'danger',{enumerable:true,get(){called=true;}});
 assert.throws(()=>project(s,options));assert.equal(called,false);
 for(const v of ['{', {...state(),schema:9},{...state(),rulesVersion:33},{...state(),bad:Infinity}])assert.throws(()=>project(v,options));
});
