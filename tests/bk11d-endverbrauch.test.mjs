// B-K11d: read-only Original-Core-Beleg. Keine gewählte Endkundenemission.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('B-K11d: genau echte verbrauchte Einheiten und paid purchases, keinerlei Endverbrauchsauszahlung', {timeout:180000},()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'bk11d-'));
  try{
    for(const scenario of ['passive','miner','handel-flotte']){
      const file=path.join(directory,scenario+'.json');
      execFileSync(process.execPath,[
        new URL('../tools/bk11d-endverbrauch.mjs',import.meta.url).pathname,
        '--scenario='+scenario,'--seed=42','--days=1','--out='+file
      ],{timeout:160000,maxBuffer:1e6,encoding:'utf8'});
      const result=JSON.parse(fs.readFileSync(file,'utf8'));
      assert.equal(result.days,1);assert.equal(result.hourAudits,24);
      assert.equal(result.saveLoads,2);
      assert.equal(result.daily.length,1);
      assert.equal(result.final.hash,result.daily[0].hash);
      assert(result.observedEvents>=24,'Verbrauch am echten Stundenabschluss');
      for(const good of ['nahrung','medikamente']){
        const a=result.bounds[good];
        assert(a.consumed>=0 && a.produced>=0);
        assert(a.guaranteedNewConsumptionLower>=0);
        assert(a.guaranteedNewConsumptionLower<=a.possibleNewConsumptionUpper);
        assert(a.possibleNewConsumptionUpper<=a.consumed);
        assert.equal(a.actualConsumerPayments,0,'Original-Endverbrauch zahlt nichts');
        assert(a.paidRealStationPurchases>=0,'separate bezahlte Warenankaeufe');
        const byStation=Object.values(result.byStation);
        assert.equal(byStation.reduce((n,x)=>n+x.consumed[good],0),a.consumed);
        assert.equal(byStation.reduce((n,x)=>n+x.produced[good],0),a.produced);
        assert.equal(byStation.reduce((n,x)=>n+x.deliveries[good],0),a.delivered);
      }
    }
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
