// B-K11a: Beobachter darf den deterministischen Core nicht veraendern.
// Kleiner kontrollierter Smoke-Test; 13x90d im getrennten CI-Langlauf.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('B-K11a: 1-Tag-Original-Replay und ausschliesslich lesende Abrechnungstakt-Zaehler', {timeout:180000},()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bk11a-'));
  const out=path.join(dir,'timing.json');
  try {
    // ui-regression.yml checkt nur den PR-Head flach aus; der Wirtschaftslauf
    // verwendet fetch-depth:0. Fuer den kurzen Smoke-Test das gepinnte main
    // nur dann nachladen, wenn das Git-Objekt lokal wirklich fehlt.
    const baseline='b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c';
    try {
      execFileSync('git',['cat-file','-e',baseline+':index.html'],{stdio:'ignore'});
    } catch {
      execFileSync('git',['fetch','--no-tags','--depth=1','origin',baseline],
        {stdio:'ignore',timeout:60000});
    }
    execFileSync(process.execPath,[
      new URL('../tools/bk11-wirtschaft.mjs',import.meta.url).pathname,
      '--suite=standard','--seed=42','--days=1','--out='+out
    ],{encoding:'utf8',timeout:150000,maxBuffer:2e6});
    const data=JSON.parse(fs.readFileSync(out,'utf8'));
    assert.equal(data.results.length,3);
    const [product,candidate,noRescue]=data.results;
    for(const x of data.results){
      assert.equal(x.hours,24);
      assert.equal(x.roundtrips,2);
      assert.equal(x.unfundedNew,0);
      assert.equal(x.timing.blockedAttempts>=x.timing.blockedWithCash,true);
      assert.equal(x.timing.blockedAttempts>=x.timing.blockedWithCargo,true);
      assert.equal(x.timing.blockedWithCargo>=x.timing.blockedWithCashAndCargo,true);
      assert.equal(x.timing.dockMinutes>=x.timing.lockedDockMinutes,true);
      assert.equal(x.timing.lockedDockMinutes>=x.timing.lockedWithCargoMinutes,true);
      for(const k of ['blockedAttempts','blockedWithCash','blockedWithCargo',
          'blockedWithCashAndCargo','lockedDockMinutes','lockedWithCargoMinutes','dockMinutes'])
        assert.equal(Object.values(x.timing.byOwner).reduce((n,r)=>n+r[k],0),x.timing[k],k);
    }
    assert.equal(product.timing.lockedDockMinutes,0,'Produkt hat keine Vertragswartezeiten');
    assert.deepEqual(candidate.timing,noRescue.timing);
    assert.equal(candidate.final.hash,noRescue.final.hash,'Beobachtung veraendert keine Welt');
    assert(candidate.timing.lockedDockMinutes>0,'Original-D1-Kandidat wartet auf Stundenabschluss');
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
