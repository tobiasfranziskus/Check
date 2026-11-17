// W6: the career diagnostic reads one authoritative Rule207 world, without NPC agency.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const V=require('../prototypes/spiel/silizium-versorgung.js');

test('P8g: W6 material and freight bottleneck is strictly read-only and financially grounded',()=>{
 const welt=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
 const zustand=welt.createState(42);
 const vorher=welt.save(zustand),hash=welt.hash(zustand);
 const lage=V.erstellen(welt,zustand);
 assert.equal(lage.regel,207);
 assert.ok(lage.frachtErsatz);
 const e=lage.frachtErsatz,nadir=zustand.stations.st_nadir.lager;
 const frachter=Object.values(zustand.ships).filter(sh=>sh.owner==='transport'&&sh.klasse==='frachter');
 const tauglich=sh=>welt.buchwert(zustand,sh.id)>0&&sh.phase==='dock'
   &&sh.flug?.lage==='angedockt'&&sh.auftrag==='halten'
   &&Object.values(sh.ladung||{}).every(n=>n===0);
 assert.equal(e.alderaBereit,frachter.filter(sh=>sh.system==='aldera'&&tauglich(sh)).length);
 assert.equal(e.nadirBereit,frachter.filter(sh=>sh.system==='nadir'&&tauglich(sh)
   &&!zustand.w5ac?.completed?.some(x=>x.id===sh.id)).length);
 assert.equal(e.fertigeHuellenNadir,nadir.frachter||0);
 assert.equal(e.speditionKasse,zustand.owners.transport.cash);
 assert.equal(e.werftKasse,zustand.owners.werft_extern.cash);
 assert.equal(e.materialNadir,nadir.material||0);
 assert.equal(e.materialFuerJ3J4UndW5,
   welt.rules.j3.material+welt.rules.j4.material+welt.rules.w5.material);
 assert.equal(e.materialLuecke,Math.max(0,e.materialFuerJ3J4UndW5-e.materialNadir));
 assert.ok(e.hinweis.length>30);
 assert.equal(welt.save(zustand),vorher,'diagnostic never writes world or saves');
 assert.equal(welt.hash(zustand),hash);
 assert.equal(welt.audit(zustand).ok,true);
 assert.equal(Object.values(zustand.owners).reduce((a,x)=>a+x.cash,0),33000);
 assert.equal(zustand.minted,0);
 assert.equal(zustand.burned,0);
 assert.equal(welt.hash(welt.load(vorher)),hash);
});

test('Original Regel204 receives no experimental Dravos replacement instruction',()=>{
 const welt=K.erstellenJ4c({carrierCash:2000,buyerCash:4000});
 const s=welt.createState(42),vorher=welt.save(s);
 const bericht=V.erstellen(welt,s);
 assert.equal(bericht.regel,204);
 assert.equal(bericht.frachtErsatz,null);
 assert.equal(welt.save(s),vorher);
});

test('Tampered accounting is rejected before an economic capacity hint',()=>{
 const welt=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
 const s=welt.createState(42);
 s.owners.transport.cash=-1;
 assert.throws(()=>V.erstellen(welt,s),/Audit|audit|pruefung|Prüfung|verweigert|Regel204/);
});
