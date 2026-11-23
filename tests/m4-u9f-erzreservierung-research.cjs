'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {simulation}=require('../tools/m4-u9d-langzeit.cjs');
const {SZENARIEN,pruefen}=require('../tools/w6-szenarien.cjs');
const {erstellenU9f}=require('../prototypes/welt/welt-kern.js');
const sz=SZENARIEN.find(x=>x.id==='S02');
const fabrik=p=>erstellenU9f({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
test('U9f trace: real S02 hourly export collision, paired same-tick counterfactual',()=>{
 let before=null,proof=null;
 const control=simulation(sz,90,42,'leerstorno',undefined,{
  vorMinute(w,s){
   before=null;
   if(s.w3.auftrag?.industrieMiner==='sh080'&&s.tick%60===59){
    before={json:w.save(s),tick:s.tick,exported:s.ledger.erz.exported,stock:s.stations.st_aldera.lager.erz};
   }
  },
  nachMinute(w,s){
   if(!before||proof||s.ledger.erz.exported!==before.exported+1||
      s.stations.st_aldera.lager.erz!==49||s.w3.auftrag?.phase!=='vorbestellt')return;
   const alt=w.save(s),p=fabrik(s.w5ad.profile),q=p.load(before.json);
   assert.equal(p.hash(q),w.hash(w.load(before.json)));
   p.advance(q,1);
   assert.equal(q.ledger.erz.exported,before.exported);
   assert.equal(q.stations.st_aldera.lager.erz,50);
   assert.equal(q.kanon.industrieErz.erzAngenommen,true);
   p.advance(q,1);
   assert.equal(q.w3.auftrag.phase,'hin');
   assert.equal(q.ships[q.w3.auftrag.schiff].ladung.erz,50);
   assert.deepEqual(pruefen(p,q),[]);
   const json=p.save(q);assert.equal(p.save(p.load(json)),json);
   assert.equal(w.save(s),alt);
   proof={tick:before.tick+1,previousStock:before.stock,originalStock:49,
    originalExport:s.ledger.erz.exported,protectedExport:q.ledger.erz.exported,loaded:50,
    originalHash:w.hash(s),protectedHash:p.hash(q)};
  }
 });
 assert.equal(control.ende.hash,'502f0dd142bc55ba');
 console.log('U9F_TRACE',JSON.stringify(proof));
 assert.ok(proof,'No actual export collision observed: inspect original trace before concluding cause');
});
test('U9f explicit profile full paired replay, no claim of guaranteed recovery',()=>{
 const run=()=>simulation(sz,90,42,'leerstorno',40,{weltFabrik:fabrik});
 const a=run();assert.deepEqual(run(),a);
 assert.equal(a.verlauf.at(-1).weltgeld,33000);
 console.log('U9F_90',JSON.stringify(a));
});
