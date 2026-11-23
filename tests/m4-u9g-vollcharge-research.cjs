'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {simulation}=require('../tools/m4-u9d-langzeit.cjs');
const {SZENARIEN,pruefen}=require('../tools/w6-szenarien.cjs');
const {erstellenU9f}=require('../prototypes/welt/welt-kern.js');
const sz=SZENARIEN.find(x=>x.id==='S02');
const weltFabrik=p=>erstellenU9f({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
test('U9g: actual full retired cargo at day 400, no cancellation, physical delivery and original accounting',()=>{
 let proof;
 const control=simulation(sz,400,42,'leerstorno',60,{weltFabrik,amEnde(w,s){
   const i=s.kanon.industrieErz,a=s.w3.auftrag,mi=s.ships[i.miner],fr=s.ships[a.schiff];
   assert.equal(i.miner,'sh366');assert.equal(a.schiff,'sh404');
   assert.equal(a.phase,'vorbestellt');assert.equal(i.erzAngenommen,false);
   assert.equal(mi.ladung.erz,50);assert.equal(w.stillgelegt(s,mi.id),true);
   assert.equal(w.stillgelegt(s,fr.id),false);
   const original=w.save(s),hash=w.hash(s),consent={hash,parteien:['st_nadir','st_aldera','npc3','transport','werft_extern']};
   for(const bad of [null,{...consent,hash:'wrong'},{...consent,parteien:consent.parteien.slice(1)}]){
     assert.equal(w.u9VollabnahmeProbe(s,bad).ok,false);assert.equal(w.save(s),original);
   }
   const result=w.u9VollabnahmeProbe(s,consent);
   assert.deepEqual(w.u9VollabnahmeProbe(w.load(original),consent),result);
   assert.equal(w.save(s),original);
   assert.equal(result.ok,true,result.reason);
   const q=w.load(result.json);
   assert.deepEqual(result.abrechnung,{menge:50,wert:500});
   assert.equal(q.stations.st_aldera.lager.erz,s.stations.st_aldera.lager.erz+50);
   assert.equal(q.ships[mi.id].ladung.erz||0,0);
   assert.equal(q.stats.verkaeufe[mi.id],s.stats.verkaeufe[mi.id]+1);
   assert.deepEqual(q.ledger,s.ledger);
   assert.deepEqual(q.w3,s.w3);
   assert.equal(q.kanon.industrieErz.erzAngenommen,true);
   for(const id of ['w3_kauf_treuhand','w3_arbeit_treuhand','k7_werft_treuhand'])
     assert.equal(q.owners[id].cash,s.owners[id].cash);
   assert.equal(w.u9VollabnahmeProbe(q,{...consent,hash:w.hash(q)}).ok,false);
   assert.deepEqual(pruefen(w,q),[]);
   w.advance(q,1);
   assert.equal(q.w3.auftrag.phase,'hin');
   assert.equal(q.ships[fr.id].ladung.erz,50);
   const start=q.w3.auftrag.start;
   w.advance(q,120);
   assert.ok(q.w5ad.freight.some(x=>x.id===fr.id&&x.start===start&&x.amount===50&&x.fee===240&&x.work===120));
   assert.equal(q.w3.abgeschlossen,s.w3.abgeschlossen+1);
   assert.equal(q.w3.storniert,s.w3.storniert);
   assert.deepEqual(pruefen(w,q),[]);
   proof={tick:s.tick,hash,acceptHash:result.hash,postHash:w.hash(q),miner:mi.id,carrier:fr.id,wert:500,menge:50,freight:240,work:120};
 }});
 assert.equal(control.verlauf.at(-1).eis,4380);
 assert.ok(proof);
 console.log('U9G_VOLL',JSON.stringify(proof));
});
