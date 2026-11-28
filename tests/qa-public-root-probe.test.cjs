'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { assetPath, identifyDeployment, targetSha, validatePurchase, validateSave, verifyBytes, verifyRelease } =
  require('../scripts/qa-public-root-probe.cjs');
const { erstellen } = require('../prototypes/verbund/konzern-session.js');

const sha = '0'.repeat(40);
const other = '1'.repeat(40);
const repo = 'tobiasfranziskus/Check';
const root = 'https://tobiasfranziskus.github.io/Check/';
const jobUrl = `https://github.com/${repo}/actions/runs/12/job/13`;

function original() {
  return {
    ref: { ref: 'refs/heads/main', object: { sha } },
    deployment: { sha, id: 10, ref: 'main', environment: 'github-pages',
      performed_via_github_app: { id: 34598, slug: 'github-pages' } },
    run: { id: 12, workflow_id: 400362250, run_attempt: 1, head_branch: 'main', head_sha: sha,
      path: 'dynamic/pages/pages-build-deployment', event: 'dynamic', status: 'completed',
      conclusion: 'success', repository: { id: 1438125521 }, head_repository: { id: 1438125521 } },
    status: { id: 11, environment: 'github-pages', state: 'success', log_url: jobUrl, environment_url: root },
    job: { id: 13, run_id: 12, run_attempt: 1, name: 'deploy', head_sha: sha, status: 'completed',
      conclusion: 'success' }
  };
}

const get = data => async path => {
  const values = {
    '/git/ref/heads/main': data.ref,
    '/deployments?environment=github-pages&per_page=1': [data.deployment],
    '/actions/workflows/400362250/runs?branch=main&per_page=1': { workflow_runs: [data.run] },
    '/deployments/10/statuses?per_page=1': [data.status],
    '/actions/jobs/13': data.job
  };
  assert.ok(Object.hasOwn(values, path), path);
  return values[path];
};

test('automatic and manual triggers pin the trusted main checkout', () => {
  const env = { GITHUB_REPOSITORY: repo, GITHUB_REF: 'refs/heads/main', GITHUB_SHA: sha };
  for (const trigger of ['push', 'schedule', 'workflow_dispatch']) {
    assert.equal(targetSha({ ...env, GITHUB_EVENT_NAME: trigger }, sha), sha);
  }
  assert.equal(targetSha({ ...env, GITHUB_EVENT_NAME: 'workflow_dispatch', PAGES_EXPECT_SHA: sha }, sha), sha);
  assert.throws(() => targetSha({ ...env, GITHUB_EVENT_NAME: 'pull_request' }, sha), { result: 'UNKNOWN' });
  assert.throws(() => targetSha({ ...env, GITHUB_EVENT_NAME: 'push', GITHUB_REPOSITORY: 'fork/Check' }, sha),
    { result: 'UNKNOWN' });
  assert.throws(() => targetSha({ ...env, GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/research' }, sha),
    { result: 'UNKNOWN' });
  assert.throws(() => targetSha({ ...env, GITHUB_EVENT_NAME: 'push' }, other), { result: 'STALE' });
  assert.throws(() => targetSha({ ...env, GITHUB_EVENT_NAME: 'workflow_dispatch', PAGES_EXPECT_SHA: other }, sha),
    { result: 'STALE' });
});

test('one exact Pages-app deployment, latest attempt and deploy job are joined', async () => {
  assert.deepEqual(await identifyDeployment(get(original()), sha), {
    sha, deploymentId: 10, statusId: 11, runId: 12, runAttempt: 1, jobId: 13, jobUrl
  });
});

for (const [name, entity, patch, result] of [
  ['main moves', 'ref', { object: { sha: other } }, 'STALE'],
  ['other deployed SHA', 'deployment', { sha: other }, 'PENDING'],
  ['missing deployment status', 'status', { id: null }, 'UNKNOWN'],
  ['other deployment ref', 'deployment', { ref: 'feature' }, 'UNKNOWN'],
  ['other environment', 'deployment', { environment: 'preview' }, 'UNKNOWN'],
  ['untrusted deployment creator', 'deployment', { performed_via_github_app: null }, 'UNKNOWN'],
  ['foreign head repository', 'run', { head_repository: { id: 99 } }, 'UNKNOWN'],
  ['wrong branch in Actions', 'run', { head_branch: 'fork' }, 'UNKNOWN'],
  ['unexpected workflow event', 'run', { event: 'pull_request' }, 'UNKNOWN'],
  ['failed run', 'run', { conclusion: 'failure' }, 'FAIL'],
  ['in-progress run', 'run', { status: 'in_progress', conclusion: null }, 'PENDING'],
  ['failed deploy status', 'status', { state: 'failure' }, 'FAIL'],
  ['foreign deployment origin', 'status', { environment_url: 'https://example.org/' }, 'OVERLAP'],
  ['unrelated status job link', 'status', { log_url: jobUrl.replace('/12/', '/2/') }, 'OVERLAP'],
  ['previous attempt', 'job', { run_attempt: 2 }, 'OVERLAP'],
  ['incorrect job SHA', 'job', { head_sha: other }, 'OVERLAP']
]) {
  test(name, async () => {
    const data = original();
    Object.assign(data[entity], patch);
    await assert.rejects(identifyDeployment(get(data), sha), { result });
  });
}

test('HTTP origin, canonical paths, status and same bytes are mandatory', () => {
  const bytes = Buffer.from('owned');
  assert.equal(assetPath(root), 'index.html');
  assert.equal(assetPath(root + 'test.js?qa=version'), 'test.js');
  assert.throws(() => assetPath('https://example.org/Check/test.js'), { result: 'FAIL' });
  assert.throws(() => assetPath(root + '../other.txt'), { result: 'FAIL' });
  assert.throws(() => assetPath(root + '%2Fother.txt'), { result: 'FAIL' });
  assert.match(verifyBytes('test.js', 200, bytes, bytes), /^[a-f0-9]{64}$/);
  assert.throws(() => verifyBytes('test.js', 302, bytes, bytes), { result: 'FAIL' });
  assert.throws(() => verifyBytes('test.js', 200, bytes, Buffer.from('other')), { result: 'CDN' });
});

const save = (paid = true) => ({
  schema: 8, rulesVersion: 208, owners: { house: { cash: paid ? 2400 : 3000 },
    seller: { cash: paid ? 30600 : 30000 } }, minted: 0, burned: 0,
  ships: { sh1: { owner: paid ? 'house' : 'seller', klasse: 'miner' } }
});

test('fresh career and purchase require usable saves, real payment and house ownership', () => {
  assert.equal(validateSave(JSON.stringify(save(false)), false).owners.house.cash, 3000);
  assert.equal(validateSave(JSON.stringify(save()), true).ships.sh1.owner, 'house');
  for (const patch of [{ rulesVersion: 209 }, { schema: 9 }, { ships: {} }, { ships: 'invalid' }, { burned: 1 },
    { ships: { sh1: { owner: 'guest', klasse: 'miner' } } }, { minted: undefined },
    { owners: { house: { cash: 3000 }, seller: { cash: 30000 } } },
    { owners: { house: { cash: 2400 }, seller: { cash: 30000 } } }]) {
    assert.throws(() => validateSave(JSON.stringify({ ...save(), ...patch }), true));
  }
  assert.throws(() => validateSave(null, true));
  assert.throws(() => validateSave('{not-json}', false));
});

function rule208Purchase() {
  const session = erstellen();
  session.starten208(true);
  const before = session.exportieren();
  const purchase = session.ausfuehren('buy-st_aldera-miner');
  assert.equal(purchase.ok, true, purchase.reason);
  assert.equal(purchase.type, 'shipBuy');
  return { before, after: session.exportieren() };
}

test('the standard Rule208 session books an Aldera miner purchase end to end', () => {
  const { before, after } = rule208Purchase();
  const result = validatePurchase(before, after);
  assert.deepEqual({ rule: result.rule, cash: result.cash, worldCash: result.worldCash,
    minted: result.minted, burned: result.burned },
  { rule: 208, cash: 2400, worldCash: 33000, minted: 0, burned: 0 });
  assert.match(result.minerId, /^sh[0-9]+$/);
  assert.equal(result.purchase.seller, 'werft_extern');
  assert.equal(result.purchase.buyerDebit, 600);
  assert.equal(result.purchase.sellerCredit, 600);
  assert.equal(result.purchase.stockBefore - result.purchase.stockAfter, 1);
  assert.equal(result.purchase.consumedAfter - result.purchase.consumedBefore, 1);
});

for (const [name, change, reason] of [
  ['a different payment recipient with unchanged world cash', (after, before) => {
    after.owners.werft_extern.cash = before.owners.werft_extern.cash;
    after.owners.export.cash += 600;
  }, /Gutschrift Werftkonto/],
  ['an unbooked stock removal', (after, before) => {
    after.stations.st_aldera.lager.miner = before.stations.st_aldera.lager.miner;
  }, /Aldera-Minerbestand/],
  ['an unbooked ledger consumption', (after, before) => {
    after.ledger.miner.consumed = before.ledger.miner.consumed;
  }, /Miner-Ledger/],
  ['an inconsistent new hull ID', (after, before, id) => {
    after.ships[id].id = Object.keys(before.ships)[0];
  }, /Neue Miner-ID/],
  ['an additional hull', (after, before, id) => {
    after.ships.sh999 = { ...after.ships[id], id: 'sh999', owner: 'werft_extern' };
  }, /Genau eine neue Hülle/],
  ['a pre-existing hull passed off as a new house miner', (after, before, id) => {
    const existingId = Object.keys(before.ships)[0];
    after.ships[existingId] = { ...after.ships[id], id: existingId };
    after.ships[id].owner = 'werft_extern';
  }, /Neue Hülle gehört nicht der Hausflotte/],
  ['a changed pre-existing hull', (after, before) => {
    after.ships[Object.keys(before.ships)[0]].heimat = 'changed';
  }, /Übrige Schiffe/],
  ['an unrelated transfer with unchanged world cash', after => {
    after.owners.export.cash -= 1;
    after.owners.npc3.cash += 1;
  }, /Übrige Konten/],
  ['a simulation step between snapshots', after => {
    after.tick += 1;
  }, /Kauf ohne Zeitschritt/]
]) {
  test(`purchase evidence rejects ${name}`, () => {
    const { before, after } = rule208Purchase();
    const initial = JSON.parse(before);
    const changed = JSON.parse(after);
    const id = Object.keys(changed.ships).find(shipId => !Object.hasOwn(initial.ships, shipId));
    change(changed, initial, id);
    assert.throws(() => validatePurchase(before, JSON.stringify(changed)), reason);
  });
}

test('bounded publication polling and CDN retry happen before final attestation', async () => {
  let checks = 0;
  let calls = 0;
  let waits = 0;
  const identify = async () => {
    if (++checks === 1) throw Object.assign(Error('pending'), { result: 'PENDING' });
    return { sha, deploymentId: 10, runAttempt: 1 };
  };
  const smoke = async () => {
    if (++calls === 1) verifyBytes('test.js', 200, Buffer.from('old'), Buffer.from('new'));
    return { cash: 2400 };
  };
  const result = {};
  await verifyRelease(null, sha, result, { identify, smoke, wait: async () => { waits++; } });
  assert.deepEqual([checks, calls, waits, result.browser.cash], [4, 2, 2, 2400]);
});

test('concurrent publication, bounded pending and missing final metadata prevent PASS', async () => {
  for (const field of ['deploymentId', 'statusId', 'runId', 'runAttempt', 'jobId']) {
    let checks = 0;
    const identify = async () => ({ sha, [field]: ++checks });
    await assert.rejects(verifyRelease(null, sha, {}, { identify, smoke: async () => ({}) }),
      { result: 'OVERLAP' });
  }
  let polls = 0;
  await assert.rejects(verifyRelease(null, sha, {}, {
    identify: async () => { polls++; throw Object.assign(Error(), { result: 'PENDING' }); },
    smoke: async () => assert.fail('must wait for a deploy'), polls: 2, wait: async () => {}
  }), { result: 'PENDING' });
  assert.equal(polls, 2);
  let checks = 0;
  await assert.rejects(verifyRelease(null, sha, {}, {
    identify: async () => {
      if (++checks === 1) return { sha };
      throw Object.assign(Error(), { result: 'UNKNOWN' });
    }, smoke: async () => ({})
  }), { result: 'UNKNOWN' });
});

test('a Pages rerun still pending after the browser invalidates the proof', async () => {
  let checks = 0;
  const identify = async () => {
    if (++checks === 1) return { sha, runId: 12 };
    throw Object.assign(Error(), { result: 'PENDING' });
  };
  await assert.rejects(verifyRelease(null, sha, {}, { identify, smoke: async () => ({}) }),
    { result: 'OVERLAP' });
});
