// node tools/longterm-v12.mjs [--seeds=7,11,... | --players] [--days=365] [--out=work/langzeit]
// Ein durchgehender Messlauf und ein uninstrumentierter Replay; Save/Load im Replay.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { coreSource, engine, Observer, independentAudit, sum } from './longterm-v12-observer.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), source = coreSource(html);
const golden = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/economy-priority-v12.json'), 'utf8'));
const args = process.argv.slice(2), option = (name, fallback) => args.find(a => a.startsWith('--' + name + '='))?.split('=')[1] ?? fallback;
assert(args.every(a => /^--(seeds=|players$|days=|out=)/.test(a)), 'Unbekannte Option');
const days = Number(option('days', '365')), out = path.resolve(option('out', 'work/langzeit'));
assert(Number.isInteger(days) && days >= 1 && days <= 365, 'Tage 1..365');
const seeds = option('seeds', golden.results.map(r => r.seed).join(',')).split(',').map(Number);
assert(seeds.length && seeds.every(s => golden.results.some(r => r.seed === s)), 'Nur Referenz-Seeds');
const plain = engine(source);
assert.equal(plain.r.rulesVersion, 12); assert.equal(plain.r.schema, 8);
assert(html.includes('content="v0.12.3"'), 'Version');
fs.mkdirSync(out, { recursive: true });
const sourceCommit = process.env.LONGTERM_SOURCE_COMMIT || process.env.GITHUB_SHA;
assert(/^[a-f0-9]{40}$/.test(sourceCommit || ''), 'LONGTERM_SOURCE_COMMIT (git rev-parse HEAD) oder GITHUB_SHA erforderlich');
const codeSha256 = createHash('sha256').update(html).digest('hex');
function snapshot(s, c, r, watch) {
  const shortageByWare = {};
  for (const row of Object.values(s.stats.mangel)) for (const [ware, n] of Object.entries(row)) shortageByWare[ware] = (shortageByWare[ware] || 0) + n;
  const cashByKind = {};
  for (const o of Object.values(s.owners)) cashByKind[o.kind] = (cashByKind[o.kind] || 0) + o.cash;
  return structuredClone({ day: s.tick / 1440, hash: c.hash(s), shortageByWare, totalShortage: sum(Object.values(shortageByWare)),
    shortage: s.stats.mangel, cashByKind, owners: s.owners, minted: s.minted, burned: s.burned, initialSupply: s.initialSupply,
    ledger: s.ledger, stats: s.stats, stocks: Object.fromEntries(Object.entries(s.stations).map(([id, st]) => [id, st.lager])),
    fleets: Object.fromEntries(Object.keys(s.owners).map(id => [id, Object.values(s.ships).filter(sh => sh.owner === id).length])),
    observer: watch.snapshot() });
}
function checkGolden(p, seed) {
  const ref = golden.results.find(row => row.seed === seed), traderSales = sum(Object.entries(p.observer.trades)
    .filter(([k]) => /^npc[12]\/frachter\/.*\/verkauf$/.test(k)).map(([, row]) => row.count));
  const actual = { seed, totalShortage: p.totalShortage, foodShortage: p.shortageByWare.nahrung || 0,
    partsShortage: p.shortageByWare.bauteil || 0, medicineShortage: p.shortageByWare.medikamente || 0,
    foodAldera: p.shortage.st_aldera.nahrung, foodDravos: p.shortage.st_dravos.nahrung, traderSales,
    npc1Unpaid: p.observer.costs.npc1.unpaid, npc2Unpaid: p.observer.costs.npc2.unpaid,
    stationsCash: p.cashByKind.station, fundCash: p.cashByKind.fund, traderCash: p.cashByKind.trader,
    civilianLosses: sum(['npc1', 'npc2', 'npc3'].flatMap(id => Object.values(p.stats.verluste[id] || {}))), minted: p.minted, burned: p.burned };
  assert.deepEqual(actual, ref, 'Unveränderte unabhängige v12-Referenz ' + seed);
}
// Ausschließlich tatsächlich ausgeführte, validierte Queue-Befehle; kein Startkapital-/Lager-Edit.
function playerCommands(s, c, r, scenario) {
  const own = Object.values(s.ships).filter(sh => sh.owner === 'house').sort((a, b) => a.id.localeCompare(b.id));
  const carrier = own.find(sh => sh.id === 'sh002');
  if (s.tick === 0) return [{ type: 'shipTrade', schiff: 'sh002', ware: 'nahrung', menge: 1, kauf: true }];
  if (s.tick === 1) return [{ type: 'shipTrade', schiff: 'sh002', ware: 'nahrung', menge: 1, kauf: false }];
  if (s.tick === 2) return [{ type: 'shipTrade', schiff: 'sh002', ware: scenario === 'jagd' ? 'jaeger' : 'frachter', menge: 1, kauf: true }];
  if (s.tick === 3) return [{ type: 'shipActivate', schiff: 'sh002', klasse: scenario === 'jagd' ? 'jaeger' : 'frachter' }];
  if (s.tick === 4) return own.map(sh => sh.klasse === 'miner'
    ? { type: 'shipMine', schiff: sh.id, ware: 'erz' }
    : sh.klasse === 'jaeger' ? { type: 'shipMove', schiff: sh.id, ziel: 'st_orion' }
    : { type: 'shipHandeln', schiff: sh.id });
  if (scenario === 'jagd') {
    const hunter = own.find(sh => sh.klasse === 'jaeger' && sh.phase === 'dock' && sh.system === 'orion' && sh.auftrag === 'halten');
    if (hunter && s.tick === 60) return [{ type: 'shipHunt', schiff: hunter.id }];
  }
  if (scenario === 'station' && s.tick % 60 === 0 && !Object.values(s.stations).some(st => st.eigentum === 'house')) {
    const ship = own.find(sh => sh.phase === 'dock' && s.owners.house.cash >= c.stationspreis(s, r, r.world.systems[sh.system].station));
    if (ship) return [{ type: 'stationBuy', schiff: ship.id }];
  }
  // Echte Flottenbefehle nach 90/180 Tagen, mit nichtleerer Queue gespeichert.
  if ([90 * 1440, 180 * 1440].includes(s.tick) && carrier?.phase === 'dock')
    return [{ type: 'shipHandeln', schiff: carrier.id }];
  return [];
}
function run(seed, scenario = 'baseline') {
  const started = performance.now(), cpuStart = process.cpuUsage();
  const watch = new Observer(plain.c.createState(seed)), { c, r } = engine(source, watch);
  let s = c.createState(seed), replay = plain.c.createState(seed), audits = 0, comparisons = 0;
  const points = [], commands = [], memory = { maxSampledRss: 0, maxSampledHeapUsed: 0 }, dailyHashes = [];
  for (let tick = 1; tick <= days * 1440; tick++) {
    const queue = scenario === 'baseline' ? [] : playerCommands(s, c, r, scenario);
    for (const command of queue) {
      const cmd = { owner: 'house', ...command };
      assert(c.submit(s, cmd, r).ok, 'Messlauf submit ' + JSON.stringify(cmd));
      assert(plain.c.submit(replay, cmd, plain.r).ok, 'Replay submit');
      commands.push({ tick, ...cmd });
    }
    const a = c.step(s, r), b = plain.c.step(replay, plain.r);
    assert.deepEqual(a, b, 'Befehlsergebnisse');
    assert(a.every(result => result.ok), 'Ausführungsfehler ' + JSON.stringify(a));
    if (tick % 60 === 0) {
      assert(c.audit(s).ok, 'Produktionsaudit ' + seed + '/' + tick);
      assert(plain.c.audit(replay).ok, 'Replayaudit ' + seed + '/' + tick);
      independentAudit(s); independentAudit(replay); watch.hourly(s, c, r); audits++;
    }
    if (tick % 1440 === 0) {
      const hash = c.hash(s); assert.equal(hash, plain.c.hash(replay), 'Täglicher Replayhash ' + seed + '/' + tick);
      comparisons++; dailyHashes.push(hash);
      const mem = process.memoryUsage();
      memory.maxSampledRss = Math.max(memory.maxSampledRss, mem.rss); memory.maxSampledHeapUsed = Math.max(memory.maxSampledHeapUsed, mem.heapUsed);
    }
    if ([90, 180, 365, days].includes(tick / 1440)) {
      assert.equal(c.canonical(s), plain.c.canonical(replay), 'Vollständiger Zustand');
      const restored = c.load(c.save(s), undefined, r);
      assert.equal(c.canonical(s), c.canonical(restored), 'Save/Load Messpunkt');
      // Queue zum Ladezeitpunkt einschließen, auch wenn Automatikschiffe gerade reisen.
      if (scenario !== 'baseline' && tick < days * 1440) {
        const rename = { owner: 'house', type: 'shipRename', schiff: 'sh001', name: 'Langzeit ' + tick / 1440 };
        if (s.ships.sh001) {
          assert(c.submit(s, rename, r).ok); assert(plain.c.submit(replay, rename, plain.r).ok);
          commands.push({ tick: tick + 1, ...rename });
        }
      }
      replay = plain.c.load(plain.c.save(replay), undefined, plain.r);
      assert.equal(c.canonical(s), plain.c.canonical(replay), 'Replay nach Laden inkl. Queue');
      const p = snapshot(s, c, r, watch); points.push(p);
      if (scenario === 'baseline' && tick === 90 * 1440) checkGolden(p, seed);
      console.log('LONGTERM_POINT ' + JSON.stringify({ seed, scenario, day: tick / 1440, hash: p.hash, shortage: p.totalShortage, seconds: (performance.now() - started) / 1000 }));
    }
  }
  const cpu = process.cpuUsage(cpuStart);
  const result = { sourceCommit, codeSha256, toolSha256: createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).update(fs.readFileSync(new URL('./longterm-v12-observer.mjs', import.meta.url))).digest('hex'),
    node: process.version, platform: process.platform, arch: process.arch, seed, scenario, days, hourlyAuditsPerTrajectory: audits,
    dailyHashComparisons: comparisons, saveLoadPoints: points.length, dailyHashes, commands, points,
    runtime: { wallSeconds: (performance.now() - started) / 1000, cpuSeconds: (cpu.user + cpu.system) / 1e6, ...memory,
      processPeakRssKiB: process.resourceUsage().maxRSS, finalSaveBytes: Buffer.byteLength(c.save(s)) } };
  fs.writeFileSync(path.join(out, scenario + '-' + seed + '.json'), JSON.stringify(result) + '\n');
  console.log('LONGTERM_PASS ' + JSON.stringify({ seed, scenario, audits, comparisons, runtime: result.runtime }));
}
if (args.includes('--players')) for (const [seed, scenario] of [[42, 'handel-flotte'], [1234, 'station'], [98765, 'jagd']]) run(seed, scenario);
else for (const seed of seeds) run(seed);
