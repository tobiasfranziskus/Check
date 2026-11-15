// Independent QA for #385. Research only; never enables W6 in the public UI.
// Run with Node22: node tools/w6-independent-longrun.cjs
'use strict';
const assert = require('node:assert/strict');
const W6 = require('./w6-szenarien.cjs');

// Reverse matching: each newer hull can cover at most one older consumed hull.
// This checks the proposed W6 reserve, not approval of its economic semantics.
function reserve(w, s, owner) {
  const available = {}, prices = w.rules.economy.waren;
  let total = 0;
  for (const sh of w.bericht(s).schiffe.filter(x => x.owner === owner).reverse()) {
    const price = prices[sh.klasse].basis;
    if (sh.buchwert === 0 && (available[sh.klasse] || 0) > 0) available[sh.klasse]--;
    else total += price - sh.buchwert;
    available[sh.klasse] = (available[sh.klasse] || 0) + 1;
  }
  return total;
}
function check(w, s) {
  assert.deepEqual(W6.pruefen(w, s), []);
  assert.equal(s.owners.house.cash, 3000);
  assert.ok(!Object.values(s.ships).some(sh => sh.owner === 'house'));
  for (const owner of ['npc3', 'transport']) {
    const hulls = w.bericht(s).schiffe.filter(sh => sh.owner === owner);
    const initial = w.rules.owners.find(o => o.id === owner).cash;
    const retained = s.kanon.politik.betriebsreserve[owner] || 0;
    const expected = Math.max(0, Math.min(s.owners[owner].cash - retained - reserve(w, s, owner),
      s.owners[owner].cash + hulls.reduce((sum, sh) => sum + sh.buchwert, 0) - initial));
    assert.equal(w.ausschuettbar(s, owner), expected, owner + ': independent reserve');
  }
  assert.equal(w.hash(w.load(w.save(s))), w.hash(s));
}
// Reuse the original simulation and independent audits; only observation is timed here.
function snapshot(w, s) {
  const b = w.bericht(s), hulls = b.schiffe, byId = new Map(hulls.map(sh=>[sh.id,sh]));
  const stocks = Object.fromEntries(Object.keys(s.ledger).map(ware => [ware,
    [...Object.values(s.stations).map(st => st.lager), ...Object.values(s.ships).map(sh => sh.ladung)]
      .reduce((n, l) => n + (l[ware] || 0), 0)]));
  for (const klasse of ['miner', 'frachter'])
    assert.equal(hulls.filter(sh => sh.klasse === klasse).length, s.ledger[klasse].consumed);
  for (const [id, sh] of Object.entries(s.ships)) {
    assert.ok(s.owners[sh.owner], 'known owner');
    assert.equal(sh.id, id);
    const price = w.rules.economy.waren[sh.klasse].basis;
    const wear = s.kanon.verschleiss[id] || 0;
    const expected = price - Math.min(price, Math.floor(wear * w.daten.verschleiss.milliJeMinute[sh.klasse] / 1000));
    assert.equal(byId.get(id).buchwert, expected, 'independent hull depreciation');
  }
  const net = {};
  for (const [key, amount] of Object.entries(s.kanon.buch.summen)) {
    const [kind, from, to] = key.split('|');
    assert.ok(kind && s.owners[from] && s.owners[to]);
    assert.ok(Number.isSafeInteger(amount) && amount > 0);
    net[from] = (net[from] || 0) + amount;
    net[to] = (net[to] || 0) - amount;
  }
  for (const id of new Set([...Object.keys(net), ...Object.keys(s.kanon.netto)]))
    assert.equal(net[id] || 0, s.kanon.netto[id] || 0, 'independent double-entry '+id);
  const additionalWages = {
    refinery:s.w4.gezahlt, freighterYard:s.w5.arbeitsGezahlt,
    minerYard:Object.entries(s.kanon.buch.summen).filter(([key])=>key.startsWith('miner-arbeitslohn|'))
      .reduce((n,[,amount])=>n+amount,0)
  };
  return {tick:s.tick, hash:w.hash(s), ...W6.kennzahlen(w,s), additionalWages,
    totalPaidWages:Object.values(b.loehne).reduce((n,v)=>n+v,0)+Object.values(additionalWages).reduce((n,v)=>n+v,0),
    hulls:{total:hulls.length, consumed:hulls.filter(sh=>sh.buchwert===0).length,
      retired:hulls.filter(sh=>sh.stillgelegt).length}, stocks,
    cash:Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash])),
    worldMoney:b.weltgeld, minted:s.minted, burned:s.burned,
    production:b.produktion, wages:b.loehne, ledger:structuredClone(s.ledger),
    commands:structuredClone(s.kanon.npc.befehle), rejected:structuredClone(s.kanon.npc.abgelehnt),
    bottleneck:structuredClone(b.engpass)};
}
// Legal saved states only; exclude loading/auditing and discard one JIT warm-up.
function benchmark(w, save) {
  const samples=[]; let hash;
  const original=w.load(save);
  for(let i=-1;i<3;i++) {
    const s=w.load(save), cpu=process.cpuUsage(), started=performance.now();
    w.advance(s,1440);
    const wallSeconds=(performance.now()-started)/1000, used=process.cpuUsage(cpu);
    assert.deepEqual(W6.pruefen(w,s),[]); snapshot(w,s);
    const endHash=w.hash(s);
    if(hash) assert.equal(endHash,hash,'benchmark clone replay');
    hash=endHash;
    if(i>=0) samples.push({wallSeconds,cpuSeconds:(used.user+used.system)/1e6});
  }
  return {day:original.tick/1440,hulls:Object.keys(original.ships).length,
    warmups:1,repeats:3,minutesPerSample:1440,loadAndAuditExcluded:true,samples,endHash:hash};
}
function run(id = 'S01', options = {}) {
  const fs = require('node:fs');
  const days = options.days ?? 730, step = options.step ?? 30;
  if (!Number.isSafeInteger(days) || days < 1 || !Number.isSafeInteger(step) || step < 1)
    throw new RangeError('days and step must be positive integers');
  const scenario = W6.SZENARIEN.find(x => x.id === id);
  if (!scenario) throw new RangeError('Unknown scenario: ' + id);
  const started = performance.now();
  const initial = W6.start(scenario.politik), w = initial.welt;
  const s = options.resumeFile ? w.load(fs.readFileSync(options.resumeFile,'utf8')) : initial.s;
  if (options.resumeFile) {
    assert.deepEqual(s.kanon.politik,initial.s.kanon.politik,'resume scenario policy');
    assert.equal(s.kanon.npcAuto,true,'resume NPC opt-in');
  }
  const startDay = s.tick / 1440;
  if (startDay >= days) throw new RangeError('resume must precede requested end');
  const checkpoints = [], targets = new Set([180,365,730].filter(d=>d<=days));
  for(let day=step;day<days;day+=step) targets.add(day);
  targets.add(days);
  let mid, previous = snapshot(w,s), previousShips = new Map(Object.values(s.ships).map(sh=>[sh.id,sh.owner]));
  const log = item => {console.log(JSON.stringify(item));};
  for (const day of [...targets].filter(d=>d>startDay).sort((a,b)=>a-b)) {
    const before = performance.now(), from = s.tick;
    w.advance(s, day*1440-s.tick);
    const advanceSeconds = (performance.now()-before)/1000;
    assert.equal(s.tick,day*1440);
    const auditStarted = performance.now();
    if (s.kanon.politik.stilllegung) check(w,s);
    else {
      assert.deepEqual(W6.pruefen(w,s),[]);
      assert.equal(w.canonical(w.load(w.save(s))), w.canonical(s));
    }
    for (const [ship,owner] of previousShips) assert.equal(s.ships[ship]?.owner,owner,'historical ownership preserved');
    previousShips = new Map(Object.values(s.ships).map(sh=>[sh.id,sh.owner]));
    assert.deepEqual(s.kanon.npc.abgelehnt,{});
    const current = snapshot(w,s), save = w.save(s);
    assert.equal(w.canonical(w.load(save)),w.canonical(s),'exact canonical roundtrip');
    const result = {day,...current, advanceSeconds, secondsPerDay:advanceSeconds/((s.tick-from)/1440),
      auditSeconds:(performance.now()-auditStarted)/1000,
      elapsedSeconds:(performance.now()-started)/1000, memory:process.memoryUsage(),
      peakRssKiB:process.resourceUsage().maxRSS, saveBytes:Buffer.byteLength(save),
      delta:{ice:current.eis-previous.eis,waterRevenue:current.wasserErloes-previous.wasserErloes,
        wages:current.loehne-previous.loehne,replacements:current.ersatz-previous.ersatz}};
    checkpoints.push(result); previous=current;
    if(options.output) {
      fs.mkdirSync(options.output,{recursive:true});
      fs.writeFileSync(options.output+'/latest.save.json',save);
      fs.writeFileSync(options.output+'/progress.json',JSON.stringify({scenario:id,requestedDays:days,completedDay:day,complete:false,checkpoints},null,2)+'\n');
      if([180,365,730].includes(day)) fs.writeFileSync(options.output+'/day'+day+'.save.json',save);
    }
    if(day===365) mid=save;
    log({checkpoint:result});
  }
  let replay = null;
  if(days>365 && mid && options.verifyContinuation !== false) {
    const replayStarted=performance.now(), continued=w.load(options.output
      ? fs.readFileSync(options.output+'/day365.save.json','utf8') : mid);
    for(const {day:target} of checkpoints.filter(c=>c.day>365)) {
      w.advance(continued,target*1440-continued.tick);
      if(continued.kanon.politik.stilllegung) check(w,continued);
      else assert.deepEqual(W6.pruefen(w,continued),[]);
      const reference=checkpoints.find(c=>c.day===target);
      if(reference) assert.equal(w.hash(continued),reference.hash,'saved continuation checkpoint '+target);
      log({continuationDay:target,elapsedSeconds:(performance.now()-replayStarted)/1000});
    }
    assert.equal(w.canonical(continued),w.canonical(s),'exact saved continuation');
    replay={fromDay:365,toDay:days,hash:w.hash(continued),canonicalEqual:true,
      elapsedSeconds:(performance.now()-replayStarted)/1000};
  }
  const result={scenario:id,days,startDay,completedDay:s.tick/1440,checkpoints,replay,
    elapsedSeconds:(performance.now()-started)/1000,peakRssKiB:process.resourceUsage().maxRSS,ok:true};
  if(options.output) fs.writeFileSync(options.output+'/result.json',JSON.stringify(result,null,2)+'\n');
  log({result});return result;
}
module.exports = {reserve, check, snapshot, benchmark, run};
if (require.main === module) {
  const args=process.argv.slice(2).filter(arg=>arg!=='--no-continuation');
  if(args[0]==='benchmark') {
    const fs=require('node:fs'),{welt:w}=W6.start(W6.SZENARIEN[1].politik);
    console.log(JSON.stringify(args.slice(1).map(file=>benchmark(w,fs.readFileSync(file,'utf8')))));
  } else run(args[0] || 'S01', {days:Number(args[1] || 730),output:args[2],
    step:Number(args[3] || 30),resumeFile:args[4],
    verifyContinuation:!process.argv.includes('--no-continuation')});
}
