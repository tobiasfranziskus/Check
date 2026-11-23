// Isolated, non-product experiment. Only trusted checked-in source is compiled.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W6=require('../tools/w6-szenarien.cjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../prototypes');
const entry='welt/welt-kern.js',factory='welt/rule200-k7-industry-core.js',silicon='welt/j2b-silizium-core.js';
const files=[entry,factory,'flug2d/flug-kern.js',silicon,'welt/j3-bauteil-core.js','welt/j4b-jaeger-werft-core.js','welt/p8d-dravos-fracht-core.js'];
const source=Object.fromEntries(files.map(p=>[p,fs.readFileSync(path.join(root,p),'utf8')]));
function once(s,a,b){assert.equal(s.split(a).length,2,'unique original source anchor: '+a);return s.replace(a,()=>b);}
const released=(day,period)=>period?8*Math.min(24,Math.floor(day/period)):0;
function isolated(period){
 const cache=new Map();
 function load(p){
  if(cache.has(p))return cache.get(p).exports;
  assert.ok(Object.hasOwn(source,p));const mod={exports:{}};cache.set(p,mod);let code=source[p];
  if(p===factory){
   code=once(code,"jaeger: { stufe: 'schiff', basis: 900 }","jaeger: { stufe: 'schiff', basis: 450 }");
   code=once(code,"r_jaeger: { ein: { bauteil: 8, material: 4 }, aus: { jaeger: 1 }, ort: 'werft', dauer: 32 }",
    "r_jaeger: { ein: { bauteil: 3, material: 2 }, aus: { jaeger: 1 }, ort: 'werft', dauer: 16 }");
  }
  if(period&&p===silicon){
   code=once(code,"const quellen=zweifeld?[C.feld,C.nebenfeld]:[C.feld];",
    `const quellen=zweifeld?[C.feld,C.nebenfeld]:[C.feld];\n  if(zweifeld)throw Error('research only 204');\n  const period=${period}*1440, freigegeben=t=>8*Math.min(24,Math.floor(t/period));`);
   code=once(code,"function minute(s){\n    const b=s.kanon.silizium,a=b.auftrag;",
     "function minute(s){\n    const b=s.kanon.silizium,a=b.auftrag;\n    b.vorrat+=freigegeben(s.tick)-freigegeben(s.tick-1);");
   code=once(code,"b.vorrat!==quellen.reduce((n,f)=>n+f.vorrat,0)-b.gefoerdert","b.vorrat!==quellen.reduce((n,f)=>n+f.vorrat,0)+freigegeben(s.tick)-b.gefoerdert");
   code=once(code,"b.gefoerdert>quellen.reduce((n,f)=>n+f.vorrat,0)","b.gefoerdert>quellen.reduce((n,f)=>n+f.vorrat,0)+freigegeben(s.tick)");
  }
  new Function('module','exports','require',code)(mod,mod.exports,x=>load(path.posix.normalize(path.posix.join(path.posix.dirname(p),x))));
  return mod.exports;
 }
 return load(entry);
}
const policy=W6.SZENARIEN.find(x=>x.id==='S02').politik;
const capital={carrierCash:2000,buyerCash:4000};
function verify(w,s,period){
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 const b=s.kanon.silizium;
 assert.equal(b.vorrat+b.gefoerdert,16+released(s.tick/1440,period));
 assert.equal(s.ledger.silizium.mined,b.gefoerdert);
 assert.equal(s.ledger.silizium.imported,0);assert.equal(s.ledger.silizium.initial,0);assert.equal(s.ledger.silizium.produced,0);
}
const expected={
 0:[[5,5,0,16,'3ad8f6dd82d6b64a'],[5,5,0,16,'d3fd4c58bafa5781'],[5,5,0,16,'d3336a8720d89aa8']],
 7:[[7,6,24,24,'e75fdc10e3347d74'],[7,6,56,24,'e8b43e3d8dbac603'],[7,6,88,24,'fdc4b10c207009fb']],
 30:[[5,5,8,16,'e956b1f4a85836a5'],[7,6,8,24,'d8ac1cd423e9c2e9'],[7,6,16,24,'cca5a91756495a5c']]
};
for(const period of [0,7,30])test('90 days finite geology release period '+period,()=>{
 const w=isolated(period).erstellenJ4c(capital),s=w.createState(42,{politik:policy});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 let purchases=0,mid=null;const points=[];
 for(let t=120;t<=90*1440;t+=120){
  w.advance(s,120);
  if(s.stations.st_nadir.lager.jaeger>0&&!s.kanon.jaeger.auftrag&&s.owners.house.cash>=450){
   const c=s.owners.house.cash,n=s.owners.st_nadir.cash;
   const result=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
   assert.equal(result.ok,true,result.reason);
   assert.equal(s.owners.house.cash,c-450);assert.equal(s.owners.st_nadir.cash,n+450);purchases++;
   verify(w,s,period);
  }
  if(t%(30*1440)===0){
   verify(w,s,period);
   const b=s.kanon.silizium,l=s.stations.st_nadir.lager;
   points.push({day:t/1440,hash:w.hash(s),geology:released(t/1440,period),field:b.vorrat,mined:b.gefoerdert,
     sold:b.verkauft,built:s.kanon.jaeger.fertig,purchased:purchases,stock:l.jaeger,parts:l.bauteil,
     material:l.material,house:s.owners.house.cash,ore:s.w3.abgeschlossen});
   if(t===60*1440)mid=w.save(s);
  }
 }
 assert.deepEqual(points.map(p=>[p.built,p.purchased,p.field,p.mined,p.hash]),expected[period]);
 assert.equal(s.owners.house.cash,3000-purchases*450);
 const clone=w.load(mid);
 for(let t=0;t<30*1440;t+=60)w.advance(clone,60);
 assert.equal(w.canonical(clone),w.canonical(s));verify(w,clone,period);
 const corrupt=JSON.parse(w.save(s));corrupt.kanon.silizium.vorrat++;
 assert.equal(w.audit(corrupt).ok,false,'unauthorized extra geology rejected');
 const free=JSON.parse(w.save(s));free.stations.st_nadir.lager.silizium++;
 assert.equal(w.audit(free).ok,false,'free stock rejected');
 for(const p of files)assert.equal(fs.readFileSync(path.join(root,p),'utf8'),source[p]);
 assert.equal(require('../prototypes/welt/welt-kern.js').erstellenJ4c(capital).rules.j4.verkaufspreis,900);
 console.log('PIR4A_GEOLOGY_90 '+JSON.stringify({period,points}));
});
test('finite geological release is schedule-bound, not generated by demand',()=>{
 assert.equal(released(6,7),0);assert.equal(released(7,7),8);
 assert.equal(released(168,7),192);assert.equal(released(730,7),192);
 assert.equal(released(720,30),192);assert.equal(released(730,30),192);
});
