// Integrated pilot academy's full per-second flight reads must NEVER mutate core.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J=require('../prototypes/verbund/konzern-session.js');
const A=require('../prototypes/tutorial-pilot/akademie.js');
const S=require('../prototypes/raum/raum-szene.js');
const sample=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
function career(){
 const s=J.erstellen();s.oeffnen204(sample,true);
 assert.equal(s.uebernehmen('sh023',false).ok,true);
 assert.equal(s.flugBefehl({type:'shipUndock',owner:'house',schiff:'sh023'}).ok,true);
 return s;
}
const conservation=s=>{
 const z=s.zustandReferenz();
 assert.equal(s.weltReferenz().audit(z).ok,true);
 assert.equal(Object.values(z.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(z.minted,0);assert.equal(z.burned,0);
 assert.equal(s.flugAudit().ok,true);
};
test('P1 Pilot-Bindung: Originalflug liefert detached full-state snapshots nur auf Wunsch',()=>{
 const a=career(),b=career();
 const before=a.exportieren(),initialHash=a.ansicht().hash;
 let seen=0;
 assert.throws(()=>a.flugSchritte(1,undefined,{fake:true}),/Vollzustand-Beobachter/);
 assert.equal(a.exportieren(),before);
 a.flugSchritte(75,undefined,full=>{
   seen++;
   const actual=a.zustandReferenz();
   assert.notStrictEqual(full,actual);
   assert.notStrictEqual(full.ships,actual.ships);
   assert.notStrictEqual(full.owners,actual.owners);
   assert.equal(full.rulesVersion,204);
   assert.equal(typeof full.ships.sh023.flug.modus,'string');
   assert.equal(typeof full.flug.schritt,'number');
   assert.ok(Array.isArray(full.kanon.spielerFrachten.auftraege));
   // Simulate hostile or buggy tutorial code: these mutations must never reach
   // the original economic or flight state, even mid-transaction.
   full.owners.house.cash+=100000;
   full.ships.sh023.flug.x=1e9;
   full.kanon.jaeger.kaeufe[0].preis=0;
   full.minted=999;
 });
 b.flugSchritte(75);
 assert.equal(seen,75);
 assert.notEqual(a.ansicht().hash,initialHash);
 assert.equal(a.exportieren(),b.exportieren(),'read-only observer cannot change core/save bytes');
 conservation(a);conservation(b);
 const loaded=J.erstellen();loaded.oeffnen204(a.exportieren(),true);
 assert.equal(loaded.exportieren(),b.exportieren());
});
test('P1 Pilot-Bindung: original flight callbacks and full lessons coexist deterministically',()=>{
 const a=career(),b=career(),id='sh023';
 let samples=0;
 const academy=A.erstellen({
   welt:()=>a.weltReferenz(),zustand:()=>a.zustandReferenz(),
   aktiv:()=>id,szene:S,angebot:cmd=>a.flugAngebot(cmd)
 });
 assert.equal(academy.starten('auswahl').ok,true);
 assert.equal(academy.stand().status,'erfolgreich');
 const original=a.exportieren();
 assert.equal(academy.starten('aufschalten').ok,false,'lock training requires paid free flight');
 a.flugSchritte(40,()=>samples++);
 b.flugSchritte(40);
 assert.equal(samples,40);
 assert.equal(a.exportieren(),b.exportieren());
 assert.equal(academy.starten('aufschalten').ok,true);
 a.flugSchritte(10,undefined,full=>academy.beobachten(full));
 b.flugSchritte(10);
 assert.equal(academy.stand().status,'aktiv');
 assert.equal(a.exportieren(),b.exportieren());
 assert.notEqual(a.exportieren(),original);
 conservation(a);
});
test('P1 Pilot/Manager shells load in deterministic order, no separate academy saves',()=>{
 const html=fs.readFileSync(new URL('../prototypes/spiel/index.html',import.meta.url),'utf8');
 const script=fs.readFileSync(new URL('../prototypes/spiel/spiel.js',import.meta.url),'utf8');
 const mod=fs.readFileSync(new URL('../prototypes/tutorial-pilot/akademie.js',import.meta.url),'utf8');
 assert.ok(html.indexOf('tutorial-manager/manager.js')>=0);
 assert.ok(html.indexOf('tutorial-pilot/akademie.js')>html.indexOf('tutorial-manager/manager.js'));
 assert.ok(html.indexOf('tutorial-pilot/menue.js')>html.indexOf('tutorial-pilot/akademie.js'));
 assert.ok(html.indexOf('tutorial-pilot/menue.js')<html.indexOf('src="spiel.js"'));
 assert.match(html,/id="pilotenausbildung-karten"/);
 assert.match(script,/flugSchritte\(n,beobachten,beobachtet\?original/);
 assert.match(script,/PilotenAkademie\.erstellen/);
 assert.match(script,/PilotenMenue\.verbinden/);
 assert.doesNotMatch(mod,/localStorage|session\.ausfuehren\(/);
});
