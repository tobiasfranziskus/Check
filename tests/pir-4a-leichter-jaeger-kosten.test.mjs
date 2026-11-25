// Read-only economic sensitivity. Does not construct a new game or change original recipes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const w=K.erstellenJ4c({carrierCash:2000,buyerCash:4000}),r=w.rules,p=w.industriePreise;
// All monetary arithmetic in tenths of ISK with integer-valued results at the original tariff.
const batchOre=r.w3.fracht, batches=batchOre/r.w4.erzJeCharge;
const batchMaterial=batches*r.w4.materialJeCharge;
const batchCash=p.nadiraufwand+batches*r.w4.dauer*r.w4.lohnJeMinute;
const material10=batchCash*10/batchMaterial;
const silicon10=r.j2b.preis*10;
const directPart=r.j3.dauer*r.j3.lohnJeMinute;
function cost({parts,hullMaterial,minutes,price}){
 const material=parts*r.j3.material+hullMaterial,silicon=parts*r.j3.silizium;
 const direct=parts*directPart+minutes*r.j4.lohnJeMinute;
 const total10=material*material10+silicon*silicon10+direct*10;
 return {parts,hullMaterial,minutes,price,material,silicon,direct,total10,margin10:price*10-total10};
}
const variants=[
 {name:'original',parts:r.j4.bauteile,hullMaterial:r.j4.material,minutes:r.j4.dauer,price:r.j4.verkaufspreis},
 {name:'half-450',parts:4,hullMaterial:2,minutes:16,price:450},
 {name:'half-500',parts:4,hullMaterial:2,minutes:16,price:500},
 {name:'half-550',parts:4,hullMaterial:2,minutes:16,price:550},
 {name:'light-450',parts:3,hullMaterial:2,minutes:16,price:450},
 {name:'heavy-1050',parts:r.j4.bauteile,hullMaterial:r.j4.material,minutes:r.j4.dauer,price:1050}
];
test('original K7 delivered ore and W4 material define actual cash-cost basis',()=>{
 assert.equal(p.alderakauf,500);assert.equal(p.nadiraufwand,740);
 assert.equal(batchMaterial,25);assert.equal(batchCash,840);assert.equal(material10,336);
 assert.equal(silicon10,240);assert.equal(directPart,8);
 assert.equal(r.economy.waren.miner.basis,600);assert.equal(r.economy.waren.frachter.basis,750);
});
test('PIR light fighter unit economics: price-only and half recipe at 450 are deficient',()=>{
 const rows=variants.map(v=>({name:v.name,...cost(v)}));
 assert.deepEqual(rows.map(x=>x.total10),[9600,4800,4800,4800,3808,9600]);
 assert.deepEqual(rows.map(x=>x.margin10),[-600,-300,200,700,692,900]);
 const original=rows[0];
 assert.equal(original.silicon,8);assert.equal(original.material,20);assert.equal(original.direct,96);
 console.log('PIR_LIGHT_UNIT '+JSON.stringify({batchOre,batchMaterial,batchCash,material10,silicon10,rows}));
});
test('PIR light: cash requirement and leftover stock, no imaginary fractional purchase',()=>{
 const rows=[variants[1],variants[3],variants[4]].flatMap(v=>[1,2,4,8].map(n=>{
  const c=cost(v);
  const oreBatches=Math.ceil(n*c.material/batchMaterial);
  const siliconBatches=Math.ceil(n*c.silicon/r.j2b.charge);
  const cashNeed=oreBatches*batchCash+siliconBatches*r.j2b.charge*r.j2b.preis+n*c.direct;
  const spareMaterial=oreBatches*batchMaterial-n*c.material;
  const spareSilicon=siliconBatches*r.j2b.charge-n*c.silicon;
  const remaining10=spareMaterial*material10+spareSilicon*silicon10;
  assert.equal(cashNeed*10-remaining10,n*c.total10);
  return {name:v.name,n,cashNeed,sales:n*c.price,cashDelta:n*c.price-cashNeed,spareMaterial,spareSilicon,remaining10};
 }));
 assert.equal(rows.find(x=>x.name==='light-450'&&x.n===2).cashNeed,1112);
 assert.equal(rows.find(x=>x.name==='light-450'&&x.n===8).cashNeed,3416);
 console.log('PIR_LIGHT_BATCH '+JSON.stringify(rows));
});
