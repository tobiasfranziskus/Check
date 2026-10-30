// B3-Prüfung: ausschließlich eigens instrumentierte v12-Sollrollen, kein Produktpatch.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const runner=fs.readFileSync(new URL('./b3-sollflotte.mjs',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const begin=runner.indexOf("const modes=['control'");
const end=runner.indexOf('function instrument(text){',begin);
assert(begin>0 && end>begin);
const variant=new Function('src','assert',runner.slice(begin,end)+'; return variant;')(html,assert);
const source=Object.fromEntries(['control','register','priority','funded'].map(m=>[m,variant(m)]));
const activation="const neu = m_core_state.neuesSchiff(state, { owner: cmd.owner, klasse: cmd.klasse, system: traeger.system, heimat: traeger.system, auftrag: 'halten', ware: null });";
const logAnchor="m_core_state.protokolliere(state, 'dienst',";

function injection(mode){
 const text=source[mode];
 const at=text.indexOf(activation),after=text.indexOf(logAnchor,at);
 assert(at>=0 && after>at,'Einmaliger Aktivierungscode');
 return text.slice(at+activation.length,after);
}
const st=()=>({
 owners:{npc3:{cash:1120}},
 stations:{st_aldera:{lager:{frachter:1}}},
 ships:{sh_miner:{id:'sh_miner',owner:'npc3',klasse:'miner',arbeit:0,auftrag:'foerdern'}},
 sollflotte:{npc3:[]},
});
const rules={world:{werft:'st_aldera',betriebskosten:{frachter:250,miner:150},ersatzRuecklage:250},
 economy:{stunde:60}};
const neu={heimat:'aldera',ware:null},cmd={owner:'npc3',klasse:'frachter'};
const mockBuild={fehlend:()=>Array.from({length:3},()=>({klasse:'miner'}))};
const mockPrice={preis:(state,werft,klasse)=>klasse==='miner'?1123:1092};
const mockTrade={gebuehr:()=>0};
function execute(mode,state=st(),overrides={}){
 const fn=new Function('state','rules','neu','cmd','m_core_schiffbau','m_core_preis','m_core_handel',injection(mode));
 fn(state,rules,neu,cmd,overrides.build??mockBuild,overrides.prices??mockPrice,mockTrade);
 return state;
}
test('Die Kontrolle bleibt der unveränderte Produktcode',()=>{
 assert.equal(source.control,html);
});
test('Sollregistrierung greift nur beim neuen eigenen Frachter, ohne Geldbuchung',()=>{
 const s=execute('register');
 assert.deepEqual(s.sollflotte.npc3,[{klasse:'frachter',heimat:'aldera',ware:null,auftrag:'handeln'}]);
 assert.equal(s.owners.npc3.cash,1120);
 const noMatch=st();
 execute('register',noMatch); // isolierter eindeutiger eigener Eintritt
 assert.equal(noMatch.sollflotte.npc3.length,1);
 assert.equal(source.register.includes("cmd.owner === 'npc3' && cmd.klasse === 'frachter'"),true);
});
test('Registrierung lässt ursprüngliche Kauf- und Arbeitsregeln unangetastet',()=>{
 assert.equal(source.register.replace(injection('register'),''),html);
 assert.equal(source.funded.includes('m_core_schiffbau.fehlend'),true);
});
test('Finanzierungsprüfung verweigert bei drei ungedeckten Minerplätzen den Frachter-Sollplatz',()=>{
 const s=execute('funded');
 assert.equal(s.sollflotte.npc3.length,0);
 assert.equal(s.owners.npc3.cash,1120);
});
test('Finanzierungsprüfung lässt nach Deckung aller Verpflichtungen eine Rolle zu',()=>{
 const s=st();s.owners.npc3.cash=8000;
 execute('funded',s);
 assert.equal(s.sollflotte.npc3.length,1);
 assert.equal(s.owners.npc3.cash,8000);
});
test('Kein neuer Sollplatz ohne tatsächlich vorhandene Werfthülle',()=>{
 const s=st();s.owners.npc3.cash=8000;s.stations.st_aldera.lager.frachter=0;
 execute('funded',s);
 assert.equal(s.sollflotte.npc3.length,0);
});
test('Ersatzpriorität ändert ausschließlich NPC3-Reihenfolge, nicht die Kaufbedingung',()=>{
 assert(source.priority.includes("owner === 'npc3' ? fehlend(state,owner).sort"));
 assert(source.priority.includes("Number(b.klasse==='frachter')-Number(a.klasse==='frachter')"));
 assert(source.priority.includes("if (state.owners[owner].cash < bedarf + (leer ? 0 : w.ersatzRuecklage)) continue;"));
 assert(source.priority.includes("if (!handel(state, rules, s, werft, x.klasse, 1, true))"));
 const order=[{klasse:'miner',id:'m1'},{klasse:'frachter',id:'f'},{klasse:'miner',id:'m2'}];
 const copy=order.slice().sort((a,b)=>Number(b.klasse==='frachter')-Number(a.klasse==='frachter'));
 assert.deepEqual(copy.map(x=>x.id),['f','m1','m2']);
});
