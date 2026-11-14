import test from 'node:test';
import assert from 'node:assert/strict';
import {j3Quelle} from '../tools/j3-bauteile-gate.mjs';
const snapshot=(s)=>({
 tick:s.tick,
 phase:s.kanon.industrieErz,
 oreAldera:s.stations.st_aldera.lager.erz,
 oreNadir:s.stations.st_nadir.lager.erz,
 material:s.stations.st_nadir.lager.material,
 silicon:s.stations.st_nadir.lager.silizium,
 parts:s.stations.st_nadir.lager.bauteil,
 frachterNadir:s.stations.st_nadir.lager.frachter,
 k7Auto:s.kanon.industrieAuto,
 waterFreight:s.w5n.frachtauftrag,
 activeFreight:s.w3.auftrag,
 wares:s.w4.auftrag,
 factory:s.w5.auftrag,
 minerWerft:s.kanon.minerWerft,
 owners:Object.fromEntries(['house','npc3','transport','st_aldera','st_nadir','werft_extern','k7_werft_treuhand'].map(x=>[x,s.owners[x]?.cash])),
 ships:Object.values(s.ships).filter(sh=>['npc3','transport'].includes(sh.owner)).map(sh=>({
 id:sh.id,owner:sh.owner,klasse:sh.klasse,system:sh.system,phase:sh.phase,
 auftrag:sh.auftrag,lage:sh.flug?.lage,anker:sh.flug?.anker,cargo:sh.ladung
 }))
});
async function target(seed){
 const {welt:w,zustand:s}=await j3Quelle(seed);
 for(let i=0;i<24;i++){
  const st=s.stations.st_nadir.lager;
  if(st.material>=2&&st.silizium>0&&s.owners.st_nadir.cash>=8){
   assert.equal(w.execute(s,{type:'stationBuildParts',owner:'st_nadir',station:'st_nadir'}).ok,true);
   for(let k=0;k<8;k++)w.minute(s);
  }else if(st.material<2&&st.erz>=10){
   assert.equal(w.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'}).ok,true);
   for(let k=0;k<20;k++)w.minute(s);
  }else break;
 }
 assert.equal(s.stations.st_nadir.lager.bauteil,7);
 assert.equal(s.stations.st_nadir.lager.material,1);
 assert.equal(s.stations.st_nadir.lager.erz,0);
 assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));
 return {w,s};
}
test('J4a: inspect real signed supply capacity after seven original paid parts',async()=>{
 for(const seed of [42,7]){
  const {w,s}=await target(seed);
  const before=w.canonical(s);
  console.log('J4A_BEFORE '+JSON.stringify({seed,...snapshot(s)}));
  const miner=Object.values(s.ships).find(sh=>sh.owner==='npc3'&&sh.klasse==='miner'&&sh.system==='aldera');
  const carrier=Object.values(s.ships).find(sh=>sh.owner==='transport'&&sh.klasse==='frachter'&&sh.system==='aldera');
  assert.ok(miner&&carrier);
  const offer={type:'industrialOreOffer',owner:'st_nadir',miner:miner.id,frachter:carrier.id};
  const offered=w.execute(s,offer);
  console.log('J4A_OFFER '+JSON.stringify({seed,offered,min:miner.id,fr:carrier.id}));
  if(!offered.ok){
    assert.equal(w.canonical(s),before,'failed contract must not mutate state');
    continue;
  }
  for(const cmd of [
    {type:'industrialOreAcceptMine',owner:'npc3'},
    {type:'industrialOreAcceptFreight',owner:'transport'},
    {type:'industrialOreAcceptYard',owner:'werft_extern'},
    {type:'industrialOreCommit',owner:'st_nadir'}
  ]){
    const r=w.execute(s,cmd);
    console.log('J4A_SIGN '+JSON.stringify({seed,cmd,r}));
    assert.equal(r.ok,true,JSON.stringify(r));
    assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));
  }
  let delivered=false;
  for(let t=0;t<800;t++){
   w.minute(s);
   if(t%30===0)assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));
   if(s.stations.st_nadir.lager.erz>=50){delivered=true;break;}
  }
  console.log('J4A_AFTER '+JSON.stringify({seed,delivered,...snapshot(s),audit:w.audit(s)}));
  assert.ok(delivered,'need real 50-ore delivery for funded materials');
 }
});
