// M1/M2: exercise the actual read-only water UI renderer with deterministic
// projection snapshots. The unchanged Rule204 cash/stock contracts are covered
// by tests/p3-wasserlohn.test.mjs and core audit tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const script=readFileSync(new URL('../prototypes/spiel/spiel.js',import.meta.url),'utf8');
const start=script.indexOf('function wasserLohnAnzeigen(s,angebote){');
const end=script.indexOf('\n}\n// P3 chapter 05',start);
assert.ok(start>=0&&end>start,'existing water UI renderer must remain discoverable');
const source=script.slice(start,end+2);
function render(inventory,needed,funded,canBuy){
 const p=Object.freeze({sichtbar:true,lohn:608,wasser:inventory,preis:16,
   kaeuferKasse:funded?300:3,eisKosten:250,fehlbetrag:funded?0:needed*16,
   zielMenge:funded?0:needed,zielKosten:funded?0:needed*16,
   zielBereit:canBuy,kleinBereit:inventory>0,grund:canBuy
     ?'Originalkauf möglich':'Nicht genügend tatsächlich vorhandenes Wasser'});
 const ids=['p3-wasser-kreislauf','p3-wasser-zahlen','p3-wasser-bedarf',
   'p3-wasser-aktion','p3-wasser-klein','p3-wasser-grund'];
 const dom=Object.fromEntries(ids.map(id=>[id,{hidden:false,disabled:false,textContent:''}]));
 const called=[];
 const $=id=>{assert.ok(dom[id],'unknown water node '+id);return dom[id];};
 const scope={P3WasserLohn:{auswerten:()=>{called.push('read');return p;}},
   AphrosWelt:{DATEN:Object.freeze({})}};
 const session={weltReferenz:()=>Object.freeze({})};
 const fn=vm.runInNewContext('('+source+')',{$,scope,session,
   fmt:n=>Number(n).toLocaleString('de-DE'),anzeigetext:x=>x});
 fn(Object.freeze({}),Object.freeze([]));
 assert.deepEqual(called,['read'],'only the existing read-only projection is consulted');
 return dom;
}
test('manager-water-text: zero inventory is never called physically available',()=>{
 const d=render(0,16,false,false);
 assert.match(d['p3-wasser-bedarf'].textContent,/16 Einheiten Wasser nötig/);
 assert.match(d['p3-wasser-bedarf'].textContent,/Tatsächlich im Aldera-Lager: 0 Einheiten/);
 assert.doesNotMatch(d['p3-wasser-bedarf'].textContent,/wirklich vorhandene Einheiten/i);
 assert.equal(d['p3-wasser-aktion'].disabled,true);
 assert.match(d['p3-wasser-grund'].textContent,/Gesperrt:/);
});
test('manager-water-text: partial inventory stays distinct from calculated need',()=>{
 const d=render(5,15,false,false);
 assert.match(d['p3-wasser-bedarf'].textContent,/15 Einheiten Wasser nötig/);
 assert.match(d['p3-wasser-bedarf'].textContent,/Aldera-Lager: 5 Einheiten/);
 assert.equal(d['p3-wasser-aktion'].disabled,true);
 assert.equal(d['p3-wasser-klein'].disabled,false,'1-unit original offer stays independent');
});
test('manager-water-text: sufficient physical stock preserves original purchase gate',()=>{
 const d=render(37,16,false,true);
 assert.match(d['p3-wasser-bedarf'].textContent,/Aldera-Lager: 37 Einheiten/);
 assert.match(d['p3-wasser-bedarf'].textContent,/256 ISK aus deinem PRIVATEN Pilotenlohn/);
 assert.equal(d['p3-wasser-aktion'].disabled,false);
 assert.equal(d['p3-wasser-aktion'].textContent,'16 Wasser für 256 ISK privat kaufen');
});
test('manager-water-text: financed ice charge needs no fictitious new water demand',()=>{
 const d=render(0,0,true,false);
 assert.match(d['p3-wasser-bedarf'].textContent,/bereits finanzierbar/);
 assert.doesNotMatch(d['p3-wasser-bedarf'].textContent,/Einheiten Wasser nötig/);
 assert.equal(d['p3-wasser-aktion'].disabled,true);
});
