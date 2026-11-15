// Unabhängiger Integrationscheck: authentischen öffentlichen J4e-Save erhalten,
// während manipulierte 31/33-Minuten-Werftbelege abgewiesen werden.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W=require('../prototypes/welt/welt-kern.js');
const raw=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
const profile=JSON.parse(raw).w5ad.profile;
const welt=W.erstellenJ4c({carrierCash:profile.carrierCash,buyerCash:profile.buyerCash});

test('J5-W eigenständig: gültiger öffentlicher Jäger-Save und Hash bleiben ohne Migration ladbar',()=>{
 const ursprung=welt.load(raw);
 const vorher=welt.hash(ursprung);
 assert.equal(ursprung.rulesVersion,204);
 assert.equal(welt.audit(ursprung).ok,true);
 assert.equal(ursprung.kanon.jaeger.belege.length,1);
 assert.equal(ursprung.kanon.jaeger.belege[0].ende-ursprung.kanon.jaeger.belege[0].start,32);
 assert.equal(welt.hash(welt.load(welt.save(ursprung))),vorher);
 assert.equal(ursprung.ships.sh023.owner,'house');
 assert.equal(ursprung.kanon.jaeger.kaeufe[0].preis,900);
 assert.equal(Object.values(ursprung.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(ursprung.minted,0);
 assert.equal(ursprung.burned,0);
 assert.equal(fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8'),raw);
});

for(const [name,delta] of [['verkürzter Beleg',1],['verlängerter Beleg',-1]]){
 test('J5-W eigenständig: '+name+' wird trotz korrekter übriger Konten verweigert',()=>{
   const gefaelscht=JSON.parse(raw);
   const original=gefaelscht.kanon.jaeger.belege[0];
   const start=original.start;
   original.start+=delta;
   assert.equal(original.ende-original.start,32-delta);
   // Weder Geld- noch Ware- oder Schiffsbestand wurde verändert:
   assert.equal(Object.values(gefaelscht.owners).reduce((n,o)=>n+o.cash,0),33000);
   assert.equal(gefaelscht.ships.sh023.owner,'house');
   assert.equal(gefaelscht.kanon.jaeger.lohnBezahlt,32);
   assert.equal(welt.audit(gefaelscht).ok,false);
   assert.throws(()=>welt.load(JSON.stringify(gefaelscht)),/ungültig|J4|Welt/);
   assert.equal(original.start,start+delta);
 });
}
