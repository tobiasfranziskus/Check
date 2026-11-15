// W6/P7 – schnelle unabhängige Beobachter-, Eingabe- und Unveränderlichkeitsregression.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const P7=require('../tools/w6-p7-silizium-langzeit.cjs');
const W6=require('../tools/w6-szenarien.cjs');

test('W6/P7: nur autorisierte Langzeithorizonte; kein unbeabsichtigter Stundenlauf',()=>{
 for(const invalid of [0,1,30,90,100,NaN,-180,Infinity,180.2])
  assert.throws(()=>P7.run(invalid),RangeError);
 assert.equal(typeof P7.run,'function');
 assert.equal(typeof P7.snapshot,'function');
 assert.equal(typeof P7.audit,'function');
});
test('W6/P7: unabhängige Beobachtung der echten S02-Welt verändert keine Core-Bytes',()=>{
 const S02=W6.SZENARIEN.find(x=>x.id==='S02');
 const {welt:w,s}=W6.start(S02.politik);
 w.npcSiliziumSetzen(s,true);
 const before=w.canonical(s),hash=w.hash(s),saved=w.save(s);
 const a=P7.snapshot(w,s);
 assert.equal(a.day,0);
 assert.equal(a.worldMoney,33000);
 assert.equal(a.playerCash,3000);
 assert.equal(a.fightersBuilt,0);
 assert.equal(a.siliconRemaining,16);
 assert.equal(a.siliconMined,0);
 assert.equal(a.playerFighterPurchases,0);
 assert.equal(s.kanon.npcSilizium.aktiv,true);
 assert.equal(w.canonical(s),before);
 assert.equal(w.hash(s),hash);
 assert.equal(w.save(s),saved);
 assert.deepEqual(W6.pruefen(w,s),[]);
});
