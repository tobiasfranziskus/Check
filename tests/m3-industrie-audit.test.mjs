// Independent M3 evidence on main's Rule204 career. No research queue or new rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const OLD=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const Industry=require('../prototypes/spiel/p3-industrie.js');
const W6=require('../tools/w6-szenarien.cjs');
function start(){
 const j=J8.erstellen();j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 return {j,w,s};
}
function check(w,s){
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
}
function unchanged(w,s,cmd){
 const before=w.save(s),r=w.execute(s,cmd);
 assert.equal(r.ok,false,JSON.stringify(cmd));
 assert.equal(w.save(s),before,'refusal must preserve all accounts, goods and contracts');
 return r.reason;
}
test('M3: original prepaid W3/W4/W5 checkpoints and every-minute replay from active refinery',()=>{
 const {j,w,s}=start(),marks=[];let replay;
 for(let minute=0;minute<=300;minute++){
  if(minute===71){
   assert.equal(s.w3.auftrag.phase,'vorbestellt');
   assert.equal(s.owners.w3_kauf_treuhand.cash,740);
   assert.equal(s.owners.w3_arbeit_treuhand.cash,120);
   assert.equal(s.owners.k7_werft_treuhand.cash,530);
   assert.equal(s.kanon.industrieErz.signMiner,true);
   assert.equal(s.kanon.industrieErz.signFracht,true);
   assert.equal(s.kanon.industrieErz.signWerft,true);
   assert.equal(unchanged(w,s,{type:'shipFreight',owner:'house',
    schiff:s.w3.auftrag.schiff}),'Schiff gehört nicht dem Besitzer');
  }
  if(minute===203){
   assert.equal(s.w3.geliefert,50);assert.equal(s.w3.abgeschlossen,0);
   assert.equal(s.w3.frachtUmsatz,0,'outbound arrival is not a completed round trip');
   assert.equal(s.w4.materialErzeugt,0);
   assert.equal(s.owners.w4_arbeit_treuhand.cash,20);
   unchanged(w,s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
   replay=w.load(w.save(s));
  }
  if(minute===223){
   assert.equal(s.w4.erzVerbraucht,10);assert.equal(s.w4.materialErzeugt,5);
   assert.equal(s.w4.gezahlt,20);assert.equal(s.w5.materialVerbraucht,5);
   assert.equal(s.w5.materialUmsatz,500);assert.equal(s.w5.fertig,0);
   assert.equal(s.owners.k7_werft_treuhand.cash,0);
   assert.equal(s.owners.w5_arbeit_treuhand.cash,30);
   unchanged(w,s,{type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'});
  }
  if(minute===253){
   assert.equal(s.w5.fertig,1);assert.equal(s.w5.arbeitsGezahlt,30);
   assert.equal(s.stations.st_nadir.lager.frachter,1);
  }
  if(minute===263){
   assert.equal(s.w3.abgeschlossen,1);assert.equal(s.w3.arbeitsKosten,120);
   assert.equal(s.w3.frachtUmsatz,240);
   assert.equal(s.owners.w3_kauf_treuhand.cash,0);
   assert.equal(s.owners.w3_arbeit_treuhand.cash,0);
  }
  if([71,203,223,253,263,300].includes(minute)){
   check(w,s);marks.push({minute,hash:w.hash(s),ore:s.w3.geliefert,
    material:s.w4.materialErzeugt,hulls:s.w5.fertig});
  }
  if(replay)assert.equal(w.hash(replay),w.hash(s),'cold replay at minute '+minute);
  if(minute<300){w.advance(s,1);if(replay)w.advance(replay,1);}
 }
 const before=w.save(s),view=Industry.auswerten(w,s,j.angebote());
 assert.equal(view.kaufberechtigt,true);assert.equal(s.owners.house.cash,3000);
 assert.equal(w.save(s),before,'observing NPC industry cannot spend player cash');
 console.log('M3_ORIGINAL_CHECKPOINTS '+JSON.stringify(marks));
});
test('M3: player cannot sign foreign industry; genuine missing inputs fail without side effects',()=>{
 const {j,w,s}=start(),reasons=[];
 for(const cmd of [
  {type:'stationRefine',owner:'st_nadir',station:'st_nadir'},
  {type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'},
 ])reasons.push(unchanged(w,s,cmd));
 w.advance(s,223);
 for(const cmd of [
  {type:'stationRefine',owner:'house',station:'st_nadir'},
  {type:'stationBuildShip',owner:'house',station:'st_nadir'},
  {type:'shipFreight',owner:'house',schiff:s.w3.auftrag.schiff},
  {type:'industrialOreAcceptMine',owner:'house'},
  {type:'industrialOreAcceptFreight',owner:'house'},
  {type:'industrialOreAcceptYard',owner:'house'},
  {type:'industrialOreCommit',owner:'house'},
 ])reasons.push(unchanged(w,s,cmd));
 const before=j.exportieren();
 for(const id of ['stationRefine','stationBuildShip','industrialOreCommit',
  'transport:shipBuy','stationBuildShip-for-house']){
  assert.equal(j.ausfuehren(id).ok,false);
  assert.equal(j.exportieren(),before,'J8 must not confer operator authority');
 }
 check(w,s);console.log('M3_REFUSALS '+JSON.stringify(reasons));
});
test('M3: neutral cash theft, forged material and altered ownership fail during paid W5 work',()=>{
 const {j,w,s}=start();w.advance(s,223);
 const source=j.exportieren(),hash=w.hash(s);
 const valid=J8.erstellen();valid.oeffnen204(source,true);
 assert.equal(valid.exportieren(),source,'fresh session accepts the genuine paid-work save');
 for(const mutate of [
  x=>{x.owners.house.cash--;x.owners.werft_extern.cash++;},
  x=>{x.owners.w5_arbeit_treuhand.cash++;x.owners.werft_extern.cash--;},
  x=>{x.stations.st_nadir.lager.material++;x.ledger.material.produced++;},
  x=>{x.ships[x.w3.auftrag.schiff].owner='house';},
  x=>{x.kanon.industrieErz.signWerft=false;},
 ]){
  const forged=JSON.parse(source);mutate(forged);
  const text=JSON.stringify(forged);
  assert.throws(()=>w.load(text),'original loader must reject the forged economic evidence');
  const fresh=J8.erstellen();
  assert.throws(()=>fresh.oeffnen204(text,true),'fresh session must reach the load audit');
  assert.throws(()=>j.oeffnen204(text,true),/laufende Sitzung nicht überschreiben/);
  assert.equal(j.exportieren(),source,'failed load cannot replace live paid contracts');
  assert.equal(w.hash(j.zustandReferenz()),hash);
 }
 check(w,s);
});
