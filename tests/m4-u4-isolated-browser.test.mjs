import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const launcher = path.join(root, 'tools', 'm4-u4-isolated-browser.cjs');

test('M4-U4 selftest records wall time but never certifies interactive gameplay', { skip: process.platform === 'win32' }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'aphros-u4-test-'));
  try {
    const fakeChrome = path.join(temp, 'fake-chromium');
    const out = path.join(temp, 'evidence');
    fs.writeFileSync(fakeChrome, '#!/bin/sh\nsleep 1\n', { mode: 0o755 });
    const result = spawnSync(process.execPath, [launcher, '--selftest'], {
      encoding: 'utf8', timeout: 6000,
      env: { ...process.env, CHROME_BIN: fakeChrome, M4_U4_SELFTEST_SECONDS: '0.2',
        M4_U4_SELFTEST_OUTPUT: out },
    });
    assert.equal(result.status, 0, result.stderr);
    const reports = fs.readdirSync(out);
    assert.equal(reports.length, 1);
    const data = JSON.parse(fs.readFileSync(path.join(out, reports[0]), 'utf8'));
    assert.equal(data.selftest, true);
    assert.equal(data.acceptance, 'NOT_ESTABLISHED');
    assert.equal(data.user_actions_verified, false);
    assert.equal(data.page_loaded_verified, false);
    assert.equal(data.gameplay_and_scoring_verified, false);
    assert.equal(data.required_seconds, 3600);
    assert.ok(data.elapsed_real_seconds >= 0.2);
    assert.ok(data.elapsed_real_seconds < 5);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('M4-U4 rejects invalid selftest duration before launching a browser', () => {
  const result = spawnSync(process.execPath, [launcher, '--selftest'], {
    encoding: 'utf8', timeout: 3000,
    env: { ...process.env, M4_U4_SELFTEST_SECONDS: '999' },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Selftest duration/);
});
