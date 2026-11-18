import assert from 'node:assert/strict';
import test from 'node:test';
import J8 from '../prototypes/verbund/konzern-session.js';
import { erstellen } from './p3-werft-mehrschiff-fixture.cjs';
import { pruefen } from '../tools/w6-szenarien.cjs';

process.env.APHROS_P3_FAIR_FERRY_RESEARCH = '1';
const fixture = erstellen();

function open() {
  const session = J8.erstellen();
  session.oeffnen204(fixture.save, true);
  return {session, world: session.weltReferenz(), state: session.zustandReferenz()};
}

function balance(world, state) {
  assert.deepEqual(pruefen(world, state), []);
  for (const [id, ship] of Object.entries(state.ships)) {
    assert.equal(ship.id, id);
    assert.ok(Object.hasOwn(state.owners, ship.owner));
  }
  assert.equal(world.hash(world.load(world.save(state))), world.hash(state));
}

const ferry = (ship, owner = 'house') => ({type: 'shipReposition', owner, schiff: ship});

function rejects(world, state, command) {
  const before = world.save(state);
  assert.equal(world.execute(state, command).ok, false, JSON.stringify(command));
  assert.equal(world.save(state), before);
}

test('admission and original commands reject invalid ship, owner, role and duplicate', () => {
  const {world, state, session} = open();
  const initial = world.save(state);
  for (const ship of ['bad-id', 'sh999', 'sh002', fixture.miner, fixture.first]) {
    assert.equal(world.p3ForschungsAnmeldung(state, ship).ok, false, ship);
    assert.equal(session.ausfuehren('reposition-' + ship).ok, false, ship);
  }
  for (const ttl of [59, 721, 60.5, '360']) {
    assert.equal(world.p3ForschungsAnmeldung(state, fixture.second, ttl).ok, false);
  }
  rejects(world, state, ferry(fixture.second, 'transport'));
  rejects(world, state, ferry(fixture.second));
  rejects(world, state, {type: 'shipFreightIce', owner: 'house', schiff: fixture.second});
  rejects(world, state, {type: 'researchShipLoss', owner: 'house', schiff: fixture.second});
  assert.equal(world.p3ForschungsAnmeldung(state, fixture.second).ok, true);
  assert.equal(world.p3ForschungsAnmeldung(state, fixture.second).ok, false);
  assert.equal(world.save(state), initial);
  balance(world, state);
});

test('invalid JSON and inconsistent original ownership or money fail closed', () => {
  const {world, state} = open();
  const original = world.save(state);
  assert.throws(() => world.load('{'));
  for (const change of [
    copy => { copy.ships[fixture.second].owner = 'absent'; },
    copy => { copy.owners.house.cash = -1; },
    copy => { copy.rulesVersion = 999; },
  ]) {
    const copy = JSON.parse(original);
    change(copy);
    assert.equal(world.audit(copy).ok, false);
    assert.throws(() => world.load(JSON.stringify(copy)));
    assert.equal(world.p3ForschungsAnmeldung(copy, fixture.second).ok, false);
  }
  assert.equal(world.p3ForschungsStatus().wartend, null);
  assert.equal(world.save(state), original);
});

test('expiry is inclusive and repeat admission does not advance the deadline', () => {
  const {world, state} = open();
  const before = state.owners.house.cash;
  assert.ok(state.w5n.frachtauftrag);
  assert.equal(world.p3ForschungsAnmeldung(state, fixture.second, 60).frist, 3220);
  world.advance(state, 60);
  assert.equal(world.p3ForschungsStatus().wartend.frist, state.tick);
  assert.equal(world.p3ForschungsAnmeldung(state, fixture.second, 720).ok, false);
  world.minute(state);
  assert.deepEqual(world.p3ForschungsStatus().letzterBeleg,
    {status: 'abgelaufen', schiff: fixture.second, tick: 3221});
  assert.equal(state.owners.house.cash, before);
  assert.equal(world.p3ForschungsAnmeldung(state, fixture.second, 60).angemeldet, 3221);
  balance(world, state);
});

test('same JSON preserves economic state but loses open queue; J8 advances a clone', () => {
  const {world, state, session} = open();
  const cold = open();
  assert.equal(world.p3ForschungsAnmeldung(state, fixture.second).ok, true);
  const exported = session.exportieren();
  const restored = J8.erstellen();
  restored.oeffnen204(exported, true);
  assert.equal(restored.exportieren(), exported);
  assert.equal(restored.weltReferenz().p3ForschungsStatus().wartend, null);
  for (let index = 0; index < 7; index++) session.weiterspielen(60);
  world.advance(cold.state, 420);
  assert.equal(world.hash(session.zustandReferenz()), cold.world.hash(cold.state));
  assert.equal(session.zustandReferenz().w5ac.completed.some(entry => entry.id === fixture.second), false);
  assert.equal(world.p3ForschungsStatus().wartend.schiff, fixture.second);
  assert.equal(world.p3ForschungsAnmeldung(session.zustandReferenz(), fixture.second).ok, false);
});

test('original charged ferry reconciles each paid minute, asset wear and completion', () => {
  const {world, state} = open();
  const ship = fixture.second;
  const {reserved, pilot} = world.rules.w5Transfer;
  const start = {cash: state.owners.house.cash, value: world.buchwert(state, ship),
    paid: state.w5ac.paid, pilot: state.owners[pilot].cash};
  assert.equal(world.p3ForschungsAnmeldung(state, ship).ok, true);
  for (let index = 0; index < 360 && state.w5ac.active?.id !== ship; index++) world.minute(state);
  assert.equal(state.w5ac.active?.id, ship);
  assert.equal(state.owners.house.cash, start.cash - 60);
  assert.equal(state.w5ac.allocated - start.paid, 60);
  assert.equal(state.w3.auftrag, null);
  assert.equal(state.w5n.frachtauftrag, null);
  rejects(world, state, ferry(ship));
  rejects(world, state, {type: 'shipCancel', owner: 'house', schiff: ship});
  const copy = world.load(world.save(state));
  assert.equal(world.hash(state), world.hash(copy));
  let firstDifference;
  for (let minute = 1; minute <= 60; minute++) {
    world.minute(state);
    world.minute(copy);
    if (firstDifference === undefined && world.hash(state) !== world.hash(copy)) {
      const a = JSON.parse(world.canonical(state)), b = JSON.parse(world.canonical(copy));
      firstDifference = {
        tick: state.tick,
        simultaneousFerryAndIce: Boolean(copy.w5ac.active && copy.w5n.frachtauftrag),
        fields: Object.keys(a)
        .filter(key => JSON.stringify(a[key]) !== JSON.stringify(b[key]))};
    }
    assert.equal(state.owners[reserved].cash, 60 - minute);
    assert.equal(state.owners[pilot].cash, start.pilot + minute);
    assert.equal(state.w5ac.paid, start.paid + minute);
    assert.equal(state.ships[ship].owner, 'house');
    assert.equal(Number(Boolean(state.w5ac.active)) + Number(Boolean(state.w3.auftrag)) +
      Number(Boolean(state.w5n.frachtauftrag)), 1);
  }
  assert.ok(firstDifference?.simultaneousFerryAndIce,
    'documented prototype gap: active save loses scheduler context and permits concurrent traffic');
  assert.notEqual(world.hash(state), world.hash(copy));
  console.log('P3_ACTIVE_SAVE_DIVERGENCE', JSON.stringify({firstDifference,
    retained: world.hash(state), reloaded: world.hash(copy)}));
  assert.equal(state.w5ac.completed.filter(entry => entry.id === ship).length, 1);
  assert.equal(state.ships[ship].system, 'aldera');
  assert.equal(world.buchwert(state, ship), start.value -
    Math.floor(60 * world.daten.verschleiss.milliJeMinute.frachter / 1000));
  assert.ok(state.w5n.frachtauftrag);
  rejects(world, state, ferry(ship));
  balance(world, state);
  balance(world, copy);
});

test('without an NPC start, the preference flag survives simulation time', () => {
  const {world, state} = open();
  assert.equal(world.p3ForschungsAnmeldung(state, fixture.second).ok, true);
  world.politikSetzen(state, {automatik: false});
  world.advance(state, 1440);
  const status = world.p3ForschungsStatus();
  assert.equal(status.abgeschlossen, 1);
  assert.equal(status.npcVorrang, true);
  assert.equal(state.w5ac.completed.some(entry => entry.id === fixture.second), true);
  assert.equal(state.w3.auftrag || state.w5n.frachtauftrag || state.w5ac.active, null);
  balance(world, state);
});

test('zero book value stress case records dispatch behavior under active retirement policy', () => {
  const {world, state} = open();
  const ship = fixture.second;
  assert.equal(world.p3ForschungsAnmeldung(state, ship).ok, true);
  // Alter only wear in this isolated test snapshot. This is a state boundary test,
  // with no claim that wear can be acquired while normally waiting at the dock.
  state.kanon.verschleiss[ship] = Math.ceil(
    world.buchwert(state, ship) * 1000 / world.daten.verschleiss.milliJeMinute.frachter);
  assert.equal(world.buchwert(state, ship), 0);
  assert.equal(world.bericht(state).schiffe.find(entry => entry.id === ship).stillgelegt, true);
  balance(world, state);
  for (let index = 0; index < 360 && world.p3ForschungsStatus().wartend; index++) world.minute(state);
  // Characterization of the prototype gap. The future acceptance test must require rejection.
  assert.equal(state.w5ac.active?.id, ship);
  balance(world, state);
});
