import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {finanzierteJaegerBauteile} from '../tools/j4b-finanzierter-jaeger-gate.mjs';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');
const F=require('../prototypes/flug2d/flug-kern.js');
const J=require('../prototypes/j4c/duell.js');
const Geld=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const audit=(w,s)=>assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s).fehler));
async function neu(seed) {
 const {welt:alt,zustand:s}=await finanzierteJaegerBauteile(seed);
 assert.equal(alt.execute(s,{type:'stationBuildFighter',owner:'st_nadir',station:'st_nadir'}).ok,true);
 for(let i=0;i<alt.rules.j4.dauer;i++)alt.minute(s);
 assert.equal(alt.execute(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'jaeger'}).ok,true);
 const id=s.kanon.jaeger.kaeufe[0].id;
 assert.equal(s.owners.house.cash,1589);
 const hash=alt.hash(s);
 const {welt:w,zustand:n,quellHash}=Welt.ausRegel203J4c(alt.save(s));
 assert.equal(quellHash,hash);assert.equal(alt.hash(s),hash);
 audit(w,n);assert.equal(w.regel,204);assert.equal(Geld(n),33000);
 const cmd=(type,extra={})=>({type,owner:'house',schiff:id,...extra});
 assert.throws(()=>J.beginnen(w,n,id),'Jäger noch am Dock');
 const before=w.canonical(n);
 assert.equal(w.execute(n,cmd('shipUndock')).ok,true);
 assert.notEqual(w.canonical(n),before);
 for(let i=0;i<40;i++)w.teilschritt(n);
 assert.equal(n.ships[id].flug.lage,'frei');
 const duel=J.beginnen(w,n,id);
 assert.equal(duel.status,'aktiv');
 assert.equal(J.audit(duel).ok,true);
 assert.equal(duel.schiff,id);assert.equal(duel.sekunden,0);
 return {w,n,id,cmd,duel};
}
function schritt(a,sekunden=1) {
 for(let i=0;i<sekunden;i++){
  a.w.teilschritt(a.n);
  J.beobachten(a.w,a.n,a.duel);
  if(a.n.flug.schritt===0)audit(a.w,a.n);
 }
}
function anflug(a) {
 const {w,n,cmd,duel}=a;
 assert.equal(w.execute(n,cmd('shipFlyTo',{x:J.TREFFER.K.zielX,y:J.TREFFER.K.zielY})).ok,true);
 schritt(a,225);
 assert.equal(duel.status,'aktiv');
 assert.ok(Math.hypot(n.ships[a.id].flug.x-J.TREFFER.K.zielX,
   n.ships[a.id].flug.y-J.TREFFER.K.zielY)<7000);
}
function gewinnen(a) {
 anflug(a);
 for(let i=0;i<3;i++){
  const d=J.stand(a.duel),b=a.n.ships[a.id].flug;
  const richtung=F.richtungZu(d.ziel.x-b.x,d.ziel.y-b.y);
  assert.equal(a.w.execute(a.n,a.cmd('shipSteer',{kurs:richtung,fahrt:0})).ok,true);
  schritt(a,8);
  const original=a.w.hash(a.n),cash=Geld(a.n);
  const fire=J.feuern(a.w,a.n,a.duel);
  assert.equal(fire.ok,true,JSON.stringify(fire));
  assert.equal(a.w.hash(a.n),original,'virtueller Trainingsschuss darf Original-Weltzustand nicht ändern');
  assert.equal(Geld(a.n),cash,'keine realen Waren-, Schuss- oder Kopfgeldtransfers');
  schritt(a,16);
  assert.equal(J.audit(a.duel).ok,true,JSON.stringify(J.audit(a.duel)));
  assert.equal(J.stand(a.duel).treffer,i+1,'echte F8-E-Geometrie mit realem Jägerkörper');
 }
 assert.equal(a.duel.status,'sieg');
 assert.equal(J.stand(a.duel).zielHp,0);
 assert.ok(J.stand(a.duel).pilotHp>0);
 assert.equal(J.feuern(a.w,a.n,a.duel).ok,false,'keine Doppelschüsse nach Sieg');
}
for(const seed of [42,7])
 test('J4e Seed '+seed+': 900-ISK-Jäger, echte K1-F6-Flugminuten, F8-E-Duell, Löhne, Save-Hash',async()=>{
  const a=await neu(seed),{w,n,id}=a,pilot=n.owners.pilot_house.cash,
    startwert=w.buchwert(n,id);
  gewinnen(a);
  assert.equal(J.stand(a.duel).treffer,3);
  assert.equal(J.stand(a.duel).gegnerTreffer,2);
  assert.equal(J.stand(a.duel).pilotHp,48);
  assert.ok(n.owners.pilot_house.cash>pilot,'tatsächlich bezahlt aus Original-K1-Reserve');
  assert.ok(w.buchwert(n,id)<startwert,'realer Verschleiß statt Gratistraining');
  assert.equal(Geld(n),33000);assert.equal(n.minted,0);assert.equal(n.burned,0);
  audit(w,n);
  assert.equal(n.ledger.jaeger.consumed,1,'original 900-ISK-Kauf nicht rückgängig');
  const snapshot=w.save(n);
  assert.deepEqual(w.load(snapshot),n);
  assert.equal(w.hash(w.load(snapshot)),w.hash(n));
  assert.equal(snapshot.includes('zielprobe'),false,'Trainingsjournale sind kein Weltspielstand');
  assert.equal(snapshot.includes('gegnerGeschosse'),false);
  const gleich=structuredClone(a.duel);
  assert.deepEqual(gleich,a.duel);assert.equal(J.audit(gleich).ok,true);
  assert.equal(w.execute(n,a.cmd('shipDock',{station:'st_nadir'})).ok,true);
  for(let i=0;i<1200&&n.ships[id].flug.lage!=='angedockt';i++)schritt(a);
  assert.equal(n.ships[id].flug.lage,'angedockt','Siegende darf regulär nach Nadir zurück');
  for(let i=0;i<60&&n.kanon.flugdienst[id];i++)schritt(a);
  assert.equal(n.kanon.flugdienst[id],undefined,'unverbrauchtes Piloten-Geld zurück');
  assert.equal(Geld(n),33000);audit(w,n);
  console.log('J4E_PAID_DUEL',JSON.stringify({seed,id,tick:n.tick,hash:w.hash(n),
   treffer:gleich.zielprobe.treffer,gegentreffer:gleich.zielprobe.gegner.treffer,
   lohn:n.owners.pilot_house.cash-pilot,weltgeld:Geld(n),buchwert:w.buchwert(n,id)}));
 });
test('J4e: Training streckt weder echten Treffer ins Schiffsvermögen noch sperrt es die Heimreise nach Niederlage',async()=>{
 const a=await neu(42),{w,n,id}=a;
 anflug(a);
 assert.equal(w.execute(n,a.cmd('shipSteer',{kurs:64,fahrt:0})).ok,true);
 for(let i=0;i<700&&a.duel.status==='aktiv';i++)schritt(a);
 assert.equal(a.duel.status,'niederlage');
 assert.equal(J.stand(a.duel).pilotHp,0);
 assert.equal(J.stand(a.duel).gegnerTreffer,4);
 assert.equal(J.feuern(w,n,a.duel).ok,false);
 assert.equal(n.ships[id].owner,'house');
 assert.equal(n.ships[id].klasse,'jaeger');
 assert.equal(n.kanon.jaeger.verkauft,1);
 assert.equal(n.ships[id].flug.lage,'frei','Training ändert reale Schiffslage nicht');
 assert.equal(w.execute(n,a.cmd('shipDock',{station:'st_nadir'})).ok,true,
  'verlorenes Training darf den echten, bezahlten Rückflug nicht blockieren');
 for(let i=0;i<1200&&n.ships[id].flug.lage!=='angedockt';i++)schritt(a);
 assert.equal(n.ships[id].flug.lage,'angedockt');
 assert.equal(Geld(n),33000);audit(w,n);
});
test('J4e: falscher Schiffskauf, alte Regel und unterbrochener Beobachter gesperrt',async()=>{
 const a=await neu(42),{w,n,id,duel}=a;
 assert.throws(()=>J.beginnen(w,n,'f8_training_only'));
 const alteRegel={regel:203,rules:w.rules,audit:w.audit};
 assert.throws(()=>J.beginnen(alteRegel,n,id));
 const falsch=w.load(w.save(n));
 falsch.ships[id].owner='npc3';
 assert.throws(()=>J.beginnen(w,falsch,id));
 const manipuliert=structuredClone(duel);
 manipuliert.zielprobe.gegner.pilotHp=1;
 assert.equal(J.audit(manipuliert).ok,false);
 const v=w.hash(n);
 const jetzt=n.tick*60+n.flug.schritt;
 assert.equal(J.feuern(w,n,{...duel,zuletzt:jetzt-10}).ok,false);
 assert.equal(w.hash(n),v);
 w.teilschritt(n);w.teilschritt(n);
 J.beobachten(w,n,duel);
 assert.equal(duel.status,'unterbrochen','ausgelassene Original-Weltsekunde blockiert Training');
 assert.equal(J.feuern(w,n,duel).ok,false);
 assert.equal(Geld(n),33000);audit(w,n);
});
