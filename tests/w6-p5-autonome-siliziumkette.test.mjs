// W6/P5 [ANALYSE/OPT-IN]: Vollstaendige NPC3-Silizium-Entscheidungskette
// auf EINER autoritativen Rule204-Sitzung. Neue Finanz-/Eigentumsregeln: keine.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W6=require('../tools/w6-szenarien.cjs');
const P=W6.SZENARIEN.find(x=>x.id==='S02').politik;
const start=()=>W6.start(P);
function sauber(w,s){
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.owners.house.cash,3000,'Sparguthaben bleibt in Spielerhand');
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
}
function bis(w,s,test,max,fehl){
 for(let i=0;i<max;i++){
  if(test())return;
  w.minute(s);
 }
 assert.fail(fehl+' bis Tick '+s.tick+'; '+JSON.stringify({
  p5:s.kanon.npcSilizium,b:s.kanon.minerWerft,
  lager:s.stations.st_nadir.lager,
  kap:{npc3:s.owners.npc3.cash,nadir:s.owners.st_nadir.cash,
   werft:s.owners.werft_extern.cash},pause:s.kanon.npc.pausen}));
}
test('W6/P5: NPC3 finanziert K2-Miner, fliegt und verkauft J2b-Silizium autonom',()=>{
 const {welt:w,s}=start();
 assert.equal(s.kanon.npcSilizium,undefined,'originale S02-Referenz bleibt ohne P5-Feld');
 assert.equal(w.npcSiliziumSetzen(s,true).ok,true);
 const beginn=w.save(s),hashBeginn=w.hash(s);
 bis(w,s,()=>s.kanon.silizium.verkauft>=8,14000,'NPC3-Foerderkette');
 const endeTick=s.tick, endHash=w.hash(s), n=s.kanon.npc;
 const lokalen=s.kanon.minerWerft.lokaleKaeufe??[];
 assert.ok(lokalen.some(x=>x.owner==='npc3'),'realer NPC3-Kauf im K2-Buch');
 const sh=Object.values(s.ships).find(x=>x.owner==='npc3'&&x.heimat==='nadir'&&x.klasse==='miner');
 assert.ok(sh);
 assert.equal(s.kanon.silizium.belege.at(-1).owner,'npc3');
 for(const k of ['werft_extern:stationBuildMiner','npc3:stationClaimMinerLocal',
  'npc3:siliconMineStart','npc3:shipUndock','npc3:shipFlyTo',
  'npc3:shipDock','npc3:siliconSell']){
  assert.ok(n.befehle[k]>=1,'eigener rechtmaessiger NPC-Befehl: '+k);
 }
 assert.deepEqual(n.abgelehnt,{});
 assert.equal(s.kanon.silizium.verkauft,8);
 assert.equal(s.kanon.silizium.vorrat,8);
 assert.equal(s.stations.st_nadir.lager.silizium,8);
 assert.equal(s.kanon.npcSilizium.werftauftrag,false);
 sauber(w,s);
 assert.equal(w.hash(w.load(w.save(s))),endHash);
 const clone=w.load(beginn);
 w.advance(clone,endeTick);
 assert.equal(w.canonical(clone),w.canonical(s),'echtes deterministisches Save/Replay bei P5');
 assert.equal(w.hash(clone),endHash);
 assert.notEqual(endHash,hashBeginn);
 console.log('W6_P5_AUTONOM_SILIZIUM',JSON.stringify({
  tick:endeTick,hash:endHash,miner:sh.id,owner:sh.owner,
  eigentumsbuch:lokalen.length,verkauft:s.kanon.silizium.verkauft,
  feldRest:s.kanon.silizium.vorrat,weltgeld:33000,spieler:3000,
  befehle:n.befehle}));
 // Nach der vollständig verkauften Charge darf der opt-in sicher stoppen.
 assert.deepEqual(w.npcSiliziumSetzen(s,false),{ok:true,aktiviert:false});
 const ende=s.kanon.silizium.verkauft;
 w.advance(s,180);
 assert.equal(s.kanon.silizium.verkauft,ende,'Opt-out erzeugt keine weitere Silizium-Förderung');
 sauber(w,s);
});
test('W6/P5: P5 ohne NPC-Opt-in ist kein verdeckter Firmenauftrag',()=>{
 const {welt:w,s}=start();
 w.npcAutoSetzen(s,false);
 w.npcSiliziumSetzen(s,true);
 w.advance(s,360);
 assert.equal(s.kanon.npc.befehle['npc3:siliconMineStart'],undefined);
 assert.equal(s.kanon.npc.befehle['werft_extern:stationBuildMiner'],undefined);
 assert.equal(s.kanon.silizium.verkauft,0);
 sauber(w,s);
});
test('W6/P5: Manipulation und laufende Fremdauftraege bleiben gesperrt',()=>{
 const {welt:w,s}=start();
 assert.throws(()=>w.npcSiliziumSetzen(s,'ja'));
 assert.equal(s.kanon.npcSilizium,undefined);
 w.npcSiliziumSetzen(s,true);
 for(const mut of [
  x=>{x.kanon.npcSilizium.aktiv='ja';},
  x=>{x.kanon.npcSilizium.werftauftrag=true;},
  x=>{x.kanon.npcSilizium.neuerMiner='gratis';},
 ]){
  const q=JSON.parse(w.save(s));mut(q);
  assert.equal(w.audit(q).ok,false,'P5-Option wird im Originalbuch validiert');
  assert.throws(()=>w.load(JSON.stringify(q)));
 }
 sauber(w,s);
});
