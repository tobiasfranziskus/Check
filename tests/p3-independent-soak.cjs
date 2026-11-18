'use strict';

const assert = require('node:assert/strict');
const J8 = require('../prototypes/verbund/konzern-session.js');
const Old = require('../prototypes/w5ac/session.js');
const {erstellen} = require('./p3-werft-mehrschiff-fixture.cjs');
const {SZENARIEN, pruefen, kennzahlen} = require('../tools/w6-szenarien.cjs');

const flag = 'APHROS_P3_FAIR_FERRY_RESEARCH';
const minutesPerDay = 1440;

function snapshot(world, state, start, day) {
  assert.deepEqual(pruefen(world, state), []);
  assert.equal(world.hash(world.load(world.save(state))), world.hash(state));
  return {
    day, tick: state.tick, hash: world.hash(state),
    ...kennzahlen(world, state),
    npcIce: state.w5n.frachtAbgeschlossen -
      (state.kanon.spielerFrachten?.auftraege.filter(order => order.end !== null).length ?? 0),
    npcFerry: state.w5ac.completed.filter(order => order.owner === 'transport').length,
    houseFerry: state.w5ac.completed.filter(order => order.owner === 'house').length - start,
    availableNpcFreighters: world.bericht(state).schiffe.filter(ship =>
      ship.owner === 'transport' && ship.klasse === 'frachter' && !ship.stillgelegt &&
      state.ships[ship.id].system === 'aldera').length,
  };
}

function checkModes(scenario, save, ship, days, seed, cohort) {
  let disabled;
  for (const enabled of [false, true]) {
    if (enabled) process.env[flag] = '1';
    else delete process.env[flag];
    const session = J8.erstellen();
    session.oeffnen204(save, true);
    const world = session.weltReferenz(), state = session.zustandReferenz();
    assert.equal(world.regel, 204);
    assert.equal(typeof world.p3ForschungsAnmeldung, enabled ? 'function' : 'undefined');
    world.politikSetzen(state, scenario.politik);
    const startTick = state.tick;
    const initialHash = world.hash(state);
    if (enabled) assert.equal(initialHash, disabled);
    else disabled = initialHash;
    const starts = state.w5ac.completed.filter(order => order.owner === 'house').length;
    const request = enabled && ship ? world.p3ForschungsAnmeldung(state, ship, 720) : null;
    if (request) assert.equal(request.ok, true, request.reason);
    const checkpoints = [...new Set([1, 30, 60, 90, 365, days])]
      .filter(day => day <= days).sort((a, b) => a - b);
    for (const day of checkpoints) {
      world.advance(state, startTick + day * minutesPerDay - state.tick);
      const row = snapshot(world, state, starts, day);
      console.log(JSON.stringify({cohort, scenario: scenario.id, seed, initialHash, startTick,
        enabled, request, queue: world.p3ForschungsStatus?.(), ...row}));
    }
  }
}

function seedFixture(seed, policy) {
  delete process.env[flag];
  const session = J8.erstellen();
  session.starten195(Old.create(seed, 'private195').export(), true);
  const world = session.weltReferenz(), state = session.zustandReferenz();
  world.politikSetzen(state, policy);
  world.npcAutoSetzen(state, true);
  world.npcSiliziumSetzen(state, true);
  let ship;
  while (state.tick < 14 * minutesPerDay) {
    if (state.stations.st_nadir.lager.frachter > 0) {
      const before = new Set(Object.keys(state.ships));
      const result = world.execute(state, {
        type: 'shipBuy', owner: 'house', station: 'st_nadir', klasse: 'frachter',
      });
      assert.equal(result.ok, true, result.reason);
      ship = Object.keys(state.ships).find(id => !before.has(id));
      assert.ok(ship);
      break;
    }
    world.advance(state, 60);
  }
  return {save: world.save(state), ship};
}

const selection = process.argv[2] || 'all';
const days = Number(process.argv[3] || 90);
assert.ok(Number.isSafeInteger(days) && days >= 1 && days <= 730);
if (selection === 'seeds') {
  const scenario = SZENARIEN.find(entry => entry.id === 'S02');
  for (const seed of [7, 42, 204]) {
    const {save, ship} = seedFixture(seed, scenario.politik);
    checkModes(scenario, save, ship, days, seed, 'first-paid-hull');
  }
} else {
  delete process.env[flag];
  const fixture = erstellen();
  const scenarios = SZENARIEN.filter(entry => selection === 'all' || entry.id === selection);
  assert.ok(scenarios.length, selection);
  for (const scenario of scenarios) {
    checkModes(scenario, fixture.save, fixture.second, days, 42, 'paid-second-hull');
  }
}
