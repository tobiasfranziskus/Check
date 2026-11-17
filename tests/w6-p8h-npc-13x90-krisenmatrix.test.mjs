// W6/P8h: 13 voneinander unabhaengige 90-Tage-Regime aus der verbindlichen Matrix.
// Ein negatives Produktionsresultat gilt NICHT als Auditfehler und bleibt sichtbar.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const sum=s=>Object.values(s.owners).reduce((a,o)=>a+o.cash,0);
function audit(w,s,id,tag){
 const a=w.audit(s);assert.equal(a.ok,true,id+' Tag '+tag+': '+a.fehler?.join('; '));
 assert.deepEqual(W6.pruefen(w,s),[],id+' unabhängiger Waren-/Geldaudit Tag '+tag);
 assert.equal(sum(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s),id+' Save/Load Tag '+tag);
}
test('W6/P8h: alle 13 realen Szenarien je 90 Tage mit Opt-in, Insolvenzsperren und negativem Ergebnis',()=>{
 const results=[];
 for(const sz of W6.SZENARIEN){
   const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
   const s=w.createState(42,{politik:sz.politik});
   w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);w.materialSupplySetzen(s,true);
   w.npcMaterialKetteSetzen(s,true);
   let bought=0, firstHash=w.hash(s), lastW3=s.w3.abgeschlossen;
   for(let t=120;t<=90*1440;t+=120){
     w.advance(s,120);
     if(s.stations.st_nadir.lager.jaeger>0&&s.owners.house.cash>=900&&bought<3){
       const e=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
       assert.equal(e.ok,true,sz.id+': '+e.reason);bought++;
     }
     if(t%(30*1440)===0)audit(w,s,sz.id,t/1440);
   }
   audit(w,s,sz.id,90);
   const alive=Object.values(s.ships).filter(sh=>sh.owner==='transport'&&sh.klasse==='frachter'
     &&sh.system==='aldera'&&w.buchwert(s,sh.id)>0).length;
   results.push({id:sz.id,hash:w.hash(s),firstHash,
     fighterBuilt:s.kanon.jaeger.fertig,fighterSold:s.kanon.jaeger.verkauft,
     bought,freight:s.w3.abgeschlossen,extraOre:s.w3.abgeschlossen-lastW3,
     viableFreighters:alive,material:s.stations.st_nadir.lager.material,
     cash:{transport:s.owners.transport.cash,werft:s.owners.werft_extern.cash,
       nadir:s.owners.st_nadir.cash},worldCash:sum(s),mint:s.minted,burn:s.burned});
 }
 assert.equal(results.length,13);
 assert.ok(results.every(x=>x.worldCash===33000&&x.mint===0&&x.burn===0));
 console.log('W6_P8H_13x90_AUDITED_RESULTS',JSON.stringify(results));
});
