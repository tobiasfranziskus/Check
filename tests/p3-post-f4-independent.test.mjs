/* Independent review tests for the #510 research successor of #509.
 * These tests intentionally do not amend production logic or old audit
 * characterizations. Run with Node22 only, never on browser/Saves.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
process.env.APHROS_P3_FAIR_FERRY_RESEARCH='1';
const J8=require('../prototypes/verbund/konzern-session.js');
const {erstellen}=require('./p3-werft-mehrschiff-fixture.cjs');

function ready() {
  const fixture=erstellen(),session=J8.erstellen();
  session.oeffnen204(fixture.save,true);
  const world=session.weltReferenz(),state=session.zustandReferenz();
  assert.equal(world.p3ForschungsAnmeldung(state,fixture.second,360).ok,true);
  while(state.tick<3440 && !state.w5ac.completed.some(x=>x.id===fixture.second))
    world.minute(state);
  assert.equal(state.tick,3437);
  assert.ok(state.w5ac.completed.some(x=>x.id===fixture.second));
  world.minute(state);
  assert.equal(state.tick,3438);
  assert.equal(world.p3ForschungsStatus().npcVorrang,false);
  assert.ok(state.w5n.frachtauftrag);
  assert.ok(world.audit(state).ok);
  return {fixture,session,world,state};
}
function audited(world,state) {
  const a=world.audit(state);
  assert.equal(a.ok,true,(a.fehler||[]).join('; '));
  assert.equal(world.hash(world.load(world.save(state))),world.hash(state));
  assert.equal(Object.values(state.owners).reduce((n,v)=>n+v.cash,0),33000);
  assert.equal(state.minted,0);assert.equal(state.burned,0);
  assert.ok(Number(!!state.w3.auftrag)+Number(!!state.w5n.frachtauftrag)+Number(!!state.w5ac.active)<=1);
}

test('P3 post-fix independent: unescrowed F4 wait is discarded by J8 clone and JSON reload',()=>{
  const {fixture,session,world,state}=ready();
  const before=world.save(state),hash=world.hash(state),house=state.owners.house.cash;
  assert.equal(world.p3ForschungsFrachtAnmeldung(state,fixture.second,1440).ok,true);
  assert.equal(world.p3ForschungsStatus().wartend.art,'f4');
  assert.equal(world.save(state),before);
  assert.equal(world.hash(state),hash);
  const cold=J8.erstellen();cold.oeffnen204(before,true);
  assert.equal(cold.weltReferenz().p3ForschungsStatus().wartend,null);
  session.weiterspielen(1);
  cold.weiterspielen(1);
  assert.equal(session.ansicht().hash,cold.ansicht().hash,
    'a non-durable queue may not change a reloaded original economic minute');
  assert.equal(world.p3ForschungsStatus().wartend,null);
  assert.equal(world.p3ForschungsStatus().letzterBeleg?.status,'zustandswechsel-abgebrochen');
  assert.equal(session.zustandReferenz().owners.house.cash,house);
  const latest=session.zustandReferenz();
  assert.equal(world.p3ForschungsFrachtAnmeldung(latest,fixture.second,1440).ok,true);
  audited(world,latest);
});

test('P3 post-fix independent: retired second hull has no F4 admission or payments',()=>{
  const {fixture,world,state}=ready();
  const ship=fixture.second;
  world.politikSetzen(state,{stilllegung:true});
  // The hull has already flown the real 60-minute W5ac transfer.
  // Add remaining wear to existing wear; replacing the counter leaves 18 ISK.
  state.kanon.verschleiss[ship]+=Math.ceil(
    world.buchwert(state,ship)*1000/world.daten.verschleiss.milliJeMinute.frachter);
  assert.equal(world.buchwert(state,ship),0);
  assert.equal(world.bericht(state).schiffe.find(x=>x.id===ship).stillgelegt,true);
  const before=world.save(state),cash=state.owners.house.cash;
  assert.equal(world.p3ForschungsFrachtAnmeldung(state,ship,1440).ok,false);
  assert.equal(world.save(state),before);
  assert.equal(state.owners.house.cash,cash);
  world.minute(state);
  assert.equal(state.kanon.spielerFrachten.auftraege.filter(x=>x.schiff===ship).length,0);
  audited(world,state);
});

test('P3 post-fix independent: admissible F4 wait revalidates retirement before original dispatch',()=>{
  const {fixture,world,state}=ready();
  const ship=fixture.second;
  world.politikSetzen(state,{stilllegung:true});
  assert.equal(world.p3ForschungsFrachtAnmeldung(state,ship,1440).ok,true);
  assert.equal(world.p3ForschungsStatus().wartend.art,'f4');
  // The hull has already flown the real 60-minute W5ac transfer.
  // Add remaining wear to existing wear; replacing the counter leaves 18 ISK.
  state.kanon.verschleiss[ship]+=Math.ceil(
    world.buchwert(state,ship)*1000/world.daten.verschleiss.milliJeMinute.frachter);
  const cash=state.owners.house.cash;
  world.minute(state);
  assert.equal(world.p3ForschungsStatus().wartend,null);
  assert.equal(world.p3ForschungsStatus().letzterBeleg?.grund,'Huelle stillgelegt');
  assert.equal(state.kanon.spielerFrachten.auftraege.filter(x=>x.schiff===ship).length,0);
  assert.equal(state.owners.house.cash,cash);
  audited(world,state);
});
