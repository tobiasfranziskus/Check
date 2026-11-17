import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),A=require('../prototypes/tutorial-pilot/akademie.js'),S=require('../prototypes/raum/raum-szene.js'),J=require('../prototypes/verbund/konzern-session.js');
const sample=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
function fall(){
 const j=J.erstellen();j.oeffnen204(sample,true);const w=j.weltReferenz(),s=w.load(sample),replay=w.load(sample);let id='sh023';
 const a=A.erstellen({welt:()=>w,zustand:()=>s,aktiv:()=>id,szene:S,angebot:c=>w.execute(w.load(w.save(s)),c)});
 const cmd=(type,extra={})=>{for(const state of [s,replay])assert.equal(w.execute(state,{type,owner:'house',schiff:id,...extra}).ok,true);a.beobachten(s);};
 const step=(n,until=()=>false)=>{for(let i=0;i<n;i++){w.teilschritt(s);w.teilschritt(replay);a.beobachten(s);if(until())break;}};
 const etappe=n=>assert.equal(a.stand().etappe,n,JSON.stringify(a.stand()));
 const start=()=>assert.equal(a.starten('flugpruefung').ok,true);
 const audit=()=>{assert.equal(w.audit(s).ok,true);assert.equal(w.save(s),w.save(replay));assert.equal(w.save(w.load(w.save(s))),w.save(s));assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);};
 return {a,w,s,replay,cmd,step,etappe,start,audit,wechsel:()=>{id='sh022';}};
}
function abflug(f){f.start();f.cmd('shipUndock');f.step(40);f.etappe(1);}
function anflug(f){abflug(f);f.cmd('shipSteer',{kurs:0,fahrt:20});f.step(100);f.cmd('shipApproach',{zielArt:'station',ziel:'st_nadir'});f.step(3000,()=>f.a.stand().etappe===2);f.etappe(2);}
function orbit(f){anflug(f);f.cmd('shipOrbit',{zielArt:'station',ziel:'st_nadir',radius:120000});f.step(6000,()=>f.a.stand().etappe===3);f.etappe(3);}
test('P2 Prüfung: vollständiger deterministischer Core-Flug mit Replay, Eigentum, Geld und Save/Load',()=>{
 const run=()=>{const f=fall();orbit(f);
 const pause=JSON.stringify(f.a.stand());for(let i=0;i<50;i++)f.a.beobachten(f.s);assert.equal(JSON.stringify(f.a.stand()),pause);
 const b=f.s.ships.sh023.flug;const kurs=(b.kurs+64)&255;
 f.cmd('shipSteer',{kurs,fahrt:50});f.step(100,()=>f.a.stand().etappe===4);f.etappe(4);
 f.cmd('shipDock',{station:'st_nadir'});f.step(6000,()=>f.a.stand().status==='erfolgreich');f.etappe(5);
 assert.equal(f.a.stand().status,'erfolgreich');assert.equal(f.a.stand().belege.length,5);f.audit();
 assert.equal(f.w.save(f.s).includes('handBasis'),false);
 const fresh=A.erstellen({welt:()=>f.w,zustand:()=>f.s,aktiv:()=> 'sh023',szene:S});assert.equal(fresh.stand().status,'bereit');
 return f.w.hash(f.s);};assert.equal(run(),run());
});
test('P2 Prüfung: Reihenfolge, verfrühte Rückkehr und Neustart im Flug gesperrt',()=>{
 const f=fall();abflug(f);f.cmd('shipOrbit',{zielArt:'station',ziel:'st_nadir',radius:120000});f.step(1500);f.etappe(1);
 assert.equal(f.a.starten('flugpruefung').ok,false);
 f.cmd('shipDock',{station:'st_nadir'});f.step(6000,()=>f.a.stand().status==='unterbrochen');assert.equal(f.a.stand().status,'unterbrochen');f.audit();
});
test('P2 Prüfung: Orbitwechsel setzt Halten zurück; Pause und Knüppelbefehl allein reichen nicht',()=>{
 const f=fall();anflug(f);f.cmd('shipOrbit',{zielArt:'station',ziel:'st_nadir',radius:120000});f.step(6000,()=>f.a.stand().stabil>=10);f.etappe(2);
 f.cmd('shipOrbit',{zielArt:'station',ziel:'st_nadir',radius:240000});assert.equal(f.a.stand().stabil,0);
 for(let i=0;i<40;i++)f.a.beobachten(f.s);f.etappe(2);
 f.step(6000,()=>f.a.stand().etappe===3);f.etappe(3);
 f.cmd('shipSteer',{kurs:f.s.ships.sh023.flug.kurs,fahrt:0});f.etappe(3);
 for(let i=0;i<50;i++)f.a.beobachten(f.s);f.etappe(3);f.audit();
});
test('P2 Prüfung: Beobachtungslücken, Eigentumsverlust, Schiffwechsel, fehlender Flugdienst und Strandung',()=>{
 for(const mutate of [f=>f.wechsel(),f=>f.s.ships.sh023.owner='npc3',f=>{f.w.teilschritt(f.s);f.w.teilschritt(f.s);},f=>delete f.s.kanon.flugdienst.sh023,f=>f.s.kanon.flugdienst.sh023.gestrandet=true]){
  const f=fall();abflug(f);mutate(f);f.a.beobachten(f.s);assert.equal(f.a.stand().status,'unterbrochen');
 }
});
test('P2 Prüfung: Unterfinanzierung und gefälschter Kauf geben keinen Start oder Fortschritt',()=>{
 const f=fall();f.cmd('shipUndock');f.step(40);
 // Spend real pilot wages, then return the remaining paid reserve at the dock.
 f.w.advance(f.s,1565);f.w.advance(f.replay,1565);
 f.cmd('shipDock',{station:'st_nadir'});f.step(100);
 assert.equal(f.s.ships.sh023.flug.lage,'angedockt');assert.equal(f.w.audit(f.s).ok,true);
 const before=f.w.save(f.s);assert.equal(f.a.starten('flugpruefung').ok,false);assert.equal(f.w.save(f.s),before);
 const g=fall();g.s.kanon.jaeger.kaeufe[0].preis=0;assert.equal(g.a.starten('flugpruefung').ok,false);
 assert.equal(A.LEKTIONEN.length,13);assert.equal(new Set(A.LEKTIONEN.map(l=>l.id)).size,13);
});
