'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { appendFileSync } = require('node:fs');
const { setTimeout: delay } = require('node:timers/promises');

const REPO = 'tobiasfranziskus/Check';
const REPO_ID = 1438125521;
const MAIN = 'refs/heads/main';
const ROOT = new URL('https://tobiasfranziskus.github.io/Check/');
const CAREER = new URL('prototypes/spiel/index.html', ROOT);
const PAGES_WORKFLOW_ID = 400362250;
const PAGES_APP_ID = 34598;
const PAGES_PATH = 'dynamic/pages/pages-build-deployment';
// Update these expectations only when the approved public standard career changes.
const RULE = 208;
const SCHEMA = 8;
const WORLD_CASH = 33000;
const INITIAL_CASH = 3000;
const MINER_PRICE = 600;
const SLOT = `aphros-void:spielerkarriere:regel${RULE}:v1`;

class ProbeError extends Error {
  constructor(result, message) {
    super(message);
    this.result = result;
  }
}

const isSha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const isId = value => Number.isSafeInteger(value) && value > 0;

function targetSha(env, checkout) {
  if (env.GITHUB_REPOSITORY !== REPO || env.GITHUB_REF !== MAIN ||
      !['push', 'schedule', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME)) {
    throw new ProbeError('UNKNOWN', 'Unzulässiges Repository, Ref oder Ereignis');
  }
  if (!isSha(checkout) || env.GITHUB_SHA !== checkout) {
    throw new ProbeError('STALE', 'Workflow-SHA und Checkout stimmen nicht überein');
  }
  if (env.PAGES_EXPECT_SHA && (env.GITHUB_EVENT_NAME !== 'workflow_dispatch' ||
      !isSha(env.PAGES_EXPECT_SHA) || env.PAGES_EXPECT_SHA !== checkout)) {
    throw new ProbeError('STALE', 'Expliziter SHA stimmt nicht mit dem main-Checkout überein');
  }
  return checkout;
}

function completed(record, field, label) {
  if (record[field] === 'success') return;
  if (['queued', 'pending', 'waiting', 'in_progress', 'requested'].includes(record[field])) {
    throw new ProbeError('PENDING', `${label} läuft noch`);
  }
  if (['failure', 'error', 'cancelled', 'timed_out', 'action_required', 'skipped', 'neutral',
    'stale', 'inactive', 'startup_failure'].includes(record[field])) {
    throw new ProbeError('FAIL', `${label}: ${record[field]}`);
  }
  throw new ProbeError('UNKNOWN', `${label}: kein eindeutiger Erfolg`);
}

async function identifyDeployment(get, sha, evidence = {}) {
  const [ref, deployments, runs] = await Promise.all([
    get('/git/ref/heads/main'),
    get('/deployments?environment=github-pages&per_page=1'),
    get(`/actions/workflows/${PAGES_WORKFLOW_ID}/runs?branch=main&per_page=1`)
  ]);
  if (ref?.ref !== MAIN || !isSha(ref.object?.sha)) {
    throw new ProbeError('UNKNOWN', 'main-Ref nicht verifizierbar');
  }
  if (ref.object.sha !== sha) throw new ProbeError('STALE', 'main wurde inzwischen ersetzt');
  const deployment = deployments?.[0];
  const run = runs?.workflow_runs?.[0];
  if (!Array.isArray(deployments) || !Array.isArray(runs?.workflow_runs)) {
    throw new ProbeError('UNKNOWN', 'Unvollständige Deployment- oder Actions-Antwort');
  }
  evidence.latestDeploymentId = isId(deployment?.id) ? deployment.id : null;
  evidence.latestRunId = isId(run?.id) ? run.id : null;
  if (run?.head_sha !== sha) {
    throw new ProbeError('PENDING', 'Pages-Systemlauf für den erwarteten SHA fehlt');
  }
  if (!isId(run.id) || !isId(run.run_attempt) || run.workflow_id !== PAGES_WORKFLOW_ID ||
      run.head_branch !== 'main' || run.path !== PAGES_PATH || run.event !== 'dynamic' ||
      run.repository?.id !== REPO_ID || run.head_repository?.id !== REPO_ID) {
    throw new ProbeError('UNKNOWN', 'Pages-Systemlauf passt nicht zum eigenen main');
  }
  if (run.status === 'completed') completed(run, 'conclusion', 'Pages-Systemlauf');
  else completed(run, 'status', 'Pages-Systemlauf');
  if (run.status !== 'completed') throw new ProbeError('UNKNOWN', 'Ungültiger Zustand des Pages-Laufs');
  if (deployment?.sha !== sha) {
    throw new ProbeError('PENDING', 'Neuestes github-pages-Deployment gehört noch nicht zum erwarteten SHA');
  }
  if (!isId(deployment.id) || deployment.ref !== 'main' || deployment.environment !== 'github-pages' ||
      deployment.performed_via_github_app?.id !== PAGES_APP_ID ||
      deployment.performed_via_github_app?.slug !== 'github-pages') {
    throw new ProbeError('UNKNOWN', 'Deployment stammt nicht von GitHub Pages für main');
  }

  const statuses = await get(`/deployments/${deployment.id}/statuses?per_page=1`);
  const status = Array.isArray(statuses) && statuses[0];
  if (!isId(status?.id) || status.environment !== 'github-pages') {
    throw new ProbeError('UNKNOWN', 'Letzter Pages-Deploymentstatus fehlt');
  }
  evidence.statusId = status.id;
  completed(status, 'state', 'Pages-Deploymentstatus');
  const runUrl = `https://github.com/${REPO}/actions/runs/${run.id}`;
  const jobId = Number(status.log_url?.slice(`${runUrl}/job/`.length));
  if (!isId(jobId) || status.log_url !== `${runUrl}/job/${jobId}` ||
      status.environment_url !== ROOT.href) {
    throw new ProbeError('OVERLAP', 'Deploymentstatus gehört nicht zum neuesten Pages-Lauf oder Root');
  }
  const job = await get(`/actions/jobs/${jobId}`);
  if (job?.id !== jobId || job.run_id !== run.id || job.run_attempt !== run.run_attempt ||
      job.head_sha !== sha || job.name !== 'deploy' || job.status !== 'completed' ||
      job.conclusion !== 'success') {
    throw new ProbeError('OVERLAP', 'Deploy-Job passt nicht zum neuesten erfolgreichen Laufversuch');
  }
  return { sha, deploymentId: deployment.id, statusId: status.id, runId: run.id,
    runAttempt: run.run_attempt, jobId, jobUrl: status.log_url };
}

function assertSameDeployment(before, after) {
  for (const key of ['sha', 'deploymentId', 'statusId', 'runId', 'runAttempt', 'jobId']) {
    if (before[key] !== after[key]) {
      throw new ProbeError('OVERLAP', 'Pages-Deployment oder Laufversuch hat sich während der Probe geändert');
    }
  }
}

function assetPath(address) {
  const url = new URL(address);
  const path = url.pathname.slice(ROOT.pathname.length);
  if (url.origin !== ROOT.origin || url.username || url.password ||
      !url.pathname.startsWith(ROOT.pathname) ||
      (path && !path.split('/').every(part => /^[a-z0-9_.-]+$/i.test(part) && part !== '.' && part !== '..'))) {
    throw new ProbeError('FAIL', 'HTTP-Anfrage außerhalb des kanonischen Pages-Pfads');
  }
  return path || 'index.html';
}

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function verifyBytes(path, status, publicBytes, ownBytes) {
  if (status !== 200) {
    throw new ProbeError([404, 429, 500, 502, 503, 504].includes(status) ? 'CDN' : 'FAIL',
      `HTTP ${status}: ${path}`);
  }
  const hash = digest(publicBytes);
  if (hash !== digest(ownBytes)) throw new ProbeError('CDN', `SHA256-Abweichung: ${path}`);
  return hash;
}

function validateSave(json, paid) {
  assert.ok(typeof json === 'string' && json.length > 0, 'Sichtbarer Spielpfad hat keinen Save geschrieben');
  const save = JSON.parse(json);
  assert.equal(save.schema, SCHEMA, 'Save-Schema');
  assert.equal(save.rulesVersion, RULE, 'Regel der öffentlichen Standardkarriere');
  assert.equal(save.owners?.house?.cash, INITIAL_CASH - (paid ? MINER_PRICE : 0), 'Hauskasse');
  const cash = Object.values(save.owners).map(owner => owner.cash);
  assert.ok(cash.every(value => Number.isSafeInteger(value) && value >= 0), 'Ungültige Eigentümerkasse');
  assert.equal(cash.reduce((total, amount) => total + amount, 0), WORLD_CASH, 'Weltgeld');
  assert.equal(save.minted, 0, 'Mint');
  assert.equal(save.burned, 0, 'Burn');
  assert.ok(save.ships && typeof save.ships === 'object' && !Array.isArray(save.ships), 'Schiffseigentum fehlt');
  const fleet = Object.entries(save.ships).filter(([, ship]) => ship.owner === 'house');
  assert.equal(fleet.length, paid ? 1 : 0, 'Anzahl eigener Schiffe');
  if (paid) assert.equal(fleet[0][1].klasse, 'miner', 'Eigenes Bergbauschiff');
  return { rule: save.rulesVersion, cash: save.owners.house.cash, worldCash: WORLD_CASH,
    minted: save.minted, burned: save.burned, minerId: fleet[0]?.[0] };
}

function githubApi(token) {
  return async path => {
    try {
      const response = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
        redirect: 'error',
        cache: 'no-store',
        headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
          'Cache-Control': 'no-cache', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new ProbeError('UNKNOWN', `GitHub-Metadaten ${path}: ${error.message}`);
    }
  };
}

async function browserSmoke(sha) {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch();
  const files = new Map();
  const problems = [];
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1180, height: 820 },
      hasTouch: true, serviceWorkers: 'block' });
    // Verify the actual HTTPS response that Chromium consumes, including on-demand resources.
    // Fetch without redirects and pass the verified HTTP status, headers and body to Chromium.
    await context.route('**/*', async route => {
      try {
        const request = route.request();
        assert.equal(request.method(), 'GET', 'Nur lesende Requests sind zulässig');
        const path = assetPath(request.url());
        if (request.redirectedFrom()) throw new ProbeError('FAIL', 'Unerwartete HTTP-Weiterleitung');
        const ownBytes = execFileSync('git', ['show', `${sha}:${path}`],
          { maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
        const url = new URL(request.url());
        url.searchParams.set('qa', sha);
        const response = await fetch(url, {
          redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(15000),
          headers: { 'cache-control': 'no-cache', accept: request.headers().accept || '*/*' }
        }).catch(() => { throw new ProbeError('CDN', `HTTP-Abruf fehlgeschlagen: ${path}`); });
        if (response.status !== 200) await response.body?.cancel();
        const publicBytes = response.status === 200 ? Buffer.from(await response.arrayBuffer()) : Buffer.alloc(0);
        const hash = verifyBytes(path, response.status, publicBytes, ownBytes);
        const headers = Object.fromEntries(response.headers);
        // Fetch already decoded the transport encoding.
        delete headers['content-encoding'];
        delete headers['content-length'];
        delete headers['transfer-encoding'];
        files.set(path, hash);
        await route.fulfill({ status: response.status, headers, body: publicBytes });
      } catch (error) {
        problems.push(error);
        await route.abort();
      }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(ROOT.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForURL(CAREER.href);
    assert.ok(files.has('index.html') && files.has('prototypes/spiel/index.html'), 'Root und Karriere-HTML fehlen');
    const dependencies = await page.locator('script[src],link[rel~="stylesheet"][href]')
      .evaluateAll(elements => elements.map(element => element.src || element.href));
    for (const url of dependencies) {
      assert.ok(files.has(assetPath(url)), 'Statische Abhängigkeit wurde nicht bytegeprüft');
    }
    const read = () => page.evaluate(key => localStorage.getItem(key), SLOT);
    assert.equal(await read(), null, 'Karriereslot ist vor Neustart belegt');
    await page.locator('#karriere-direkt').tap();
    await page.locator('#spielwelt').waitFor({ state: 'visible' });
    validateSave(await read(), false);
    await page.locator('#tab-jaeger').tap();
    await page.locator('[data-j13-action="buy-st_aldera-miner"]').tap();
    const paid = validateSave(await read(), true);
    if (problems.length) throw problems[0];
    assert.deepEqual(errors, [], 'Browserfehler im öffentlichen Startpfad');
    return { ...paid, files: Object.fromEntries([...files].sort()) };
  } catch (error) {
    throw problems.find(problem => problem.result !== 'CDN') || problems[0] || error;
  } finally {
    await browser.close();
  }
}

async function verifyRelease(get, sha, evidence, options = {}) {
  const { identify = identifyDeployment, smoke = browserSmoke, wait = delay,
    polls = 25, attempts = 3 } = options;
  let deployment;
  for (let poll = 1; ; poll++) {
    try {
      deployment = await identify(get, sha, evidence);
      break;
    } catch (error) {
      if (error.result !== 'PENDING' || poll === polls) throw error;
      await wait(15000);
    }
  }
  evidence.deployment = deployment;
  const recheck = async () => {
    let current;
    try {
      current = await identify(get, sha, evidence);
    } catch (error) {
      if (error.result === 'PENDING') {
        throw new ProbeError('OVERLAP', 'Pages-Deployment ist seit Beginn der Probe wieder in Arbeit');
      }
      throw error;
    }
    assertSameDeployment(deployment, current);
  };
  for (let attempt = 1; ; attempt++) {
    if (attempt > 1) await recheck();
    try {
      evidence.browser = await smoke(sha);
      break;
    } catch (error) {
      if (error.result !== 'CDN' || attempt === attempts) throw error;
      await wait(15000);
    }
  }
  await recheck();
}

async function main() {
  const evidence = { trigger: process.env.GITHUB_EVENT_NAME, probeRunId: process.env.GITHUB_RUN_ID };
  try {
    const checkout = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    evidence.sha = targetSha(process.env, checkout);
    const get = githubApi(process.env.GH_TOKEN);
    delete process.env.GH_TOKEN;
    await verifyRelease(get, evidence.sha, evidence);
    evidence.result = 'PASS';
  } catch (error) {
    evidence.result = { CDN: 'FAIL', PENDING: 'UNKNOWN' }[error.result] ?? error.result ?? 'FAIL';
    evidence.reason = error.message;
    process.exitCode = 1;
  }
  const { files = {}, ...browser } = evidence.browser ?? {};
  for (const [path, sha256] of Object.entries(files)) {
    console.log('PUBLIC_BYTES_OK', JSON.stringify({ path, http: 200, sha256 }));
  }
  if (evidence.browser) evidence.browser = { ...browser, fileCount: Object.keys(files).length };
  const summary = JSON.stringify(evidence);
  console.log('PUBLIC_PAGES_PROBE', summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Öffentlicher Pages-Nachweis\n\n    ${summary}\n`);
  }
}

if (require.main === module) main();
module.exports = { assetPath, assertSameDeployment, identifyDeployment, targetSha, validateSave,
  verifyBytes, verifyRelease };
