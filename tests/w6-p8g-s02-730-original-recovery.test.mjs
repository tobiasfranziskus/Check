/* W6/P8g: independent 730-day crisis-state rescue using only existing original commands. */
// W6/P8g: independent original-command recovery of worn transport fleet after S02×730.
// No new pricing, carrier grant, scripted warehouse goods, or NPC policy changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const policy=W6.SZENARIEN.find(s=>s.id==='S02').politik;
function sum(s){return Object.values(s.owners).reduce((a,o)=>a+o.cash,0);}
function verify(w,s){const a=w.audit(s);assert.equal(a.ok,true,a.fehler?.join('; '));assert.deepEqual(W6.pruefen(w,s),[]);
  assert.equal(sum(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(w.hash(w.load(w.save(s))),w.hash(s));}
function ready730(){
  const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
  const s=w.createState(42,{politik:policy});
  w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);w.materialSupplySetzen(s,true);
  let bought=0;
  for(let t=120;t<=730*1440;t+=120){
    w.advance(s,120);
    if(s.stations.st_nadir.lager.jaeger>0&&s.owners.house.cash>=900&&bought<3){
      const r=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
      assert.equal(r.ok,true,r.reason);bought++;
    }
  }
  verify(w,s);
  assert.equal(w.hash(s),'c5b60a0c1bf90c03','unveränderte original-finanzierte S02-730-Referenz');
  assert.equal(s.kanon.jaeger.fertig,2);
  assert.equal(s.stations.st_nadir.lager.silizium,8);
  assert.equal(s.stations.st_nadir.lager.material,10);
  assert.equal(s.stations.st_nadir.lager.frachter,0);
  const candidates=Object.values(s.ships).filter(x=>x.owner==='transport'&&x.klasse==='frachter'
    &&x.system==='aldera'&&x.phase==='dock'&&w.buchwert(s,x.id)>0);
  assert.deepEqual(candidates,[],'keine funktionsfähige transport-Hülle in Aldera');
  return {w,s,originalHash:w.hash(s),bought};
}
test('P8g-S02×730: erneuter 50-Erz-Auftrag über originalfinanzierten Ersatzfrachter bis Jäger Nr. 3',()=>{
  const {w,s,originalHash,bought}=ready730();
  assert.equal(s.tick,730*1440);
  w.politikSetzen(s,{automatik:false});
  const build=w.execute(s,{type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'});
  assert.equal(build.ok,true,build.reason);w.advance(s,30);
  const prev=new Set(Object.keys(s.ships));
  const buy=w.execute(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'});
  assert.equal(buy.ok,true,buy.reason);
  const id=Object.keys(s.ships).find(x=>!prev.has(x));
  const move=w.execute(s,{type:'shipReposition',owner:'transport',schiff:id});
  assert.equal(move.ok,true,move.reason);
  w.advance(s,60);verify(w,s);
  const miner=Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner'
    &&x.system==='aldera'&&x.phase==='dock'&&x.flug?.lage==='angedockt'
    &&Object.values(x.ladung).every(n=>n===0)&&w.buchwert(s,x.id)>0
    &&(!s.kanon.pendel[x.id]||s.kanon.pendel[x.id].ware==='erz')
    &&!s.erzpilotVertraege?.[x.id]).sort((a,b)=>a.id.localeCompare(b.id))[0];
  assert.ok(miner,'kein eigener noch arbeitsfähiger erzbereiter Miner');
  const before={w3:s.w3.abgeschlossen,j4:s.kanon.jaeger.fertig,
    warehouse:s.stations.st_nadir.lager.frachter,house:s.owners.house.cash};
  for(const cmd of [
    {type:'industrialOreOfferMaterial',owner:'st_nadir',miner:miner.id,frachter:id},
    {type:'industrialOreAcceptMine',owner:'npc3'},
    {type:'industrialOreAcceptFreight',owner:'transport'},
    {type:'industrialOreCommitMaterial',owner:'st_nadir'},
  ]){
    const r=w.execute(s,cmd);assert.equal(r.ok,true,'rechtmäßiger P8g-Vertrag: '+cmd.type+' '+r.reason);
  }
  verify(w,s);
  let mins=0;
  while(s.kanon.industrieErz.phase!=='geliefert'&&mins<1440){
    w.advance(s,60);mins+=60;verify(w,s);
  }
  assert.equal(s.kanon.industrieErz.phase,'geliefert','Original W1-W3-Fahrt muss beendet sein');
  assert.equal(s.w3.abgeschlossen,before.w3+1);
  assert.equal(s.stations.st_nadir.lager.erz,50);
  for(let i=0;i<5;i++){
    const r=w.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
    assert.equal(r.ok,true,'Original W4 Charge '+i+': '+r.reason);
    w.advance(s,w.rules.w4.dauer);verify(w,s);
  }
  assert.equal(s.stations.st_nadir.lager.erz,0);
  for(let i=0;i<8;i++){
    const r=w.execute(s,{type:'stationBuildParts',owner:'st_nadir',station:'st_nadir'});
    assert.equal(r.ok,true,'Original J3 Charge '+i+': '+r.reason);
    w.advance(s,w.rules.j3.dauer);verify(w,s);
  }
  const r=w.execute(s,{type:'stationBuildFighter',owner:'st_nadir',station:'st_nadir'});
  assert.equal(r.ok,true,'Jägerbau: '+r.reason);
  w.advance(s,w.rules.j4.dauer);verify(w,s);
  assert.equal(s.kanon.jaeger.fertig,before.j4+1);
  assert.equal(s.stations.st_nadir.lager.jaeger,1);
  const purchase=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
  assert.equal(purchase.ok,true,'Haus kann den Jäger aus eigenen ISK bezahlen: '+purchase.reason);
  verify(w,s);
  assert.equal(before.house-s.owners.house.cash,900);
  assert.equal(s.kanon.jaeger.fertig,3);
  assert.equal(s.kanon.jaeger.verkauft,bought+1);
  assert.equal(s.kanon.industrieErz.materialOnly,true);
  console.log('P8G_SECOND_REPLENISHMENT',JSON.stringify({originalHash,miner:miner.id,freighter:id,
    originalW3Jobs:s.w3.abgeschlossen,materials:s.stations.st_nadir.lager.material,
    builtFighters:s.kanon.jaeger.fertig,soldFighters:s.kanon.jaeger.verkauft,
    houseISK:s.owners.house.cash,worldISK:sum(s),mint:s.minted,burn:s.burned,
    newHullPurchased:true,oldHullNotReactivated:true,hash:w.hash(s)}));
});