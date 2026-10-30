// Verdichtet Rohartefakte; keine Freigabegrenzwerte und keine neuen Goldenwerte.
// node tools/longterm-v12-summary.mjs work/langzeit docs/data/wirtschaft-langzeit-v12.json
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { sum } from './longterm-v12-observer.mjs';
const input = process.argv[2] || 'work/langzeit', output = process.argv[3] || 'work/langzeit-summary.json';
const rows = fs.readdirSync(input).filter(f => /^(baseline|handel-flotte|station|jagd)-\d+\.json$/.test(f))
  .map(f => JSON.parse(fs.readFileSync(path.join(input, f), 'utf8')));
const baseline = rows.filter(r => r.scenario === 'baseline'), players = rows.filter(r => r.scenario !== 'baseline');
const seeds = [7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
assert.deepEqual(baseline.map(r => r.seed).sort((a,b)=>a-b), [...seeds].sort((a,b)=>a-b));
assert.equal(players.length, 3);
assert.equal(new Set(rows.map(r => r.codeSha256)).size, 1);
assert.equal(new Set(rows.map(r => r.toolSha256)).size, 1);
for (const r of rows) { assert.equal(r.days,365); assert.equal(r.hourlyAuditsPerTrajectory,8760); assert.equal(r.dailyHashComparisons,365); assert.deepEqual(r.points.map(p=>p.day),[90,180,365]); }
const total = obj => sum(Object.values(obj || {}));
const median = a => [...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
const stats = a => ({ sum: sum(a), median: median(a), min: Math.min(...a), max: Math.max(...a) });
const losses = (p,id) => total(p.stats.verluste[id]);
const sales = p => Object.entries(p.observer.trades).filter(([k]) => /^npc[12]\/frachter\/.*\/verkauf$/.test(k));
const flow = p => {
  const out = {};
  for (const [key,n] of Object.entries(p.observer.flows)) out[key.split(':')[0]] = (out[key.split(':')[0]] || 0) + n;
  return out;
};
function metrics(p) {
  const t = Object.values(p.observer.trades), npcCost = ['npc1','npc2','npc3'].map(id=>p.observer.costs[id]);
  const transport = Object.values(p.observer.transport), f = flow(p);
  return { shortage: p.totalShortage, foodShortage: p.shortageByWare.nahrung || 0, partsShortage: p.shortageByWare.bauteil || 0,
    medicineShortage: p.shortageByWare.medikamente || 0, stationsCash: p.cashByKind.station, fundsCash: p.cashByKind.fund,
    tradersCash: p.cashByKind.trader, minersCash: p.cashByKind.miner, playerCash: p.cashByKind.player,
    securityCash: p.cashByKind.authority, piratesCash: p.cashByKind.pirate, moneySupply: total(p.cashByKind),
    minted: p.minted, burned: p.burned, npcUnpaid: sum(npcCost.map(x=>x.unpaid)), securityUnpaid: p.observer.costs.security.unpaid,
    securityDue: p.observer.costs.security.due, securityPaid: p.observer.costs.security.paid,
    civilianLosses: sum(['npc1','npc2','npc3'].map(id=>losses(p,id))), pirateLosses: losses(p,'pirates'), securityLosses: losses(p,'security'),
    replacements: sum(['npc1','npc2','npc3'].map(id=>total(p.stats.indienst[id]))), pirateReplacements: p.stats.piratenErsatz,
    subsidy: p.stats.zuschuss, traderSales: sum(sales(p).map(([,v])=>v.count)),
    traderRealizedMargin: sum(sales(p).map(([,v])=>v.realizedMargin)),
    tradeOperations: sum(t.map(x=>x.count)), tradeUnits: sum(t.map(x=>x.units)), tradeValue: sum(t.map(x=>x.value)),
    fees: sum(t.map(x=>x.fees)), cargoUnitMinutes: sum(transport.map(x=>x.cargoUnitMinutes)), shipMinutes: sum(transport.map(x=>x.shipMinutes)),
    destroyedCargo: p.stats.vernichtet, stationBelow2500Hours: sum(Object.entries(p.observer.liquidity).filter(([k])=>k.startsWith('st_')).map(([,v])=>v.below2500Hours)),
    stationZeroHours: sum(Object.entries(p.observer.liquidity).filter(([k])=>k.startsWith('st_')).map(([,v])=>v.zeroHours)),
    securityZeroHours: p.observer.liquidity.security.zeroHours, npcSurplusTransfers: f.npcAbgabe || 0,
    fundLocalTransfers: f.fondsLokal || 0, fundGlobalTransfers: f.fondsGlobal || 0, pirateLootRevenue: f.beuteVerkauf || 0,
    pirateReplacementTransfers: f.piratenErsatz || 0,
  };
}
const combine = (objects) => {
  const result = {};
  for (const object of objects) for (const [key,value] of Object.entries(object)) {
    if (typeof value === 'number') result[key] = (result[key] || 0) + value;
    else if (value && typeof value === 'object') result[key] = combine([result[key] || {}, value]);
  }
  return result;
};
const checkpoints = {};
for (const day of [90,180,365]) {
  const ps = baseline.map(row=>row.points.find(p=>p.day===day)), ms = ps.map(metrics);
  const prices = {};
  for (const p of ps) for (const [key, row] of Object.entries(p.observer.prices)) {
    const ware = key.split('/')[1], q = prices[ware] ||= { min: row.min, max: row.max, sum: 0, samples: 0 };
    q.min = Math.min(q.min,row.min); q.max = Math.max(q.max,row.max); q.sum += row.sum; q.samples += row.samples;
  }
  for (const q of Object.values(prices)) q.mean = q.sum / q.samples;
  checkpoints[day] = { metrics: Object.fromEntries(Object.keys(ms[0]).map(k=>[k,stats(ms.map(m=>m[k]))])),
    shortage: combine(ps.map(p=>p.shortage)), cashByOwner: Object.fromEntries(Object.keys(ps[0].owners).map(id=>[id,stats(ps.map(p=>p.owners[id].cash))])),
    costs: combine(ps.map(p=>Object.fromEntries(Object.entries(p.observer.costs).map(([id,q])=>[id,{due:q.due,paid:q.paid,unpaid:q.unpaid}])))),
    ledger: combine(ps.map(p=>p.ledger)), stockTotal: Object.fromEntries(Object.keys(ps[0].ledger).map(w=>[w,sum(ps.map(p=>{const l=p.ledger[w];return l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported;}))])),
    flows: combine(ps.map(flow)), transport: combine(ps.map(p=>p.observer.transport)), prices,
    consumption: combine(ps.map(p=>p.observer.consumption)), production: combine(ps.map(p=>p.observer.production)), mining: combine(ps.map(p=>p.observer.mining)),
    fleet: combine(ps.map(p=>Object.fromEntries(Object.entries(p.observer.fleet).map(([id,q])=>[id,{missingShipHours:q.missingShipHours,zeroFleetHours:q.zeroFleetHours}])))),
    trades: combine(ps.map(p=>p.observer.trades)),
  };
}
const compact = r => ({ seed:r.seed,scenario:r.scenario,sourceCommit:r.sourceCommit,codeSha256:r.codeSha256,toolSha256:r.toolSha256,node:r.node,
  runtime:r.runtime,commands:r.commands,points:r.points.map(p=>({day:p.day,hash:p.hash,metrics:metrics(p),shortage:p.shortage,
    cash:Object.fromEntries(Object.entries(p.owners).map(([id,o])=>[id,o.cash])),costs:p.observer.costs,fleet:p.observer.fleet,
    losses:p.stats.verluste,replacements:p.stats.indienst,liquidity:p.observer.liquidity})) });
const summary = { status:'ANALYSE: gemessene Ergebnisse, keine Freigabe-Fixture', seeds, days:[90,180,365],
  sourceCommits:[...new Set(rows.map(r=>r.sourceCommit))], codeSha256:rows[0].codeSha256, toolSha256:rows[0].toolSha256,
  hourlyAuditsBothTrajectories:sum(rows.map(r=>2*r.hourlyAuditsPerTrajectory)), dailyHashComparisons:sum(rows.map(r=>r.dailyHashComparisons)),
  saveLoadPoints:sum(rows.map(r=>r.saveLoadPoints)), baseline:baseline.sort((a,b)=>seeds.indexOf(a.seed)-seeds.indexOf(b.seed)).map(compact),
  players:players.map(compact), checkpoints,
};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(summary)+'\n');
console.log(JSON.stringify({output,bytes:fs.statSync(output).size,baselines:baseline.length,players:players.length}));
