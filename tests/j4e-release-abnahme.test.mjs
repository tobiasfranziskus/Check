// Unabhängige Ergänzungen; Root-/NAS- und Regel195-Fälle liegen bereits in der Gesamtsuite.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), W=require('../prototypes/welt/welt-kern.js');
const json=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
const raw=JSON.parse(json),w=W.erstellenJ4c(raw.w5ad.profile);
const geld=s=>Object.values(s.owners).reduce((n,a)=>n+a.cash,0);
function bilanz(s){
 assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));
 assert.equal(geld(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 for(const [ware,l] of Object.entries(s.ledger)){
  const physisch=[...Object.values(s.stations).map(x=>x.lager),...Object.values(s.ships).map(x=>x.ladung)].reduce((n,x)=>n+(x[ware]||0),0);
  assert.equal(physisch,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,ware);
 }
}
test('Unabhängige Referenz und physische Waren-/Eigentumsbilanz des öffentlichen Beispiels',()=>{
 const s=w.load(json);bilanz(s);assert.equal(w.hash(s),'daec00c7618a6cd7');
 assert.equal(w.save(s),json);assert.equal(s.rng,42);
 assert.equal(s.kanon.jaeger.bauteileVerbraucht,8);assert.equal(s.kanon.jaeger.materialVerbraucht,4);
 assert.equal(s.kanon.jaeger.lohnBezahlt,32);assert.equal(s.owners.j4_jaeger_arbeiter.cash,32);
 const b=s.kanon.jaeger.belege[0];assert.equal(b.ende-b.start,32);
 assert.equal(s.kanon.jaeger.kaeufe[0].preis,900);assert.equal(s.ships.sh023.owner,'house');
 console.log('AUDIT_SAMPLE',JSON.stringify({hash:w.hash(s),sha256:createHash('sha256').update(json).digest('hex'),tick:s.tick,ships:Object.keys(s.ships).length,geld:geld(s)}));
});
const faelle={
 mint:s=>s.minted++, burn:s=>s.burned++,geld:s=>s.owners.house.cash++,
 umbuchung:s=>{s.owners.house.cash++;s.owners.st_nadir.cash--;},
 eigentum:s=>s.ships.sh023.owner='npc3',gratisKauf:s=>s.kanon.jaeger.kaeufe[0].preis=0,
 werftlohn:s=>s.kanon.jaeger.lohnBezahlt--,ware:s=>s.stations.st_nadir.lager.material++,
 gratisSchiff:s=>s.ships.fake={...s.ships.sh023,id:'fake'},
 zukunft:s=>s.rulesVersion=205,alt:s=>s.rulesVersion=195,schema:s=>s.schema=99,
};
for(const [name,change] of Object.entries(faelle))test('Import weist Manipulation ab: '+name,()=>{
 const s=JSON.parse(json);change(s);assert.throws(()=>w.load(JSON.stringify(s)),name);
 assert.equal(w.hash(w.load(json)),'daec00c7618a6cd7','Original bleibt ladbar');
});
test('Ungültiges JSON wird abgewiesen',()=>{for(const text of ['{','null','[]','{}'])assert.throws(()=>w.load(text));});
for(const seed of [42,7])test('Seed '+seed+': Start, Replay, Save/Load und Gratisbefehle',()=>{
 const a=w.createState(seed),b=w.createState(seed);bilanz(a);
 for(const s of [a,b]){
  assert.equal(w.execute(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'jaeger'}).ok,false);
  for(let i=0;i<120;i++)w.teilschritt(s);
  bilanz(s);
 }
 assert.equal(w.hash(a),w.hash(b));assert.equal(w.hash(w.load(w.save(a))),w.hash(a));
 console.log('AUDIT_SEED',seed,w.hash(a));
});
