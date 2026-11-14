import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {finanzierteJaegerBauteile} from '../tools/j4b-finanzierter-jaeger-gate.mjs';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');
const build=()=>({type:'stationBuildFighter',owner:'st_nadir',station:'st_nadir'});
const buy=(other={})=>({type:'shipBuy',owner:'house',station:'st_nadir',klasse:'jaeger',...other});
const geld=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const audit=(w,s,label)=>assert.equal(w.audit(s).ok,true,label+': '+JSON.stringify(w.audit(s).fehler));
function abweisen(w,s,cmd){
 const vorher=w.canonical(s),r=w.execute(s,cmd);
 assert.equal(r.ok,false,'illegaler Auftrag erfolgreich: '+JSON.stringify({cmd,r}));
 assert.equal(w.canonical(s),vorher,'Ablehnung ohne bezahlte oder materielle Nebenwirkungen');
}
async function kompletterJ4b(seed){
 const {welt:w,zustand:s,source,sourceState,sourceHash}=await finanzierteJaegerBauteile(seed);
 const before={
  parts:s.stations.st_nadir.lager.bauteil,mat:s.stations.st_nadir.lager.material,
  stCash:s.owners.st_nadir.cash,houseCash:s.owners.house.cash,ships:Object.keys(s.ships).length
 };
 assert.equal(before.parts,8);assert.equal(before.mat,4);
 assert.equal(geld(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 abweisen(w,s,buy());
 abweisen(w,s,{...build(),owner:'house'});
 abweisen(w,s,{...build(),betrag:0});
 const started=w.execute(s,build());
 assert.equal(started.ok,true,JSON.stringify(started));
 assert.equal(s.owners.st_nadir.cash,before.stCash-32,'32 ISK echter Auftraggeber-Lohnfonds');
 assert.equal(s.owners.j4_arbeit_treuhand.cash,32);
 assert.equal(s.kanon.jaeger.bauteileVerbraucht,8);
 assert.equal(s.kanon.jaeger.materialVerbraucht,4);
 assert.equal(s.stations.st_nadir.lager.bauteil,0);
 assert.equal(s.stations.st_nadir.lager.material,0);
 assert.equal(s.ledger.bauteil.consumed,8);
 assert.ok(s.ledger.material.consumed>=4);
 assert.equal(s.stations.st_nadir.lager.jaeger,0,'keine Hülle vor bezahlter Arbeit');
 audit(w,s,'J4b Rohware und Lohn gebunden');
 abweisen(w,s,build());
 abweisen(w,s,buy());
 const afterStart=w.hash(s),reloaded=w.load(w.save(s));
 assert.equal(w.hash(reloaded),afterStart,'laufender, vorfinanzierter Auftrag ist speicherbar');
 for(let minute=1;minute<=32;minute++){
  w.minute(s);
  assert.equal(s.owners.j4_jaeger_arbeiter.cash,minute,'jeder tatsächliche Arbeitslohn');
  assert.equal(s.owners.j4_arbeit_treuhand.cash,32-minute);
  assert.equal(s.stations.st_nadir.lager.jaeger,minute===32?1:0);
  audit(w,s,'J4b vollständig bezahlte Minute '+minute);
 }
 assert.equal(s.kanon.jaeger.begonnen,1);
 assert.equal(s.kanon.jaeger.fertig,1);
 assert.equal(s.kanon.jaeger.verkauft,0);
 assert.equal(s.kanon.jaeger.belege.length,1);
 assert.equal(s.ledger.jaeger.produced,1);
 assert.equal(s.kanon.jaeger.lohnBezahlt,32);
 assert.equal(s.owners.j4_arbeit_treuhand.cash,0);
 audit(w,s,'J4b nach Original-32-Minutendauer');
 const vorKauf=s.owners.house.cash,vorKasse=s.owners.st_nadir.cash;
 const ids=new Set(Object.keys(s.ships));
 abweisen(w,s,buy({owner:'npc3'}));
 abweisen(w,s,buy({station:'st_aldera'}));
 abweisen(w,s,buy({preis:0}));
 assert.equal(w.execute(s,buy()).ok,true,'Original-900-ISK-Kauf');
 const sh=Object.values(s.ships).find(x=>!ids.has(x.id));
 assert.ok(sh,'Original-Kern erzeugt echte und eindeutige Schiff-ID');
 assert.equal(sh.owner,'house');
 assert.equal(sh.klasse,'jaeger');
 assert.equal(sh.heimat,'nadir');
 assert.equal(sh.system,'nadir');
 assert.equal(sh.phase,'dock');
 assert.equal(sh.auftrag,'halten');
 assert.equal(sh.flug.lage,'angedockt');
 assert.equal(sh.flug.anker,'st_nadir');
 assert.equal(s.owners.house.cash,vorKauf-900);
 assert.equal(s.owners.st_nadir.cash,vorKasse+900,'Nadir hat bezahlte Ware verkauft');
 assert.equal(s.stations.st_nadir.lager.jaeger,0);
 assert.equal(s.ledger.jaeger.consumed,1);
 assert.equal(s.kanon.jaeger.verkauft,1);
 assert.deepEqual(s.kanon.jaeger.kaeufe,[{id:sh.id,tick:s.tick,owner:'house',station:'st_nadir',preis:900}]);
 assert.equal(geld(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 audit(w,s,'J4b Original-Schiff, Werftlohn, stationärer Kauf');
 const bericht=w.bericht(s);
 assert.equal(bericht.produktion.jaegerGebaut,1);
 assert.equal(bericht.produktion.jaegerVerkauft,1);
 assert.equal(bericht.inventar.jaegerLager,0);
 assert.equal(bericht.loehne.jaegerWerft,32);
 assert.equal(bericht.schiffe.find(x=>x.id===sh.id)?.buchwert,900,
   '900-ISK-Jäger ist realer Firmenanlagenwert, nicht unbelegter UI-Zustand');
 assert.ok(Number.isSafeInteger(bericht.firmen.house.anlagewert));
 assert.ok(bericht.firmen.house.anlagewert>=900);
 const save=w.save(s),loaded=w.load(save);
 assert.equal(w.hash(loaded),w.hash(s));
 assert.deepEqual(loaded,s);
 abweisen(w,s,buy());
 abweisen(w,s,build());
 assert.equal(source.hash(sourceState),sourceHash,'J4a-Quelle bleibt ohne Save-Migration identisch');
 return {w,s,sh,before,hash:w.hash(s),sourceHash};
}
for(const seed of [42,7])test('J4b seed '+seed+': echte 8+4 Inputgüter, 32 Lohn-ISK, 900-ISK-Jägerkauf mit F6-Körper',async()=>{
 const r=await kompletterJ4b(seed);
 console.log('J4B_PAID_FIGHTER '+JSON.stringify({seed,tick:r.s.tick,hash:r.hash,
  id:r.sh.id,house:r.s.owners.house.cash,nadir:r.s.owners.st_nadir.cash,
  input:r.before,lohn:r.s.kanon.jaeger.lohnBezahlt,preis:900,gesamt:geld(r.s)}));
});
test('J4b: ursprüngliche Regel202 kennt weder neuen Jägervertrag noch ein freies Jägerschiff',()=>{
 const w=Welt.erstellenJ3(),s=w.createState(42);
 abweisen(w,s,build());
 abweisen(w,s,buy());
 assert.equal(s.stations.st_nadir.lager.jaeger,undefined);
 assert.equal(s.kanon.jaeger,undefined);
});
test('J4b: erst bezahlte Lagerware; unterfinanzierter Werft- und Spielerauftrag abgelehnt',async()=>{
 const {welt:w,zustand:s}=await finanzierteJaegerBauteile(42);
 const raw=w.save(s);
 for(const change of [
  x=>x.stations.st_nadir.lager.bauteil--,
  x=>x.stations.st_nadir.lager.material--,
  x=>x.owners.st_nadir.cash=31,
  x=>x.owners.j4_arbeit_treuhand={id:'j4_arbeit_treuhand',kind:'k1-reserve',cash:8},
 ]){
  const q=w.load(raw);change(q);abweisen(w,q,build());
 }
 const began=w.execute(s,build());
 assert.equal(began.ok,true);
 for(let i=0;i<32;i++)w.minute(s);
 const then=w.save(s);
 const poor=w.load(then);poor.owners.house.cash=899;
 abweisen(w,poor,buy());
 audit(w,s,'Original unmanipulierter Auftrag erfolgreich');
});
test('J4b: falsche Hülle, Lohnbelege, Preis-, Käufer- und Warenmanipulationen scheitern im Import',async()=>{
 const {w,s}=await kompletterJ4b(42);
 const original=w.save(s),key=s.kanon.jaeger.kaeufe[0].id;
 for(const change of [
  x=>x.stations.st_nadir.lager.jaeger++,
  x=>x.ledger.jaeger.produced++,
  x=>x.ledger.jaeger.consumed--,
  x=>x.ledger.material.consumed--,
  x=>x.ledger.bauteil.consumed--,
  x=>x.kanon.jaeger.materialVerbraucht--,
  x=>x.kanon.jaeger.bauteileVerbraucht--,
  x=>x.kanon.jaeger.lohnBezahlt--,
  x=>x.kanon.jaeger.belege[0].lohn=0,
  x=>x.kanon.jaeger.kaeufe[0].preis=0,
  x=>x.kanon.jaeger.kaeufe[0].id='f8_training_only',
  x=>x.kanon.jaeger.kaeufe.push({...x.kanon.jaeger.kaeufe[0]}),
  x=>x.ships[key].owner='npc3',
  x=>x.ships[key].heimat='aldera',
  x=>x.ships[key].flug.anker='st_aldera',
  x=>x.owners.j4_jaeger_arbeiter.cash++,
 ]){
  const q=JSON.parse(original);change(q);
  assert.equal(w.audit(q).ok,false,'ungültige J4b-Manipulation abzuweisen');
  assert.throws(()=>w.load(JSON.stringify(q)),'manipulierter Jäger-Import');
 }
 audit(w,s,'Quellzustand nach Angriffen unverändert');
});
test('J4b: Regel203 nicht als 202/201/200/195-Save ladbar, kein Trainings-F8-Konto',async()=>{
 const {w,s}=await kompletterJ4b(42);
 for(const old of [Welt.erstellenJ3(),Welt.erstellenJ2b(),Welt.erstellenK7(),Welt.erstellen()])
  assert.throws(()=>old.load(w.save(s)),'kein stiller Rule203-Downgrade');
 assert.throws(()=>Welt.ausRegel202J4b(w.save(s)),'keine unbegrenzte Selbstmigration');
 for(const k of ['f8_training_only','kopfgeld','xp','trainingHp'])
  assert.equal(Object.hasOwn(s.kanon,k),false,'F8-Trainingswerte niemals Wirtschaftsbeläge');
});
