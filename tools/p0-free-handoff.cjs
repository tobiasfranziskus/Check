'use strict'

const { execFile } = require('node:child_process')
const { writeFileSync, mkdirSync } = require('node:fs')
const { join } = require('node:path')
const { promisify } = require('node:util')
const exec = promisify(execFile)

const repo = 'tobiasfranziskus/Check'
const web = 'https://github.com/' + repo
const api = 'repos/' + repo
const workflows = [
  { path: '.github/workflows/p0-prototype-inventory.yml', job: 'inventory' },
  { path: '.github/workflows/ui-regression.yml', job: 'test' }
]
const positive = value => Number.isSafeInteger(value) && value > 0
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value) ? value : null
const status = record => {
  const value = record.status === 'completed' ? record.conclusion : record.status
  return typeof value === 'string' && /^(success|failure|skipped|cancelled|queued|in_progress|requested|waiting|pending|action_required|neutral|stale|timed_out|startup_failure)$/.test(value)
    ? value : 'unknown'
}
const safeText = (value, env = process.env) => {
  let result = String(value ?? '')
  for (const [name, secret] of Object.entries(env)) {
    if (/(?:TOKEN|SECRET|PASSWORD|API_KEY)/i.test(name) && typeof secret === 'string' && secret.length >= 8) {
      result = result.replaceAll(secret, '[redacted]')
    }
  }
  return result
    .replace(/\b(?:github_pat_|gh[pousr]_|sk-(?:proj-)?|AIza)[\w-]{12,}/g, '[redacted]')
    .replace(/\b(?:bearer\s+|(?:[\w-]*token|[\w-]*secret|password|[\w-]*api[_-]?key)\s*[=:]\s*)[^\s,;]+/gi, '[redacted]')
    .replace(/https?:\/\/[^\s<>"']+/gi, '[url redacted]')
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ')
    .slice(0, 260)
}

class ReadError extends Error {}

async function githubGet(endpoint, signal) {
  let response
  try {
    response = await exec('gh', [
      'api', '--hostname', 'github.com', '--method', 'GET', '--include',
      '-H', 'X-GitHub-Api-Version: 2022-11-28', endpoint
    ], {
      timeout: 12000, signal, maxBuffer: 8 * 1024 * 1024, windowsHide: true,
      env: { ...process.env, GH_PROMPT_DISABLED: '1', GH_DEBUG: '', GH_FORCE_TTY: '' }
    })
  } catch (error) {
    const http = /^HTTP\/\S+ (\d{3})/m.exec(error.stdout ?? '')?.[1]
      ?? /\(HTTP (\d{3})\)/.exec(error.stderr ?? '')?.[1]
    throw new ReadError(http ? 'HTTP ' + http
      : error.code === 'ENOENT' ? 'gh fehlt'
      : signal?.aborted || error.killed ? 'Zeitlimit'
      : 'gh-Aufruf fehlgeschlagen (Netz oder Anmeldung prüfen)')
  }
  return parseResponse(response.stdout)
}

function parseResponse(stdout) {
  const boundary = /\r?\n\r?\n/.exec(stdout)
  if (!boundary) throw new ReadError('HTTP-Antwort ohne Header')
  const headers = stdout.slice(0, boundary.index)
  try {
    return {
      data: JSON.parse(stdout.slice(boundary.index + boundary[0].length)),
      next: /^link:[^\r\n]*;\s*rel="next"/im.test(headers)
    }
  } catch {
    throw new ReadError('Ungültige JSON-Antwort')
  }
}

async function collect({ pr = null, allow = [], get = githubGet, sourceSha = null, now = new Date() } = {}) {
  const signal = AbortSignal.timeout(100_000)
  const issues = []
  const problem = (label, error) => issues.push({
    source: label, reason: error instanceof ReadError ? error.message : 'Unerwarteter Lesefehler'
  })
  const object = async (endpoint, label, valid) => {
    try {
      const { data } = await get(api + endpoint, signal)
      if (!valid(data)) throw new ReadError('Unerwartete Datenform')
      return data
    } catch (error) {
      problem(label, error)
      return null
    }
  }
  const pages = async (endpoint, key, label) => {
    const items = []
    for (let page = 1; page <= 3; page++) {
      try {
        const separator = endpoint.includes('?') ? '&' : '?'
        const { data, next } = await get(api + endpoint + separator + 'per_page=100&page=' + page, signal)
        const rows = key ? data?.[key] : data
        if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
          throw new ReadError('Unerwartete Listenantwort')
        }
        items.push(...rows)
        if (!next) {
          if (key && Number.isSafeInteger(data.total_count) && data.total_count !== items.length) {
            throw new ReadError('Listenmenge weicht von total_count ab')
          }
          return { items, complete: true }
        }
      } catch (error) {
        problem(label, error)
        return { items, complete: false }
      }
    }
    problem(label, new ReadError('Seitenlimit erreicht'))
    return { items, complete: false }
  }
  const readMain = label => object('/branches/main', label, data => sha(data?.commit?.sha))
  const readPr = label => object('/pulls/' + pr, label, data =>
    data?.number === pr && sha(data.head?.sha) && sha(data.base?.sha)
    && typeof data.head.ref === 'string' && typeof data.base.ref === 'string'
    && Number.isSafeInteger(data.changed_files) && data.changed_files >= 0)
  const [main, pull, catalog] = await Promise.all([
    readMain('main'),
    pr ? readPr('PR') : null,
    pages('/actions/workflows', 'workflows', 'Workflow-Liste')
  ])

  async function diff() {
    const files = await pages('/pulls/' + pr + '/files', null, 'PR-Dateiliste')
    const hasPath = file => typeof file.filename === 'string'
      && (file.status !== 'renamed' || typeof file.previous_filename === 'string')
    const check = filename => allow.some(rule => rule.endsWith('/') ? filename.startsWith(rule) : filename === rule)
    const complete = files.complete && files.items.every(hasPath)
      && new Set(files.items.map(file => file.filename)).size === pull.changed_files
      && files.items.length === pull.changed_files
    if (files.complete && !complete) problem('PR-Dateiliste', new ReadError('Dateimenge oder Pfade widersprechen PR-Metadaten'))
    return {
      complete, changedFiles: pull.changed_files, allowedPaths: allow.map(rule => safeText(rule)),
      files: files.items.filter(hasPath).map(file => ({
        path: safeText(file.filename),
        previousPath: typeof file.previous_filename === 'string' ? safeText(file.previous_filename) : null,
        status: safeText(file.status),
        allowed: allow.length ? check(file.filename) && (!file.previous_filename || check(file.previous_filename)) : null
      }))
    }
  }

  async function inspect(target, workflow) {
    const label = target.label + ' / ' + workflow.path.split('/').at(-1)
    const definition = catalog.items.find(item => item.path === workflow.path && positive(item.id))
    const row = {
      path: workflow.path, definition: definition ? safeText(definition.state) : null,
      status: catalog.complete ? 'missing' : 'unknown', relation: null, run: null,
      expectedJob: { name: workflow.job, status: null }, jobs: [], artifacts: []
    }
    if (!definition || !target.headSha) return { ...row, status: target.headSha ? row.status : 'unknown' }

    const list = '/actions/workflows/' + definition.id + '/runs?' + new URLSearchParams({
      branch: target.ref, event: target.event
    })
    const exact = await pages(list + '&head_sha=' + target.headSha, 'workflow_runs', label + ' / aktueller SHA')
    const sameBranch = run => positive(run.id) && positive(run.run_attempt) && sha(run.head_sha)
      && run.event === target.event && run.head_branch === target.ref
      && (!target.isPr || (positive(target.repoId) && run.head_repository?.id === target.repoId))
    const linkedPr = run => Array.isArray(run.pull_requests)
      ? run.pull_requests.find(item => item?.number === pr && item.base?.ref === target.baseRef)
      : null
    const relation = run => {
      if (run.head_sha !== target.headSha) return 'stale_head'
      if (!target.isPr) return 'current'
      const runBase = sha(linkedPr(run)?.base?.sha)
      if (!runBase) return 'unverified_base'
      return runBase === target.baseSha ? 'current' : 'stale_base'
    }

    const candidates = exact.items.filter(run => sameBranch(run) && run.head_sha === target.headSha)
    let run = candidates.find(run => !target.isPr || linkedPr(run))
      ?? candidates.find(run => target.isPr && (!run.pull_requests
        || (Array.isArray(run.pull_requests) && run.pull_requests.length === 0)))
    let runsComplete = exact.complete
    if (!run && exact.complete) {
      const recent = await pages(list, 'workflow_runs', label + ' / Branch-Verlauf')
      run = recent.items.find(item => sameBranch(item) && item.head_sha !== target.headSha && (!target.isPr || linkedPr(item)))
      runsComplete = recent.complete
      if (!recent.complete) row.status = 'unknown'
    }
    if (!run) return exact.complete ? row : { ...row, status: 'unknown' }

    const runPath = '/actions/runs/' + run.id
    const [jobs, artifacts] = await Promise.all([
      pages(runPath + '/attempts/' + run.run_attempt + '/jobs', 'jobs', label + ' / Jobs'),
      pages(runPath + '/artifacts', 'artifacts', label + ' / Artefakte')
    ])
    const matches = jobs.items.filter(job => job.name === workflow.job)
    return {
      ...row, status: status(run), relation: relation(run), runsComplete,
      run: {
        id: run.id, attempt: run.run_attempt, url: web + '/actions/runs/' + run.id + '/attempts/' + run.run_attempt,
        headSha: run.head_sha, reportedBaseSha: target.isPr ? sha(linkedPr(run)?.base?.sha) : null
      },
      expectedJob: {
        name: workflow.job,
        status: matches.length === 1 ? status(matches[0]) : jobs.complete && !matches.length ? 'missing' : 'unknown'
      },
      jobsComplete: jobs.complete, artifactsComplete: artifacts.complete,
      jobs: jobs.items.map(job => ({
        name: safeText(job.name), status: status(job),
        url: positive(job.id) ? web + '/actions/runs/' + run.id + '/job/' + job.id : null
      })),
      artifacts: artifacts.items.map(artifact => ({
        id: positive(artifact.id) ? artifact.id : null,
        name: safeText(artifact.name), sizeBytes: Number.isSafeInteger(artifact.size_in_bytes) ? artifact.size_in_bytes : null,
        expired: typeof artifact.expired === 'boolean' ? artifact.expired : null,
        expiresAt: /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(artifact.expires_at) ? artifact.expires_at : null
      }))
    }
  }

  const mainTarget = { label: 'main', ref: 'main', event: 'push', headSha: sha(main?.commit?.sha) }
  const prTarget = pull && {
    label: 'PR #' + pr, ref: pull.head.ref, event: 'pull_request', headSha: pull.head.sha,
    isPr: true, repoId: pull.head.repo?.id, baseRef: pull.base.ref, baseSha: pull.base.sha
  }
  const [mainRuns, prRuns, changed] = await Promise.all([
    Promise.all(workflows.map(workflow => inspect(mainTarget, workflow))),
    prTarget ? Promise.all(workflows.map(workflow => inspect(prTarget, workflow))) : null,
    pull ? diff() : null
  ])
  const [mainAgain, pullAgain] = await Promise.all([
    main && readMain('main / erneute Prüfung'),
    pull && readPr('PR / erneute Prüfung')
  ])
  const mainStable = mainAgain ? mainAgain.commit.sha === mainTarget.headSha : null
  const prStable = pullAgain ? pullAgain.head.sha === prTarget.headSha && pullAgain.head.ref === prTarget.ref
    && pullAgain.base.sha === prTarget.baseSha && pullAgain.base.ref === prTarget.baseRef
    && pullAgain.changed_files === pull.changed_files : null
  if (mainStable === false) problem('main', new ReadError('SHA änderte sich während des Abrufs'))
  if (prStable === false) problem('PR', new ReadError('Head, Base oder Dateimenge änderte sich während des Abrufs'))
  return {
    schema: 1, observedAt: now.toISOString(), repository: repo, sourceSha: sha(sourceSha),
    main: { sha: mainTarget.headSha, stable: mainStable, workflows: mainRuns },
    pr: pr && {
      number: pr, url: web + '/pull/' + pr, stable: prStable, headSha: prTarget?.headSha ?? null,
      headRef: safeText(prTarget?.ref) || null, baseSha: prTarget?.baseSha ?? null,
      baseRef: safeText(prTarget?.baseRef) || null,
      baseMatchesMain: prTarget?.baseRef === 'main' && mainTarget.headSha ? prTarget.baseSha === mainTarget.headSha : null,
      diff: changed, workflows: prRuns
    },
    issues: issues.sort((a, b) => a.source.localeCompare(b.source))
  }
}

// GitHub-controlled text may contain Markdown, HTML, links, or mentions.
const md = value => String(value ?? '—').replace(/[^\p{L}\p{N} ]/gu, char => '&#' + char.codePointAt(0) + ';')
const code = value => value ? '`' + value + '`' : '—'
function markdown(report) {
  const lines = [
    '# P0 · CI-Nachweis', '',
    report.repository + ' · ' + report.observedAt,
    'Workflow-Quellcommit ' + code(report.sourceSha), '',
    'GitHub-Metadaten für zwei ausgewählte Workflows. Testzahlen und fachliche Abnahme stehen in den Originaljobs.', ''
  ]
  const list = (rows, format) => {
    for (const row of rows.slice(0, 15)) lines.push('- ' + format(row))
    if (rows.length > 15) lines.push('- Weitere ' + (rows.length - 15) + ' Einträge im JSON.')
  }
  const workflowsFor = rows => {
    for (const row of rows ?? []) {
      lines.push('', '### ' + row.path.split('/').at(-1), '',
        'Status ' + code(row.status) + ' · Bezug ' + code(row.relation)
        + ' · Workflow-Definition ' + md(row.definition))
      if (!row.run) continue
      lines.push('', '[Run ' + row.run.id + ' · Versuch ' + row.run.attempt + '](' + row.run.url + ') · SHA '
        + code(row.run.headSha) + ' · gemeldete PR-Base ' + code(row.run.reportedBaseSha), '',
      'Erwarteter Job ' + code(row.expectedJob.name) + ' · ' + code(row.expectedJob.status), '')
      if (!row.runsComplete) lines.push('Run-Liste unvollständig.', '')
      if (!row.jobsComplete) lines.push('Jobliste unvollständig.', '')
      list(row.jobs, job => md(job.name) + ' · ' + code(job.status) + (job.url ? ' · [Job](' + job.url + ')' : ''))
      lines.push('', 'Artefakte auf Run-Ebene' + (row.artifactsComplete ? '' : ' (Liste unvollständig)'), '')
      if (!row.artifacts.length) lines.push(row.artifactsComplete ? 'Keine gemeldet.' : 'Keine abrufbar.')
      list(row.artifacts, artifact => md(artifact.name) + ' · ID ' + md(artifact.id)
        + ' · ' + md(artifact.sizeBytes) + ' Bytes · '
        + (artifact.expired === true ? 'abgelaufen' : md(artifact.expiresAt)))
    }
  }
  const stability = value => value === true ? 'stabil' : value === false ? 'während Abruf geändert' : 'unbestätigt'
  lines.push('## main', '', code(report.main.sha) + ' · ' + stability(report.main.stable))
  workflowsFor(report.main.workflows)
  if (report.pr) {
    const pr = report.pr
    lines.push('', '## [PR #' + pr.number + '](' + pr.url + ')', '',
      'Head ' + md(pr.headRef) + ' ' + code(pr.headSha) + ' · Base ' + md(pr.baseRef) + ' ' + code(pr.baseSha),
      'Stand ' + stability(pr.stable) + (pr.baseMatchesMain === false ? ' · Base weicht von main ab.' : ''))
    if (pr.diff) {
      const diff = pr.diff
      const violations = diff.files.filter(file => file.allowed === false)
      lines.push('', 'Dateien ' + diff.files.length + '/' + diff.changedFiles
        + (diff.complete ? '' : ' (unvollständig)') + ' · Pfadgrenze '
        + (!diff.allowedPaths.length ? 'offen' : violations.length + ' außerhalb'), '')
      if (diff.allowedPaths.length) lines.push('Erlaubt ' + diff.allowedPaths.map(md).join(', '), '')
      list([...violations, ...diff.files.filter(file => file.allowed !== false)], file =>
        md(file.status) + ' · ' + (file.previousPath ? md(file.previousPath) + ' → ' : '') + md(file.path)
        + (file.allowed === false ? ' **außerhalb**' : ''))
    }
    workflowsFor(pr.workflows)
  }
  if (report.issues.length) {
    lines.push('', '## Abrufgrenzen und Fehler', '')
    list(report.issues, issue => md(issue.source) + ' · ' + md(issue.reason))
  }
  return lines.join('\n') + '\n'
}

function parseArgs(args) {
  const usage = 'node tools/p0-free-handoff.cjs [--pr NUMMER] [--allow DATEI,VERZEICHNIS/] [--out ORDNER]'
  const options = { out: 'p0-handoff', pr: null, allow: [] }
  if (args.length === 1 && args[0] === '--help') return { usage }
  for (let i = 0; i < args.length; i += 2) {
    const [flag, value] = args.slice(i, i + 2)
    if (!value || value.startsWith('--')) throw new Error(usage)
    if (flag === '--pr' && /^\d+$/.test(value) && positive(Number(value))) options.pr = Number(value)
    else if (flag === '--out') options.out = value
    else if (flag === '--allow' && value.length <= 1000) {
      options.allow.push(...value.split(',').map(path => path.trim()).filter(Boolean))
    } else throw new Error(usage)
  }
  if ((options.allow.length && !options.pr) || options.allow.length > 20
    || options.allow.some(path => !/^[\w./-]+$/.test(path) || path.startsWith('/') || path.split('/').includes('..'))) {
    throw new Error(usage)
  }
  return options
}

async function main() {
  let options
  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
    return
  }
  if (options.usage) return console.log(options.usage)
  const report = await collect({ ...options, sourceSha: process.env.GITHUB_SHA })
  mkdirSync(options.out, { recursive: true })
  writeFileSync(join(options.out, 'handoff.json'), JSON.stringify(report, null, 2) + '\n')
  writeFileSync(join(options.out, 'handoff.md'), markdown(report))
  if (report.issues.length) process.exitCode = 2
}

if (require.main === module) main().catch(() => {
  console.error('P0-Bericht konnte nicht erstellt werden.')
  process.exitCode = 1
})
module.exports = { collect, markdown, parseArgs, parseResponse, safeText }
