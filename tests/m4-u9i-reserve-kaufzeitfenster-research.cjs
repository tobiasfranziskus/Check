'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {SZENARIEN}=require('../tools/w6-szenarien.cjs');
const {lauf}=require('../tools/m4-u9i-reserve-kaufzeitfenster.cjs');
const sz=SZENARIEN.find(x=>x.id==='S02');
test('U9i: unchanged control policy and real reserve purchase window comparison',()=>{
 const c=lauf(sz,90,42,60,'control');
 assert.equal(c.report.ende.hash,'5e14d64c83e6e942');
 assert.equal(c.buys.length,0);
 assert.equal(c.report.verlauf.at(-1).eis,1014);
 const free=lauf(sz,90,42,60,'routefree');
 const a=lauf(sz,90,42,60,'purchase');
 assert.deepEqual(lauf(sz,90,42,60,'purchase'),a);
 for(const x of [c,free,a]){
   assert.equal(x.report.verlauf.at(-1).weltgeld,33000);
   assert.ok(Object.values(x.gates).reduce((n,v)=>n+v,0)>0);
   for(const b of x.buys){
     assert.ok(b.stock>0&&b.cash>=b.preis+b.transfer+2*b.arbeit);
     assert.notEqual(b.old,b.new);assert.notEqual(b.before,b.after);
   }
 }
 assert.ok(free.buys.every(b=>!b.routeBusy));
 // A zero-purchase arm is a negative result, not evidence of reserve effectiveness.
 const summary=x=>({mode:x.mode,hash:x.report.ende.hash,eis:x.report.verlauf.at(-1).eis,
   erz:x.report.verlauf.at(-1).erz,gates:x.gates,windows:x.windows,buys:x.buys,rejections:x.rejections});
 console.log('U9I_90',JSON.stringify([c,free,a].map(summary)));
});
