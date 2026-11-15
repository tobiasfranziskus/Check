// W6/P8c [ANALYSE]: truly financed Rule206 Dravos->Orion->Nadir
// with ORIGINAL W3 transit and K1/J2b/J3/J4 money/commodity/ownership core.
// Each experiment is independent, no free ships/ISK/cargo, no saved-state migration.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('./w6-szenarien.cjs');
const opts={carrierCash:2000,buyerCash:4000};
const name=process.argv[2]||'alle';
const days=Number(process.argv[3]||90);
if((name!=='alle'&&!W6.SZENARIEN.some(x=>x.id===name))
   ||!Number.isSafeInteger(days)||days<1||days>730)
 throw Error('P8c-Szenarien: [alle|S01...S13] [1...730 Tage]');
function check(w,s,id,day){
 const fehler=W6.pruefen(w,s);
 assert.deepEqual(fehler,[],id+' Tag '+day+': '+JSON.stringify(fehler));
 assert.equal(s.rulesVersion,206);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.stations.st_dravos.lager.silizium,undefined,'kein Phantomverkauf in Dravos');
 assert.equal(s.owners.st_dravos.cash,0,'keine neue Kaufkraft in Dravos');
 assert.equal(s.ledger.silizium.mined,s.kanon.silizium.gefoerdert);
 const f=s.kanon.silizium.felder;
 assert.equal(f['nadir-primaer'].gefoerdert+f['dravos-silizium'].gefoerdert,
   s.kanon.silizium.gefoerdert);
 assert.equal(f['nadir-primaer'].vorrat+f['dravos-silizium'].vorrat,s.kanon.silizium.vorrat);
 assert.ok(f['nadir-primaer'].gefoerdert<=16);
 assert.ok(f['dravos-silizium'].gefoerdert<=16);
 assert.ok(s.kanon.p8c.bezahlt<=s.kanon.p8c.gebunden);
 assert.equal(s.kanon.p8c.minuten,s.kanon.p8c.bezahlt);
}
function run(sc){
 const w=K.erstellenP8c(opts);
 const s=w.createState(42,{politik:sc.politik});
 assert.deepEqual(w.npcAutoSetzen(s,true),{ok:true,aktiviert:true});
 assert.deepEqual(w.npcSiliziumSetzen(s,true),{ok:true,aktiviert:true});
 let bought=0,at60=null,at90=null;
 check(w,s,sc.id,0);
 for(let t=120;t<=days*1440;t+=120){
  w.advance(s,120);
  if((s.stations.st_nadir.lager.jaeger||0)>0
      &&s.owners.house.cash>=900&&bought<3){
   const haus=s.owners.house.cash,nadir=s.owners.st_nadir.cash;
   const r=w.execute(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'jaeger'});
   assert.equal(r.ok,true,JSON.stringify(r));
   assert.equal(haus-s.owners.house.cash,900);
   assert.equal(s.owners.st_nadir.cash-nadir,900);
   bought++;
  }
  if(t%(15*1440)===0 ||t===days*1440){
   check(w,s,sc.id,t/1440);
   if(t===60*1440)at60=W6.kennzahlen(w,s);
   if(t===90*1440)at90=W6.kennzahlen(w,s);
  }
 }
 const field=s.kanon.silizium.felder,travel=s.kanon.p8c,k=W6.kennzahlen(w,s);
 const result={
  id:sc.id,days,hash:w.hash(s),builtFighters:s.kanon.jaeger.fertig,
  boughtFighters:bought,house:s.owners.house.cash,
  minedNadir:field['nadir-primaer'].gefoerdert,
  minedDravos:field['dravos-silizium'].gefoerdert,
  soldSilicon:s.kanon.silizium.verkauft,
  travelCount:travel.reisen.length,
  paidTravelMinutes:travel.minuten,
  paidTravelISK:travel.bezahlt,
  unpaidTravelISK:travel.gebunden-travel.bezahlt,
  replacements:k.ersatz,ice:k.eis,waterISK:k.wasserErloes,
  wageISK:k.loehne,weltgeld:33000,mint:0,burn:0,
  activeBetween60And90:at60&&at90?{
    ice:at90.eis>at60.eis,water:at90.wasserErloes>at60.wasserErloes,
    wages:at90.loehne>at60.loehne,replacement:at90.ersatz>at60.ersatz
  }:null,
  topBlockers:Object.entries(s.kanon.npc.pausen).sort((a,b)=>b[1]-a[1]).slice(0,3)
 };
 assert.equal(w.hash(w.load(w.save(s))),result.hash);
 console.log('W6_P8C_DRAVOS_REGIME',JSON.stringify(result));
 if(process.env.P8C_STORE_SAVE==='1'&&sc.id==='S02')
   fs.writeFileSync(process.env.P8C_OUTPUT_SAVE||'/tmp/p8c-s02.json',w.save(s));
 return result;
}
const results=[];
for(const sc of W6.SZENARIEN.filter(x=>name==='alle'||x.id===name)){
 try{results.push(run(sc));}
 catch(e){console.error('W6_P8C_DRAVOS_FAILED',sc.id,String(e));process.exitCode=1;break;}
}
if(process.env.P8C_OUTPUT_JSON)
 fs.writeFileSync(process.env.P8C_OUTPUT_JSON,
   JSON.stringify({profile:206,region:'dravos',days,results},null,2));
if(results.length===13)
 console.log('W6_P8C_13_REGIMES_DONE',JSON.stringify({
  days,scenarios:results.length,
  realDravosSupply:results.filter(x=>x.minedDravos>0).map(x=>x.id),
  thirdFighter:results.filter(x=>x.builtFighters>=3).map(x=>x.id),
  paidByNPC:results.filter(x=>x.paidTravelISK>0).map(x=>x.id),
  inventedMoney:results.some(x=>x.weltgeld!==33000||x.mint||x.burn)
 }));
