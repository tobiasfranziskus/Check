// Independent S2 boundary: original paid flight, no injected wear/cash/ship fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
const Karte=require('../prototypes/spiel/p3-manager-karte.js');
const Flotte=require('../prototypes/spiel/p3-manager-flotte.js');
const Audit=require('../tools/w6-szenarien.cjs');

test('Independent S2: naturally worn own miner cannot restart at dock; original refusal is atomic and survives load',()=>{
 const j=J8.erstellen();j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz();
 // Existing original policy, as in the audited S02 configuration. No new rule.
 w.politikSetzen(j.zustandReferenz(),{stilllegung:true});
 assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);
 const id=j.ansicht().schiffe[0].id;
 assert.equal(j.uebernehmen(id).ok,true);
 assert.equal(j.flugBefehl({type:'shipUndock',owner:'house',schiff:id}).ok,true);
 for(let i=0;i<34;i++)j.weiterspielen(60);
 assert.equal(j.flugBefehl({type:'shipDock',owner:'house',schiff:id,station:'st_aldera'}).ok,true);
 j.weiterspielen(10);
 const s=j.zustandReferenz(),saved=j.exportieren(),cmd='ice-'+id;
 assert.equal(s.ships[id].phase,'dock');
 assert.equal(s.ships[id].flug.lage,'angedockt');
 assert.equal(s.kanon.verschleiss[id],2041);
 assert.equal(s.owners.house.cash,359,'600 purchase + 2041 genuinely paid flight minutes');
 assert.equal(s.owners.pilot_house.cash,2041);
 const original=w.bericht(s).schiffe.find(sh=>sh.id===id);
 assert.equal(original.stillgelegt,true);assert.equal(original.buchwert,0);
 const quotes=j.angebote(),q=quotes.find(q=>q.id===cmd);
 assert.equal(q.ok,false,'A retired hull must not be advertised as ready');
 assert.equal(q.reason,'K1: Hülle ist verbraucht und stillgelegt; Ersatz kaufen');
 const map=Karte.auswerten(j.ansicht(),s,w,quotes);
 const p=Flotte.auswerten(map.schiffe,quotes,id,w.bericht(s).schiffe);
 assert.equal(p.schiff.stillgelegt,true);
 assert.equal(p.aktionen.find(a=>a.id===cmd).grund,q.reason);
 assert.equal(j.ausfuehren(cmd).ok,false);
 assert.equal(j.exportieren(),saved,'No inert pendulum, wage reservation or other mutation');
 const loaded=J8.erstellen();loaded.oeffnen204(saved,true);
 assert.equal(loaded.exportieren(),saved);
 assert.equal(loaded.angebote().find(q=>q.id===cmd).reason,q.reason);
 assert.deepEqual(Audit.pruefen(w,s),[]);
 assert.deepEqual([j.ansicht().weltgeld,s.minted,s.burned],[33000,0,0]);
});
