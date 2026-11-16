// P4 – Real career flight telemetry and a reward-free patrol observer.
// No production economy, save schema, virtual prize, or counterfeit owned ship.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const W5=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const Kurs=require('../prototypes/j4c/patrouille.js');

function bezahlterMiner(){
 const s=J8.erstellen();
 s.starten195(W5.create(42,'private195').export(),true);
 const offer=s.angebote().find(o=>o.id==='buy-st_aldera-miner');
 assert.equal(offer?.ok,true);
 assert.equal(s.ausfuehren(offer.id).ok,true);
 const id=s.ansicht().schiffe.find(sh=>sh.klasse==='miner').id;
 assert.equal(s.uebernehmen(id,false).ok,true);
 assert.equal(s.flugBefehl({type:'shipUndock',schiff:id,owner:'house'}).ok,true);
 return {s,id};
}

test('P4: read-only telemetry produces identical funded career hashes and save bytes',()=>{
 const a=bezahlterMiner(),b=bezahlterMiner(),proben=[];
 const before=a.s.exportieren();
 assert.equal(before,b.s.exportieren());
 assert.throws(()=>a.s.flugSchritte(1,{}),TypeError);
 assert.equal(a.s.exportieren(),before);
 assert.equal(a.s.flugSchritte(60,p=>{
   proben.push(p);
   if(proben.length===1){
     assert.equal(Object.isFrozen(p),true);
     assert.equal(Object.isFrozen(p.ships[a.id].flug),true);
     assert.equal(Object.isFrozen(p.kanon.jaeger.kaeufe),true);
     assert.throws(()=>{p.ships[a.id].flug.x=999999;},TypeError);
     assert.throws(()=>{p.kanon.jaeger.kaeufe.push({id:'fake'});},TypeError);
     assert.equal(p.ships[a.id].owner,'house');
   }
 }),1);
 assert.equal(b.s.flugSchritte(60),1);
 assert.equal(proben.length,60);
 assert.equal(proben[0].flug.schritt,1);
 assert.equal(proben[59].flug.schritt,0);
 assert.equal(a.s.exportieren(),b.s.exportieren(),'flight and money must not depend on UI observers');
 assert.equal(a.s.zustandReferenz().minted,0);
 assert.equal(a.s.zustandReferenz().burned,0);
 assert.equal(a.s.weltReferenz().audit(a.s.zustandReferenz()).ok,true);
 const reload=J8.erstellen();reload.oeffnen204(a.s.exportieren(),true);
 assert.equal(reload.exportieren(),a.s.exportieren());
});

function regel204Jaeger(){
 const id='paid-test-jaeger';
 return {id,s:{
  rulesVersion:204,tick:0,flug:{schritt:0},
  ships:{[id]:{id,owner:'house',klasse:'jaeger',system:'nadir',
   flug:{lage:'angedockt',anker:'st_nadir',x:0,y:0,vx:0,vy:0}}},
  kanon:{jaeger:{kaeufe:[{id,owner:'house',station:'st_nadir'}]}}
 }};
}
function sekunde(s,zahl,x,y,vx=0,vy=0,lage='frei'){
 s.tick=Math.floor(zahl/60);s.flug.schritt=zahl%60;
 Object.assign(s.ships[Object.keys(s.ships)[0]].flug,{x,y,vx,vy,lage});
}

test('P4: patrol only accepts the checked Nadir-owner record, 3 real positions and safe docking',()=>{
 const {s,id}=regel204Jaeger();
 assert.equal(Kurs.beginnen(s,id).status,'bereit');
 s.kanon.jaeger.kaeufe=[];
 assert.throws(()=>Kurs.beginnen(s,id),/gekauften Spielerjäger/);
 s.kanon.jaeger.kaeufe=[{id,owner:'house',station:'st_nadir'}];
 const p=Kurs.beginnen(s,id);
 let zeit=0;
 for(let i=0;i<3;i++){
   const marke=Kurs.TORE[i];
   sekunde(s,++zeit,marke.x,marke.y,350,0);
   Kurs.beobachten(p,s);
   assert.equal(p.stufe,i,'over-speed flight must not count');
   sekunde(s,++zeit,marke.x,marke.y,120,0);
   Kurs.beobachten(p,s);
   assert.equal(p.stufe,i+1);
 }
 assert.equal(p.stufe,3);
 sekunde(s,zeit+2,0,0,0,0,'angedockt'); // skipped second is rejected, no free finish
 Kurs.beobachten(p,s);
 assert.equal(p.status,'unterbrochen');
 const x=regel204Jaeger(),q=Kurs.beginnen(x.s,x.id);
 for(let i=0;i<3;i++){
   const z=Kurs.TORE[i];
   sekunde(x.s,i+1,z.x,z.y,100,0);Kurs.beobachten(q,x.s);
 }
 sekunde(x.s,4,0,0,0,0,'angedockt');
 Kurs.beobachten(q,x.s);
 assert.equal(Kurs.stand(q).status,'erfolgreich');
 assert.equal(Kurs.stand(q).erreicht,3);
 assert.equal(Kurs.stand(q).ziel,'Nadir-Dock');
 assert.equal(x.s.kanon.jaeger.kaeufe.length,1,'observer does not issue goods or rewards');
});

test('P4: regular public career loads the existing patrol, no unsafe save migration',()=>{
 const html=fs.readFileSync(new URL('../prototypes/spiel/index.html',import.meta.url),'utf8');
 const js=fs.readFileSync(new URL('../prototypes/spiel/spiel.js',import.meta.url),'utf8');
 const session=fs.readFileSync(new URL('../prototypes/verbund/konzern-session.js',import.meta.url),'utf8');
 assert.match(html,/src="\.\.\/j4c\/patrouille\.js"/);
 assert.ok(html.indexOf('src="../j4c/patrouille.js"')<html.indexOf('src="spiel.js"'));
 assert.match(js,/J4dPatrouille\.beginnen\(session\.zustandReferenz\(\),session\.pilotStatus\(\)\)/);
 assert.match(js,/J4dPatrouille\.beobachten\(patrouille,probe\)/);
 assert.match(js,/patrouille=null/);
 assert.match(session,/Object\.freeze\(\{schritt:neu\.flug\.schritt\}\)/);
 assert.doesNotMatch(js,/localStorage\.setItem\([^,]+,\s*patrouille/);
});

test('P4: real purchased 900-ISK fighter from original Regel204 save can begin a paid patrol',()=>{
 const original=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
 const s=J8.erstellen();s.oeffnen204(original,true);
 const id='sh023',state=s.zustandReferenz();
 assert.equal(state.ships[id].owner,'house');
 assert.equal(state.ships[id].klasse,'jaeger');
 assert.equal(state.ships[id].flug.anker,'st_nadir');
 assert.ok(state.kanon.jaeger.kaeufe.some(k=>k.id===id&&k.owner==='house'&&k.preis===900));
 assert.equal(s.uebernehmen(id,false).ok,true);
 const patrol=Kurs.beginnen(state,id);
 assert.equal(patrol.status,'bereit');
 const startCash=state.owners.house.cash;
 const undock=s.flugBefehl({type:'shipUndock',owner:'house',schiff:id});
 assert.equal(undock.ok,true,JSON.stringify(undock));
 assert.ok(s.zustandReferenz().owners.house.cash<startCash,'real flight salary reserve must be paid');
 let samples=0;
 const beobachten=p=>{samples++;Kurs.beobachten(patrol,p);};
 s.flugSchritte(40,beobachten);
 assert.equal(samples,40);
 assert.equal(patrol.status,'flug');
 assert.equal(s.zustandReferenz().ships[id].flug.lage,'frei');
 const target=Kurs.TORE[0];
 const flight=s.flugBefehl({type:'shipFlyTo',owner:'house',schiff:id,x:target.x,y:target.y});
 assert.equal(flight.ok,true,JSON.stringify(flight));
 for(let i=0;i<5&&patrol.stufe===0;i++)s.flugSchritte(900,beobachten);
 assert.equal(patrol.stufe,1,'first patrol checkpoint requires actual financed physical arrival at safe speed');
 for(let index=1;index<Kurs.TORE.length;index++){
   const next=Kurs.TORE[index];
   const course=s.flugBefehl({type:'shipFlyTo',owner:'house',schiff:id,x:next.x,y:next.y});
   assert.equal(course.ok,true,JSON.stringify(course));
   for(let step=0;step<6&&patrol.stufe<=index;step++)s.flugSchritte(900,beobachten);
   assert.equal(patrol.stufe,index+1,'next checkpoint requires financed physical flight, not instant progress');
 }
 const toDock=s.flugBefehl({type:'shipDock',owner:'house',schiff:id,station:'st_nadir'});
 assert.equal(toDock.ok,true,JSON.stringify(toDock));
 for(let i=0;i<8&&patrol.status!=='erfolgreich';i++)s.flugSchritte(900,beobachten);
 assert.equal(patrol.status,'erfolgreich','all three real checkpoints require actual Nadir docking');
 assert.equal(s.zustandReferenz().ships[id].flug.lage,'angedockt');
 assert.equal(s.zustandReferenz().minted,0);
 assert.equal(s.zustandReferenz().burned,0);
 assert.equal(s.weltReferenz().audit(s.zustandReferenz()).ok,true);
 const exported=s.exportieren(),copy=J8.erstellen();copy.oeffnen204(exported,true);
 assert.equal(copy.exportieren(),exported,'patrol status must never modify core save');
 assert.equal(Kurs.stand(null).status,'nicht gestartet','patrol is intentionally not imported as a game state');
});
