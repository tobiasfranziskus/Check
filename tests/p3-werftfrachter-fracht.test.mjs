import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {run}=require('../tools/p3-werftfrachter-fracht.cjs');
const J8=require('../prototypes/verbund/konzern-session.js');

test('P3 S02: produced W4/W5 hull, own 750 ISK, prepaid ferry, real mining; F4 fails atomically',()=>{
 const r=run(),point=id=>r.points.find(p=>p.label===id);
 assert.equal(r.ship,'sh004');assert.equal(r.miner,'sh005');
 assert.deepEqual(point('produced').production,{ore:50,w3:1,w4:5,w5:1});
 assert.equal(point('purchased').cash,2250);
 assert.equal(point('arrived').cash,2190);
 assert.equal(point('arrived').assets[0].heimat,'nadir');
 assert.equal(point('arrived').assets[0].system,'aldera');
 assert.equal(point('arrived').assets[0].verschleissMinuten,60);
 const ready=point('F4-offered');
 assert.equal(ready.tick,480);assert.equal(ready.stock.aldera.eis,50);
 assert.equal(ready.cash,1719);assert.equal(ready.equity,3030);
 assert.equal(ready.owners.st_nadir,3740);assert.equal(ready.owners.st_aldera,250);
 assert.equal(r.blocked.completed,0);assert.equal(r.blocked.revenue,0);
 assert.equal(r.blocked.wages,0);assert.equal(r.blocked.wear,0);
 assert.equal(r.points.at(-1).hash,'b90f5cbcb1957541');
 assert.equal(r.arrivalHash,'da11aacaa43f77bf');
 assert.equal(r.alternative.cash,1119);assert.equal(r.alternative.equity,3030);
 assert.equal(ready.equity-3000,30,'actual total surplus cannot fund a 600 ISK replacement');
 assert.equal(r.tamperedSavesRejected,8);
 assert.deepEqual(Object.keys(r.negatives),['noGoods','buyerBudget','workingCapital','shipCapacity']);
});

test('P3 S02: independent deterministic replay includes every hash and byte-identical Save/Load',()=>{
 const a=run(),b=run();assert.deepEqual(a,b);
 const restored=J8.erstellen();restored.oeffnen204(a.finalSave,true);
 const w=restored.weltReferenz(),hash=w.hash(restored.zustandReferenz());
 assert.equal(hash,a.points.at(-1).hash);
 assert.throws(()=>restored.ausfuehren('freight-'+a.ship),/K1-Spielerfracht\/Vertragslohn/);
 assert.equal(restored.exportieren(),a.finalSave);
 // Cold continuation of the legal (never rejected) state remains deterministic.
 const second=J8.erstellen();second.oeffnen204(b.finalSave,true);
 restored.weiterspielen(60);second.weiterspielen(60);
 assert.equal(restored.exportieren(),second.exportieren());
 assert.equal(w.audit(restored.zustandReferenz()).ok,true);
});
