import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {finanzierteJaegerBauteile} from '../tools/j4b-finanzierter-jaeger-gate.mjs';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');
const kost=()=>({type:'stationBuildFighter',owner:'st_nadir',station:'st_nadir'});
const buy=()=>({type:'shipBuy',owner:'house',station:'st_nadir',klasse:'jaeger'});
const geld=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const audit=(w,s,label)=>assert.equal(w.audit(s).ok,true,label+': '+JSON.stringify(w.audit(s).fehler));
function ablehnen(w,s,cmd){
 const vorher=w.canonical(s),r=w.execute(s,cmd);
 assert.equal(r.ok,false,'Fremdauftrag wurde angenommen: '+JSON.stringify({cmd,r}));
 assert.equal(w.canonical(s),vorher,'unerlaubter Befehl muss atomar sein');
}
async function bezahlt(seed){
 const {welt:alt,zustand:s}=await finanzierteJaegerBauteile(seed);
 const r=alt.execute(s,kost());assert.equal(r.ok,true,JSON.stringify(r));
 for(let i=0;i<alt.rules.j4.dauer;i++)alt.minute(s);
 assert.equal(s.stations.st_nadir.lager.jaeger,1);
 assert.equal(alt.execute(s,buy()).ok,true);
 const id=s.kanon.jaeger.kaeufe[0].id;
 const ursprung=alt.hash(s),c=Welt.ausRegel203J4c(alt.save(s));
 assert.equal(c.quellHash,ursprung);
 assert.equal(alt.hash(s),ursprung,'Quellwelt nicht verändert');
 const {welt:w,zustand:neu}=c;
 assert.equal(w.regel,204);assert.equal(w.j4cBezahlterJaegerflug,true);
 assert.equal(neu.ships[id].owner,'house');
 assert.equal(neu.ships[id].klasse,'jaeger');
 assert.equal(neu.ships[id].flug.lage,'angedockt');
 assert.equal(neu.kanon.jaeger.verkauft,1);
 assert.equal(w.buchwert(neu,id),900);
 assert.equal(geld(neu),33000);
 audit(w,neu,'wirkliche bezahlte Jäger-Herkunft');
 return {w,s:neu,id,ursprung};
}
async function flug(seed){
 const {w,s,id,ursprung}=await bezahlt(seed);
 const cmd=(type,rest={})=>({type,owner:'house',schiff:id,...rest});
 const k=s.owners.house.cash, pilot=s.owners.pilot_house.cash;
 ablehnen(w,s,cmd('shipFlyTo',{x:100000,y:-80000}));
 ablehnen(w,s,cmd('shipUndock',{gratis:true}));
 ablehnen(w,s,{type:'shipUndock',owner:'npc3',schiff:id});
 ablehnen(w,s,{type:'shipUndock',owner:'house',schiff:'f8-training'});
 assert.equal(w.execute(s,cmd('shipUndock')).ok,true);
 assert.equal(s.owners.house.cash,k-40,'40 bezahlbare ISK im bestehenden Original-Flugdienst vorgemerkt');
 assert.equal(s.owners['k1_flug_'+id].cash,40);
 assert.equal(s.kanon.flugdienst[id].konto,'k1_flug_'+id);
 assert.equal(s.ships[id].flug.lage,'abdocken');
 audit(w,s,'direkt nach finanziertem Abdocken');
 ablehnen(w,s,cmd('shipUndock'));
 for(let i=0;i<40;i++)w.teilschritt(s);
 assert.equal(s.ships[id].flug.lage,'frei','nur Original-F6-Schritt macht den Jäger frei');
 audit(w,s,'nach echten F6-Abdocksekunden');
 const f=w.execute(s,cmd('shipFlyTo',{x:180000,y:-100000}));
 assert.equal(f.ok,true,JSON.stringify(f));
 const vor={x:s.ships[id].flug.x,y:s.ships[id].flug.y};
 for(let i=0;i<220;i++){
  w.teilschritt(s);
  if(s.flug.schritt===0)audit(w,s,'F6-minutengrenze physischer Flug');
 }
 assert.ok(s.ships[id].flug.x!==vor.x||s.ships[id].flug.y!==vor.y,'echte 2D-Ortsbewegung, kein Trainer');
 assert.ok(s.owners.pilot_house.cash>=pilot+3,'mindestens drei reale Lohnminuten');
 assert.ok(w.buchwert(s,id)<900,'verschleißbedingter echter Anlagenwertverlust');
 assert.ok(s.kanon.verschleiss[id]>=3);
 assert.equal(geld(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 audit(w,s,'während Flug mit Pilotarbeitsbuch');
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s),'Freiflug speicherbar');
 const sv=w.save(s);
 const kopie=w.load(sv);
 assert.deepEqual(kopie,s);
 assert.equal(w.execute(s,cmd('shipSteer',{kurs:175,fahrt:50})).ok,true);
 for(let i=0;i<20;i++)w.teilschritt(s);
 assert.equal(s.ships[id].flug.modus,'hand');
 assert.equal(w.execute(s,cmd('shipDock',{station:'st_nadir'})).ok,true);
 for(let i=0;i<2500&&s.ships[id].flug.lage!=='angedockt';i++){
   w.teilschritt(s);
   if(s.flug.schritt===0)audit(w,s,'autonomer Rückdockanflug');
 }
 assert.equal(s.ships[id].flug.lage,'angedockt','echte physische Distanz und Docktempo');
 // Pilotdienst und Reservefreigabe erst bei autoritativer Abrechnungsminute.
 for(let i=0;i<60&&s.kanon.flugdienst[id];i++)w.teilschritt(s);
 assert.equal(s.kanon.flugdienst[id],undefined);
 assert.equal(s.owners['k1_flug_'+id].cash,0,'unverbrauchtes Geld an Spieler zurück');
 assert.ok(s.owners.house.cash<k,'mindestens eine geleistete Pilotminute ist nicht gratis');
 assert.ok(s.owners.pilot_house.cash>pilot,'Pilot hat aus den tatsächlichen Minuten Einkommen');
 assert.ok(s.kanon.fluglohnMinuten>=kopie.kanon.fluglohnMinuten,
  'allgemeines Original-K1-Fluglohnjournal darf keine Stunden löschen');
 assert.equal(geld(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 audit(w,s,'ausgeflogen und bezahlt zurück am Dock');
 assert.deepEqual(w.load(w.save(s)),s);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 console.log('J4C_PAID_FLIGHT',JSON.stringify({seed,tick:s.tick,id,ursprung,hash:w.hash(s),
   pilotLohn:s.owners.pilot_house.cash-pilot,verschleiss:s.kanon.verschleiss[id],
   buchwert:w.buchwert(s,id),house:s.owners.house.cash,weltgeld:geld(s)}));
 return {w,s,id};
}
for(const seed of [42,7])
 test('J4c Seed '+seed+': echten bezahlten J4b-Jäger physisch steuern, Löhne, Verschleiß, Rückdock',async()=>{
  await flug(seed);
 });
test('J4c: alte Version kennt J4c-Befehle nicht, keine kostenlose Hülle',async()=>{
 const w=Welt.erstellenJ4c(),s=w.createState(42);
 assert.equal(s.kanon.jaeger.verkauft,0);
 assert.equal(s.stations.st_nadir.lager.jaeger,0);
 ablehnen(w,s,{type:'shipUndock',owner:'house',schiff:'f8-training'});
 assert.equal(geld(s),33000);audit(w,s,'zero fighter genesis');
 const b=Welt.erstellenJ4b(),q=b.createState(42);
 assert.throws(()=>b.load(w.save(s)));
 assert.throws(()=>Welt.ausRegel203J4c(w.save(s)),'Regel204 nicht als Regel203 geladen');
});
test('J4c: keine geschenkte Lohnreserve und keine fremden Flugrechte',async()=>{
 const {w,s,id}=await bezahlt(42),cmd={type:'shipUndock',owner:'house',schiff:id};
 const knapp=w.load(w.save(s));
 knapp.owners.house.cash=39;
 ablehnen(w,knapp,cmd);
 const alien=w.load(w.save(s));
 alien.ships[id].owner='npc3';
 ablehnen(w,alien,cmd);
 for(const other of [
  {type:'shipSteer',owner:'house',schiff:id,kurs:256,fahrt:100},
  {type:'shipSteer',owner:'house',schiff:id,kurs:64,fahrt:101},
  {type:'shipUndock',owner:'house',schiff:id,werftGratis:true},
 ])ablehnen(w,s,other);
});
test('J4c: manipulierte Flugreserve, Eigentum, Doppelbuch und Zwischenstand abgewiesen',async()=>{
 const {w,s,id}=await bezahlt(42);
 assert.equal(w.execute(s,{type:'shipUndock',owner:'house',schiff:id}).ok,true);
 for(let i=0;i<75;i++)w.teilschritt(s);
 const sv=w.save(s);
 for(const damage of [
  x=>{x.owners['k1_flug_'+id].cash++;},
  x=>{delete x.kanon.flugdienst[id];},
  x=>{x.kanon.jaeger.kaeufe[0].id='training-only';},
  x=>{x.ships[id].owner='npc3';},
  x=>{x.ships[id].flug.anker='st_nadir';},
  x=>{x.ships[id].flug.x=999999999;},
  x=>{x.kanon.fluglohnMinuten--;},
  x=>{x.kanon.verschleiss[id]=-1;},
 ]){
  const t=JSON.parse(sv);damage(t);
  assert.equal(w.audit(t).ok,false,'manipulierter bezahlter Flug muss scheitern');
  assert.throws(()=>w.load(JSON.stringify(t)));
 }
 audit(w,s,'originaler aktiver bezahlter Flug bleibt gültig');
});
