// Verdichtet Diagnose + vier isolierte Eingriffe und Kontrolle, keine neue Golden-Fixture.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {variants} from './npc-restart-v12-variants.mjs';
const dir=process.argv[2]||'work/npc-restart',out=process.argv[3]||'work/npc-restart-summary.json';
const cases=[['miner',42],['handel-flotte',42],['station',1234],['jagd',98765]],sum=a=>a.reduce((x,y)=>x+y,0);
const starts=cases.map(([scenario,seed])=>JSON.parse(fs.readFileSync(path.join(dir,'start-'+scenario+'-'+seed+'.json'),'utf8')));
const rows=cases.flatMap(([scenario,seed])=>variants.map(v=>JSON.parse(fs.readFileSync(path.join(dir,scenario+'-'+seed+'-'+v+'.json'),'utf8'))));
assert.equal(new Set(rows.map(r=>r.toolSha256)).size,1);assert.equal(new Set(rows.map(r=>r.codeSha256)).size,1);
for(const r of rows){
 assert.equal(r.audits,13200);assert.equal(r.dailyHashComparisons,275);assert.equal(r.days,365);assert.equal(r.startDay,90);
 assert.equal(r.saveLoadRoundtrips,12);assert.equal(r.points.length,6);
 for(const p of r.points)assert.equal(p.abgabePlayer,0);
 for(const p of r.shipPurchases){assert(p.value>0&&p.fee>=0&&p.cashAfter>=0);assert.equal(p.stockBefore-p.stockAfter,1);}
}
const compact=p=>({day:p.day,tick:p.tick,hash:p.hash,short:p.short,cash:p.cash,cashByKind:p.cashByKind,fleets:p.fleets,
 werftStock:p.werftStock,stocks:p.stocks,price:p.price,fee:p.fee,totalPrice:p.totalPrice,subsidyGap:p.subsidyGap,poolGap:p.poolGap,
 productionLines:p.productionLines.filter(l=>['r_frachter','r_bauteil'].includes(l.recipe)),ledger:p.ledger,fleet:p.fleet,
 paidReplacements:p.shipPurchases.length,npcTrades:p.npcTrades,production:p.ledgerProduction,costs:p.costs,flows:p.flows,
 stats:{handel:p.stats.handel,verluste:p.stats.verluste,indienst:p.stats.indienst,zuschuss:p.stats.zuschuss,kopfgeld:p.stats.kopfgeld,abgabeHouse:p.stats.abgabe.house||0}});
const result={status:'ANALYSE/DRAFT, nur isolierte Fonds-/Zuschussversuche, keine Spielerabgabe',baseCommit:rows[0].baseCommit,diagnosisCommit:rows[0].diagnosisCommit,
 codeSha256:rows[0].codeSha256,toolSha256:rows[0].toolSha256,sourceCommits:[...new Set(rows.map(r=>r.sourceCommit))],variants,
 cases:starts.map(s=>({scenario:s.scenario,seed:s.seed,start:s.diagnosis,flowsBefore90:s.flowsBefore90,costsBefore90:s.costsBefore90,tape:s.tape,
  results:rows.filter(r=>r.scenario===s.scenario&&r.seed===s.seed).map(r=>({variant:r.variant,variantSha256:r.variantSha256,node:r.node,audits:r.audits,
   dailyHashComparisons:r.dailyHashComparisons,saveLoadRoundtrips:r.saveLoadRoundtrips,points:r.points.map(compact),fleet:r.fleet,
   shipPurchases:r.shipPurchases,npcTrades:r.npcTrades,lossesAfter90:r.lossesAfter90,lastNpcTradeTick:r.lastNpcTradeTick,longestNoTradeHours:r.longestNoTradeHours,runtime:r.runtime}))})),
 verification:{prefixAudits:sum(starts.map(s=>s.audits)),continuationAudits:sum(rows.map(r=>r.audits)),dailyReplayHashes:starts.length*90+sum(rows.map(r=>r.dailyHashComparisons)),
 saveLoadRoundtripsAfter90:sum(rows.map(r=>r.saveLoadRoundtrips)),unchangedControlReferenceHashes:starts.length+rows.filter(r=>r.variant==='control').length*2}};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result)+'\n');
console.log('RESTART_SUMMARY '+JSON.stringify({cases:starts.length,continuations:rows.length,...result.verification,bytes:fs.statSync(out).size}));
