'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {abnahme}=require('./w6-gesamtpaket.cjs');
const {pruefen}=require('./w6-szenarien.cjs');
const {angebot}=require('./w6-wasser-vorbestellung.cjs');
const id=process.argv[2]||'S08';
assert.ok(['S08','S02'].includes(id));
const expected={S08:'fabca2f65d3300cb',S02:'77aae111ae5163df'};
function check(w,s){
 const original=w.save(s);
 const request={schiff:id==='S08'?'sh002':'sh004',tarif:160,
  bestellungen:[{owner:id==='S08'?'eigner_npc3':'pilot_house',menge:100}]};
 const a=angebot(w,s,request);assert.equal(a.ok,true,JSON.stringify(a));
 const sig=a.angebot.parteien.map(owner=>({owner,angebot:a.angebot.id}));
 const result=w.w6WasserLieferProbe(s,request,sig);
 assert.equal(result.ok,true,JSON.stringify(result));
 const l=result.lieferung;
 assert.deepEqual([l.ende-l.start,l.menge,l.lohn,l.tarif,l.warenwert,l.stationsmarge,l.wertverzehr,l.aktivMinuten,l.verbraucht,l.kasseKauf,l.kasseLohn],
   [120,100,120,160,1400,40,36,120,100,0,0]);
 assert.deepEqual(l.belege.map(b=>[b.tick-l.start,b.phase,b.system,b.flug,b.ladung,b.kauf,b.lohn]),
 [[1,'hin','aldera','transit',0,1600,119],
  [60,'rueck','nadir','transit',100,1600,60],
  [119,'rueck','nadir','transit',100,1600,1],
  [120,'geliefert','aldera','angedockt',0,0,0]]);
 assert.equal(l.startDiagnose.schiff,request.schiff);
 assert.equal(l.startDiagnose.kauf,1600);
 assert.equal(l.startDiagnose.lohn,120);
 assert.equal(l.startDiagnose.auftrag,'w6-wasser');
 assert.ok(Object.values(l.startDiagnose.ladung).every(n=>n===0));
 if(id==='S02'){
   assert.ok(l.startDiagnose.w5ac,'S02: bought hull with genuine prior paid repositioning');
   assert.deepEqual(l.endeDiagnose.w5ac,l.startDiagnose.w5ac);
 }
 assert.equal(l.endeDiagnose.kauf,0);
 assert.equal(l.endeDiagnose.lohn,0);
 assert.equal(l.endeDiagnose.nadirWasser,l.startDiagnose.nadirWasser-100);
 assert.equal(l.endeDiagnose.alderaWasser,l.startDiagnose.alderaWasser);
 assert.equal(result.weltgeld,33000);
 assert.equal(result.mint,0);assert.equal(result.burn,0);
 assert.equal(result.importAbgelehnt,true);assert.equal(result.originalUnveraendert,true);
 assert.deepEqual(w.w6WasserLieferProbe(s,request,sig),result);
 assert.equal(w.w6WasserLieferProbe(s,request,[]).ok,false);
 assert.equal(w.w6WasserLieferProbe(s,{...request,tarif:100},sig).ok,false);
 const q=w.load(original);w.advance(q,1);
 assert.equal(w.w6WasserLieferProbe(q,request,sig).ok,false);
 assert.equal(w.save(s),original);assert.deepEqual(pruefen(w,s),[]);
 return {result,syntheticConsent:true,isolatedCopy:true,discretionaryPolicyPaused:true};
}
const r=abnahme(id,id==='S08'?90:365,42,'gesamt',true,check);
assert.equal(r.verlauf.at(-1).hash,expected[id]);
fs.writeFileSync(process.argv[3]||'report.json',JSON.stringify(r,null,2)+'\n');
console.log('W6_WASSER_LIEFERUNG '+JSON.stringify({id,hash:r.verlauf.at(-1).hash,...r.untersuchung,replay:r.replay}));
