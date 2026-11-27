import test from 'node:test'
import assert from 'node:assert/strict'
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
  const get = (endpoint) => {
    assert.ok(endpoint.startsWith(prefix + '/'))
    const url = new URL('https://api.github.com/' + endpoint)
    const path = url.pathname.slice(prefix.length + 1)
    const params = url.searchParams
    requests.push({ path, params })
    if (path in overrides) return overrides[path](params)
    switch (path) {
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
  assert.deepEqual(partial.jobs.map(job => job.status), ['success', 'failure', 'skipped', 'cancelled'])
  assert.equal(partial.artifacts.length, 2)
  assert.equal(partial.artifacts[1].expired, true)
  assert.match(partial.run.url, /101\/attempts\/2$/)
  assert.equal(queued.status, 'queued')
  assert.equal(queued.expectedJob.status, 'missing')
  assert.deepEqual(report.main.workflows.map(workflow => workflow.relation), ['current', 'stale_head'])
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
    '/actions/workflows': () => list('workflows', [defs[0]], true, 700),
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
