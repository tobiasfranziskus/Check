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
  assert.equal(offered.ok,true,'Original-K7-Angebot trotz einsatzfähiger Bestände: '+JSON.stringify(offered));
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
  assert.equal(s.stations.st_nadir.lager.erz,50);
  // Bestehender Frachtvertrag benötigt die bezahlte Rückroute, nicht
  // sofort beim Nadir-Ankunftstick eine Gratisstornierung.
  for(let t=0;t<300&&s.w3.auftrag;t++){
    w.minute(s);
    if(t%12===0)assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));
  }
  assert.equal(s.w3.auftrag,null,'vollständig finanzierten Rückflug abwarten');
  assert.equal(s.kanon.industrieErz.phase,'geliefert');
  const vorn={
    ore:s.stations.st_nadir.lager.erz,
    material:s.stations.st_nadir.lager.material,
    bauteile:s.stations.st_nadir.lager.bauteil,
    silizium:s.stations.st_nadir.lager.silizium,
    werftReserve:s.owners.k7_werft_treuhand.cash
  };
  for(let n=0;n<2;n++){
    const cmd={type:'stationRefine',owner:'st_nadir',station:'st_nadir'};
    const started=w.execute(s,cmd);
    assert.equal(started.ok,true,'Original-W4 aus tatsächlich angeliefertem Erz: '+JSON.stringify(started));
    for(let t=0;t<w.rules.w4.dauer;t++){
      w.minute(s);
      assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));
    }
  }
  assert.equal(s.stations.st_nadir.lager.material,vorn.material+10);
  assert.equal(s.stations.st_nadir.lager.erz,vorn.ore-20);
  const part=w.execute(s,{type:'stationBuildParts',owner:'st_nadir',station:'st_nadir'});
  assert.equal(part.ok,true,'echte 2 Material/1 Silizium + 8 ISK: '+JSON.stringify(part));
  for(let t=0;t<8;t++){
    w.minute(s);
    assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));
  }
  assert.equal(s.stations.st_nadir.lager.bauteil,8);
  assert.equal(s.stations.st_nadir.lager.silizium,0);
  assert.equal(s.stations.st_nadir.lager.material,9);
  // Ein originales K7-Angebot enthält rechtmäßig 530 ISK reservierte
  // Werftkapital. Das muss in den Original-W5-Schiffbau fließen, nicht
  // auf einem künstlich unvollständigen Forschungsauftrag hängenbleiben.
  const werk=w.execute(s,{type:'industrialOreBuildShip',owner:'werft_extern'});
  assert.equal(werk.ok,true,'bereits signierte Original-W5-Werft soll finanziert bauen: '+JSON.stringify(werk));
  for(let t=0;t<w.rules.w5.dauer;t++){
    w.minute(s);
    assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));
  }
  assert.equal(s.kanon.industrieErz.werftVerwendet,true);
  assert.equal(s.owners.k7_werft_treuhand.cash,0,'kein gebundenes Restkapital');
  assert.equal(s.stations.st_nadir.lager.material,4,'echte 4 Material für Jägerhülle');
  assert.equal(s.stations.st_nadir.lager.bauteil,8,'acht Bauteile vollständig produziert');
  assert.ok(s.stations.st_nadir.lager.frachter>=1,'K7-Werft baut echte zusätzliche Frachterhülle');
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
  assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));
  console.log('J4A_JAEGER_INPUTS_FINANZIERT '+JSON.stringify({seed,
    vorher:vorn,nachher:{
      ore:s.stations.st_nadir.lager.erz,
      material:s.stations.st_nadir.lager.material,
      silizium:s.stations.st_nadir.lager.silizium,
      bauteil:s.stations.st_nadir.lager.bauteil,
      frachter:s.stations.st_nadir.lager.frachter,
      werftReserve:s.owners.k7_werft_treuhand.cash,
      geld:Object.values(s.owners).reduce((n,o)=>n+o.cash,0)},
    hash:w.hash(s),tick:s.tick}));
 }
});
