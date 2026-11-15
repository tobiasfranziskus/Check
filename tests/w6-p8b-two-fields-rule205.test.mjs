// W6/P8b Rule205 [ANALYSE] – zweite ENDLICHE physische Nadir-Lagerstaette.
// KEINE Dravos-Fracht, keine Main-/Spielstand-Migration und keine Rohstoffgeschenke.
// Abbau/Flug/Kauf/Loch im Geldbuch laufen im EINEN originalen Weltkern.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W6=require('../tools/w6-szenarien.cjs');
const K=require('../prototypes/welt/welt-kern.js');
const S02=W6.SZENARIEN.find(x=>x.id==='S02').politik;
function quelle(){
 const {welt,s}=W6.start(S02);
 const save=welt.save(s);
 assert.equal(welt.regel,204);
 assert.equal(welt.audit(s).ok,true);
 return {welt,s,save,hash:welt.hash(s)};
}
const audit=(w,s)=>{
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
};
test('P8b: 204 bleibt kanonisch, 205 entsteht nur durch ausdrueckliche, pruefbare Quellkopie',()=>{
 const alt=quelle();
 const moved=K.ausRegel204P8b(alt.save),w=moved.welt,s=moved.zustand;
 assert.equal(moved.quellHash,alt.hash);
 assert.equal(alt.welt.save(alt.s),alt.save);
 assert.equal(w.regel,205);
 assert.equal(w.p8bZweiEndlicheFelder,true);
 assert.equal(moved.neueBodenreserve,16);
 assert.equal(s.kanon.silizium.vorrat,32);
 assert.deepEqual(Object.keys(s.kanon.silizium.felder).sort(),
  ['nadir-primaer','nadir-sekundaer']);
 assert.equal(s.kanon.silizium.felder['nadir-primaer'].vorrat,16);
 assert.equal(s.kanon.silizium.felder['nadir-sekundaer'].vorrat,16);
 assert.equal(s.ledger.silizium.mined,0);
 assert.equal(s.stations.st_nadir.lager.silizium,0);
 assert.equal(s.stations.st_nadir.lager.bauteil,0);
 assert.equal(s.stations.st_nadir.lager.jaeger,0);
 assert.equal(Object.values(s.ships).filter(sh=>sh.owner==='house').length,0);
 assert.equal(s.owners.house.cash,3000);
 assert.deepEqual(s.kanon.npcSilizium,undefined);
 assert.equal(w.rules.world.systems.dravos,undefined);
 assert.notEqual(w.hash(s),alt.hash);
 audit(w,s);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 assert.throws(()=>alt.welt.load(w.save(s)),/Regelversion|Regel|migration/i);
 assert.throws(()=>K.ausRegel204P8b(w.save(s)),/Regel204/);
 assert.equal(K.erstellenJ4c({carrierCash:2000,buyerCash:4000}).regel,204);
 console.log('P8B_MIGRATION_AUDIT',JSON.stringify({
  quellHash:alt.hash,zielHash:w.hash(s),regel:205,
  boden:w.rules.j2b.feld.vorrat+w.rules.j2b.nebenfeld.vorrat,
  ware:0,weltgeld:33000,mint:0,burn:0}));
});
test('P8b: alle Lagerstaetten sind getrennt erschöpfbar, Manipulation faellt beim Laden auf',()=>{
 const {welt:old,save}=quelle();
 const {welt:w,zustand:s}=K.ausRegel204P8b(save);
 const vor=w.save(s);
 for(const change of [
  x=>{x.kanon.silizium.felder['nadir-sekundaer'].vorrat+=8;},
  x=>{x.kanon.silizium.vorrat+=16;},
  x=>{x.kanon.silizium.felder['nadir-primaer'].gefoerdert=1;},
  x=>{x.kanon.silizium.felder['nadir-sekundaer'].verkauft=8;},
  x=>{x.rulesVersion=204;},
  x=>{x.stations.st_nadir.lager.silizium=8;},
  x=>{x.owners.npc3.cash+=192;},
 ]){
  const forged=JSON.parse(vor);change(forged);
  assert.equal(w.audit(forged).ok,false,'faelschende Geologie/Ware/Kasse muss abgelehnt werden');
  assert.throws(()=>w.load(JSON.stringify(forged)));
  assert.equal(w.save(s),vor);
 }
 assert.equal(old.load(save).rulesVersion,204);
});
test('P8b: Original-NPC3 foerdert legal aus zwei real getrennten Feldern; dritter bezahlter J4 wird nicht durch Gratiswaren erzeugt',()=>{
 const {welt:w,zustand:s}=K.ausRegel204P8b(quelle().save);
 assert.deepEqual(w.npcSiliziumSetzen(s,true),{ok:true,aktiviert:true});
 const anfang=w.save(s);
 let gekauft=0,ersterFremdkauf=null,checkpoint=null;
 for(let min=120;min<=90*1440;min+=120){
  w.advance(s,120);
  if(s.stations.st_nadir.lager.jaeger>0 && s.owners.house.cash>=900 && gekauft<3){
   const vor=s.owners.house.cash,nadir=s.owners.st_nadir.cash;
   const r=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
   assert.equal(r.ok,true,JSON.stringify(r));
   assert.equal(vor-s.owners.house.cash,900);
   assert.equal(s.owners.st_nadir.cash-nadir,900);
   gekauft++;
   if(!ersterFremdkauf)ersterFremdkauf=s.tick;
  }
  if(s.tick===30*1440){checkpoint=w.save(s);audit(w,s);}
  if(s.tick% (15*1440)===0)audit(w,s);
 }
 audit(w,s);
 const b=s.kanon.silizium,f=b.felder,ids=Object.keys(f);
 assert.equal(ids.length,2);
 assert.ok(b.gefoerdert>=24,'keine dritte volle Charge aus separatem Feld');
 assert.ok(f['nadir-primaer'].gefoerdert>=16,'urspruengliche 16er Quelle verbraucht');
 assert.ok(f['nadir-sekundaer'].gefoerdert>=8,'zusaetzlicher physischer Abbau erforderlich');
 assert.ok(b.belege.some(x=>x.feld==='nadir-sekundaer'),'echte Zusatzquelle im Kaufjournal');
 assert.ok(s.kanon.jaeger.fertig>=3,
  'keine dritte aus physischem Silizium bezahlte J4-Huelle: '+JSON.stringify({
   sil:b,gebaut:s.kanon.jaeger.fertig,gekauft,pausen:s.kanon.npc.pausen}));
 assert.ok(gekauft>=2,'mindestens 2 vollstaendige Original-Spielerkaeufe');
 assert.ok(s.kanon.ersatzkaeufe>20,'Eis-/Wasser-Ersatzlaeufe unveraendert aktiv');
 assert.equal(s.owners.house.cash,3000-900*gekauft);
 assert.equal(s.ledger.silizium.mined,b.gefoerdert);
 assert.equal(s.ledger.silizium.consumed,s.kanon.bauteile.siliziumVerbraucht);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 const restore=w.load(checkpoint);
 let replayBought=restore.kanon.jaeger.kaeufe.filter(x=>x.owner==='house').length;
 for(let t=restore.tick+120;t<=90*1440;t+=120){
  w.advance(restore,120);
  if(restore.stations.st_nadir.lager.jaeger>0 &&
    restore.owners.house.cash>=900 && replayBought<3){
   assert.equal(w.execute(restore,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'}).ok,true);
   replayBought++;
  }
 }
 audit(w,restore);
 assert.equal(w.hash(restore),w.hash(s));
 assert.equal(w.canonical(restore),w.canonical(s));
 const alt=quelle();
 assert.equal(alt.welt.regel,204);
 assert.equal(alt.s.kanon.silizium.vorrat,16);
 assert.equal(alt.welt.hash(alt.s),alt.hash,'Originalquelle bleibt unveraendert');
 console.log('P8B_90_TAGE_ECHTES_SILIZIUM',JSON.stringify({
  day:90,hash:w.hash(s),ersteJ4Abnahme:ersterFremdkauf,
  j4:s.kanon.jaeger.fertig,gekauft,f,bilanz:s.ledger.silizium,
  ersatz:s.kanon.ersatzkaeufe,weltgeld:33000,mint:0,burn:0}));
});
