import assert from 'node:assert/strict';
import test from 'node:test';
import {BASE,MODES,readCore,changePirates} from './piraten-einstieg-common.mjs';
const html=readCore();
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const engines={};
for(const mode of MODES){
 const adapted=changePirates(source,mode);
 if(mode==='control')assert.equal(adapted,source,'Kontrolle byteidentisch');
 else assert.notEqual(adapted,source,'Variante verändert nur Testsynthese');
 const extra="return {c:m_core_index,r:m_data_rules.RULES,security:m_core_sicherheit,create:m_core_state.neuesSchiff};";
 const exposed=adapted.replace("return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen };",
   "return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen, "+
   (mode==='control'?"ueberfall":"piratenBerechtigt")+" };");
 engines[mode]=new Function(exposed+';'+extra)();
 assert.equal(engines[mode].r.rulesVersion,13);
}
const pirate=(mode)=>engines[mode];
function ship(id='shTEST'){return {id,owner:'npc3',klasse:'frachter',phase:'dock',system:'meridian',auftrag:'handeln',heimat:'meridian',ladung:{},arbeit:0,ware:null};}
test('Kontrolle ist bytegleich zu main und vier Varianten verändern keine echten Regeln',()=>{
 assert.equal(changePirates(source,'control'),source);
 assert(source.includes("const ziele = ids(state.ships).filter((id) => zivil(rules, state.ships[id], system));"));
});
test('20 Tage Schutz nach Indienststellung, direkt vor und nach Grenztick',()=>{
 const e=pirate('grace20'),s=e.c.createState(42,e.r),sh=ship();
 sh.erstelltTick=100;
 s.tick=100+20*1440-1;assert(!e.security.piratenBerechtigt(s,e.r,sh,'meridian'));
 s.tick++;assert(e.security.piratenBerechtigt(s,e.r,sh,'meridian'));
});
test('Neu angelegte Schiffe speichern ihren tatsächlichen Entstehungstick',()=>{
 const e=pirate('grace20'),s=e.c.createState(42,e.r);
 s.tick=129663;
 const sh=e.create(s,{owner:'npc3',klasse:'frachter',heimat:'aldera',system:'aldera',auftrag:'handeln'});
 assert.equal(sh.erstelltTick,s.tick);
 const copy=e.c.load(e.c.save(s),undefined,e.r);
 assert.equal(copy.ships[sh.id].erstelltTick,129663);
 assert.equal(e.c.hash(copy),e.c.hash(s));
});
test('Alte Spielstände ohne Geburtsticker werden nicht plötzlich am Tag 90 immun',()=>{
 const e=pirate('grace20'),s=e.c.createState(42,e.r),sh=ship();
 s.tick=90*1440;
 assert(e.security.piratenBerechtigt(s,e.r,sh,'meridian'));
});
test('Kapitalgrenze 4000 ISK wirkt unmittelbar und ist dadurch bewusst umgehbar',()=>{
 const e=pirate('capital4000'),s=e.c.createState(42,e.r),sh=ship();
 s.owners.npc3.cash=3999;assert(!e.security.piratenBerechtigt(s,e.r,sh,'meridian'));
 s.owners.npc3.cash=4000;assert(e.security.piratenBerechtigt(s,e.r,sh,'meridian'));
 s.owners.npc3.cash=3999;assert(!e.security.piratenBerechtigt(s,e.r,sh,'meridian'));
});
test('Drei echte Core-Verkäufe aktivieren die Aktivitätsregel',()=>{
 const e=pirate('activity'),s=e.c.createState(42,e.r),sh=ship();
 s.stats.verkaeufe[sh.id]=2;assert(!e.security.piratenBerechtigt(s,e.r,sh,'meridian'));
 s.stats.verkaeufe[sh.id]=3;assert(e.security.piratenBerechtigt(s,e.r,sh,'meridian'));
});
test('Wertvolle Fracht ermöglicht Piratenangriff sofort, leere Fracht nicht',()=>{
 const e=pirate('activity'),s=e.c.createState(42,e.r),sh=ship();
 s.stats.verkaeufe[sh.id]=0;
 assert(!e.security.piratenBerechtigt(s,e.r,sh,'meridian'));
 sh.ladung.silizium=100;assert(e.security.piratenBerechtigt(s,e.r,sh,'meridian'));
});
test('Keine Zustands-/Geldmutation allein durch die neuen Zielberechtigungsprüfungen',()=>{
 for(const mode of ['grace20','capital4000','activity']){
  const e=pirate(mode),s=e.c.createState(42,e.r),before=e.c.hash(s);
  e.security.piratenBerechtigt(s,e.r,ship(),'meridian');
  assert.equal(e.c.hash(s),before,mode);
 }
});
