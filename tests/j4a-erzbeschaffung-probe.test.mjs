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
  console.log('J4A_BEFORE '+JSON.stringify({seed,...snapshot(s)}));
  const standing=(owner,klasse)=>Object.values(s.ships)
    .filter(sh=>sh.owner===owner&&sh.klasse===klasse&&sh.system==='aldera'
      &&sh.phase==='dock'&&sh.auftrag==='halten'&&sh.flug?.lage==='angedockt'
      &&Object.values(sh.ladung).every(n=>n===0))
    .sort((a,b)=>w.buchwert(s,b.id)-w.buchwert(s,a.id));
  const berge=standing('npc3','miner'),spedition=standing('transport','frachter');
  console.log('J4A_BOOKVALUES '+JSON.stringify({seed,stilllegung:s.kanon.politik.stilllegung,
    miner:berge.map(sh=>({id:sh.id,book:w.buchwert(s,sh.id)})),
    carrier:spedition.map(sh=>({id:sh.id,book:w.buchwert(s,sh.id)})),
    alderaMinerStock:s.stations.st_aldera.lager.miner,
    alderaFreighterStock:s.stations.st_aldera.lager.frachter}));
  let miner=berge.find(sh=>w.buchwert(s,sh.id)>0);
  let carrier=spedition.find(sh=>w.buchwert(s,sh.id)>0);
  // Nur realer Originalkauf gegen echte NPC-Mittel und physischen Lagerabgang.
  if(!miner&&s.stations.st_aldera.lager.miner>0){
    const ids=new Set(Object.keys(s.ships));
    const q=w.execute(s,{type:'shipBuy',owner:'npc3',station:'st_aldera',klasse:'miner'});
    console.log('J4A_MINER_REPLACEMENT '+JSON.stringify({seed,q}));
    if(q.ok)miner=Object.values(s.ships).find(sh=>!ids.has(sh.id));
  }
  if(!carrier&&s.stations.st_aldera.lager.frachter>0){
    const ids=new Set(Object.keys(s.ships));
    const q=w.execute(s,{type:'shipBuy',owner:'transport',station:'st_aldera',klasse:'frachter'});
    console.log('J4A_CARRIER_REPLACEMENT '+JSON.stringify({seed,q}));
    if(q.ok)carrier=Object.values(s.ships).find(sh=>!ids.has(sh.id));
  }
  assert.ok(miner&&carrier,'real existing or explicitly purchased funded original ships');
  const offer={type:'industrialOreOffer',owner:'st_nadir',miner:miner.id,frachter:carrier.id};
  const offered=w.execute(s,offer);
  console.log('J4A_OFFER '+JSON.stringify({seed,offered,min:miner.id,fr:carrier.id}));
  if(!offered.ok){
    console.log('J4A_BLOCKER '+JSON.stringify({seed,reason:offered.reason,
      miner:{id:miner.id,book:w.buchwert(s,miner.id)},
      carrier:{id:carrier.id,book:w.buchwert(s,carrier.id)}}));
    assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));
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
