// Einmalige Prüfung des archivierten Standalone-Langlaufs; danach wieder entfernen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
test('Archivierter 13-Seed-Simulator reproduziert unabhängig alle Referenzen',()=>{
 const p=spawnSync(process.execPath,[new URL('../tools/freeflight-simulation.mjs',import.meta.url).pathname],
  {encoding:'utf8',maxBuffer:8*1024*1024,timeout:180000});
 assert.equal(p.status,0,(p.stderr||'')+'\n'+(p.stdout||''));
 assert.match(p.stdout,/V12_SUMMARY/);
});
