// Long horizon, original contracts only. No new buyer, credit, income or simulated hull loss.
import test from 'node:test';
import assert from 'node:assert/strict';
import { isolated, verify, released, policy, capital } from './helpers/pir-4a-geology.mjs';
const D=1440;
const cases=[
 {id:'finite',period:0,staged:false},
 {id:'monthly',period:30,staged:false},
 {id:'reserved-demand',period:30,staged:true}
];
const selected=process.env.PIR_LONG_CASE;
function snapshot(w,s,c){
 const b=s.kanon.silizium,l=s.stations.st_nadir.lager;
 const miners=Object.values(s.ships).filter(sh=>sh.klasse==='miner'&&sh.heimat==='nadir'&&sh.owner==='npc3')
   .map(sh=>({id:sh.id,system:sh.system,lage:sh.flug?.lage,stillgelegt:w.stillgelegt(s,sh.id),buchwert:w.buchwert(s,sh.id)}));
 return {day:s.tick/D,hash:w.hash(s),released:released(s.tick/D,c.period),
  deepRemaining:c.period?192-released(s.tick/D,c.period):0,field:b.vorrat,mined:b.gefoerdert,sold:b.verkauft,
  fighterMade:s.kanon.jaeger.fertig,fighterSold:s.kanon.jaeger.verkauft,stock:l.jaeger,
  parts:l.bauteil,material:l.material,silicon:l.silizium,
  house:s.owners.house.cash,nadir:s.owners.st_nadir.cash,npc3:s.owners.npc3.cash,
  ore:s.w3.abgeschlossen,replacements:s.kanon.ersatzkaeufe,miners,
  worldMoney:Object.values(s.owners).reduce((n,o)=>n+o.cash,0),mint:s.minted,burn:s.burned};
}
for(const c of cases.filter(c=>!selected||c.id===selected))test('PIR/W6 760 days '+c.id,()=>{
 const w=isolated(c.period).erstellenJ4c(capital),s=w.createState(42,{politik:policy});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);verify(w,s,c.period);
 const points=[],receipts=[];
 let day730=null,day730Receipts=0;
 const checkpoints=new Set([30,90,180,365,395,730,760].map(d=>d*D));
 for(let t=120;t<=760*D;t+=120){
  w.advance(s,120);
  // In the staged case the original player deliberately saves money,
  // not an invented recurring replacement need. Every purchase is real.
  const cap=c.staged?(t<=365*D?2:t<=730*D?4:6):6;
  if(s.stations.st_nadir.lager.jaeger>0&&!s.kanon.jaeger.auftrag&&receipts.length<cap&&s.owners.house.cash>=450){
   const a=s.owners.house.cash,b=s.owners.st_nadir.cash,l=s.stations.st_nadir.lager.jaeger;
   const result=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
   assert.equal(result.ok,true,result.reason);
   assert.equal(s.owners.house.cash,a-450);assert.equal(s.owners.st_nadir.cash,b+450);
   assert.equal(s.stations.st_nadir.lager.jaeger,l-1);
   const receipt=s.kanon.jaeger.kaeufe.at(-1);
   assert.equal(receipt.preis,450);assert.equal(s.ships[receipt.id].owner,'house');
   receipts.push({...receipt});
   verify(w,s,c.period);
  }
  if(checkpoints.has(t)){
   verify(w,s,c.period);
   const p=snapshot(w,s,c);points.push(p);
   console.log('PIR4A_GEOLOGY_LONG_CHECKPOINT '+JSON.stringify({case:c.id,...p}));
   if(t===730*D){day730=w.save(s);day730Receipts=receipts.length;}
  }
 }
 assert.equal(s.owners.house.cash,3000-receipts.length*450);
 assert.equal(s.kanon.jaeger.verkauft,receipts.length);
 assert.equal(s.kanon.silizium.vorrat+s.kanon.silizium.gefoerdert,16+released(760,c.period));
 assert.ok(s.kanon.jaeger.fertig*3<=s.kanon.silizium.gefoerdert);
 if(c.id==='finite')assert.equal(points.find(x=>x.day===90).hash,'d3336a8720d89aa8');
 if(c.id==='monthly')assert.equal(points.find(x=>x.day===90).hash,'cca5a91756495a5c');
 // Replay with identical purchase policy but different advancement chunk size.
 const clone=w.load(day730);let replayCount=day730Receipts;
 for(let t=730*D+60;t<=760*D;t+=60){
   w.advance(clone,60);
   if(t%120===0&&clone.stations.st_nadir.lager.jaeger>0&&!clone.kanon.jaeger.auftrag&&replayCount<6&&clone.owners.house.cash>=450){
    const res=w.execute(clone,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
    assert.equal(res.ok,true,res.reason);replayCount++;
   }
 }
 verify(w,clone,c.period);assert.equal(w.canonical(clone),w.canonical(s));
 console.log('PIR4A_GEOLOGY_LONG_RESULT '+JSON.stringify({case:c.id,points,receipts,
  additionalSoldAfter365:receipts.filter(x=>x.tick>365*D).length,
  additionalSoldAfter730:receipts.filter(x=>x.tick>730*D).length,
  // A negative result is deliberately allowed.
  recurringDemandProven:false,actualReplacementProven:false}));
});
