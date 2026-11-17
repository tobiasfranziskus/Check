// W6/P8h: langer real finanzierter Rule207-NPC-Wiederanlauf S02 bis Tag 730.
// Der Versuch dokumentiert auch ein negatives dauerhaftes Produktionsergebnis.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const policy=W6.SZENARIEN.find(x=>x.id==='S02').politik;
const cash=s=>Object.values(s.owners).reduce((a,o)=>a+o.cash,0);
test('W6/P8h S02: 365 und 730 Tage ohne Gratisressourcen, negatives Ergebnis bleibt erlaubt',()=>{
 const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
 const s=w.createState(42,{politik:policy});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);w.materialSupplySetzen(s,true);
 w.npcMaterialKetteSetzen(s,true);
 let gekauft=0;const belege=[];
 const audit=(tag)=>{
   const a=w.audit(s);
   assert.equal(a.ok,true,'Tag '+tag+': '+a.fehler?.join('; '));
   assert.deepEqual(W6.pruefen(w,s),[],'unabhaengiger Tag '+tag+' Waren-/Geldaudit');
   assert.equal(cash(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
   assert.equal(w.hash(w.load(w.save(s))),w.hash(s),'Save/Load Tag '+tag);
   const flotten=Object.values(s.ships).filter(sh=>sh.owner==='transport'
     &&sh.klasse==='frachter'&&sh.system==='aldera'&&w.buchwert(s,sh.id)>0).length;
   belege.push({day:tag,hash:w.hash(s),w3:s.w3.abgeschlossen,
     fighterBuilt:s.kanon.jaeger.fertig,fighterSold:s.kanon.jaeger.verkauft,
     w5Ships:s.w5.fertig,viableAlderaFreighters:flotten,
     material:s.stations.st_nadir.lager.material,silicon:s.stations.st_nadir.lager.silizium,
     cash:{transport:s.owners.transport.cash,werft:s.owners.werft_extern.cash,
       nadir:s.owners.st_nadir.cash},worldISK:cash(s),mint:s.minted,burn:s.burned});
 };
 for(let t=120;t<=730*1440;t+=120){
   w.advance(s,120);
   if(s.stations.st_nadir.lager.jaeger>0&&s.owners.house.cash>=900&&gekauft<3){
     const purchase=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
     assert.equal(purchase.ok,true,purchase.reason);gekauft++;
   }
   if(t===90*1440||t===365*1440||t===730*1440)audit(t/1440);
 }
 assert.deepEqual(belege.map(x=>x.day),[90,365,730]);
 console.log('W6_P8H_S02_730_REALITAET',JSON.stringify({belege,bought:gekauft,
   begrenzteRohstoffe:true,erfolgszusage:false}));
});
