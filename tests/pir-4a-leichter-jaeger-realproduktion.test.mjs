// Test-only isolated runtime copies. Never publish or import experimental saves.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W6=require('../tools/w6-szenarien.cjs');
const original=require('../prototypes/welt/welt-kern.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../prototypes');
const entry='welt/welt-kern.js',factory='welt/rule200-k7-industry-core.js';
const files=[entry,factory,'flug2d/flug-kern.js','welt/j2b-silizium-core.js',
 'welt/j3-bauteil-core.js','welt/j4b-jaeger-werft-core.js','welt/p8d-dravos-fracht-core.js'];
const source=Object.fromEntries(files.map(p=>[p,fs.readFileSync(path.join(root,p),'utf8')]));
const variants=[
 {name:'original',parts:8,mat:4,duration:32,price:900},
 {name:'compact',parts:3,mat:2,duration:16,price:450},
 {name:'half',parts:4,mat:2,duration:16,price:550}
];
function once(s,a,b){assert.equal(s.split(a).length,2,'exactly one original parameter');return s.replace(a,()=>b);}
function isolated(v){
 const cache=new Map();
 function load(p){
  if(cache.has(p))return cache.get(p).exports;
  assert.ok(Object.hasOwn(source,p),'only listed original CommonJS modules: '+p);
  const mod={exports:{}};cache.set(p,mod);
  let code=source[p];
  if(p===factory){
   code=once(code,"jaeger: { stufe: 'schiff', basis: 900 }",`jaeger: { stufe: 'schiff', basis: ${v.price} }`);
   code=once(code,"r_jaeger: { ein: { bauteil: 8, material: 4 }, aus: { jaeger: 1 }, ort: 'werft', dauer: 32 }",
    `r_jaeger: { ein: { bauteil: ${v.parts}, material: ${v.mat} }, aus: { jaeger: 1 }, ort: 'werft', dauer: ${v.duration} }`);
  }
  // Compile only trusted repository source, no player input, no global require/cache edits.
  new Function('module','exports','require',code)(mod,mod.exports,x=>load(path.posix.normalize(path.posix.join(path.posix.dirname(p),x))));
  return mod.exports;
 }
 return load(entry);
}
const capital={carrierCash:2000,buyerCash:4000};
const policy=W6.SZENARIEN.find(x=>x.id==='S02').politik;
function audit(w,s){
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
}
function run(v,cap,api=isolated(v)){
 const w=api.erstellenJ4c(capital),s=w.createState(42,{politik:policy});
 assert.equal(w.rules.j4.bauteile,v.parts);assert.equal(w.rules.j4.material,v.mat);
 assert.equal(w.rules.j4.dauer,v.duration);assert.equal(w.rules.j4.verkaufspreis,v.price);
 assert.equal(w.rules.economy.waren.jaeger.basis,v.price);
 assert.equal(w.rules.economy.waren.miner.basis,600);assert.equal(w.rules.economy.waren.frachter.basis,750);
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 const initial=w.hash(s),buys=[],points=[];
 audit(w,s);
 let checkpoint=null;
 for(let t=120;t<=30*1440;t+=120){
  w.advance(s,120);
  if(s.stations.st_nadir.lager.jaeger>0&&!s.kanon.jaeger.auftrag&&buys.length<cap&&s.owners.house.cash>=v.price){
   const before=s.owners.house.cash,nadir=s.owners.st_nadir.cash,stock=s.stations.st_nadir.lager.jaeger;
   const result=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
   assert.equal(result.ok,true,result.reason);
   assert.equal(s.owners.house.cash,before-v.price);assert.equal(s.owners.st_nadir.cash,nadir+v.price);
   assert.equal(s.stations.st_nadir.lager.jaeger,stock-1);
   const receipt=s.kanon.jaeger.kaeufe.at(-1);
   assert.equal(receipt.preis,v.price);assert.equal(s.ships[receipt.id].owner,'house');
   buys.push({...receipt});audit(w,s);
  }
  if(t%(10*1440)===0){
   audit(w,s);
   const l=s.stations.st_nadir.lager;
   points.push({day:t/1440,hash:w.hash(s),built:s.kanon.jaeger.fertig,sold:s.kanon.jaeger.verkauft,
    stock:l.jaeger,field:s.kanon.silizium.vorrat,silicon:l.silizium,parts:l.bauteil,material:l.material,
    ore:s.w3.abgeschlossen,house:s.owners.house.cash,nadir:s.owners.st_nadir.cash});
   if(t===20*1440)checkpoint=w.save(s);
  }
 }
 assert.equal(s.owners.house.cash,3000-buys.length*v.price);
 assert.equal(s.kanon.jaeger.verkauft,buys.length);
 assert.ok(s.kanon.jaeger.fertig<=Math.floor(16/v.parts));
 // In the measured cases no new purchases occur after day 20. Replay without intervention.
 assert.ok(buys.every(x=>x.tick<=20*1440));
 const replay=w.load(checkpoint);
 for(let i=0;i<10*1440;i+=60)w.advance(replay,60);
 assert.equal(w.canonical(replay),w.canonical(s));audit(w,replay);
 return {name:v.name,cap,initial,buys,points};
}
const expected={
 2:[['4f58ab5f2be8023f',2,2,13320],['ccdf1f6fa58db9aa',3,2,7920],['6df13b010e1f2a2f',3,2,8040]],
 5:[['4f58ab5f2be8023f',2,2,13320],['3ad8f6dd82d6b64a',5,5,7920],['0e9967ed381fccb3',4,4,8040]]
};
for(const cap of [2,5])test('PIR4a real production, maximum '+cap+' funded house purchases',()=>{
 const rows=variants.map(v=>run(v,cap));
 assert.deepEqual(rows.map(x=>[x.points.at(-1).hash,x.points.at(-1).built,x.points.at(-1).sold,x.buys[0].tick]),expected[cap]);
 assert.ok(rows.every(x=>x.initial==='b9e942aafa1d4c05'));
 if(cap===2)assert.deepEqual(rows[0],run(variants[0],cap,original),'unchanged module vs isolated original');
 assert.equal(original.erstellenJ4c(capital).rules.j4.verkaufspreis,900);
 for(const p of files)assert.equal(fs.readFileSync(path.join(root,p),'utf8'),source[p],'source files unchanged');
 console.log('PIR4A_REAL_PRODUCTION '+JSON.stringify(rows));
});
