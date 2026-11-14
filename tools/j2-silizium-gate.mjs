// [ANALYSE] Originalbefehle und lesende Bestandsaufnahme; keine neue Siliziumregel.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require = createRequire(import.meta.url);
const Welt = require('../prototypes/welt/welt-kern.js');
const J1 = require('../prototypes/welt/j1-wirtschaftsaudit.cjs');
const {supply} = require('../tests/k13-f7-vorbereitung.cjs');

export function bestand(w, s) {
  const before = w.canonical(s);
  const audit = J1.inspect(w, s).audit;
  assert.equal(audit.ok, true, JSON.stringify(audit));
  const money = Object.values(s.owners).reduce((n, a) => n + a.cash, 0);
  assert.equal(money, 33000);
  assert.equal(s.minted, 0); assert.equal(s.burned, 0);
  // Physische Ware unabhängig aus allen Stationen/Schiffen rekonstruieren.
  for (const [ware, ledger] of Object.entries(s.ledger)) {
    const actual = [...Object.values(s.stations).map(x => x.lager),
      ...Object.values(s.ships).map(x => x.ladung)]
      .reduce((n, cargo) => n + (cargo[ware] || 0), 0);
    assert.equal(actual, ledger.initial + ledger.mined + ledger.produced
      + ledger.imported - ledger.consumed - ledger.exported, ware);
  }
  const result = {
    tick: s.tick, hash: w.hash(s), money, minted: s.minted, burned: s.burned,
    cash: Object.fromEntries(Object.entries(s.owners).map(([id, x]) => [id, x.cash])),
    warehouses: Object.fromEntries(Object.entries(s.stations).map(([id, x]) => [id, {...x.lager}])),
    ships: Object.values(s.ships).map(sh => ({id: sh.id, owner: sh.owner,
      klasse: sh.klasse, system: sh.system, phase: sh.phase, auftrag: sh.auftrag,
      dock: sh.flug?.anker, lage: sh.flug?.lage, cargo: {...sh.ladung},
      buchwert: w.buchwert(s, sh.id)})),
    fields: w.rules.world.fields,
    silicon: {registered: Object.hasOwn(w.rules.economy.waren, 'silizium'),
      mined: s.ledger.silizium?.mined || 0, nadir: s.stations.st_nadir.lager.silizium || 0},
    minerYard: s.kanon.minerWerft ? structuredClone(s.kanon.minerWerft) : null,
  };
  assert.equal(w.canonical(s), before);
  return result;
}

export function ablehnen(w, s, cmd) {
  const before = w.canonical(s), response = w.execute(s, cmd);
  assert.equal(response.ok, false, JSON.stringify(cmd));
  assert.equal(w.canonical(s), before, 'Ablehnung muss vollständig atomar bleiben');
  return {cmd, reason: response.reason};
}

export function minerSperren(w, s, id) {
  const owner = s.ships[id].owner;
  return [
    {type:'shipMove', owner, schiff:id, ziel:'st_nadir'},
    {type:'shipReposition', owner, schiff:id},
    {type:'shipGateCheck', owner, schiff:id},
    {type:'shipFreightGateIce', owner, schiff:id},
    {type:'shipMine', owner, schiff:id, ware:'silizium'},
  ].map(cmd => ablehnen(w, s, cmd));
}

export async function versuch(seed) {
  if (![42,7].includes(seed)) throw RangeError('J2: Seeds42/7');
  const w0 = Welt.erstellenK7(), s0 = w0.createState(seed);
  const initial = bestand(w0, s0);
  // Gegenbeweis gegen eine pauschale "kein finanzierbarer Miner"-Behauptung.
  const beforeIds = new Set(Object.keys(s0.ships));
  assert.equal(w0.execute(s0, {type:'shipBuy', owner:'house', klasse:'miner', station:'st_aldera'}).ok, true);
  const miner = Object.keys(s0.ships).find(id => !beforeIds.has(id));
  assert.equal(s0.owners.house.cash, initial.cash.house - 600);
  assert.equal(s0.owners.werft_extern.cash, initial.cash.werft_extern + 600);
  assert.equal(s0.ledger.miner.consumed, 2); // ein NPC-Kauf bei Genesis, ein echter Spielerkauf
  const purchased = bestand(w0, s0), localRejections = minerSperren(w0, s0, miner);

  // Original-K6/K7/F7-Kette, keine Testeinlagen oder Lagerkorrekturen.
  const {w, s} = await supply(seed);
  const industrial = bestand(w, s);
  const originalBuild = ablehnen(w, s, {type:'stationBuildMiner', owner:'werft_extern', station:'st_nadir', besteller:'house'});
  const commands = [
    [{type:'shipBuy', owner:'house', klasse:'frachter', station:'st_nadir'}, 0],
    [{type:'stationRefine', owner:'st_nadir', station:'st_nadir'}, w.rules.w4.dauer],
    [{type:'stationBuildMiner', owner:'werft_extern', station:'st_nadir', besteller:'house'}, w.rules.w5.dauer],
  ];
  const transcript = [];
  let readySave;
  for (const [cmd, minutes] of commands) {
    const before = bestand(w, s);
    if (cmd.type === 'stationBuildMiner') readySave = w.save(s);
    const response = w.execute(s, cmd);
    assert.equal(response.ok, true, JSON.stringify(response));
    const started = bestand(w, s);
    for (let i = 0; i < minutes; i++) {w.minute(s); bestand(w, s);}
    transcript.push({cmd, minutes, before, started, after: bestand(w, s)});
  }
  assert.equal(s.stations.st_nadir.lager.miner, 1);
  const final = bestand(w, s);
  const nadirRejections = ['house','npc3'].map(owner => ablehnen(w, s,
    {type:'shipBuy', owner, klasse:'miner', station:'st_nadir'}));
  assert.equal(w.hash(w.load(w.save(s))), final.hash);
  return {report: {status:'BLOCKED_NOT_IMPLEMENTED', seed, initial, purchased, localRejections,
    industrial, originalBuild, transcript, final, nadirRejections,
    deliveredSilicon: 0, gates: {siliconMining:false, siliconFreight:false, siliconPurchase:false}},
    w, s, readySave};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const seed of [42,7]) console.log(JSON.stringify((await versuch(seed)).report));
}
