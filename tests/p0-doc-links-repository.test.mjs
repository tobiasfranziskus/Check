import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checker = path.join(repoRoot, 'tools', 'check-doc-links.cjs');

test('P0: default CLI checks all three real repository documents without broken local targets', () => {
  const run = spawnSync(process.execPath, [checker], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 15000,
  });
  assert.equal(run.error, undefined, String(run.error));
  assert.equal(run.status, 0, `Linkprüfung schlug fehl:\n${run.stderr}\n${run.stdout}`);
  assert.match(run.stdout, /Dokumentations-Linkprüfung: 3 Dateien, \d+ lokale Ziele, 0 Fehler/);
});
