// B-K11c: analytische Kassenintervention nur im Node-Runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('B-K11c: A/B/C mit Geld-/Warenaudit, stündlichem Replay und Save/Load', {timeout:150000},()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bk11c-'));
  try {
    const rows=[];
    for(const mode of ['A','B','C']){
      const target=path.join(dir,mode+'.json');
      execFileSync(process.execPath,[new URL('../tools/bk11c-sparabfluss.mjs',import.meta.url).pathname,
        '--scenario=miner','--mode='+mode,'--days=1','--out='+target],
        {encoding:'utf8',timeout:100000,maxBuffer:2e6});
      const x=JSON.parse(fs.readFileSync(target,'utf8'));
      assert.equal(x.days,1);assert.equal(x.mode,mode);
      assert.equal(x.hourlyAudits,24);assert.equal(x.roundtrips,2);
      assert.equal(x.daily.length,1);assert.equal(x.final.day,1);
      assert.equal(x.final.hash,x.daily[0].hash);
      assert(Number.isSafeInteger(x.final.existingSupply)&&x.final.existingSupply>0);
      assert.equal(x.totalTransferred,x.cashBelege.reduce((a,b)=>a+b.amount,0));
      assert(x.cashBelege.every(e=>e.amount>0 && e.sourceBefore>=2000+e.amount));
      rows.push(x);
    }
    const [a,b,c]=rows;
    assert.equal(a.totalTransferred,0);assert.equal(a.transfers,0);
    assert(b.totalTransferred>0,'Gegenprobe muss tatsächlich Spielergeld zurückführen');
    assert(b.final.playerCash<=2000,'B belässt höchstens die Startkasse');
    assert(c.totalTransferred>0,'C muss tatsächlich teilweise zurückführen');
    assert(c.transferDefinition.includes('halber positiver'));
    assert(c.final.playerCash>=0,'Originalausgaben dürfen das Guthaben senken');
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
