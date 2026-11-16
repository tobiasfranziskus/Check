// W6/P8b [ANALYSE ONLY]: paid finite Rule205 twin-field S01–S13 study.
// All tests run same original 204->205 validated import, NO stocks/mint/rescues.
// Controlled player behavior: buys only genuinely finished 900-ISK fighters,
// max three, whenever the real owner has cash. Other firms decide themselves.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const W6=require('./w6-szenarien.cjs');
const K=require('../prototypes/welt/welt-kern.js');
const alle=W6.SZENARIEN;
const scenario=process.argv[2]||'alle';
const days=Number(process.argv[3]||90);
if((scenario!=='alle'&&!alle.some(x=>x.id===scenario))
 || !Number.isSafeInteger(days)||days<1||days>730)
 throw Error('P8b: Aufruf [alle|S01..S13] [1..730 Tage]');

const snapshots={};
const audit=(w,s,id,tag)=>{
 const fehler=W6.pruefen(w,s);
 assert.deepEqual(fehler,[],id+' Tag '+tag+': inkonsistentes Geld/Waren/Schiffe/Eigentum');
 assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 const b=s.kanon.silizium,z=b.felder,prim=z['nadir-primaer'],sec=z['nadir-sekundaer'];
 assert.equal(prim.gefoerdert+sec.gefoerdert,b.gefoerdert);
 assert.equal(prim.vorrat+sec.vorrat,b.vorrat);
 assert.equal(s.ledger.silizium.mined,b.gefoerdert);
 assert.equal(s.ledger.silizium.consumed,s.kanon.bauteile.siliziumVerbraucht);
 if(s.kanon.jaeger.fertig<0||b.gefoerdert>32)throw Error('P8b: Gratisjaeger oder Ueberfoerderung');
};
function run(sz){
 const {welt:original,s:quelle}=W6.start(sz.politik),old=original.save(quelle);
 const cloned=K.ausRegel204P8b(old),w=cloned.welt,s=cloned.zustand;
 assert.equal(w.regel,205);
 assert.equal(original.save(quelle),old);
 w.npcSiliziumSetzen(s,true);
 let bought=0;
 let at60=null,at90=null;
 const end=days*1440;
 audit(w,s,sz.id,0);
 for(let t=120;t<=end;t+=120){
  w.advance(s,120);
  if((s.stations.st_nadir.lager.jaeger||0)>0
      &&s.owners.house.cash>=900 && bought<3){
   const before=s.owners.house.cash,nadir=s.owners.st_nadir.cash;
   const r=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
   assert.equal(r.ok,true,sz.id+': rechtswirksamer J4-Kauf');
   assert.equal(before-s.owners.house.cash,900);
   assert.equal(s.owners.st_nadir.cash-nadir,900);
   bought++;
  }
  if(t%(15*1440)===0 || t===end){
   audit(w,s,sz.id,t/1440);
   if(t===60*1440)at60=W6.kennzahlen(w,s);
   if(t===90*1440)at90=W6.kennzahlen(w,s);
   if(sz.id==='S02'&&([90,180,365,730].includes(t/1440))) {
    const file=path.join(process.env.RUNNER_TEMP||'/tmp',
      'w6-p8b-'+sz.id+'-'+String(t/1440)+'d.json');
    if(process.env.P8B_STORE_SAVES==='1'){fs.writeFileSync(file,w.save(s));}
   }
  }
 }
 const b=s.kanon.silizium;
 const stats=W6.kennzahlen(w,s);
 const x={
  id:sz.id,tage:days,hash:w.hash(s),tick:s.tick,paidPlayerFighters:bought,
  builtJ4:s.kanon.jaeger.fertig,
  feldPrimaer:b.felder['nadir-primaer'],
  feldSekundaer:b.felder['nadir-sekundaer'],
  gekauftSilizium:b.verkauft,siliziumLager:s.stations.st_nadir.lager.silizium,
  inventarJ4:s.stations.st_nadir.lager.jaeger,
  ersatz:stats.ersatz,eis:stats.eis,wasserUmsatz:stats.wasserErloes,
  loehne:stats.loehne,haus:s.owners.house.cash,
  weltgeld:Object.values(s.owners).reduce((n,o)=>n+o.cash,0),mint:0,burn:0,
  aktivVon60Bis90:at60&&at90?{
   eis:at90.eis>at60.eis,
   wasser:at90.wasserErloes>at60.wasserErloes,
   loehne:at90.loehne>at60.loehne,
   ersatz:at90.ersatz>at60.ersatz
  }:null,
  pausenTop:Object.entries(s.kanon.npc.pausen).sort((a,b)=>b[1]-a[1]).slice(0,4)
 };
 assert.equal(w.hash(w.load(w.save(s))),x.hash,sz.id+': Save/Load');
 console.log('W6_P8B_205_REGIME',JSON.stringify(x));
 return x;
}
const out=[];
for(const sz of alle.filter(x=>scenario==='alle'||x.id===scenario)){
 try{out.push(run(sz));}
 catch(e){console.error('W6_P8B_205_FAILED',sz.id,String(e));process.exitCode=1;break;}
}
if(out.length){
 const filename=process.env.P8B_OUTPUT_JSON;
 if(filename)fs.writeFileSync(filename,JSON.stringify({version:205,geologie:'Nadir-Zweifeld-Forschung',days,results:out},null,2));
 if(out.length===13)console.log('W6_P8B_13_REGIMES_COMPLETE',JSON.stringify({
  scenarioCount:out.length,tage:days,
  dritteJ4Realisiert:out.filter(x=>x.builtJ4>=3).map(x=>x.id),
  zweitesFeldGenutzt:out.filter(x=>x.feldSekundaer.gefoerdert>0).map(x=>x.id),
  fremdmoneten:out.some(x=>x.weltgeld!==33000||x.mint||x.burn)
 }));
}
