import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),J=require('../prototypes/verbund/konzern-session.js'),O=require('../prototypes/w5ac/session.js'),S=require('../prototypes/raum/raum-szene.js');
export function start(seed=42){const j=J.erstellen();j.starten195(O.create(seed,'private195').export(),true);assert.equal(j.ausfuehren('buy-st_aldera-frachter').ok,true);const id=j.piloten()[0].id;return {j,id};}
const cmd=(id,type,extra={})=>({type,owner:'house',schiff:id,...extra});
function audit(j){const s=j.zustandReferenz();assert.equal(j.flugAudit().ok,true);assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);const ships=Object.values(s.ships).filter(x=>x.owner==='house'&&x.klasse==='frachter');assert.equal(ships.length,s.kanon.spielerFrachterKaeufe.length);for(const sh of ships)assert.ok(s.kanon.spielerFrachterKaeufe.some(k=>k.id===sh.id&&k.preis===750));}
test('J11 echter Lagerkauf, Fluglohn, Dockrückkehr und deterministischer Replay für drei Seeds',()=>{
 for(const seed of [42,7,3301]){
  const {j,id}=start(seed),w=j.weltReferenz(),s=j.zustandReferenz();
  assert.equal(s.owners.house.cash,2250);assert.equal(s.stations.st_aldera.lager.frachter,0);assert.equal(s.ledger.frachter.consumed,1);
  assert.equal(j.uebernehmen(id).ok,true);const source=j.exportieren(),r=w.load(source),beforePilot=s.owners.pilot_house.cash;
  const actions=[cmd(id,'shipUndock')];
  assert.equal(j.flugBefehl(actions[0]).ok,true);assert.equal(j.zustandReferenz().owners['k1_flug_'+id].cash,40);
  j.flugSchritte(120);audit(j);
  assert.equal(j.zustandReferenz().owners.pilot_house.cash,beforePilot+2);
  actions.push(cmd(id,'shipFlyTo',{x:120000,y:30000}));assert.equal(j.flugBefehl(actions[1]).ok,true);
  actions.push(cmd(id,'shipSteer',{kurs:64,fahrt:0}));assert.equal(j.flugBefehl(actions[2]).ok,true);
  actions.push(cmd(id,'shipDock',{station:'st_aldera'}));assert.equal(j.flugBefehl(actions[3]).ok,true);j.flugSchritte(180);
  assert.equal(j.zustandReferenz().ships[id].flug.lage,'angedockt');assert.equal(j.zustandReferenz().kanon.flugdienst[id],undefined);audit(j);
  assert.equal(w.execute(r,actions[0]).ok,true);for(let i=0;i<120;i++)w.teilschritt(r);for(const c of actions.slice(1))assert.equal(w.execute(r,c).ok,true);for(let i=0;i<180;i++)w.teilschritt(r);
  assert.equal(w.save(r),j.exportieren());const again=J.erstellen();again.oeffnen204(j.exportieren(),true);assert.equal(again.ansicht().hash,j.ansicht().hash);console.log('J11_FLIGHT_HASH',seed,j.ansicht().hash);
 }
});
test('J11 bezahlte echte F4-Eisfracht, nur Korridorsteuerung, keine freien Dock-/Zielbefehle',()=>{
 const {j,id}=start();assert.equal(j.uebernehmen(id).ok,true);
 const empty=j.exportieren();assert.equal(j.flugBefehl(cmd(id,'shipFreightIce')).ok,false);assert.equal(j.exportieren(),empty);
 assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);const m=j.piloten().find(x=>x.klasse==='miner').id;assert.equal(j.ausfuehren('ice-'+m).ok,true);j.weiterspielen(60);j.weiterspielen(60);
 const before=j.zustandReferenz().stations.st_aldera.lager.eis;assert.ok(before>=50);
 assert.equal(j.flugBefehl(cmd(id,'shipFreightIce')).ok,true);assert.equal(j.zustandReferenz().stations.st_aldera.lager.eis,before-50);audit(j);
 assert.equal(j.flugBefehl(cmd(id,'shipSteer',{kurs:64,fahrt:25})).ok,false,'Original-Flugkern sperrt Korridormanöver in Regel204');
 for(const c of [cmd(id,'shipUndock'),cmd(id,'shipDock',{station:'st_aldera'}),cmd(id,'shipFlyTo',{x:1,y:1})]){const save=j.exportieren();assert.equal(j.flugBefehl(c).ok,false);assert.equal(j.exportieren(),save);}
 assert.equal(j.uebernehmen(m).ok,false);const save=j.exportieren(),reload=J.erstellen();reload.oeffnen204(save,true);assert.equal(reload.ansicht().hash,j.ansicht().hash);
 const w=j.weltReferenz(),r=w.load(save);for(let n=0;n<8;n++)j.flugSchritte(900);for(let n=0;n<7200;n++)w.teilschritt(r);assert.equal(w.save(r),j.exportieren());audit(j);
 const f=j.zustandReferenz().kanon.spielerFrachten;assert.equal(f.auftraege[0].end!==null,true);assert.equal(f.lohn,120);assert.equal(f.gebuehr,240);console.log('J11_F4_HASH',j.ansicht().hash);
});
test('J11 Geld, Eigentum, Kaufbeleg, pausierter gleicher Dockwechsel geschützt',()=>{
 const {j,id}=start(),w=j.weltReferenz();assert.equal(j.uebernehmen('sh001').ok,false);assert.equal(j.uebernehmen('missing').ok,false);assert.equal(j.uebernehmen(id,true).ok,false);
 const s=w.load(j.exportieren());s.owners.house.cash=0;s.owners.st_aldera.cash+=2250;
 const before=JSON.stringify(s);assert.equal(w.execute(s,cmd(id,'shipUndock')).ok,false);assert.equal(w.execute(s,{type:'shipBuy',owner:'house',station:'st_aldera',klasse:'miner'}).ok,false);assert.equal(JSON.stringify(s),before);assert.throws(()=>J.erstellen().oeffnen204(JSON.stringify(s),true),'Manipulierte Finanzierung wird auch beim Import abgelehnt');
 const bad=w.load(j.exportieren());bad.kanon.spielerFrachterKaeufe=[];assert.throws(()=>J.erstellen().oeffnen204(w.save(bad),true));
 assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);const m=j.piloten().find(x=>x.klasse==='miner').id;assert.equal(j.uebernehmen(id).ok,true);assert.equal(j.uebernehmen(m).ok,true);assert.equal(j.uebernehmen(id).ok,true);
 const scene=S.erzeugen(w,j.zustandReferenz(),id,{});assert.equal(scene.aktiv.klasse,'frachter');assert.equal(scene.jaeger,null);audit(j);
});
