import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J7=require('../prototypes/verbund/kompatibilitaet.js');
const Session=require('../prototypes/w5ac/session.js');
const create=()=>Session.create(42,'private195');

test('J7: vollständige Original-Regel195-Übernahmekette auf unveränderter, real finanzierter Ausgangswelt',()=>{
 const session=create(),original=session.export(),hash=session.snapshot().hash;
 const a=J7.untersuchen(original);
 assert.equal(a.ok,true,JSON.stringify(a));
 assert.deepEqual(a.schritte.map(x=>x.von+'→'+x.nach),['195→199','199→200','200→201','201→202','202→203','203→204']);
 assert.equal(a.originalUnveraendert,true);
 assert.equal(a.weltgeld,33000);assert.equal(a.eigenerJägerGekauft,false);
 assert.equal(a.cockpitSofortNutzbar,false,'Kein kostenloser Jäger beim Regelupgrade');
 assert.equal(session.export(),original);
 assert.equal(session.snapshot().hash,hash);
 assert.deepEqual(J7.untersuchen(original),a,'identischer Quellzustand liefert deterministischen Prüfbericht');
});
test('J7: manipulierter Geldwert, falsches Schema und unlesbare Quelle werden abgewiesen',()=>{
 const src=create().export(),state=JSON.parse(src);
 const kaputt={...state,owners:{...state.owners,house:{...state.owners.house,cash:state.owners.house.cash+1}}};
 const m=J7.untersuchen(JSON.stringify(kaputt));
 assert.equal(m.ok,false);
 assert.equal(m.stufe,'195→199');
 for(const x of [null,'', '{','[]',JSON.stringify({...state,rulesVersion:194}),JSON.stringify({...state,schema:9})]){
  const r=J7.untersuchen(x);
  assert.equal(r.ok,false);
 }
 assert.equal(J7.untersuchen(src).ok,true,'Fehlversuche verändern den validen Originalzustand nicht');
});
test('J7: bestehende laufende Wirtschaft wird weder still zurückgesetzt noch manipuliert',()=>{
 const s=create();
 assert.equal(s.command({type:'freightBuy'}).ok,true);
 const original=s.export(),hash=s.snapshot().hash;
 const result=J7.untersuchen(original);
 assert.equal(typeof result.ok,'boolean');
 assert.equal(s.export(),original);
 assert.equal(s.snapshot().hash,hash);
 if(!result.ok){
  assert.ok(/^\d+→\d+$/.test(result.stufe));
  assert.ok(result.reason.length>0);
  assert.equal(result.originalUnveraendert,true);
 }else{
  assert.equal(result.weltgeld,33000);
  assert.equal(result.cockpitSofortNutzbar,false);
 }
});
