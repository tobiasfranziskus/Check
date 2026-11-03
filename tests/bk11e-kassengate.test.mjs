import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('B-K11e: echte Core-Buchungen, Spotkosten und Zahlungsgaenge bleiben read-only', {timeout:150000},()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bk11e-'));
 try {
  for(const scenario of ['passive','miner','handel-flotte']){
   const output=path.join(dir,scenario+'.json');
   execFileSync(process.execPath,[new URL('../tools/bk11e-kassengate.mjs',import.meta.url).pathname,
     '--scenario='+scenario,'--seed=42','--days=1','--out='+output],
     {encoding:'utf8',timeout:120000,maxBuffer:2e6});
   const x=JSON.parse(fs.readFileSync(output,'utf8'));
   assert.equal(x.days,1);assert.equal(x.hourlyAudits,24);assert.equal(x.roundtrips,2);
   assert.equal(x.daysData[0].hash,x.originalFinalHash);
   assert.equal(Object.keys(x.byFactory).length,3);
   let starts=0;
   for(const f of Object.values(x.byFactory)){
     starts+=f.begun;
     assert(f.begun>=f.finished && f.begun<=f.finished+1);
     assert.equal(f.begun,f.negativeSpot+f.positiveSpot+f.zeroSpot);
     assert(f.negativeSpot>=0 && f.wageGateMissing>=0);
     assert(f.workingCapitalSpotMissing>=0 && f.workingCapitalSpotMissing<=f.begun);
     assert.equal(f.counterfactualWageCashFlow,
       f.factualIceFoodCashFlow-24*f.begun);
     assert(Number.isInteger(f.spotProfitSum),'Spotabstand je echtem Produktionsstart');
     assert(f.realFundTransfers>=0,'keine negative Geldumlagerung');
   }
   assert(starts>0,'Original-Nahrungsproduktion muss stattfinden');
  }
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
