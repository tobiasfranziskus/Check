import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W=require('../prototypes/welt/welt-kern.js');
const S=require('../prototypes/raum/raum-szene.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
const source=()=>OLD.create(42,'private195').export();
const starter=()=>{
 const alt=source(),session=J8.erstellen(),start=session.starten195(alt,true);
 assert.equal(start.eigenerJaeger,0);
 assert.equal(start.schiffe.length,0);
 const kauf=session.ausfuehren('buy-st_aldera-miner');
 assert.equal(kauf.ok,true,JSON.stringify(kauf));
 const miner=session.piloten();
 assert.equal(miner.length,1);
 return {session,alt,id:miner[0].id};
};
const scene=(session,id)=>S.erzeugen(session.weltReferenz(),session.zustandReferenz(),id,
 {bojen:[],patrouille:null,duell:null});
const sum=s=>Object.values(s.owners).reduce((a,b)=>a+b.cash,0);

test('J9 – original RAUM-Szene zeigt einen echten, bezahlten Aldera-Miner ohne jeden Jäger',()=>{
 const {session,alt,id}=starter(),w=session.weltReferenz(),s=session.zustandReferenz();
 const hash=w.hash(s),save=session.exportieren();
 const sz=scene(session,id);
 assert.equal(sz.jaeger,null);
 assert.equal(sz.aktiv.id,id);
 assert.equal(sz.system,'aldera');
 assert.equal(sz.weltgeld,33000);
 assert.ok(sz.objekte.some(o=>o.art==='station'));
 assert.ok(sz.objekte.some(o=>o.art==='feld'));
 assert.equal(session.piloten()[0].erlaubt,true);
 assert.equal(session.ansicht().pilotierbar,true);
 assert.equal(session.uebernehmen(id).ok,true);
 assert.equal(session.pilotStatus(),id);
 assert.equal(w.hash(session.zustandReferenz()),hash);
 assert.equal(session.exportieren(),save,'reine Sichtübernahme niemals Ware oder Konto ändern');
 assert.equal(OLD.create(42,'private195').export(),alt);
});
test('J9 – persönliche F6-Flugreserve des wirklich gekauften Miners, deterministischer Original-Core-Replay',()=>{
 const {session,id}=starter();
 assert.equal(session.uebernehmen(id).ok,true);
 const src=session.exportieren(),w=session.weltReferenz(),s0=session.zustandReferenz();
 const geld=s0.owners.house.cash,jaeger=s0.kanon.jaeger.kaeufe.length;
 const cmd=S.befehl(w,scene(session,id),'abdocken');
 const c=session.flugBefehl(cmd);
 assert.equal(c.ok,true,JSON.stringify(c));
 const now=session.zustandReferenz();
 assert.equal(now.owners.house.cash,geld-40,'Original-Flugdienst zieht genau 40 ISK Reserve');
 assert.equal(now.owners['k1_flug_'+id].cash,40);
 assert.equal(now.kanon.jaeger.kaeufe.length,jaeger);
 assert.equal(session.flugAudit().ok,true);
 // J9 120 Original-Flugteilschritte in vier UI-Batches, Replay ohne UI identisch.
 let minuten=0;
 for(let i=0;i<4;i++)minuten+=session.flugSchritte(30);
 assert.ok(minuten>=1);
 const out=session.exportieren(),hash=w.hash(session.zustandReferenz());
 const p=JSON.parse(src).w5ad.profile,core=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
 const replay=core.load(src);
 assert.equal(core.execute(replay,cmd).ok,true);
 for(let i=0;i<120;i++)core.teilschritt(replay);
 assert.equal(core.hash(replay),hash);
 assert.equal(core.save(replay),out,'identische Geld-, Ware-, Eigentums- und Flugzustände');
 const neu=J8.erstellen();
 neu.oeffnen204(out,true);
 assert.equal(neu.ansicht().hash,hash,'Flugstand wird getrennt mit vollständigem Rule204-Save geladen');
 assert.equal(neu.uebernehmen(id).ok,true,'einziges eigenes Schiff aus gültigem Flugstand wieder aufnehmen');
 assert.equal(neu.pilotStatus(),id);
 assert.equal(sum(session.zustandReferenz()),33000);
 assert.equal(session.zustandReferenz().minted,0);
 assert.equal(session.zustandReferenz().burned,0);
});
test('J9 – keine Fremdschiffe, keine fremden Firmenrechte und keine Remote-Übernahme',()=>{
 const {session,id}=starter();
 const before=session.ansicht().hash,save=session.exportieren();
 assert.equal(session.uebernehmen('sh008').ok,false);
 assert.equal(session.uebernehmen('__proto__').ok,false);
 assert.equal(session.flugBefehl({type:'shipUndock',owner:'house',schiff:id}).ok,false,'vor Pilotwahl kein Schiffsbefehl');
 assert.equal(session.uebernehmen(id,true).ok,false,'kein Wechsel bei laufender Zeit');
 assert.equal(session.uebernehmen(id).ok,true);
 for(const cmd of [
  {type:'shipUndock',owner:'npc3',schiff:id},
  {type:'shipUndock',owner:'house',schiff:'sh008'},
  {type:'industrialOreAcceptYard',owner:'house',schiff:id},
  {type:'shipFreightIce',owner:'house',schiff:id},
  {type:'shipBuy',owner:'house',schiff:id,station:'st_nadir',klasse:'jaeger'}
 ])assert.equal(session.flugBefehl(cmd).ok,false,JSON.stringify(cmd));
 assert.throws(()=>session.flugSchritte(901),/maximal 900/);
 assert.throws(()=>session.flugSchritte(-1),/maximal 900/);
 assert.equal(session.exportieren(),save);
 assert.equal(session.ansicht().hash,before);
});
test('J9 – autonome Eisrunde und persönliche Steuerung sind nie gleichzeitig aktiv',()=>{
 const {session,id}=starter(),old=session.exportieren();
 assert.equal(session.ausfuehren('ice-'+id).ok,true);
 assert.equal(session.uebernehmen(id).ok,false,'Pendel zunächst beenden');
 assert.equal(session.flugBefehl({type:'shipUndock',owner:'house',schiff:id}).ok,false);
 assert.equal(session.ansicht().weltgeld,33000);
 assert.ok(session.exportieren()!==old,'Original-Pendelauftrag ist echter Weltzustand');
 assert.equal(session.ausfuehren('stop-'+id).ok,true);
 const eligible=session.piloten().find(x=>x.id===id);
 if(eligible.erlaubt)assert.equal(session.uebernehmen(id).ok,true);
 else assert.match(eligible.grund,/andocken|Pendel/);
 assert.equal(session.flugAudit().ok,true);
});
