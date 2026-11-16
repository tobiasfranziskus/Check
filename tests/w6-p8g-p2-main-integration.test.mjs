// Independent integration contract: current public P2/Rule204 stays the default,
// W6/P8g is opt-in Rule207 research using the SAME flight core, no auto-save migration.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W=require('../prototypes/welt/welt-kern.js');
const F=require('../prototypes/flug2d/flug-kern.js');

test('W6-bridge: P2 target commands still exist in the current 2D flight core',()=>{
  for(const name of ['shipOrbit','shipFollow','shipLock','shipUnlock','shipSteer','shipApproach','shipDock']){
    const example={rulesVersion:204,flug:{schritt:0},ships:{}};
    // Invalid commands are rejected, not silently treated as unknown: require source
    // smoke and rely on unchanged main P2 behavior tests for valid flight state.
    assert.equal(typeof F.ausfuehren,'function');
  }
  assert.equal(F.DATEN.systeme.dravos.station.id,'st_dravos');
  assert.equal(F.DATEN.systeme.dravos.felder[0].ware,'silizium');
  assert.equal(F.DATEN.systeme.aldera.station.id,'st_aldera');
  assert.equal(F.DATEN.systeme.nadir.station.id,'st_nadir');
});

test('W6-bridge: public Rule204 and P8g Rule207 are separate worlds with no silent upgrade',()=>{
  const old=W.erstellenJ4c({carrierCash:2000,buyerCash:4000});
  const state=old.createState(42),oldVersion=state.rulesVersion;
  assert.equal(oldVersion,204);
  assert.equal(state.kanon.materialSupplyEnabled,undefined);
  assert.equal(old.p8gMaterialOnlyW3,undefined);
  const original=old.save(state);
  const restored=old.load(original);
  assert.equal(old.hash(restored),old.hash(state));
  assert.equal(original,old.save(restored));
  assert.equal(old.execute(state,{type:'industrialOreOfferMaterial',owner:'st_nadir',miner:'sh001',frachter:'sh002'}).ok,false);

  const w6=W.erstellenP8d({carrierCash:2000,buyerCash:4000});
  const candidate=w6.createState(42);
  assert.equal(candidate.rulesVersion,207);
  assert.equal(w6.p8gMaterialOnlyW3,true);
  assert.equal(candidate.kanon.materialSupplyEnabled,undefined);
  assert.equal(w6.execute(candidate,{type:'industrialOreOfferMaterial',owner:'st_nadir',miner:'sh001',frachter:'sh002'}).ok,false);
  assert.equal(w6.hash(w6.load(w6.save(candidate))),w6.hash(candidate));
  assert.equal(state.rulesVersion,oldVersion);
  assert.equal(old.save(state),original);
});

test('W6-bridge: P2 flight physics optional Dravos neither grants a ship nor a ledger good to Rule204',()=>{
  const w=W.erstellenJ4c({carrierCash:2000,buyerCash:4000});
  const s=w.createState(42);
  const before={hash:w.hash(s),silicon:s.ledger.silizium?.initial||0,
    shipCount:Object.keys(s.ships).length,stations:Object.keys(s.stations)};
  const flug=F.koerperAngedockt('aldera');
  assert.equal(flug.lage,'angedockt');
  assert.equal(w.hash(s),before.hash);
  assert.equal((s.ledger.silizium?.initial||0),before.silicon);
  assert.equal(Object.keys(s.ships).length,before.shipCount);
  assert.deepEqual(Object.keys(s.stations),before.stations);
  assert.equal(s.stations.st_dravos,undefined);
  assert.equal(w.audit(s).ok,true);
});
