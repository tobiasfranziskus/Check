/* Issue469: Forschung A/B/C, Originalpolitik und Originalbefehle; kein Gratisstart. */
'use strict';
const assert=require('node:assert/strict');
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('./w6-szenarien.cjs');
function start(profil,politik){
 const w=profil==='alt'?K.erstellenP8d({carrierCash:2000,buyerCash:4000}):K.erstellenRohstoffForschung(profil);
 const s=w.createState(42,{politik});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);w.materialSupplySetzen(s,true);w.npcMaterialKetteSetzen(s,true);
 return {w,s};
}
function audit(w,s){
 const a=w.audit(s);assert.equal(a.ok,true,a.fehler.join('; '));assert.deepEqual(W6.pruefen(w,s),[]);
 const json=w.save(s);assert.equal(w.save(w.load(json)),json);
}
function messung(w,s){
 const b=w.bericht(s);
 return {tag:s.tick/1440,hash:w.hash(s),gefoerdert:Object.fromEntries(['erz','eis','silizium','kristall'].map(k=>[k,s.ledger[k]?.mined||0])),
 verkauft:{erz:s.ledger.erz.exported,eis:s.w5n.mineVerkauft,silizium:s.kanon.silizium.verkauft,kristall:0},
 loehne:b.loehne,weltgeld:b.weltgeld,mint:s.minted,burn:s.burned,jaeger:s.kanon.jaeger.fertig,
 kassen:{nadir:s.owners.st_nadir.cash,transport:s.owners.transport.cash,werft:s.owners.werft_extern.cash},
 felder:s.kanon.rohstoffe?Object.values(s.kanon.rohstoffe.felder).map(f=>({id:f.feldId,rest:f.restmenge,gefoerdert:f.gefoerdert,generation:f.generation,respawn:f.respawn})):s.kanon.silizium.felder};
}
function lauf(profil,sz,tage){
 const {w,s}=start(profil,sz.politik);let gekauft=0;const belege=[];
 for(let t=120;t<=tage*1440;t+=120){
   w.advance(s,120);
   if(s.stations.st_nadir.lager.jaeger>0&&s.owners.house.cash>=900&&gekauft<3){
     assert.equal(w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'}).ok,true);gekauft++;
   }
   if(t%(30*1440)===0||t===365*1440||t===tage*1440){audit(w,s);if([90,365,730].includes(t/1440))belege.push(messung(w,s));}
 }
 return {profil,id:sz.id,tage,gekauft,belege};
}
module.exports={start,audit,messung,lauf};
if(require.main===module){
 for(const profil of (process.argv[2]||'alt,A,B,C').split(',')){
  for(const sz of W6.SZENARIEN)console.log(JSON.stringify(lauf(profil,sz,sz.id==='S02'?730:90)));
 }
}
