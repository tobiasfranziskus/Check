// Zweiervergleich: Überfall explizit deaktiviert, restliche Piratenfunktionen unverändert.
import assert from 'node:assert/strict';
import test from 'node:test';
import {BASE,MODES,readCore,changePirates} from './piratenfrei-common.mjs';

const html=readCore();
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const normal=changePirates(source,'control'),peace=changePirates(source,'no_raids');
const declaration='function ueberfall(state, rules) {';
const injection=declaration+'\n  return; // Analyse: alle Überfallaktionen samt RNG-Auswahl ausschalten, keine anderen Piratenmechaniken.';
const unpack=s=>new Function(s+';return {c:m_core_index,r:m_data_rules.RULES,security:m_core_sicherheit};')();
const standard=unpack(normal),noRaid=unpack(peace);
const token=p=>p.match(/\bfunction ueberfall\(state, rules\) \{/g)?.length||0;

test('Originalkontrolle verwendet unveränderte v13-Produktlogik',()=>{
 assert.equal(normal,source);
 assert.equal(standard.r.rulesVersion,13);
 assert.deepEqual(MODES,['control','no_raids']);
});
test('Nur der Überfall-Einstieg erhält einen unmittelbaren Rücksprung',()=>{
 assert.equal(token(peace),1);
 assert.equal(peace,source.replace(declaration,injection));
 assert(peace.includes('function patrouille(state, rules)'));
 assert(peace.includes('function piratenErsatz(state, rules)'));
 assert(peace.includes('function schutzgeld(state, rules)'));
 assert(peace.includes('function escorteBewegen(state, rules)'));
});
test('Piratensysteme und Kampfparameter bleiben identisch',()=>{
 assert.deepEqual(noRaid.r,standard.r);
 assert.equal(noRaid.r.rulesVersion,13);
 assert.deepEqual(Object.keys(noRaid.r.world.systems),Object.keys(standard.r.world.systems));
});
test('Überfallaufruf verändert in friedlicher Variante keinen Zustand und verbraucht kein RNG',()=>{
 const state=noRaid.c.createState(42,noRaid.r),before=noRaid.c.hash(state);
 noRaid.security.ueberfall(state,noRaid.r);
 assert.equal(noRaid.c.hash(state),before);
 assert(noRaid.c.audit(state).ok);
});
test('Überfallschutz wirkt zu Beginn und im fortgeschrittenen Spiel',()=>{
 for(const seed of [42,1234]){
  const state=noRaid.c.createState(seed,noRaid.r);
  for(let t=0;t<3000;t++)noRaid.c.step(state,noRaid.r);
  const before=noRaid.c.hash(state);
  noRaid.security.ueberfall(state,noRaid.r);
  assert.equal(noRaid.c.hash(state),before);
  assert(noRaid.c.audit(state).ok);
 }
});
test('Test-Kern bleibt über Save/Load deterministisch und buchhalterisch korrekt',()=>{
 const state=noRaid.c.createState(7,noRaid.r);
 for(let t=0;t<1500;t++)noRaid.c.step(state,noRaid.r);
 const saved=noRaid.c.save(state),loaded=noRaid.c.load(saved,undefined,noRaid.r);
 assert.equal(noRaid.c.hash(loaded),noRaid.c.hash(state));
 assert.equal(loaded.schema,8);
 assert.equal(loaded.rulesVersion,13);
 assert(noRaid.c.audit(loaded).ok);
});
