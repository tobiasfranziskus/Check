// J4b: die echte, reproduzierbare W0/W1→J2a→J2b→J3→J4a-Industrie.
// Keine manuell geschriebenen Waren, Geld- oder Schiffsbestände.
import assert from 'node:assert/strict';
import {j3Quelle} from './j3-bauteile-gate.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');
const gut=(w,s,where)=>assert.equal(w.audit(s).ok,true,where+': '+JSON.stringify(w.audit(s).fehler));
const aus=(w,s,c)=>{const r=w.execute(s,c);assert.equal(r.ok,true,JSON.stringify({command:c,result:r}));return r;};
const mine=(s,owner,klasse)=>Object.values(s.ships)
 .filter(sh=>sh.owner===owner&&sh.klasse===klasse&&sh.system==='aldera'
  &&sh.phase==='dock'&&sh.auftrag==='halten'&&sh.flug?.lage==='angedockt'
  &&Object.values(sh.ladung).every(x=>x===0));
export async function finanzierteJaegerBauteile(seed){
 const {welt:w,zustand:s,nachweis}=await j3Quelle(seed);
 let teile=0;
 for(let n=0;n<32;n++){
  const st=s.stations.st_nadir.lager;
  if(st.material>=2&&st.silizium>=1&&s.owners.st_nadir.cash>=8){
   aus(w,s,{type:'stationBuildParts',owner:'st_nadir',station:'st_nadir'});
   for(let t=0;t<8;t++)w.minute(s);
   teile++;
  }else if(st.material<2&&st.erz>=10){
   aus(w,s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
   for(let t=0;t<w.rules.w4.dauer;t++)w.minute(s);
  }else break;
 }
 assert.equal(teile,7);
 assert.deepEqual([s.stations.st_nadir.lager.bauteil,s.stations.st_nadir.lager.material,
  s.stations.st_nadir.lager.silizium,s.stations.st_nadir.lager.erz],[7,1,1,0]);
 const miner=mine(s,'npc3','miner').filter(sh=>w.buchwert(s,sh.id)>0)
   .sort((a,b)=>w.buchwert(s,b.id)-w.buchwert(s,a.id))[0];
 const frachter=mine(s,'transport','frachter').filter(sh=>w.buchwert(s,sh.id)>0)
   .sort((a,b)=>w.buchwert(s,b.id)-w.buchwert(s,a.id))[0];
 assert.ok(miner&&frachter,'rechtmässige, nicht stillgelegte K7-Frachtmittel');
 for(const cmd of [
  {type:'industrialOreOffer',owner:'st_nadir',miner:miner.id,frachter:frachter.id},
  {type:'industrialOreAcceptMine',owner:'npc3'},
  {type:'industrialOreAcceptFreight',owner:'transport'},
  {type:'industrialOreAcceptYard',owner:'werft_extern'},
  {type:'industrialOreCommit',owner:'st_nadir'},
 ]){aus(w,s,cmd);gut(w,s,'K7-Vertragsbelege');}
 for(let t=0;t<800&&s.stations.st_nadir.lager.erz<50;t++)w.minute(s);
 assert.equal(s.stations.st_nadir.lager.erz,50,'echte Original-Fracht geliefert');
 for(let t=0;t<300&&s.w3.auftrag;t++)w.minute(s);
 assert.equal(s.w3.auftrag,null,'Rückroute bezahlt und geschlossen');
 assert.equal(s.kanon.industrieErz.phase,'geliefert');
 for(let n=0;n<2;n++){
  aus(w,s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
  for(let t=0;t<w.rules.w4.dauer;t++)w.minute(s);
 }
 aus(w,s,{type:'stationBuildParts',owner:'st_nadir',station:'st_nadir'});
 for(let t=0;t<8;t++)w.minute(s);
 aus(w,s,{type:'industrialOreBuildShip',owner:'werft_extern'});
 for(let t=0;t<w.rules.w5.dauer;t++)w.minute(s);
 assert.deepEqual([s.stations.st_nadir.lager.bauteil,s.stations.st_nadir.lager.material,
  s.stations.st_nadir.lager.erz,s.owners.k7_werft_treuhand.cash],[8,4,30,0]);
 assert.equal(s.kanon.industrieErz.werftVerwendet,true);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 gut(w,s,'J4a bezahlte echte Inputs');
 const sourceHash=w.hash(s),neu=Welt.ausRegel202J4b(w.save(s));
 assert.equal(neu.quellHash,sourceHash);
 assert.equal(w.hash(s),sourceHash);
 assert.equal(neu.zustand.kanon.jaeger.fertig,0);
 assert.equal(neu.zustand.stations.st_nadir.lager.jaeger,0);
 assert.equal(neu.zustand.ledger.jaeger.initial,0);
 assert.equal(neu.welt.regel,203);
 gut(neu.welt,neu.zustand,'J4b Regel203 ohne Start-Jäger');
 return {...neu,source:w,sourceState:s,sourceHash,nachweis,miner:miner.id,frachter:frachter.id};
}
