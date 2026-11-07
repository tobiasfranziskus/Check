import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {normalize,project,layout}=createRequire(import.meta.url)('../prototypes/legacy-mining-scanner/scanner.js');
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
test('Scanner kopiert eingefrorenen Snapshot ohne Mutation oder Referenzübernahme',()=>{
 const s=freeze({asteroids:[{id:'a',name:'A',position:{x:2,y:3},resources:[{name:'Erz',amount:0,unit:'t'}],hazards:[]}],fields:[],zones:[]});
 const before=JSON.stringify(s),v=normalize(s);v.asteroids[0].position.x=20;v.asteroids[0].resources[0].amount=9;v.asteroids[0].hazards.push('x');assert.equal(JSON.stringify(s),before);
});
test('Scanner unterscheidet fehlende Daten von null Beständen und leeren Meldungen',()=>{
 const v=normalize({asteroids:[{id:'a',resources:[{name:'Erz',amount:0}],hazards:[]},{}]});
 assert.equal(v.asteroids[0].resources[0].amount,0);assert.deepEqual(v.asteroids[0].hazards,[]);assert.equal(v.asteroids[1].resources,null);assert.equal(v.fields,null);assert.equal(normalize(null).asteroids,null);assert.match(v.asteroids[1].status,/Nicht im Snapshot/);
});
test('Scanner verwirft ungültige Zahlen ohne Ersatzvorkommen oder Entfernungsrechnung',()=>{
 const v=normalize({asteroids:[{distance:-2,position:{x:Infinity,y:2},resources:[{amount:NaN},{amount:'4'}]}],fields:[{radius:-1}]});
 assert.equal(v.asteroids[0].position,null);assert.equal(v.asteroids[0].distance,null);assert.equal(v.fields[0].radius,null);assert.ok(v.asteroids[0].resources.every(r=>r.amount===null));
});
test('Scanner Kamera ist deterministisch und passt Flächen ein',()=>{
 const v=normalize({asteroids:[{position:{x:100,y:20}}],zones:[{position:{x:0,y:0},radius:200}]});
 assert.deepEqual(layout(v,600,400),layout(v,600,400));const l=layout(v,600,400);assert.deepEqual(project(l.camera,l.camera,l.zoom,600,400),{x:300,y:200});assert.equal(l.zoom,.75);
});
test('Scanner weist doppelte IDs zurück und übernimmt keine fremden Mechanikfelder',()=>{
 assert.throws(()=>normalize({asteroids:[{id:'x'},{id:'x'}]}),/eindeutig/);assert.equal(normalize({price:100,scanPower:5,asteroids:[{oreRule:7}]}).price,undefined);
});
test('Scanner Quellvertrag: sichere Textsenken und keine Simulation, Speicherung oder Uhr',()=>{
 const src=readFileSync(new URL('../prototypes/legacy-mining-scanner/scanner.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/innerHTML|outerHTML|insertAdjacentHTML|eval\(|Math\.random|Date\.|performance\.|localStorage|indexedDB|fetch\(|requestAnimationFrame|setInterval/);
 assert.match(src,/textContent/);assert.match(src,/destroy\(\)/);assert.match(src,/update\(next\)/);
});
