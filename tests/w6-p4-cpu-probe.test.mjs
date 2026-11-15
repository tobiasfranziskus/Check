// W6 [ANALYSE]: CPU-Probe auf einem original erzeugten 30-Tage-S02-Zustand.
// NICHT als isolierter Vorher/Nachher-Vergleich zu #389 interpretieren:
// minute() besitzt auch die vorhandene Idle-Abkuerzung. Hauptaussage ist
// die kanonische Gleichheit und eine beobachtete CPU-Rate im CI-System.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W6=require('../tools/w6-szenarien.cjs');
const S02=W6.SZENARIEN.find(x=>x.id==='S02').politik;
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];

test('W6 S02: CPU- und Kanon-Probe gegen echte 60 Einzel-Flugschritte ab Tag 30',()=>{
 const {welt:w,s}=W6.start(S02);
 w.advance(s,30*1440);
 assert.deepEqual(W6.pruefen(w,s),[]);
 const basis=w.save(s),minuten=360;
 const proben={minute:[],einzeln:[]};
 for(let r=0;r<3;r++) {
   const result={};
   for(const modus of (r%2 ? ['einzeln','minute'] : ['minute','einzeln'])) {
     const z=w.load(basis);
     const vor=process.cpuUsage();
     for(let i=0;i<minuten;i++){
       if(modus==='minute')w.minute(z);
       else for(let j=0;j<60;j++)w.teilschritt(z);
     }
     const cpu=process.cpuUsage(vor);
     assert.deepEqual(W6.pruefen(w,z),[]);
     result[modus]={cpuMs:(cpu.user+cpu.system)/1000,kanon:w.canonical(z),hash:w.hash(z)};
   }
   assert.equal(result.minute.kanon,result.einzeln.kanon,'Original-Teilschritte muessen denselben Zustand liefern');
   assert.equal(result.minute.hash,result.einzeln.hash);
   proben.minute.push(result.minute.cpuMs);
   proben.einzeln.push(result.einzeln.cpuMs);
 }
 const a=median(proben.minute),b=median(proben.einzeln);
 console.log('W6_S02_CPU_PROBE',JSON.stringify({
  tag:30,historischeHuellen:Object.keys(s.ships).length,
  minutenProMessung:minuten,wiederholungen:3,
  cpuMedianMs:{minute:a,einzeln:b},beobachteterFaktor:Number((b/a).toFixed(3)),
  keinIsolierterVorherNachherVergleich:true,kanonischIdentisch:true}));
});
