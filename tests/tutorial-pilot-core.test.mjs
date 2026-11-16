import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url),A=require('../prototypes/tutorial-pilot/akademie.js'),S=require('../prototypes/raum/raum-szene.js'),W=require('../prototypes/welt/welt-kern.js'),J=require('../prototypes/verbund/konzern-session.js'),O=require('../prototypes/w5ac/session.js'),P=require('../prototypes/j4c/patrouille.js');
const sample=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
function fall(){
 const j=J.erstellen();j.oeffnen204(sample,true);const w=j.weltReferenz(),s=w.load(sample);let aktiv='sh023',pat=null;
 const a=A.erstellen({welt:()=>w,zustand:()=>s,aktiv:()=>aktiv,szene:S,angebot:c=>{const copy=w.load(w.save(s));return w.execute(copy,c);},patrouilleStand:()=>P.stand(pat)});
 const cmd=(type,extra={})=>{const r=w.execute(s,{type,schiff:aktiv,owner:'house',...extra});assert.equal(r.ok,true,JSON.stringify(r));a.beobachten(s);};
 const step=(n,stop=false)=>{for(let i=0;i<n;i++){w.teilschritt(s);if(pat)P.beobachten(pat,s);a.beobachten(s);if(stop&&a.stand().status==='erfolgreich')break;}};
 const start=id=>assert.equal(a.starten(id).ok,true,JSON.stringify(a.menue().find(x=>x.id===id)));
 const audit=()=>{assert.equal(w.audit(s).ok,true);assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);assert.equal(w.save(w.load(w.save(s))),w.save(s));};
 return {a,s,w,cmd,step,start,audit,wechsel:id=>{aktiv=id;},patStart:()=>{pat=P.beginnen(s,aktiv);a.beobachten(s);},pat:()=>pat};
}
test('Akademie: realer Kauf, Eigentum und Flugfinanzierung; keine Gratisbefehle',()=>{
 const j=J.erstellen();j.starten195(O.create(42,'private195').export(),true);
 const a=A.erstellen({welt:()=>j.weltReferenz(),zustand:()=>j.zustandReferenz(),aktiv:()=>j.pilotStatus(),szene:S,angebot:c=>j.flugAngebot(c)});
 const before=j.exportieren();assert.ok(a.menue().every(x=>x.grund));assert.equal(a.starten('abdocken').ok,false);assert.equal(j.exportieren(),before);
 assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);const id=j.piloten()[0].id;assert.equal(j.uebernehmen(id).ok,true);
 assert.equal(a.starten('auswahl').ok,true);assert.equal(a.stand().status,'erfolgreich');
 assert.equal(a.starten('bergbau').ok,false);assert.equal(a.starten('fracht').ok,false);assert.equal(a.starten('patrouille').ok,false);assert.equal(a.starten('freeShip').ok,false);
 assert.equal(a.starten('abdocken').ok,true);assert.equal(j.flugBefehl({type:'shipUndock',owner:'house',schiff:id}).ok,true);
 for(let i=0;i<40;i++){j.flugSchritte(1);a.beobachten(j.zustandReferenz());}
 // Undock is a real 40-second core transition, not a UI acknowledgement.
 assert.equal(j.zustandReferenz().ships[id].flug.lage,'frei');
 assert.equal(j.zustandReferenz().owners.house.cash,2360);
 const save=j.exportieren(),reload=J.erstellen();reload.oeffnen204(save,true);assert.equal(reload.exportieren(),save);
 assert.equal(save.includes('"trainingAlt"'),false);assert.equal(save.includes('"trainingAlt"'),false);
 const fresh=A.erstellen({welt:()=>reload.weltReferenz(),zustand:()=>reload.zustandReferenz(),aktiv:()=>null,szene:S});assert.equal(fresh.stand().status,'bereit');
 const f=fall();for(const id of ['missing','sh001']){f.wechsel(id);assert.equal(f.a.starten('auswahl').ok,false);}
 const broke=fall();broke.s.owners.st_nadir.cash+=broke.s.owners.house.cash;broke.s.owners.house.cash=0;
 const hash=broke.w.hash(broke.s);assert.equal(broke.a.starten('abdocken').ok,false);assert.equal(broke.w.execute(broke.s,{type:'shipUndock',owner:'house',schiff:'sh023'}).ok,false);assert.equal(broke.w.hash(broke.s),hash);
});
test('Akademie: echte Bewegung, Zielanflug, Handübernahme, Aufschalten/Lösen und Dock',()=>{
 const f=fall();f.start('abdocken');f.cmd('shipUndock');assert.equal(f.a.stand().status,'aktiv');f.step(40);
 f.cmd('shipSteer',{kurs:0,fahrt:20});f.step(30,true);assert.equal(f.a.stand().status,'erfolgreich');
 f.start('aufschalten');f.cmd('shipLock',{zielArt:'station',ziel:'st_nadir'});assert.equal(f.a.stand().status,'aktiv');f.cmd('shipUnlock');assert.equal(f.a.stand().status,'erfolgreich');
 f.start('handflug');f.cmd('shipOrbit',{zielArt:'station',ziel:'st_nadir',radius:120000});f.step(2);f.cmd('shipSteer',{kurs:64,fahrt:20});f.step(2);assert.equal(f.a.stand().status,'erfolgreich');
 f.cmd('shipFlyTo',{x:350000,y:100000});f.step(1800);
 f.start('annaehern');f.cmd('shipApproach',{zielArt:'station',ziel:'st_nadir'});f.step(3000,true);assert.equal(f.a.stand().status,'erfolgreich');
 f.start('andocken');f.cmd('shipDock',{station:'st_nadir'});f.step(1000,true);assert.equal(f.a.stand().status,'erfolgreich');f.audit();
});
test('Akademie: Orbit benötigt stabile reale Umkreisung; Folgen braucht bewegtes Ziel',()=>{
 const f=fall();f.cmd('shipUndock');f.step(40);
 f.start('orbit');f.cmd('shipOrbit',{zielArt:'station',ziel:'st_nadir',radius:120000});assert.equal(f.a.stand().status,'aktiv');f.step(6000,true);assert.equal(f.a.stand().status,'erfolgreich');
 assert.equal(f.w.execute(f.s,{type:'shipUndock',owner:'house',schiff:'sh022'}).ok,true);f.step(40);
 f.start('folgen');f.cmd('shipFollow',{ziel:'sh022',abstand:90000});f.step(2500);assert.equal(f.a.stand().status,'aktiv','stationary target is insufficient');
 assert.equal(f.w.execute(f.s,{type:'shipSteer',owner:'house',schiff:'sh022',kurs:0,fahrt:20}).ok,true);f.step(4000,true);assert.equal(f.a.stand().status,'erfolgreich');f.audit();
});
test('Akademie: Drei-Bojen-Patrouille nutzt den Originalbeobachter, keinen alten Erfolg',()=>{
 const f=fall();f.start('patrouille');f.patStart();f.cmd('shipUndock');f.step(40);
 for(const m of P.TORE){f.cmd('shipFlyTo',{x:m.x,y:m.y});for(let i=0;i<6000&&f.pat().stufe<=P.TORE.indexOf(m);i++)f.step(1);}
 assert.equal(f.pat().stufe,3);f.cmd('shipDock',{station:'st_nadir'});f.step(6000,true);
 assert.equal(f.a.stand().status,'erfolgreich');f.start('patrouille');f.a.beobachten(f.s);assert.equal(f.a.stand().status,'aktiv');f.audit();
});
test('Akademie: übersprungene Zeit und Pilotwechsel unterbrechen; Lesen verändert Save/Hash nicht',()=>{
 const f=fall(),before=f.w.save(f.s),hash=f.w.hash(f.s);f.a.menue();f.start('abdocken');f.a.beobachten(f.s);assert.equal(f.w.save(f.s),before);assert.equal(f.w.hash(f.s),hash);
 f.s.flug.schritt+=2;f.a.beobachten(f.s);assert.equal(f.a.stand().status,'unterbrochen');f.s.flug.schritt-=2;
 f.start('abdocken');f.wechsel('sh022');f.a.beobachten(f.s);assert.equal(f.a.stand().status,'unterbrochen');f.a.zuruecksetzen();assert.equal(f.a.stand().status,'bereit');
});
test('Akademie: gekaufter Nadir-Miner fördert im Originalfeld, keine Belohnung ohne Ware',()=>{
 const fixture=require('./j10b-k2-kauf-fixture.cjs').erzeugen('house'),j=J.erstellen();j.oeffnen204(fixture.save,true);
 assert.equal(j.ausfuehren('buy-st_nadir-miner').ok,true);
 const id=j.piloten().find(x=>x.system==='nadir'&&x.klasse==='miner').id;assert.equal(j.uebernehmen(id,false).ok,true);
 const w=j.weltReferenz(),s=w.load(j.exportieren());
 const a=A.erstellen({welt:()=>w,zustand:()=>s,aktiv:()=>id,szene:S});
 assert.equal(a.starten('bergbau').ok,false);
 assert.equal(w.execute(s,{type:'siliconMineStart',owner:'house',schiff:id}).ok,true);
 assert.equal(a.starten('bergbau').ok,true);assert.equal(a.stand().status,'aktiv');
 assert.equal(w.execute(s,{type:'shipUndock',owner:'house',schiff:id}).ok,true);
 for(let i=0;i<40;i++){w.teilschritt(s);a.beobachten(s);}
 assert.equal(w.execute(s,{type:'shipFlyTo',owner:'house',schiff:id,x:w.siliziumFeld.x,y:w.siliziumFeld.y}).ok,true);
 for(let i=0;i<10000&&a.stand().status==='aktiv';i++){w.teilschritt(s);a.beobachten(s);}
 assert.equal(a.stand().status,'erfolgreich');assert.ok(s.ships[id].ladung.silizium>0);assert.ok(s.kanon.silizium.gefoerdert>0);
 assert.equal(w.audit(s).ok,true);assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
});
test('Akademie: bezahlter F4-Vertrag erfordert Lieferung, Rückkehr und echten Dockbeleg',()=>{
 const j=J.erstellen();j.starten195(O.create(42,'private195').export(),true);
 assert.equal(j.ausfuehren('buy-st_aldera-frachter').ok,true);assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);
 const id=j.piloten().find(x=>x.klasse==='frachter').id,m=j.piloten().find(x=>x.klasse==='miner').id;
 assert.equal(j.uebernehmen(id).ok,true);assert.equal(j.ausfuehren('ice-'+m).ok,true);j.weiterspielen(60);j.weiterspielen(60);
 const w=j.weltReferenz(),s=w.load(j.exportieren()),a=A.erstellen({welt:()=>w,zustand:()=>s,aktiv:()=>id,szene:S});
 assert.equal(a.starten('fracht').ok,false);assert.equal(w.execute(s,{type:'shipFreightIce',owner:'house',schiff:id}).ok,true);assert.equal(a.starten('fracht').ok,true);
 const original=w.load(w.save(s));
 for(let i=0;i<7200;i++){w.teilschritt(s);a.beobachten(s);w.teilschritt(original);}
 assert.equal(a.stand().status,'erfolgreich');assert.equal(s.kanon.spielerFrachten.lohn,120);assert.equal(s.kanon.spielerFrachten.gebuehr,240);
 assert.equal(w.save(s),w.save(original),'academy cannot book a second reward or affect replay');assert.equal(w.audit(s).ok,true);
});
test('Akademie: echtes F8-Duell nach bezahltem Anflug; Treffer bleiben virtuelle Belege',()=>{
 const D=require('../prototypes/j4c/duell.js'),F=require('../prototypes/flug2d/flug-kern.js'),j=J.erstellen();j.oeffnen204(sample,true);
 const w=j.weltReferenz(),s=w.load(sample),id='sh023';let duel=null;
 const a=A.erstellen({welt:()=>w,zustand:()=>s,aktiv:()=>id,szene:S,duellStand:()=>D.stand(duel)});
 const cmd=(type,extra={})=>{const r=w.execute(s,{type,owner:'house',schiff:id,...extra});assert.equal(r.ok,true,r.reason);a.beobachten(s);};
 const step=()=>{w.teilschritt(s);if(duel)D.beobachten(w,s,duel);a.beobachten(s);};
 cmd('shipUndock');for(let i=0;i<40;i++)step();assert.equal(a.starten('duell').ok,true);
 cmd('shipFlyTo',{x:500000,y:-288000});for(let i=0;i<1800;i++)step();
 duel=D.beginnen(w,s,id);a.beobachten(s);
 for(let i=0;i<2000&&duel.status==='aktiv';i++){
  const b=s.ships[id].flug,z=D.stand(duel).ziel;
  cmd('shipSteer',{kurs:F.richtungZu(z.x-b.x,z.y-b.y),fahrt:0});D.feuern(w,s,duel);step();
 }
 assert.equal(duel.status,'sieg');assert.equal(a.stand().status,'erfolgreich');assert.equal(D.stand(duel).treffer,3);
 assert.equal(w.audit(s).ok,true);assert.equal(s.minted,0);assert.equal(s.burned,0);assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 const save=w.save(s);assert.equal(save.includes('trainingAlt'),false);assert.equal(save.includes('zielprobe'),false);assert.equal(w.save(w.load(save)),save);
});
test('Akademie: manipulierte Gratis-Hülle, Gratis-Kauf und Gratis-Fracht werden beim Import abgelehnt',()=>{
 const f=fall(),hash=f.w.hash(f.s);
 for(const mutate of [s=>s.kanon.jaeger.kaeufe[0].preis=0,s=>s.ships.fake={...s.ships.sh023,id:'fake'},s=>s.kanon.spielerFrachten={auftraege:[{schiff:'sh023',start:s.tick,end:null,menge:50,arbeit:0,fracht:0,eis:0,zeit:60}],lohn:0,gebuehr:0}]){
  const raw=JSON.parse(sample);mutate(raw);assert.throws(()=>f.w.load(JSON.stringify(raw)));
 }
 assert.equal(f.w.hash(f.s),hash);f.audit();
});
