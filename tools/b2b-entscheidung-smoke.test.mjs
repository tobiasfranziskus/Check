// B2b: Testet den unveränderten, im Runner eingebetteten Suchalgorithmus mit isolierten Angeboten.
// Nur Entwicklung: keine Abhängigkeit und kein zweiter Produktionskern.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const source=readFileSync(new URL('./b2b-umpositionierung.mjs',import.meta.url),'utf8');
const match=source.match(/const helper=`([\s\S]*?)`;/);
assert(match, 'Die untersuchte Suchfunktion muss eindeutig im B2b-Runner enthalten sein');
assert.equal(source.match(/const helper=`/g)?.length,1,'Nur eine Suchfunktion');

const stations={st_a:{system:'a'},st_b:{system:'b'},st_c:{system:'c'}};
const rules={world:{
  stations, systems:{a:{sicherheit:'sicher'},b:{sicherheit:'sicher'},c:{sicherheit:'umkaempft'}},
  werft:'st_a', betriebskosten:{frachter:250},
},economy:{stunde:60}};
const ship={id:'sh1',owner:'npc3',auftrag:'handeln',arbeit:0,klasse:'frachter',system:'a'};
const state={owners:{npc3:{cash:3000}},ships:{sh1:ship}};
const offers={
  st_b:{ziel:'st_a',ware:'silizium',menge:20},
  st_c:{ziel:'st_b',ware:'silizium',menge:20},
};
let prices={st_a:70,st_b:20,st_c:12};
const ids=o=>Object.keys(o).sort();
const route=(world,a,b)=>({zeit:a===b?0:10});
const preis=(s,station,ware)=>ware==='frachter'?750:prices[station];
const gebuehr=()=>0;
const bezahlbar=(r,st,cash,unit)=>Math.floor(cash/unit);
const bestesPaar=(s,r,sh,station)=>offers[station]??null;
const suche=new Function('ids','route','preis','gebuehr','bezahlbar','bestesPaar',
  match[1]+'; return sucheUmpositionierung;')(
    ids,route,preis,gebuehr,bezahlbar,bestesPaar);

function pruefe(cash,risiko,preise){
  state.owners.npc3.cash=cash;
  prices={...preise};
  return suche(state,rules,ship,'st_a',risiko);
}

test('Gewinn nach Leerfahrt und regulärer Fahrt ist positiv',()=>{
  const x=pruefe(3000,false,{st_a:70,st_b:20,st_c:12});
  assert.equal(x?.start,'st_b');
  assert.equal(x?.margin,908);
  assert.equal(x?.emptyCost,46);
  assert.equal(x?.freightCost,46);
});
test('Bestehende Hüllenreserve darf nicht als Waren-/Reisekapital zählen',()=>{
  assert.equal(pruefe(740,false,{st_a:70,st_b:20,st_c:12}),null);
});
test('Kleine Preisdifferenzen decken beide Fahrten nicht',()=>{
  assert.equal(pruefe(3000,false,{st_a:21,st_b:20,st_c:19}),null);
});
test('Sicherheitsfilter lässt ein geplantes sicheres Angebot zu',()=>{
  assert.equal(pruefe(3000,true,{st_a:70,st_b:20,st_c:12})?.start,'st_b');
});
test('Sicherheitsfilter verwirft unsicheren alternativen Start',()=>{
  assert.equal(pruefe(3000,true,{st_a:21,st_b:20,st_c:12}),null);
});
test('Ohne Sicherheitsfilter bleibt die unsichere Alternative wählbar',()=>{
  const x=pruefe(3000,false,{st_a:21,st_b:20,st_c:12});
  assert.equal(x?.start,'st_c');
  assert.equal(x?.margin,68);
});
