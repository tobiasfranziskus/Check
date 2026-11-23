// PIR-4a prerequisite: current production / buyer gates only.
// No pirate/escort/flight commands, new policy, edits to production state or shared code.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const policy=W6.SZENARIEN.find(x=>x.id==='S02').politik;
const buyers=['npc3','transport','werft_extern','st_nadir'];
const buy=owner=>({type:'shipBuy',owner,klasse:'jaeger',station:'st_nadir'});
const cash=s=>Object.values(s.owners).reduce((n,x)=>n+x.cash,0);
function audit(w,s){
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(cash(s),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
}
function snapshot(w,s){
 const l=s.stations.st_nadir.lager,b=s.kanon.jaeger;
 return {tick:s.tick,hash:w.hash(s),built:b.fertig,sold:b.verkauft,stock:l.jaeger,
  fieldLeft:s.kanon.silizium.vorrat,siliconStock:l.silizium,parts:l.bauteil,material:l.material,
  oreDeliveries:s.w3.abgeschlossen,house:s.owners.house.cash,nadir:s.owners.st_nadir.cash,
  lastBuild:b.belege.at(-1)??null,worldMoney:cash(s),
  shipIds:b.kaeufe.map(x=>x.id)};
}
function buyerGate(w,s){
 const original=w.save(s),res=[];
 assert.ok(s.stations.st_nadir.lager.jaeger>0,'real hull available');
 assert.equal(s.kanon.jaeger.auftrag,null,'no concurrent J4 build');
 for(const owner of buyers){
  assert.ok(s.owners[owner]);
  const clone=w.load(original),before=w.save(clone);
  const result=w.execute(clone,buy(owner));
  assert.equal(result.ok,false,'buyer gate: '+owner);
  assert.match(result.reason,/nur echter persönlicher Nadir-Jägerkauf/);
  assert.equal(w.save(clone),before,'rejected purchase must be atomic');
  res.push({owner,cash:s.owners[owner].cash,reason:result.reason});
 }
 // Positive control uses the identical real stock & rules, not a fabricated fixture.
 const clone=w.load(original),count=clone.stations.st_nadir.lager.jaeger,bank=clone.owners.st_nadir.cash;
 const result=w.execute(clone,buy('house'));
 assert.equal(result.ok,true,result.reason);
 const id=clone.kanon.jaeger.kaeufe.at(-1).id;
 assert.equal(clone.ships[id].owner,'house');
 assert.equal(clone.owners.house.cash,s.owners.house.cash-900);
 assert.equal(clone.owners.st_nadir.cash,bank+900);
 assert.equal(clone.stations.st_nadir.lager.jaeger,count-1);
 audit(w,clone);
 // Deliberate corruption on throwaway copies. No claim of implemented combat or transfers.
 const missing=JSON.parse(w.save(clone));delete missing.ships[id];
 assert.equal(w.audit(missing).ok,false,'unrecorded disappearance is rejected');
 const wrongSystem=JSON.parse(w.save(clone));wrongSystem.ships[id].system='aldera';
 assert.equal(w.audit(wrongSystem).ok,false,'unrecorded location change is rejected');
 assert.equal(w.save(s),original,'all gates used copies');
 return {tick:s.tick,stock:count,denied:res,positive:{owner:'house',price:900,id}};
}
function run(w,s,tag){
 audit(w,s);
 const initial=s.kanon.silizium.vorrat;
 const points=[],purchases=[];let gates=null;
 for(let t=120;t<=30*1440;t+=120){
  w.advance(s,120);
  if(s.stations.st_nadir.lager.jaeger>0&&!s.kanon.jaeger.auftrag&&s.owners.house.cash>=900&&purchases.length<2){
   if(!gates)gates=buyerGate(w,s);
   const r=w.execute(s,buy('house'));
   assert.equal(r.ok,true,r.reason);
   purchases.push({...s.kanon.jaeger.kaeufe.at(-1)});
   audit(w,s);
  }
  if(t% (10*1440)===0){audit(w,s);points.push(snapshot(w,s));}
 }
 const cost={silicon:w.rules.j3.silizium*w.rules.j4.bauteile,
  material:w.rules.j3.material*w.rules.j4.bauteile+w.rules.j4.material};
 assert.equal(cost.silicon,8);assert.equal(cost.material,20);
 assert.ok(s.kanon.jaeger.fertig<=Math.floor(initial/cost.silicon),'finite original silica ceiling');
 assert.equal(s.kanon.jaeger.verkauft,purchases.length);
 assert.equal(s.owners.house.cash,3000-900*purchases.length);
 console.log('PIR4A_SUPPLY '+JSON.stringify({tag,initialField:initial,cost,points,purchases,gates}));
 assert.ok(gates,'positive control requires one real available hull by day 30');
}
test('PIR4a: Rule204 S02 opt-in, paid house fighter vs existing other-company buyers',()=>{
 const {welt:w,s}=W6.start(policy);
 assert.deepEqual(w.npcSiliziumSetzen(s,true),{ok:true,aktiviert:true});
 run(w,s,'204-S02');
});
test('PIR4a: Rule207 extended material chain, separate comparison, no production guarantee',()=>{
 const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000}),s=w.createState(42,{politik:policy});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);w.materialSupplySetzen(s,true);w.npcMaterialKetteSetzen(s,true);
 run(w,s,'207-S02-P8h');
});
