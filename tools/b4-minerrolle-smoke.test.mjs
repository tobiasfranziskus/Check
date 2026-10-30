// B4 isolierte Struktur-/Kernversuche mit echten Codefragmenten, keine simulierte zweite Wirtschaft.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const runner=fs.readFileSync(new URL('./b4-minerrolle.mjs',import.meta.url),'utf8');
const start=runner.indexOf("const modes=['control'");
const stop=runner.indexOf('function instrument(text){',start);
assert(start>0&&stop>start,'Variante eindeutig vorhanden');
const variant=new Function('src','assert',runner.slice(start,stop)+';return variant;')(html,assert);
const cores=Object.fromEntries(['control','return_native','return_paid','release'].map(x=>[x,variant(x)]));
const ids=o=>Object.keys(o).sort(),anzahl=(o,k)=>o?.[k]||0;

const minStart=html.indexOf('const m_core_foerderung = (() => {');
const minEnd=html.indexOf('const m_core_route = (() => {',minStart);
assert(minStart>0&&minEnd>minStart);
const foerderung=new Function('m_core_zahl','m_core_handel','m_core_state',
 html.slice(minStart,minEnd)+';return m_core_foerderung.foerderung;')(
 {ids,anzahl},
 {handel:()=>true,aufnehmbar:()=>0,stationIn:()=> 'st_nadir'},
 {protokolliere:()=>{}});
const slotsStart=html.indexOf('const schluessel = (x) =>',html.indexOf('const m_core_schiffbau = (() => {'));
const slotsEnd=html.indexOf('function zuschuss(',slotsStart);
assert(slotsStart>0&&slotsEnd>slotsStart);
const fehlend=new Function('ids','anzahl',html.slice(slotsStart,slotsEnd)+';return fehlend;')(ids,anzahl);
const slot={klasse:'miner',heimat:'nadir',ware:'silizium',auftrag:'foerdern'};
const carrier=()=>({id:'sh010',owner:'npc3',klasse:'miner',system:'aldera',heimat:'nadir',
 phase:'dock',auftrag:'foerdern',ware:'silizium',ladung:{silizium:0},arbeit:0});
function state(){return {ships:{sh010:carrier()},sollflotte:{npc3:[{...slot}]},
 stations:{st_nadir:{module:{}}},ledger:{silizium:{mined:0}},
 owners:{npc3:{cash:2000}},stats:{handel:0},tick:129661};}
const rules={world:{fields:[{system:'nadir',ware:'silizium'}],
 stations:{st_nadir:{system:'nadir'}}},economy:{cargo:100,miningRate:2}};

test('Kontrolle und native Rückfahrt verwenden bytegleichen Produktkern',()=>{
 assert.equal(cores.control,html);assert.equal(cores.return_native,html);
});
test('In Aldera stoppt die echte Förderfunktion den Miner und löscht seine Ware',()=>{
 const s=state();foerderung(s,rules);
 assert.equal(s.ships.sh010.auftrag,'halten');assert.equal(s.ships.sh010.ware,null);
 assert.equal(fehlend(s,'npc3').length,1,'Original-Sollplatz dadurch unbesetzt');
});
test('Ein weiterhin vorhandenes Schiff ohne Förderware erfüllt seine Sollrolle nicht',()=>{
 const s=state();s.ships.sh010.ware=null;s.ships.sh010.auftrag='halten';
 assert.equal(fehlend(s,'npc3').length,1);
 s.ships.sh010.ware='silizium';
 assert.equal(fehlend(s,'npc3').length,0,'Identitätsabgleich prüft nicht den aktuellen Ort');
});
test('Am tatsächlichen Siliziumfeld Nadir kann derselbe Miner wieder fördern',()=>{
 const s=state();s.ships.sh010.system='nadir';foerderung(s,rules);
 assert.equal(s.ships.sh010.auftrag,'foerdern');
 assert.equal(s.ledger.silizium.mined,2);
 assert.equal(fehlend(s,'npc3').length,0);
});
const shipMoveSrc=x=>{
 const st=x.indexOf("case 'shipMove': {"),en=x.indexOf("case 'shipTrade': {",st);
 assert(st>0&&en>st);return x.slice(st,en);
};
function move(mode){
 const s=state();s.ships.sh010.auftrag='halten';s.ships.sh010.ware=null;
 const cmd={type:'shipMove',owner:'npc3',schiff:'sh010',ziel:'st_nadir'};
 const result=new Function('state','cmd','rules','m_core_route',
  'switch(cmd.type){'+shipMoveSrc(cores[mode])+'}return state.ships.sh010;')(
    s,cmd,rules,{route:()=>({zeit:60})});
 return result;
}
test('Native Rückfahrt bleibt auf halten und umgeht deshalb die bestehende Betriebskostenprüfung',()=>{
 const x=move('return_native');assert.equal(x.phase,'reise');
 assert.equal(x.auftrag,'halten');assert.equal(x.ware,null);
 assert(html.includes("if (s.auftrag === 'halten') continue;"));
});
test('B4-Kostenvariante setzt unterwegs ausdrücklich den originalen bezahlten Förderauftrag',()=>{
 const x=move('return_paid');assert.equal(x.phase,'reise');
 assert.equal(x.auftrag,'foerdern');assert.equal(x.ware,'silizium');
 assert.equal(x.ankunft,129721);
});
const activateSrc=x=>{
 const st=x.indexOf("case 'shipActivate': {"),en=x.indexOf("case 'shipHandeln': {",st);
 assert(st>0&&en>st);return x.slice(st,en);
};
function activate(mode){
 const s=state();s.ships.sh010.ware=null;s.ships.sh010.auftrag='halten';
 s.ships.sh010.ladung.frachter=1;s.ledger.frachter={consumed:0};s.nextShip=2;
 const cmd={type:'shipActivate',owner:'npc3',schiff:'sh010',klasse:'frachter'};
 const newShip=(s,fields)=>({id:'sh002',...fields});
 new Function('state','cmd','m_core_state',
   'switch(cmd.type){'+activateSrc(cores[mode])+'}return state;')(
  s,cmd,{neuesSchiff:newShip,protokolliere:()=>{}});
 return s;
}
test('Bewusste Aufgabe streicht genau den alten Miner-Sollplatz, aber keinen Kauf und keine Ware',()=>{
 const control=activate('control'),released=activate('release');
 assert.equal(control.sollflotte.npc3.length,1);
 assert.equal(released.sollflotte.npc3.length,0);
 assert.equal(Object.hasOwn(released.ships.sh010.ladung,'frachter'),false);
 assert.equal(released.ledger.frachter.consumed,1);
 assert.equal(released.owners.npc3.cash,control.owners.npc3.cash);
 assert.equal(released.nextShip,control.nextShip,'Hüllenaktivierung muss unverändert bleiben');
});
test('Produktcode bleibt nur in den jeweils vorgesehenen Befehlszweigen verändert',()=>{
 const paid=cores.return_paid,release=cores.release;
 assert.notEqual(paid,html);assert.notEqual(release,html);
 const moveHead=shipMoveSrc(paid),origMove=shipMoveSrc(html);
 assert(moveHead.includes("B4 ANALYSE: Rückkehr"));
 assert.equal(paid.replace(moveHead,origMove),html,'paid verändert nur shipMove');
 const activateHead=activateSrc(release),origActivate=activateSrc(html);
 assert(activateHead.includes('bewusster Verzicht'));
 assert.equal(release.replace(activateHead,origActivate),html,'release verändert nur shipActivate');
});
