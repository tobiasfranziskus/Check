// Independent Rule204 industrial evidence; no player/NPC rescue actions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url),R=require('../../tools/w6-industrie-langzeit.cjs'),W=require('../../tools/w6-szenarien.cjs');
const reference=JSON.parse(readFileSync(new URL('../fixtures/w6-industrie/reference.json',import.meta.url)));
for(const sz of W.SZENARIEN)test(`W6 Industrie ${sz.id}: 90 days, independent audits, save/load and replay`,()=>{
 const a=R.run(sz,90),b=R.run(sz,90);
 assert.deepEqual(a.result,b.result,'full deterministic replay including daily production');
 assert.equal(a.result.checkpoints.at(-1).hash,reference.matrix.find(x=>x.id===sz.id).checkpoints.at(-1).hash);
 assert.deepEqual(a.result.daily,reference.matrix.find(x=>x.id===sz.id).daily);
 assert.equal(a.s.owners.house.cash,3000,'no forced player demand');
 if(sz.id==='S03'){
  const before=a.w.hash(a.s),q=a.w.kern.pilotW5Verkauf(a.s);
  assert.equal(q.ok,true);assert.equal(q.preis,750);
  assert.equal(a.s.owners.werft_extern.cash,220);
  assert.equal(a.s.owners.transport.cash,1484);
  assert.equal(a.s.stations.st_nadir.lager.frachter,1);
  assert.ok(a.s.owners.transport.cash>=750+60+120,'real purchase, ferry and freight wage budget');
  assert.equal(a.w.hash(a.s),before,'diagnosis never rescues baseline');
  console.log('INDUSTRIE_MISSING_DECISION',JSON.stringify({hash:before,quote:q,ware:1,
   yardBefore:220,yardAfterPaidSale:220+q.preis,carrierBefore:1484,carrierAfterPaidSale:1484-q.preis}));
 }
 if(sz.id==='S06'){
  assert.equal(a.w.kern.pilotW4Kalkulation(a.s).ok,true);
  assert.equal(a.s.stations.st_nadir.lager.erz,30);
  assert.equal(a.s.owners.st_aldera.cash,216);
 }
 if(sz.id==='S02')assert.equal(a.result.checkpoints.find(x=>x.day===14).hash,'daafc5405c915767');
 console.log('INDUSTRIE_90',sz.id,JSON.stringify(a.result.checkpoints.at(-1)));
});
test('W6 Industrie S02: 365/730 days, replay from original initial save',()=>{
 const sz=W.SZENARIEN[1],a=R.run(sz,730);
 // This is a fresh, full replay of the independently generated reference run.
 const expected=JSON.parse(readFileSync(new URL('../fixtures/w6-industrie/reference.json',import.meta.url))).long;
 for(const day of [14,90,365,730]){
  assert.equal(a.result.checkpoints.find(x=>x.day===day).hash,
   expected.checkpoints.find(x=>x.day===day).hash,'reference replay day '+day);
 }
 assert.deepEqual(a.result.daily,expected.daily);
 assert.deepEqual([a.s.w3.abgeschlossen,a.s.w4.abgeschlossen,a.s.w5.fertig,a.s.w5.verkauft,a.s.kanon.ersatzkaeufe],[153,761,401,400,756]);
 assert.deepEqual(a.result.lastProgress,{w3:730,w4:730,w5:730});
 const sale=a.w.kern.pilotW5Verkauf(a.s);
 assert.equal(sale.ok,true);assert.equal(a.s.owners.werft_extern.cash,0);
 assert.equal(a.s.stations.st_nadir.lager.frachter,1);
 assert.equal(a.s.w5ad.purchases.reduce((n,r)=>n+r.preis,0),300750);
 console.log('INDUSTRIE_730',JSON.stringify(a.result.checkpoints.at(-1)));
 console.log('INDUSTRIE_730_NEXT_SALE',JSON.stringify(sale));
});
test('W6 independent audits detect cash, goods, ship and ownership corruption',()=>{
 const {welt:w,s}=R.start(W.SZENARIEN[1]);w.advance(s,300);R.audit(w,s);
 const changes=[s=>s.owners.house.cash++,s=>s.stations.st_nadir.lager.erz++,
  s=>delete s.ships.sh002,s=>s.ships.sh002.owner='house',s=>s.ships.sh001.owner='house',s=>{s.owners.house.cash++;s.owners.werft_extern.cash--;}];
 for(const change of changes){const bad=structuredClone(s);change(bad);
  assert.ok(R.independent(bad,w.rules).length,'independent detector must reject changed copy');
  assert.throws(()=>w.load(JSON.stringify(bad)),'authoritative load rejects tampering');
 }
});
test('S02 first original financing gates have exact minute evidence, not invented permanent deadlocks',()=>{
 const events=R.trace(W.SZENARIEN[1],15);
 assert.deepEqual(events.map(e=>[e.tick,e.reason]),reference.trace.map(e=>[e.tick,e.reason]));
 const first=events.find(e=>e.reason.includes('nächste Eischarge'));
 assert.equal(first.tick,3192);assert.equal(first.state.cash.st_aldera,87);
 const yard=events.find(e=>e.reason.startsWith('Minerwerft:'));
 assert.equal(yard.tick,12409);assert.equal(yard.state.cash.werft_extern,0);
 assert.equal(yard.state.stock.nadir.frachter,2);
 console.log('INDUSTRIE_FIRST_GATES',JSON.stringify(events));
 const crisis=R.trace(W.SZENARIEN[2],15);
 assert.deepEqual(crisis.map(e=>[e.tick,e.reason]),reference.traceS03.map(e=>[e.tick,e.reason]));
 const firstYard=crisis.find(e=>e.reason.startsWith('Werft:'));
 assert.equal(firstYard.tick,6552);assert.equal(firstYard.state.cash.werft_extern,70);
 assert.equal(firstYard.state.stock.nadir.material,5);
});

test('industrial evidence pins the unchanged production core and scenario catalogue',()=>{
 for(const [path,expected] of Object.entries(reference.sourceSha256))
  assert.equal(createHash('sha256').update(readFileSync(new URL('../../'+path,import.meta.url))).digest('hex'),expected,path);
 assert.equal(reference.matrix.length,13);
 assert.equal(new Set(reference.matrix.map(x=>JSON.stringify(x.policy))).size,13);
});
