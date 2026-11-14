/* K13 + F6 in einem gemeinsamen, deterministischen Forschungsweltkern. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');

test('F6-Flugfunktionen und K7-Industrie verwenden einen einzigen Rule200-Zustand',()=>{
  const welt=Welt.erstellenK7({});
  assert.equal(welt.rules.rulesVersion,200);
  assert.equal(typeof welt.torPruefen,'function');
  assert.equal(typeof welt.torFrachtPruefen,'function');
  assert.equal(typeof welt.execute,'function');
  const s=welt.createState(42);
  assert.equal(s.rulesVersion,200);
  assert.equal(s.kanon.industrieErz.phase,'frei');
  assert.equal(welt.audit(s).ok,true);
  assert.equal(Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0),33000);
  for(let i=0;i<10;i++)welt.minute(s);
  assert.equal(welt.audit(s).ok,true);
  const loaded=welt.load(welt.save(s));
  assert.equal(welt.hash(s),welt.hash(loaded));
  const replay=welt.createState(42);
  for(let i=0;i<10;i++)welt.minute(replay);
  assert.equal(welt.hash(s),welt.hash(replay));
});

test('Regel199 bleibt getrennt; industrielle Regel200 ist nur Opt-in',()=>{
  const k1=Welt.erstellen({}),k7=Welt.erstellenK7({});
  assert.equal(k1.rules.rulesVersion,199);
  assert.equal(k7.rules.rulesVersion,200);
  assert.equal(k1.audit(k1.createState(7)).ok,true);
  assert.equal(k7.audit(k7.createState(7)).ok,true);
});
