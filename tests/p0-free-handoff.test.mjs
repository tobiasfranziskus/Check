import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import handoff from '../tools/p0-free-handoff.cjs'

const { collect, markdown, parseArgs, parseResponse, safeText } = handoff
const sha = letter => letter.repeat(40)
const prefix = 'repos/tobiasfranziskus/Check'
const pr = {
  number: 42, changed_files: 2,
  head: { ref: 'codex/nachweis', sha: sha('b'), repo: { id: 1 } },
  base: { ref: 'main', sha: sha('a') }
}
const defs = [
  { id: 10, path: '.github/workflows/p0-prototype-inventory.yml', state: 'active' },
  { id: 11, path: '.github/workflows/ui-regression.yml', state: 'active' }
]

const workflowDir = new URL('../.github/workflows/', import.meta.url)
const blobs = readdirSync(workflowDir).map(name => {
  const content = readFileSync(new URL(name, workflowDir))
  const digest = createHash('sha1').update('blob ' + content.length + '\0').update(content).digest('hex')
  return { type: 'file', path: '.github/workflows/' + name, sha: digest }
})
const run = (id, target, fields = {}) => ({
  id, run_attempt: 2, status: 'completed', conclusion: 'success',
  head_branch: target ? pr.head.ref : 'main', head_sha: target ? pr.head.sha : pr.base.sha,
  event: target ? 'pull_request' : 'push', head_repository: { id: 1 },
  pull_requests: target ? [{ number: pr.number, base: pr.base }] : [],
  ...fields
})
const list = (key, items, next = false, total = items.length) => ({ data: { [key]: items, total_count: total }, next })

function fixture(overrides = {}) {
  const requests = []
  const runRoutes = new Map()
  const route = (endpoint) => {
    assert.ok(endpoint.startsWith(prefix + '/'))
    const url = new URL('https://api.github.com/' + endpoint)
    const path = url.pathname.slice(prefix.length + 1)
    const params = url.searchParams
    requests.push({ path, params })
    if (path in overrides) return overrides[path](params)
    const detail = /^\/actions\/runs\/(\d+)$/.exec(path)
    if (detail) return { data: runRoutes.get(Number(detail[1])) }
    const prior = /^\/actions\/runs\/(\d+)\/attempts\/1$/.exec(path)
    if (prior) return { data: { ...runRoutes.get(Number(prior[1])), run_attempt: 1 } }
    if (path.endsWith('/attempts/1/jobs')) return list('jobs', [])
    switch (path) {
      case '/contents/.github/workflows': return { data: blobs }
      case '/actions/runs': return list('workflow_runs', [])
      case '/events':
      case '/deployments': return { data: [], next: false }
      case '/branches/main': return { data: { commit: { sha: sha('a') } } }
      case '/pulls/42': return { data: pr }
      case '/pulls/42/files':
        return params.get('page') === '1'
          ? { data: [{ filename: 'docs/README.md', status: 'added' }], next: true }
          : { data: [{ filename: 'docs/moved.md', previous_filename: 'index.html', status: 'renamed' }], next: false }
      case '/actions/workflows':
        return params.get('page') === '1' ? list('workflows', [defs[0]], true, 2) : list('workflows', [defs[1]], false, 2)
      case '/actions/workflows/10/runs': {
        if (params.get('event') === 'push') return list('workflow_runs', [run(100, false)])
        return list('workflow_runs', [run(101, true, { conclusion: 'failure' })])
      }
      case '/actions/workflows/11/runs': {
        if (params.get('event') === 'push') {
          return list('workflow_runs', params.has('head_sha') ? [] : [run(102, false, { head_sha: sha('c') })])
        }
        return list('workflow_runs', [run(103, true, { status: 'queued', conclusion: null })])
      }
      case '/actions/runs/100/attempts/2/jobs':
        return list('jobs', [{ id: 200, name: 'inventory', status: 'completed', conclusion: 'success' }])
      case '/actions/runs/101/attempts/2/jobs':
        return params.get('page') === '1' ? list('jobs', [
          { id: 201, name: 'inventory', status: 'completed', conclusion: 'success' },
          { id: 202, name: 'Linkprüfung', status: 'completed', conclusion: 'failure' }
        ], true, 4) : list('jobs', [
          { id: 203, name: 'Alte Matrix', status: 'completed', conclusion: 'skipped' },
          { id: 204, name: 'Touch', status: 'completed', conclusion: 'cancelled' }
        ], false, 4)
      case '/actions/runs/102/attempts/2/jobs':
        return list('jobs', [{ id: 205, name: 'test', status: 'completed', conclusion: 'success' }])
      case '/actions/runs/103/attempts/2/jobs': return list('jobs', [])
      case '/actions/runs/101/artifacts':
        return params.get('page') === '1' ? list('artifacts', [
          { id: 301, name: 'P0-Inventur', size_in_bytes: 512, expired: false, expires_at: '2026-12-04T10:01:00Z' }
        ], true, 2) : list('artifacts', [
          { id: 302, name: 'Browsertest', size_in_bytes: 256, expired: true }
        ], false, 2)
      case '/actions/runs/100/artifacts':
      case '/actions/runs/102/artifacts':
      case '/actions/runs/103/artifacts': return list('artifacts', [])
      default: assert.fail('Unerwarteter Pfad ' + path)
    }
  }
  const get = endpoint => {
    const response = route(endpoint)
    for (const item of response.data?.workflow_runs ?? []) runRoutes.set(item.id, item)
    const match = /\/actions\/runs\/(\d+)\/attempts\/(\d+)\/jobs/.exec(endpoint)
    if (match && response.data?.jobs) {
      const [runId, attempt] = match.slice(1).map(Number)
      response.data.jobs = response.data.jobs.map(job => ({
        run_id: runId, run_attempt: attempt, head_sha: runRoutes.get(runId)?.head_sha,
        steps: [{ number: 1, name: 'Set up job', status: 'completed', conclusion: 'success' }], ...job
      }))
    }
    return response
  }
  return { get, requests }
}

test('GitHub-Link-Header und Antwortformat werden ohne Weiterleitung fremder URLs geparst', () => {
  assert.deepEqual(parseResponse(
    'HTTP/2.0 200 OK\r\nLink: <https://api.github.com/?page=2>; rel="next", <https://api.github.com/?page=3>; rel="last"\r\n\r\n{"jobs":[]}'
  ), { data: { jobs: [] }, next: true })
  assert.deepEqual(parseResponse('HTTP/2 200\nlink: <https://api.github.com/?page=1>; rel="prev"\n\n[]'), {
    data: [], next: false
  })
  assert.throws(() => parseResponse('HTTP/2 200\n\nINVALID'), /Ungültige JSON-Antwort/)
})

test('verknüpft Main/PR und blättert Workflows, Dateien, Jobs und Artefakte weiter', async () => {
  const { get, requests } = fixture()
  const report = await collect({ get, pr: 42, allow: ['docs/'], now: new Date('2026-11-27T10:01:00Z'), sourceSha: sha('e') })
  assert.deepEqual(report.issues, [])
  assert.equal(report.sourceSha, sha('e'))
  assert.equal(report.main.sha, sha('a'))
  assert.equal(report.pr.headSha, sha('b'))
  assert.equal(report.pr.baseSha, sha('a'))
  assert.equal(report.pr.stable, true)
  assert.equal(report.pr.baseMatchesMain, true)
  assert.equal(report.pr.diff.complete, true)
  assert.deepEqual(report.pr.diff.files.map(file => file.allowed), [true, false])
  const [partial, queued] = report.pr.workflows
  assert.equal(partial.status, 'failure')
  assert.equal(partial.expectedJob.status, 'success')
  assert.equal(partial.definitionListComplete, true)
  assert.equal(partial.runsComplete, true)
  assert.equal(partial.jobsComplete, true)
  assert.equal(partial.artifactsComplete, true)
  assert.deepEqual(partial.jobs.map(job => job.status), ['success', 'failure', 'skipped', 'cancelled'])
  assert.equal(partial.artifacts.length, 2)
  assert.equal(partial.artifacts[1].expired, true)
  assert.match(partial.run.url, /101\/attempts\/2$/)
  assert.equal(queued.status, 'queued')
  assert.equal(queued.expectedJob.status, 'missing')
  assert.deepEqual(report.main.workflows.slice(0, 2).map(workflow => workflow.relation), ['current', 'stale_head'])
  assert.ok(requests.some(({ path, params }) => path.includes('/101/attempts/2/jobs') && params.get('page') === '2'))
  assert.ok(requests.every(({ path }) => !/\/logs|\/zip/.test(path)))
  assert.match(markdown(report), /1 außerhalb/)
  assert.match(markdown(report), /Testzahlen und fachliche Abnahme stehen in den Originaljobs/)
})

test('ein gleichnamiger fremder PR und eine abweichende Base zählen nicht als aktueller Bezug', async () => {
  const { get } = fixture({
    '/actions/workflows/10/runs': params => list('workflow_runs', params.get('event') === 'push' ? [] : [
      run(900, true, { head_repository: { id: 99 } }),
      run(901, true, { pull_requests: [{ number: 77, base: pr.base }] }),
      run(101, true, { pull_requests: [{ number: 42, base: { ref: 'main', sha: sha('d') } }] })
    ])
  })
  const report = await collect({ get, pr: 42 })
  assert.deepEqual(report.issues, [])
  assert.equal(report.main.workflows[0].status, 'missing')
  assert.equal(report.pr.workflows[0].relation, 'stale_base')
  assert.equal(report.pr.workflows[0].run.id, 101)
  assert.equal(report.pr.workflows[0].run.reportedBaseSha, sha('d'))
})

test('ein Run ohne PR-Zuordnung bleibt unbestätigt, laufende Jobs bleiben in_progress', async () => {
  const { get } = fixture({
    '/actions/workflows/11/runs': params => list('workflow_runs', params.get('event') === 'push' ? [] : [
      run(103, true, { status: 'in_progress', conclusion: null, pull_requests: [] })
    ]),
    '/actions/runs/103/attempts/2/jobs': () => list('jobs', [{ id: 206, name: 'test', status: 'in_progress' }])
  })
  const report = await collect({ get, pr: 42 })
  assert.equal(report.pr.workflows[1].relation, 'unverified_base')
  assert.equal(report.pr.workflows[1].status, 'in_progress')
  assert.equal(report.pr.workflows[1].expectedJob.status, 'in_progress')
})

test('API-Fehler, Seitenlimit und Diff-Mengenabweichung bleiben sichtbar', async () => {
  const { get, requests } = fixture({
    '/actions/workflows': params => list('workflows', [params.get('page') === '1' ? defs[0] : { id: 20 + Number(params.get('page')), path: 'other' }], true, 700),
    '/actions/runs/101/attempts/2/jobs': () => { throw new Error('Authorization: Bearer should-never-appear') },
    '/pulls/42/files': () => ({ data: [{ filename: 'docs/README.md', status: 'added' }], next: false })
  })
  const report = await collect({ get, pr: 42 })
  assert.equal(report.pr.workflows[1].status, 'unknown')
  assert.equal(report.pr.workflows[0].expectedJob.status, 'unknown')
  assert.equal(report.pr.diff.complete, false)
  assert.deepEqual(requests.filter(request => request.path === '/actions/workflows').map(request => request.params.get('page')), ['1', '2', '3'])
  assert.match(JSON.stringify(report), /Seitenlimit/)
  assert.match(JSON.stringify(report), /Dateimenge/)
  assert.match(JSON.stringify(report), /Unerwarteter Lesefehler/)
  assert.doesNotMatch(JSON.stringify(report), /should-never-appear/)
})

test('ein Wechsel der Ziel-SHAs während des Abrufs kennzeichnet die Momentaufnahme', async () => {
  let mainReads = 0
  let prReads = 0
  const { get } = fixture({
    '/branches/main': () => ({ data: { commit: { sha: sha(++mainReads === 1 ? 'a' : 'c') } } }),
    '/pulls/42': () => ({ data: ++prReads === 1 ? pr : { ...pr, base: { ...pr.base, sha: sha('c') } } })
  })
  const report = await collect({ get, pr: 42 })
  assert.equal(report.main.stable, false)
  assert.equal(report.pr.stable, false)
  assert.equal(report.issues.length, 2)
  assert.match(markdown(report), /während Abruf geändert/)
})

test('Secrets, Download-URLs und aktives Markup geraten nicht in Markdown oder JSON', async () => {
  const token = 'ghp_' + 'a'.repeat(36)
  const signed = 'https://files.example.test/download?X-Amz-Signature=secret-signature'
  const { get } = fixture({
    '/actions/runs/100/artifacts': () => list('artifacts', [{
      id: 301, name: 'A| <script> @owner [x](x)\n' + token + ' ' + signed,
      size_in_bytes: 42, expired: false, archive_download_url: signed
    }])
  })
  const report = await collect({ get })
  assert.equal(safeText('marker fixture-custom-value', { CUSTOM_SECRET: 'fixture-custom-value' }), 'marker [redacted]')
  assert.doesNotMatch(JSON.stringify(report), /secret-signature|ghp_|archive_download_url/)
  assert.match(JSON.stringify(report), /\[redacted\]/)
  assert.doesNotMatch(markdown(report), /\| <script>|@owner|\[x\]\(x\)|ghp_|secret-signature/)
})

test('die CLI akzeptiert nur PR-Nummern und relative Pfadgrenzen', () => {
  assert.deepEqual(parseArgs(['--pr', '42', '--allow', 'docs/,tools/check-doc-links.cjs', '--out', 'outside']), {
    pr: 42, allow: ['docs/', 'tools/check-doc-links.cjs'], out: 'outside'
  })
  assert.match(parseArgs(['--help']).usage, /^node /)
  for (const args of [['--pr', '-1'], ['--pr', '42;whoami'], ['--allow', 'docs/'], ['--pr', '42', '--allow', '../'], ['--pr']]) {
    assert.throws(() => parseArgs(args), /node tools/)
  }
})

test('doppelte Nicht-Zieljob-ID auf Folgeseite macht den gesamten Jobnachweis unvollständig', async () => {
  const inventory = { id: 201, name: 'inventory', status: 'completed', conclusion: 'success' }
  const other = { id: 202, name: 'other', status: 'completed', conclusion: 'success' }
  const { get } = fixture({
    '/actions/runs/101/attempts/2/jobs': params => params.get('page') === '1'
      ? list('jobs', [inventory, other], true, 3)
      : list('jobs', [other], false, 3)
  })
  const report = await collect({ get, pr: 42 })
  const row = report.pr.workflows[0]
  assert.equal(row.jobsComplete, false)
  assert.equal(row.expectedJob.status, 'unknown')
  assert.deepEqual(row.jobs.map(job => job.name), ['inventory', 'other'])
  assert.deepEqual(report.issues, [{ source: 'PR #42 / p0-prototype-inventory.yml / Jobs', reason: 'Doppelte Listen-ID' }])
  assert.match(markdown(report), /Jobliste unvollständig/)
})

const idCases = [
  { endpoint: '/actions/workflows', key: 'workflows', valid: defs[0],
    check: report => report.pr.workflows[0].definitionListComplete },
  { endpoint: '/actions/workflows/10/runs', key: 'workflow_runs', valid: run(101, true),
    check: report => report.pr.workflows[0].runsComplete },
  { endpoint: '/actions/runs/101/attempts/2/jobs', key: 'jobs',
    valid: { id: 201, name: 'inventory', status: 'completed', conclusion: 'success' },
    check: report => report.pr.workflows[0].jobsComplete },
  { endpoint: '/actions/runs/101/artifacts', key: 'artifacts', valid: { id: 301, name: 'Inventur' },
    check: report => report.pr.workflows[0].artifactsComplete }
]

function idFixture({ endpoint, key, valid }, second) {
  return fixture({
    [endpoint]: params => key === 'workflow_runs' && params.get('event') === 'push'
      ? list(key, [run(100, false)])
      : list(key, [params.get('page') === '1' ? valid : second], params.get('page') === '1', 2)
  })
}

test('doppelte IDs werden in allen vier Listentypen erkannt; PR-Dateien brauchen keine IDs', async () => {
  for (const entry of idCases) {
    const { get } = idFixture(entry, entry.valid)
    const report = await collect({ get, pr: 42 })
    assert.equal(entry.check(report), false, entry.key)
    assert.ok(report.issues.some(issue => issue.reason === 'Doppelte Listen-ID'), entry.key)
    assert.equal(report.pr.diff.complete, true)
  }
})

test('fehlende, null, nichtpositive, nichtnumerische und unsichere IDs bleiben Abruflücken', async () => {
  for (const entry of idCases) {
    for (const invalid of [undefined, null, 0, -1, 1.5, '2', Number.MAX_SAFE_INTEGER + 1]) {
      const bad = { ...entry.valid, id: invalid }
      if (invalid === undefined) delete bad.id
      const { get } = idFixture(entry, bad)
      const report = await collect({ get, pr: 42 })
      assert.equal(entry.check(report), false, entry.key + ': ' + invalid)
      assert.ok(report.issues.some(issue => issue.reason === 'Fehlende oder ungültige Listen-ID'), entry.key)
      if (entry.key === 'jobs') assert.equal(report.pr.workflows[0].expectedJob.status, 'unknown')
    }
  }
})

const workflowPath = name => '.github/workflows/' + name + '.yml'
const goodJob = (id, name, rest = {}) => ({
  id, name, status: 'completed', conclusion: 'success', ...rest
})

function matrixFixture(jobOverrides = {}, extra = {}) {
  const compat = { id: 12, path: workflowPath('w-rule208-compat'), state: 'active' }
  const browser = { id: 13, path: workflowPath('m4-u3-ore'), state: 'active' }
  const matrix = ['pinned-old-build', ...Array.from({ length: 13 }, (_, i) =>
    'revision-longterm (S' + String(i + 1).padStart(2, '0') + ', 90)'),
  'revision-longterm (S02, 365)', 'revision-longterm (S02, 730)']
  return fixture({
    '/actions/workflows': () => list('workflows', [...defs, compat, browser]),
    '/pulls/42/files': () => ({ data: [
      { filename: 'prototypes/verbund/konzern-session.js', status: 'modified' },
      { filename: 'docs/README.md', status: 'added' }
    ] }),
    '/actions/workflows/12/runs': () => list('workflow_runs', [run(110, true)]),
    '/actions/workflows/13/runs': () => list('workflow_runs', [run(111, true)]),
    '/actions/runs/110/artifacts': () => list('artifacts', []),
    '/actions/runs/111/artifacts': () => list('artifacts', []),
    '/actions/runs/110/attempts/2/jobs': () => list('jobs', matrix.map((name, i) => goodJob(400 + i, name))),
    '/actions/runs/111/attempts/2/jobs': () => list('jobs', [
      goodJob(470, 'ore-original-node22'), goodJob(471, 'ore-browser (chromium)'), goodJob(472, 'ore-browser (webkit)')
    ]),
    ...jobOverrides,
    ...extra
  })
}

test('der Katalog deckt alle geprüften Git-Blobs ab und trennt Pflicht-, bedingte und manuelle Workflows', async () => {
  const { get } = matrixFixture()
  const report = await collect({ get, pr: 42 })
  assert.equal(report.main.workflows.length, 22)
  assert.deepEqual(report.main.workflows.map(row => row.path).sort(), blobs.map(row => row.path).sort())
  assert.ok(report.main.workflows.every(row => row.definitionStatus === 'verified'))
  assert.equal(report.main.workflows.find(row => row.path === workflowPath('w6-p8g-p2-main-integration')).applicability, 'not_applicable')
  assert.equal(report.pr.workflows.find(row => row.path === workflowPath('m4-u4-gemini-visual')).coverage, 'not_applicable')
  const rule = report.pr.workflows.find(row => row.path === workflowPath('w-rule208-compat'))
  assert.equal(rule.expectedJobs.length, 16)
  assert.equal(rule.coverage, 'metadata_success')
  const browser = report.pr.workflows.find(row => row.path === workflowPath('m4-u3-ore'))
  assert.equal(browser.coverage, 'metadata_success')
  assert.ok(markdown(report).trimEnd().split('\n').length < 100)
})

test('grüner Run mit fehlenden, doppelt benannten, übersprungenen oder widersprüchlichen Matrixjobs bleibt offen', async () => {
  const { get } = matrixFixture({
    '/actions/runs/111/attempts/2/jobs': () => list('jobs', [
      goodJob(470, 'ore-original-node22', { steps: [{ number: 2, name: 'Checkout', status: 'completed', conclusion: 'failure' }] }),
      goodJob(471, 'ore-browser (chromium)', { conclusion: 'skipped' }),
      goodJob(472, 'ore-browser (chromium)')
    ])
  })
  const report = await collect({ get, pr: 42 })
  const browser = report.pr.workflows.find(row => row.path === workflowPath('m4-u3-ore'))
  assert.equal(browser.status, 'success')
  assert.equal(browser.coverage, 'incomplete_jobs')
  assert.deepEqual(browser.expectedJobs.map(job => job.status), ['success', 'unknown', 'missing'])
  assert.equal(browser.jobs[0].diagnostic.name, 'Checkout')
})

test('ein neuerer abgebrochener Run verdrängt einen älteren grünen Run desselben SHA', async () => {
  const { get } = fixture({
    '/actions/workflows/10/runs': params => list('workflow_runs', params.get('event') === 'push' ? [] : [
      run(100, true), run(101, true, { conclusion: 'cancelled' })
    ])
  })
  const report = await collect({ get, pr: 42 })
  const row = report.pr.workflows[0]
  assert.deepEqual(row.candidates.map(item => item.id), [101, 100])
  assert.equal(row.coverage, 'cancelled')
})

test('Retry-Wechsel, fremder Jobversuch und Run-Artefakte liefern keinen aktuellen Nachweis', async () => {
  const { get } = fixture({
    '/actions/runs/101': () => ({ data: run(101, true, { run_attempt: 3 }) }),
    '/actions/runs/101/attempts/2/jobs': () => list('jobs', [goodJob(201, 'inventory', { run_attempt: 1 })]),
    '/actions/runs/101/attempts/1/jobs': () => list('jobs', [goodJob(205, 'inventory')])
  })
  const { pr: result, issues } = await collect({ get, pr: 42 })
  const row = result.workflows[0]
  assert.equal(row.run.stable, false)
  assert.equal(row.coverage, 'unknown')
  assert.equal(row.jobs[0].status, 'unknown')
  assert.equal(row.attempts[1].jobs[0].status, 'success')
  assert.equal(row.artifacts[0].attempt, 'unknown')
  assert.ok(issues.some(issue => /Versuch änderte/.test(issue.reason)))
})

test('unbekannte und geänderte Workflow-Definitionen werden als Lücken ausgewiesen', async () => {
  const unexpected = workflowPath('unreviewed')
  const { get } = matrixFixture({}, {
    '/contents/.github/workflows': () => ({ data: [
      ...blobs.map(file => file.path === workflowPath('m4-u3-ore') ? { ...file, sha: sha('d') } : file),
      { path: unexpected, sha: sha('e'), type: 'file' }
    ] })
  })
  const { pr: result } = await collect({ get, pr: 42 })
  const browser = result.workflows.find(row => row.path === workflowPath('m4-u3-ore'))
  assert.equal(browser.definitionStatus, 'drift')
  assert.equal(browser.coverage, 'unknown')
  assert.equal(result.workflows.find(row => row.path === unexpected).coverage, 'unknown')
})

test('Optionen, Schritttexte, Artefakte und ein Testmerge-Kandidat belegen weder Checkout noch TAP oder Marker', async () => {
  const { get, requests } = fixture({
    '/pulls/42': () => ({ data: { ...pr, state: 'open', merge_commit_sha: sha('c') } }),
    ['/git/commits/' + sha('c')]: () => ({ data: {
      sha: sha('c'), tree: { sha: sha('d') }, parents: [{ sha: sha('a') }, { sha: sha('b') }]
    } }),
    '/actions/runs/101/attempts/2/jobs': () => list('jobs', [goodJob(201, 'inventory', {
      head_sha: sha('c'), steps: [{
        number: 2, status: 'completed', conclusion: 'success', name: 'Checkout',
        output: 'TAP version 13\n1..639\n# pass 639\nINDEPENDENT_MANAGER_PASS\nPASSWORD=do-not-export'
      }]
    })])
  })
  const report = await collect({ get, pr: 42 })
  assert.equal(report.pr.testMerge.matchesPr, true)
  const row = report.pr.workflows[0]
  assert.equal(row.run.checkoutSha, null)
  assert.deepEqual(row.jobs[0].evidence, { checkout: 'unknown', tap: 'unknown', markers: 'unknown' })
  assert.doesNotMatch(JSON.stringify(report), /TAP version|# pass 639|INDEPENDENT_MANAGER_PASS|do-not-export/)
  assert.ok(requests.every(({ path }) => !/\/logs|\/zip/.test(path)))
})

test('Push-Filter, Pages-Deployment und Root-Nachweis sind getrennt', async () => {
  const deploymentRun = 'dynamic/pages/pages-build-deployment'
  const { get } = fixture({
    '/events': () => ({ data: [{
      type: 'PushEvent', repo: { name: 'tobiasfranziskus/Check' },
      payload: { ref: 'refs/heads/main', head: sha('a'), before: sha('c') }
    }] }),
    ['/compare/' + sha('c') + '...' + sha('a')]: () => ({ data: {
      base_commit: { sha: sha('c') }, merge_base_commit: { sha: sha('c') }, status: 'ahead', total_commits: 1,
      files: [{ filename: 'prototypes/spiel/spiel.js' }]
    } }),
    '/actions/runs': () => list('workflow_runs', [run(104, false, { event: 'dynamic', path: deploymentRun + '@main' })]),
    '/actions/runs/104/attempts/2/jobs': () => list('jobs', [
      goodJob(222, 'build'), goodJob(223, 'report-build-status'), goodJob(224, 'deploy')
    ]),
    '/actions/runs/104/artifacts': () => list('artifacts', []),
    '/deployments': () => ({ data: [{ id: 3, sha: sha('a'), environment: 'github-pages' }] }),
    '/deployments/3/statuses': () => ({ data: [{ id: 4, state: 'success' }] })
  })
  const report = await collect({ get })
  assert.equal(report.main.pushBeforeSha, sha('c'))
  assert.equal(report.main.workflows[0].applicability, 'required')
  assert.equal(report.main.workflows[1].coverage, 'not_applicable')
  assert.equal(report.pages.workflow.coverage, 'metadata_success')
  assert.equal(report.pages.deployment.status, 'success')
  assert.equal(report.publicRoot.status, 'unknown')
})
