'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {SZENARIEN}=require('../tools/w6-szenarien.cjs');
const {marktS02}=require('../tools/m4-management-szenarien.cjs');
const {restAktivMinuten,vorpruefung,experiment}=require('../tools/m4-u9-vertragsvorsorge.cjs');

test('U9: exact original wear threshold; read-only inquiry',()=>{
 const {welt,s}=marktS02(),json=welt.save(s);
 for(const sh of Object.values(s.ships).filter(x=>x.klasse==='miner')){
   const limit=Math.ceil(welt.rules.economy.waren.miner.basis*1000/welt.daten.verschleiss.milliJeMinute.miner);
   assert.equal(restAktivMinuten(welt,s,sh.id),s.kanon.politik.stilllegung?
      Math.max(0,limit-(s.kanon.verschleiss[sh.id]||0)):null);
 }
 vorpruefung(welt,s);
 assert.equal(welt.save(s),json);
});

test('U9: S02 original 30-day blocker and counterfactual, no fabricated rescue',()=>{
 const sz=SZENARIEN.find(x=>x.id==='S02');
 const base=experiment(sz,30,42,false),variant=experiment(sz,30,42,true);
 const original=base.report.verlauf.at(-1),neu=variant.report.verlauf.at(-1);
 assert.equal(original.hash,'478696c8bbb0c153');
 assert.equal(original.gebunden,1390);
 assert.equal(original.aktiveAuftraege.w3.phase,'vorbestellt');
 const miner=original.huellen.find(x=>x.id===original.aktiveAuftraege.w3.industrieMiner);
 assert.equal(miner.stillgelegt,true);
 assert.equal(miner.ladung.erz,22);
 assert.equal(original.stornoProbeNadir.ok,false);
 assert.ok(base.protokoll.length>0);
 for(const x of [...base.report.verlauf,...variant.report.verlauf])assert.equal(x.weltgeld,33000);
 for(const p of variant.protokoll.filter(x=>x.storno)) assert.equal(p.status,'STILLLEGUNG_VOR_VOLLER_CHARGE');
 assert.ok(base.protokoll.every(x=>!x.storno));
 console.log('U9_VORPRUEFUNG',JSON.stringify({base:base.protokoll,variant:variant.protokoll,
   original:{hash:original.hash,gebunden:original.gebunden,frachten:original.auftraege,storno:original.stornoProbeNadir},
   neu:{hash:neu.hash,gebunden:neu.gebunden,frachten:neu.auftraege,storno:neu.stornoProbeNadir}}));
});
