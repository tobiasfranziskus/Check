// Verdichtung der 19 gepaarten Gegenversuche. Keine Golden-Fixture, kein Balancing.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const input=process.argv[2]||'work/rueckfluss',out=process.argv[3]||'work/rueckfluss-summary.json';
const rows=fs.readdirSync(input).filter(f=>/^(baseline|miner|handel-flotte|station|jagd)-\d+(-ab90)?\.json$/.test(f)).map(f=>JSON.parse(fs.readFileSync(path.join(input,f),'utf8')));
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const expected=[...seeds.map(s=>'baseline/'+s+'/0'),'miner/42/0','handel-flotte/42/0','station/1234/0','jagd/98765/0','miner/42/90','station/1234/90'];
assert.deepEqual(rows.map(r=>[r.scenario,r.seed,r.switchDay].join('/')).sort(),expected.sort(),'Vollständige, duplikatfreie Fallmenge');
assert.equal(new Set(rows.map(r=>r.codeSha256)).size,1);assert.equal(new Set(rows.map(r=>r.toolSha256)).size,1);
const sum=a=>a.reduce((x,y)=>x+y,0),total=o=>sum(Object.values(o||{}));
for(const r of rows){
 assert.equal(r.days,365);assert.equal(r.audits,35040);assert.equal(r.hashComparisons,730);assert.equal(r.variants.length,2);
 assert.deepEqual(r.ruleDelta,{world:{npcAusgabenArten:{before:['trader','miner'],after:['trader','miner','player']}}});
 for(const v of r.variants)assert.deepEqual(v.points.map(p=>p.day),[30,90,180,365]);
 if(r.scenario==='baseline')assert.deepEqual(r.variants[0].points.map(p=>p.hash),r.variants[1].points.map(p=>p.hash));
}
function compactPoint(p){return {day:p.day,hash:p.hash,shortage:p.shortage,tradeOperations:p.tradeOperations,produced:p.produced,mined:p.mined,
 cash:p.cash,cashByKind:p.cashByKind,investment:p.investment,budget:p.budget,playerSurplus:p.playerSurplus,flows:p.flows,houseFlows:p.houseFlows,
 costs:p.costs,fleets:p.fleets,fleetHistory:p.fleetHistory,episodes:p.episodes,losses:p.losses,replacements:p.replacements,
 subsidy:p.subsidy,minted:p.minted,burned:p.burned,initialSupply:p.initialSupply,commandResults:p.commandResults,shortageByStation:p.shortageByStation,
 playerSweepCount:p.playerSweepCount,maxBeforePlayerSweep:p.maxBeforePlayerSweep,maxDuringCore:p.maxDuringCore,
 civilianLosses:sum(['npc1','npc2','npc3'].map(id=>total(p.losses[id]))),
 civilianReplacements:sum(['npc1','npc2','npc3'].map(id=>total(p.replacements[id]))),
 civilianUnpaid:sum(['npc1','npc2','npc3'].map(id=>p.costs[id]?.unpaid||0))};}
const postmortems=['postmortem-miner.json','postmortem-station.json'].map(f=>JSON.parse(fs.readFileSync(path.join(input,f),'utf8')));
for(const p of postmortems)assert.equal(p.hash,rows.find(r=>r.scenario===p.scenario&&r.seed===p.seed&&r.switchDay===90).variants[1].points.at(-1).hash);
const result={seeds,postmortems,kind:'ANALYSE: isolierter Owner-Filter, keine Produktfreigabe',baseCommit:rows[0].baseCommit,diagnosisCommit:rows[0].diagnosisCommit,
 sourceCommits:[...new Set(rows.map(r=>r.sourceCommit))],codeSha256:rows[0].codeSha256,toolSha256:rows[0].toolSha256,
 cases:rows.map(r=>({...Object.fromEntries(['seed','scenario','switchDay','days','ruleDelta','audits','hashComparisons','referenceChecks','node','runtime','tape'].map(k=>[k,r[k]])),
 variants:r.variants.map(v=>({...Object.fromEntries(['label','budget','episodes','commandResults','lastTradeTick','lastProductionTick','lastMiningTick','firstDifferenceTick','firstTradeAfterSwitch','firstProductionAfterSwitch','firstMiningAfterSwitch'].map(k=>[k,v[k]])),points:v.points.map(compactPoint)}))})),
 audits:sum(rows.map(r=>r.audits)),dailyReplayHashes:sum(rows.map(r=>r.hashComparisons)),referenceChecks:sum(rows.map(r=>r.referenceChecks))};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result)+'\n');
console.log('REFLUX_SUMMARY '+JSON.stringify({cases:rows.length,audits:result.audits,dailyReplayHashes:result.dailyReplayHashes,referenceChecks:result.referenceChecks,bytes:fs.statSync(out).size}));
