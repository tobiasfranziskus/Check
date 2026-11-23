'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {lauf}=require('../tools/m4-management-szenarien.cjs');
const {SZENARIEN,pruefen}=require('../tools/w6-szenarien.cjs');

function approvals(welt,s){
 return {hash:welt.hash(s),parteien:['st_nadir','st_aldera','npc3',
   s.kanon.industrieErz.carrier??'transport','werft_extern']};
}
test('U9b: real S02 blocked partial cargo, exact consent, original settlement, replay',()=>{
 const sz=SZENARIEN.find(x=>x.id==='S02');let proof;
 const report=lauf(sz,30,42,true,'konzerne',{amEnde(welt,s){
   const original=welt.save(s),a=s.w3.auftrag,i=s.kanon.industrieErz,mi=s.ships[i.miner];
   assert.equal(welt.hash(s),'478696c8bbb0c153');
   assert.equal(a.phase,'vorbestellt');assert.equal(mi.ladung.erz,22);
   assert.equal(welt.stillgelegt(s,mi.id),true);
   const consent=approvals(welt,s);
   for(const bad of [null,{...consent,hash:'wrong'},{...consent,parteien:consent.parteien.slice(1)},
      {...consent,parteien:['house','house','house','house','house']}]){
     assert.equal(welt.u9TeilabrechnungProbe(s,bad).ok,false);
     assert.equal(welt.save(s),original);
   }
   const attempt=welt.u9TeilabrechnungProbe(s,consent);
   assert.deepEqual(welt.u9TeilabrechnungProbe(welt.load(original),consent),attempt);
   assert.equal(welt.save(s),original);
   proof={ok:attempt.ok,aldera:s.owners.st_aldera.cash,meridian:s.owners.npc3.cash,
      ladung:mi.ladung.erz,w1:s.erzpilotVertraege?.[mi.id]??null};
   if(!attempt.ok){
     // A real financing or stock-capacity barrier is a legitimate research outcome.
     assert.match(attempt.reason,/Teilmenge nicht vollständig gedeckt|Reservierter Erzauftrag kann nicht bezahlt werden/);
     proof.reason=attempt.reason;
     return;
   }
   const q=welt.load(attempt.json),carrier=i.carrier??'transport';
   assert.deepEqual(attempt.abrechnung,{menge:22,wert:220});
   assert.equal(q.ships[mi.id].ladung.erz||0,0);
   assert.equal(q.stations.st_aldera.lager.erz,s.stations.st_aldera.lager.erz+22);
   assert.equal(q.w3.auftrag,null);assert.equal(q.kanon.industrieErz.phase,'storniert');
   assert.equal(q.owners.st_nadir.cash,s.owners.st_nadir.cash+740);
   assert.equal(q.owners[carrier].cash,s.owners[carrier].cash+120);
   assert.equal(q.owners.werft_extern.cash,s.owners.werft_extern.cash+530);
   assert.equal(q.owners.w3_kauf_treuhand.cash,0);
   assert.equal(q.owners.w3_arbeit_treuhand.cash,0);
   assert.equal(q.owners.k7_werft_treuhand.cash,0);
   assert.equal(q.w3.frachtUmsatz,s.w3.frachtUmsatz);
   assert.equal(q.w3.arbeitsKosten,s.w3.arbeitsKosten);
   assert.equal(q.w3.geliefert,s.w3.geliefert);
   assert.equal(q.minted,s.minted);assert.equal(q.burned,s.burned);
   assert.deepEqual(q.ledger,s.ledger);
   assert.deepEqual(Object.fromEntries(Object.entries(q.ships).map(([k,v])=>[k,v.owner])),
                    Object.fromEntries(Object.entries(s.ships).map(([k,v])=>[k,v.owner])));
   assert.deepEqual(pruefen(welt,q),[]);
   assert.equal(welt.save(q),attempt.json);
   assert.equal(welt.u9TeilabrechnungProbe(q,approvals(welt,q)).ok,false);
   proof.hash=attempt.hash;proof.after=welt.bericht(q).gebunden;
   const before=q.w3.abgeschlossen,ice=q.w5n.frachtAbgeschlossen;
   const replay=welt.load(attempt.json);
   for(let d=0;d<7;d++){welt.advance(q,1440);welt.advance(replay,1440);}
   assert.equal(welt.hash(q),welt.hash(replay));assert.deepEqual(pruefen(welt,q),[]);
   proof.followUp={ore:q.w3.abgeschlossen-before,ice:q.w5n.frachtAbgeschlossen-ice,hash:welt.hash(q)};
 }});
 assert.equal(report.verlauf.at(-1).gebunden,1390);
 assert.ok(proof);
 console.log('U9B_TEILABRECHNUNG',JSON.stringify(proof));
});
