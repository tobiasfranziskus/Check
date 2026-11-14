import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {finanzierteJaegerBauteile} from '../tools/j4b-finanzierter-jaeger-gate.mjs';
const require=createRequire(import.meta.url);
const Kurs=require('../prototypes/j4c/patrouille.js');
const Welt=require('../prototypes/welt/welt-kern.js');
const summe=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function fixture(){
 const id='sh023';
 return {rulesVersion:204,tick:20,flug:{schritt:0},ships:{[id]:{
  id,owner:'house',klasse:'jaeger',system:'nadir',
  flug:{x:0,y:0,vx:0,vy:0,lage:'angedockt',anker:'st_nadir'}}},
  kanon:{jaeger:{kaeufe:[{id,owner:'house',station:'st_nadir'}]}}};
}
function sekunde(s,p,position,lage='frei',vx=0,vy=0){
 s.flug.schritt++;
 if(s.flug.schritt===60){s.flug.schritt=0;s.tick++;}
 Object.assign(s.ships.sh023.flug,{...position,lage,vx,vy});
 Kurs.beobachten(p,s);
}
test('J4d: nur real signierter, am Nadir-Dock befindlicher Regel204-Jäger',()=>{
 const s=fixture();
 const p=Kurs.beginnen(s,'sh023');
 assert.equal(p.stufe,0);assert.equal(p.status,'bereit');
 assert.equal(Kurs.stand(p).weg,0);
 assert.throws(()=>Kurs.beginnen(s,'fake'));
 s.kanon.jaeger.kaeufe=[];
 assert.throws(()=>Kurs.beginnen(s,'sh023'));
 s.kanon.jaeger.kaeufe=[{id:'sh023',owner:'house',station:'st_nadir'}];
 s.rulesVersion=203;assert.throws(()=>Kurs.beginnen(s,'sh023'));
 s.rulesVersion=204;s.ships.sh023.flug.lage='frei';
 assert.throws(()=>Kurs.beginnen(s,'sh023'));
});
test('J4d: drei wirkliche Ort-/Tempokontrollen, Reihenfolge und echte Dock-Rückkehr',()=>{
 const s=fixture(),p=Kurs.beginnen(s,'sh023');
 const beta=Kurs.TORE[1];
 sekunde(s,p,{x:beta.x,y:beta.y});assert.equal(p.stufe,0,'Beta kann Alpha nicht überspringen');
 for(const marke of Kurs.TORE){
  sekunde(s,p,marke,'frei',301,0);
  assert.equal(p.stufe,p.kontrollen.length,'zu hohe Geschwindigkeit verweigert Ziel');
  sekunde(s,p,marke,'frei',100,0);
 }
 assert.equal(p.stufe,3);assert.equal(p.status,'flug');
 sekunde(s,p,{x:0,y:0},'angedockt');
 assert.equal(p.status,'erfolgreich');assert.equal(p.kontrollen.length,3);
 assert.equal(Kurs.stand(p).erreicht,3);
 assert.equal(Kurs.stand(p).ziel,'Nadir-Dock');
 assert.ok(p.weg>0);
 const kopie=JSON.parse(JSON.stringify(p));
 assert.deepEqual(kopie,p);
 sekunde(s,p,{x:100,y:100});
 assert.equal(p.status,'erfolgreich','abgeschlossene Übung kann nicht doppelt abgeschlossen werden');
});
test('J4d: verfrühte Rückkehr oder übersprungene Weltsekunde scheitert ohne Geldwirkung',()=>{
 let s=fixture(),p=Kurs.beginnen(s,'sh023');
 sekunde(s,p,{x:10000,y:0});sekunde(s,p,{x:0,y:0},'angedockt');
 assert.equal(p.status,'abgebrochen');
 s=fixture();p=Kurs.beginnen(s,'sh023');
 s.flug.schritt=4;Kurs.beobachten(p,s);
 assert.equal(p.status,'unterbrochen');
 assert.equal(Kurs.stand(p).erreicht,0);
});
test('J4d: vollständige W0–W5/J2–J4-Kette plus reale F6-Patrouille Seed42, Lohn und Save',async()=>{
 const {welt:alt,zustand:s}=await finanzierteJaegerBauteile(42);
 assert.equal(alt.execute(s,{type:'stationBuildFighter',owner:'st_nadir',station:'st_nadir'}).ok,true);
 for(let m=0;m<alt.rules.j4.dauer;m++)alt.minute(s);
 const kauf=alt.execute(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'jaeger'});
 assert.equal(kauf.ok,true,JSON.stringify(kauf));
 const id=s.kanon.jaeger.kaeufe[0].id,quellHash=alt.hash(s);
 const c=Welt.ausRegel203J4c(alt.save(s)),{welt:w,zustand:n}=c;
 assert.equal(c.quellHash,quellHash);
 assert.equal(w.audit(n).ok,true);
 const alterPilot=n.owners.pilot_house.cash,alterWert=w.buchwert(n,id);
 const p=Kurs.beginnen(n,id),cmd=(type,extra={})=>({type,owner:'house',schiff:id,...extra});
 assert.equal(w.execute(n,cmd('shipUndock')).ok,true);
 function schritt(){
   w.teilschritt(n);Kurs.beobachten(p,n);
   if(n.flug.schritt===0)assert.equal(w.audit(n).ok,true,'Core-Audit während bezahlter F6-Mission');
 }
 for(let i=0;i<50&&n.ships[id].flug.lage!=='frei';i++)schritt();
 assert.equal(n.ships[id].flug.lage,'frei');
 for(let j=0;j<Kurs.TORE.length;j++){
   const z=Kurs.TORE[j],r=w.execute(n,cmd('shipFlyTo',{x:z.x,y:z.y}));
   assert.equal(r.ok,true,'Originalflugziel '+z.name+': '+JSON.stringify(r));
   for(let i=0;i<16000&&p.stufe===j;i++)schritt();
   assert.equal(p.stufe,j+1,'physisch langsam genug passierte Boje '+z.name);
 }
 assert.equal(w.execute(n,cmd('shipDock',{station:'st_nadir'})).ok,true);
 for(let i=0;i<16000&&p.status==='flug';i++)schritt();
 assert.equal(p.status,'erfolgreich','echter Jäger am echten Dock');
 for(let i=0;i<60&&n.kanon.flugdienst[id];i++)schritt();
 assert.equal(n.kanon.flugdienst[id],undefined,'Originalreserve zurückgebucht');
 assert.ok(n.owners.pilot_house.cash>alterPilot,'real bezahlter Pilotenlohn');
 assert.ok(w.buchwert(n,id)<alterWert,'tatsächlicher Aktivverschleiß');
 assert.equal(summe(n),33000);assert.equal(n.minted,0);assert.equal(n.burned,0);
 assert.equal(w.audit(n).ok,true,JSON.stringify(w.audit(n).fehler));
 assert.deepEqual(w.load(w.save(n)),n);
 assert.equal(w.hash(w.load(w.save(n))),w.hash(n));
 console.log('J4D_REAL_PATROL',JSON.stringify({id,hash:w.hash(n),tick:n.tick,
   kontrollen:p.kontrollen,weg:p.weg,dauer:p.letzter-p.gestartet,
   pilotLohn:n.owners.pilot_house.cash-alterPilot,weltgeld:summe(n)}));
});
