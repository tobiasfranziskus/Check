// J14 – ein bereits originalfinanzierter, laufender J2b-Spielerauftrag
// bindet nach JSON-Reload ausschliesslich SEINEN Miner neu an die Bedienung.
// Das ist kein Speicherformatwechsel und kein allgemeiner Teleport/Schiffwechsel.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const {erzeugen}=require('./j10b-k2-kauf-fixture.cjs');

function echteMehrschiffkarriere(){
 const sample=erzeugen('house');
 const session=J8.erstellen();
 assert.equal(session.oeffnen204(sample.save,true).weltgeld,33000);
 assert.equal(session.ausfuehren('buy-st_nadir-miner').ok,true);
 const own=Object.values(session.zustandReferenz().ships).filter(sh=>sh.owner==='house');
 assert.ok(own.length>=2,'echter Haus-Aldera-Miner und fuer 600 ISK erworbener Nadir-Miner');
 const nadir=own.find(sh=>sh.heimat==='nadir'&&sh.klasse==='miner');
 const aldera=own.find(sh=>sh.heimat==='aldera'&&sh.klasse==='miner');
 assert.ok(nadir&&aldera&&nadir.id!==aldera.id);
 assert.ok(session.zustandReferenz().kanon.minerWerft.lokaleKaeufe.some(k=>
  k.id===nadir.id&&k.owner==='house'&&k.preis===600));
 assert.equal(session.ausfuehren('sil-start-'+nadir.id).ok,true,
  'Original-Core nimmt nur vollstaendig finanzierte 8er-Charge an');
 const raw=session.zustandReferenz();
 assert.equal(raw.kanon.silizium.auftrag.owner,'house');
 assert.equal(raw.kanon.silizium.auftrag.schiff,nadir.id);
 assert.equal(raw.minted,0);assert.equal(raw.burned,0);
 assert.equal(session.flugAudit().ok,true);
 return {save:session.exportieren(),nadir:nadir.id,aldera:aldera.id};
}

test('J14: nach Reload einer bezahlten Mehrschiffkarriere ist nur der original gebundene J2b-Miner wieder anmeldefaehig',()=>{
 const {save,nadir,aldera}=echteMehrschiffkarriere();
 const session=J8.erstellen(),ansicht=session.oeffnen204(save,true);
 assert.equal(session.pilotStatus(),null,'kein fiktiver Pilot wird in den Core-Save geschrieben');
 const offer=session.piloten().find(p=>p.id===nadir);
 assert.equal(offer?.erlaubt,true,JSON.stringify(offer));
 assert.equal(ansicht.schiffe.length>=2,true);
 const hash=ansicht.hash;
 assert.equal(session.uebernehmen(nadir,true).ok,false,'niemals waehrend laufender Flugzeit');
 assert.equal(session.uebernehmen('shNichtVorhanden').ok,false);
 assert.equal(session.uebernehmen(nadir).ok,true);
 assert.equal(session.pilotStatus(),nadir);
 assert.equal(session.exportieren(),save,'Anmeldung veraendert weder Geld noch Flugort/Weltkern');
 assert.equal(session.ansicht().hash,hash);
 const denied=session.flugBefehl({type:'shipUndock',schiff:aldera,owner:'house'});
 assert.equal(denied.ok,false,'keine Fernbedienung eines zweiten eigenen Schiffs');
 assert.equal(session.exportieren(),save,'kein Nebenwirkung auf Sperre');
 const undock=session.flugBefehl({type:'shipUndock',schiff:nadir,owner:'house'});
 assert.equal(undock.ok,true,JSON.stringify(undock));
 assert.equal(session.zustandReferenz().ships[nadir].flug.lage,'abdocken',
  'Original-F6-Abdocken ist ein realer, noch nicht abgeschlossener Flugzustand');
 assert.equal(session.flugAudit().ok,true);
 assert.equal(session.ansicht().weltgeld,33000);
 assert.equal(session.zustandReferenz().minted,0);
 assert.equal(session.zustandReferenz().burned,0);
 const neu=J8.erstellen();
 neu.oeffnen204(session.exportieren(),true);
 assert.equal(neu.uebernehmen(nadir).ok,true,'auch laufenden Abbauflug legal fortsetzen');
 assert.equal(neu.flugAudit().ok,true);
});

test('J14: einmalige Wiederanmeldung ist kein uneingeschraenkter Wechsel zwischen entfernten Docks',()=>{
 const {save,nadir,aldera}=echteMehrschiffkarriere();
 const session=J8.erstellen();session.oeffnen204(save,true);
 // Original J6 erlaubt den normalen Dock-Piloten, aber niemals den
 // anschliessenden Fernwechsel in den nun gebundenen Nadir-Miner.
 assert.equal(session.uebernehmen(aldera).ok,true);
 assert.equal(session.uebernehmen(nadir).ok,false,
  'eine laufende J2b-Arbeit kann nicht als Teleport/Flottenwechsel missbraucht werden');
 assert.equal(session.pilotStatus(),aldera);
 assert.equal(session.exportieren(),save);
 const raw=session.zustandReferenz();
 assert.ok(raw.kanon.silizium.auftrag);
 assert.equal(raw.kanon.silizium.auftrag.owner,'house');
 assert.equal(session.flugAudit().ok,true);
});

test('J14: der ursprüngliche Import bleibt streng und ein weiterer Import verändert keine bestehende Sitzung',()=>{
 const {save,nadir}=echteMehrschiffkarriere();
 const session=J8.erstellen();session.oeffnen204(save,true);
 const allowed=session.piloten().find(x=>x.id===nadir);
 assert.equal(allowed.erlaubt,true);
 const original=session.exportieren();
 // Ein zweiter Ladevorgang darf die alte Welt nicht anruehren.
 assert.throws(()=>session.oeffnen204(original,true),/nicht überschreiben/);
 assert.equal(session.exportieren(),original);
 assert.equal(session.ansicht().weltgeld,33000);
});
