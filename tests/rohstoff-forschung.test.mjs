import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire,Module} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const G=require('../prototypes/welt/rohstoff-forschung-core.cjs');
const R=require('../tools/rohstoff-forschung.cjs');
const W6=require('../tools/w6-szenarien.cjs');
const policy=W6.SZENARIEN[1].politik;
const copy=x=>JSON.parse(JSON.stringify(x));
test('R1: alte 204/207 Zustände und RNG bitgleich gegen main-Quellen, JSON keine Migration',()=>{
 const cache={};
 function alt(path){
   if(cache[path])return cache[path].exports;
   const filename=require.resolve('../prototypes/welt/'+path),m=new Module(filename);cache[path]=m;
   m.filename=filename;m.paths=Module._nodeModulePaths(filename.slice(0,filename.lastIndexOf('/')));
   const native=createRequire(filename);
   m.require=id=>['./j2b-silizium-core.js','./rule200-k7-industry-core.js'].includes(id)?alt(id.slice(2)):native(id);
   m._compile(execFileSync('git',['show','bf8d4d27:'+ 'prototypes/welt/'+path],{encoding:'utf8'}),filename);return m.exports;
 }
 const original=alt('welt-kern.js');
 for(const factory of ['erstellenJ4c','erstellenP8d']){
   const a=K[factory](),b=original[factory](),s=a.createState(),t=b.createState();
   assert.equal(a.save(s),b.save(t));a.advance(s,3000);b.advance(t,3000);
   assert.equal(a.save(s),b.save(t));assert.equal(a.hash(s),b.hash(t));
   assert.equal(a.save(a.load(b.save(t))),b.save(t));
   assert.throws(()=>K.erstellenRohstoffForschung('A').load(b.save(t)),/Forschungswelt|fremde Regelversion/);
 }
 assert.throws(()=>K.erstellenRohstoffForschung(),/Profil/);
});
test('R1: Modellvertrag volle/leere Felder, genau ein Abbau pro Miner/Tick, neues Vorkommen ohne Ware',()=>{
 // Nur Geologiemodell: kein Beleg fuer rechtmaessige Wirtschaft; diese folgt im Replaytest.
 const w=K.erstellenRohstoffForschung('A'),s=w.createState(),g=G.create('A');g.konfigurieren(w.rules);
 const sh=Object.values(s.ships).find(x=>x.klasse==='miner'&&x.system==='aldera');
 for(let i=1;i<=400;i++){s.tick=i;assert.equal(g.menge(s,sh,'erz',20),1);g.abbauen(s,sh,'erz',1);assert.equal(g.menge(s,sh,'erz',20),0);}
 const f=s.kanon.rohstoffe.felder['aldera-erz'];assert.equal(f.restmenge,0);assert.equal(f.respawn,640);
 const ledger=copy(s.ledger),owners=copy(s.owners),ships=copy(s.ships);
 g.minute(s,639);assert.equal(f.restmenge,0);g.minute(s,640);assert.equal(f.restmenge,400);assert.equal(f.generation,1);
 g.minute(s,640);assert.equal(f.restmenge,400);assert.deepEqual(s.ledger,ledger);assert.deepEqual(s.owners,owners);assert.deepEqual(s.ships,ships);
 assert.equal(g.menge(s,{...sh,system:'nadir'},'erz',1),0);
 assert.equal(g.menge(s,sh,'kristall',1),0);
});
test('R1: reale bezahlte Kette, Wiederentdeckung, kalter JSON-Import und zwei identische Replays',()=>{
 function run(){const {w,s}=R.start('A',policy);w.advance(s,30*1440);R.audit(w,s);
   const json=w.save(s),other=K.erstellenRohstoffForschung('A');
   const loaded=other.load(json,{p8gImportFreigegeben:true});assert.equal(other.save(loaded),json);
   assert.throws(()=>K.erstellenP8d().load(json,{p8gImportFreigegeben:true}),/Forschungswelt|fremde Regelversion/);
   assert.throws(()=>K.erstellenRohstoffForschung('B').load(json,{p8gImportFreigegeben:true}));
   assert.ok(Object.values(s.kanon.rohstoffe.felder).some(f=>f.generation>0&&f.gefoerdert>f.maxkapazitaet));
   for(const mutate of [
     q=>q.kanon.rohstoffe.felder['aldera-erz'].restmenge++,
     q=>q.kanon.rohstoffe.felder['aldera-erz'].ereignisse.push(q.kanon.rohstoffe.felder['aldera-erz'].ereignisse[0]),
     q=>q.kanon.rohstoffe.felder['aldera-erz'].ereignisse[0].neu--,
     q=>q.kanon.rohstoffe.felder['aldera-erz'].respawn=1,
     q=>q.kanon.rohstoffe.felder['aldera-erz'].generation++,
     q=>q.kanon.rohstoffe.felder['aldera-erz'].ware='silizium'
   ]){const q=copy(s);mutate(q);assert.equal(w.audit(q).ok,false);assert.throws(()=>other.load(JSON.stringify(q),{p8gImportFreigegeben:true}));}
   return json;
 }
 assert.equal(run(),run());
});
test('R1: abgeschnittene Lohn-/Kaufbelege und Gratisware werden abgelehnt',()=>{
 const {w,s}=R.start('A',policy);w.advance(s,10*1440);R.audit(w,s);
 for(const change of [q=>q.ledger.erz.mined++,q=>q.owners.npc3.cash++,q=>q.kanon.silizium.arbeitsMinuten++,q=>q.w5n.mineLohn++,q=>Object.values(q.ships)[0].owner='house']){
   const q=copy(s);change(q);assert.equal(w.audit(q).ok,false,String(change));
 }
});
