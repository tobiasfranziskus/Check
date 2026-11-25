// Isolated, non-product experiment. Only trusted checked-in source is compiled.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W6=require('../../tools/w6-szenarien.cjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../prototypes');
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

export { isolated, verify, released, policy, capital, source, files, root };
