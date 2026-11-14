import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const Welt = require('../prototypes/welt/welt-kern.js');
const {inspect, loadChecked} = require('../prototypes/welt/j1-wirtschaftsaudit.cjs');
for (const seed of [42, 7]) test(`J1 seed ${seed}: executable profile, atomic refusals, replay and load`, () => {
  const w = Welt.erstellenK7(), s = w.createState(seed), before = w.canonical(s);
  const r = inspect(w, s);
  assert.equal(r.audit.ok, true, JSON.stringify(r.audit));
  assert.deepEqual(r.missingGoods, ['silizium', 'bauteil', 'jaeger']);
  assert.deepEqual(r.missingRecipes, ['r_bauteil', 'r_jaeger']);
  assert.deepEqual(r.siliconFields, []);
  assert.deepEqual(r.productionLines, []);
  assert.equal(r.shipyardClass, 'frachter');
  assert.ok(r.advertisedRecipes.includes('r_jaeger'));
  assert.deepEqual(r.fighters, []);
  const miner = Object.values(s.ships).find(sh => sh.klasse === 'miner');
  const commands = [
    ...['house','npc3'].flatMap(owner => ['st_aldera','st_nadir'].map(station =>
      ({type:'shipBuy',owner,station,klasse:'jaeger'}))),
    {type:'shipMine',owner:miner.owner,schiff:miner.id,ware:'silizium'},
    {type:'stationRecipe',owner:'house',station:'st_nadir',rezept:'r_jaeger'},
    {type:'stationBuildShip',owner:'werft_extern',station:'st_nadir',klasse:'jaeger'},
    {type:'shipHunt',owner:miner.owner,schiff:miner.id},
    {type:'shipHunt',owner:'house',schiff:'f8_training_only'},
    {type:'shipReplaceFighter',owner:'house',verlust:'fake'},
    {type:'bountyClaim',owner:'house',verlust:'fake'},
    {type:'bountyClaim',owner:'house',verlust:'fake'},
  ];
  for (const cmd of commands) {
    const result = w.execute(s, cmd);
    assert.equal(result.ok, false, JSON.stringify(cmd));
    assert.equal(w.canonical(s), before, 'no rejection side effects');
  }
  assert.equal(w.canonical(s), before, 'inspection is read only');
  const replay = w.load(w.save(s));
  w.advance(s, 120); w.advance(replay, 120);
  assert.equal(w.hash(s), w.hash(replay));
  console.log('J1_REFERENCE', seed, w.hash(s));
  assert.equal(w.hash(s), seed === 42 ? '9f3decc1bc502233' : '0a500c4d4814e76b');
  assert.equal(inspect(w, s).audit.ok, true);
});
test('J1 independent checks reject invented stock, ledger, ship and cash', () => {
  const w = Welt.erstellenK7(), base = w.save(w.createState(42));
  for (const mutate of [
    s => {s.stations.st_nadir.lager.silizium = 8;},
    s => {s.ledger.silizium = {initial:8,mined:0,produced:0,consumed:0,imported:0,exported:0};s.stations.st_nadir.lager.silizium=8;},
    s => {s.ships.fake = {...Object.values(s.ships)[0],id:'fake',klasse:'jaeger'};},
    s => {s.owners.house.cash += 900;},
    s => {Object.values(s.ships)[0].ladung.silizium = 8;},
    s => {const sh=Object.values(s.ships)[0];sh.id='f8_training_only';},
  ]) {
    const s = JSON.parse(base); mutate(s);
    assert.equal(inspect(w, s).audit.ok, false);
    assert.throws(() => loadChecked(w, JSON.stringify(s)));
  }
  const w199 = Welt.erstellen();
  assert.throws(() => inspect(w199, w199.createState(42)), /Regel200/);
});
