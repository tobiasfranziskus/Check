// B-K11b: Test-Only-Gegenprobe des B-K11a-D1-Abrechnungstakts.
// Ausführung echter Original-Core-Welten mit zusätzlicher testseitiger Variante.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('B-K11b: Ankunftsauszahlung bleibt finanz- und warenbilanziert sowie speicher- und replayfest', {timeout:180000},()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bk11b-'));
  const out=path.join(dir,'probe.json');
  try {
    const baseline='b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c';
    // Beide Audit-Smokes koennen bei flachem GitHub-Checkout parallel
    // denselben Commit nachladen; Git-Fetch-Locks nur in dieser Testhuelle
    // koordiniert erneut versuchen, niemals einen fehlenden Beleg uebergehen.
    const hatBaseline=()=>{
      try{execFileSync('git',['cat-file','-e',baseline+':index.html'],{stdio:'ignore'});return true;}
      catch{return false;}
    };
    for(let versuch=0;versuch<12&&!hatBaseline();versuch++){
      try{
        execFileSync('git',['fetch','--no-tags','--depth=1','origin',baseline],
          {stdio:'ignore',timeout:60000});
      } catch(err){
        if(versuch===11)throw err;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,150*(versuch+1));
      }
    }
    assert(hatBaseline(),'historischer main-Beleg vorhanden');
    execFileSync(process.execPath,[
      new URL('../tools/bk11-wirtschaft.mjs',import.meta.url).pathname,
      '--suite=standard','--seed=42','--days=1','--probe=arrival','--out='+out
    ],{encoding:'utf8',timeout:150000,maxBuffer:3e6});
    const data=JSON.parse(fs.readFileSync(out,'utf8'));
    assert.equal(data.results.length,3);
    assert.deepEqual(data.results.map(x=>x.mode),['product','candidate','candidate-arrival']);
    const [product,candidate,arrival]=data.results;
    for(const x of data.results){
      assert.equal(x.hours,24);
      assert.equal(x.roundtrips,2,'täglicher Save/Load auch in D1');
      assert.equal(x.unfundedNew,0);
      assert.equal(x.final.escrow>=0,true);
      assert.equal(x.timing.lockedDockMinutes<=x.timing.dockMinutes,true);
    }
    assert.equal(product.timing.lockedDockMinutes,0);
    assert.equal(arrival.timing.lockedDockMinutes<=candidate.timing.lockedDockMinutes,true,
      'Ankunft darf nicht mehr durch offene Abrechnung warten lassen');
    assert.notEqual(arrival.final.hash,undefined);
    // Von der Welt tatsächlich bezahlte Flugkosten / Original-Audit überprüft
    // der Lauf selbst stündlich. Ein einzelner Tag ist KEIN 90-Tage-Wirtschaftsgate.
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
