'use strict'

const { execFile } = require('node:child_process')
const { writeFileSync, mkdirSync } = require('node:fs')
const { join } = require('node:path')
const { promisify } = require('node:util')
const exec = promisify(execFile)

const repo = 'tobiasfranziskus/Check'
const web = 'https://github.com/' + repo
const api = 'repos/' + repo
// Reviewed trigger/job catalog. Blob IDs detect definition changes without interpreting PR YAML.
const scenarioJobs = name => [...Array.from({ length: 13 }, (_, i) =>
  name + ' (S' + String(i + 1).padStart(2, '0') + ', 90)'), name + ' (S02, 365)', name + ' (S02, 730)']
const workflows = [
  { path: ".github/workflows/p0-prototype-inventory.yml", blob: "595c832ddfc9423d75609376e578d2bfa7dd3656",
    pr: ["index.html", "aphros-void.html", "prototypes/**", "tests/**", "scripts/**", ".github/workflows/**", "versionen/**", "spieltest/**", "AGENTS.md", "README.md", "docs/**", "tools/check-doc-links.cjs"],
    push: {"branches": ["main"]},
    dispatch: "manual",
    jobs: ["inventory"] },
  { path: ".github/workflows/ui-regression.yml", blob: "5095a948f3fe7d703444075ae5f51ea20d6c7864",
    pr: ["index.html", "tests/**", ".github/workflows/ui-regression.yml", ".github/workflows/p0-prototype-inventory.yml"],
    push: {"branches": ["main"], "paths": ["index.html", "tests/**", ".github/workflows/ui-regression.yml", ".github/workflows/p0-prototype-inventory.yml"]},
    dispatch: "manual",
    jobs: ["test", "sicherheitsgeografie-vergleich", "wirtschaft-v11-referenz", "wirtschaft-geografie-drei-varianten", "wirtschaft-v10-referenz", "wirtschaft-v12-versorgungsfreigabe", "wirtschaft-v13-kostenkorrektur", "wirtschaft-v14-sollflottenzuordnung"] },
  { path: ".github/workflows/b5b-sollflotte.yml", blob: "ae6d614c1c5e5460f4d885cb9b125503e6560d79",
    pr: ["tools/b5b-*.mjs", "tests/b5b-sollrolle.test.mjs", "docs/TEST_B5B_SOLLFLOTTENZUORDNUNG.md", ".github/workflows/b5b-sollflotte.yml"],
    dispatch: "manual",
    jobs: ["start-b1", "spieler-b1 (miner)", "spieler-b1 (handel-flotte)", "spieler-b1 (station)", "spieler-b1 (jagd)", "abnahme"] },
  { path: ".github/workflows/j14-pilot-relogin.yml", blob: "5622f7457a200e4d186416f0ec8977bccdea9da1",
    pr: ["prototypes/verbund/konzern-session.js", "tests/j14-pilot-relogin-multiship.test.mjs", "tests/j14-pilot-relogin-browser.cjs", ".github/workflows/j14-pilot-relogin.yml"],
    dispatch: "manual",
    jobs: ["original-j2b-controller", "public-root-j14-touch (chromium)", "public-root-j14-touch (webkit)"] },
  { path: ".github/workflows/j4e-public-smoke.yml", blob: "dda61faf6d7fd64769fb2da754b0d7814cfa0e76",
    pr: ["index.html", "aphros-void.html", "scripts/build-w5-singlefile.mjs", "prototypes/j4c/**", "prototypes/raum/**", "prototypes/verbund/**", "prototypes/legacy-hub/**", "prototypes/w5x/**", "tests/p0-w5x-*", "tests/w5x-*", "tests/p0-legacy-hub-*", "scripts/p0-prototype-deps.mjs", "tests/j7-*", "tests/j8-*", "tests/j9-*", "tests/j10a-*", "tests/j10b-*", "tests/j11-*", "prototypes/flug2d/flug-kern.js", "prototypes/f8-jaeger/**", "prototypes/welt/**", "tests/j4e-*", "tests/j5-*", "tests/raum-*", "tests/j6i-*", "tests/w5singlefile.test.mjs", "tests/w5rc1-preservation.test.mjs", ".github/workflows/j4e-public-smoke.yml"],
    dispatch: "manual",
    jobs: ["root-and-paid-sample", "genuine-fighter-browser (chromium)", "genuine-fighter-browser (webkit)"] },
  { path: ".github/workflows/m4-house-ore-longterm.yml", blob: "2e164e3e750cc1b8d9f6cc8e5bc103663053015c",
    pr: [".github/workflows/m4-house-ore-longterm.yml", "tests/m4-u5-house-ore-scenarios.cjs", "tools/w6-szenarien.cjs", "prototypes/welt/**", "prototypes/verbund/**"],
    dispatch: "manual",
    jobs: ["paired (S01, 90, d9d72edaa778a9f5, d6b32676051a2aaa, 4)", "paired (S02, 90, f83aa3062b729e1e, 20ab73c826ac2daa, 16)", "paired (S03, 90, d374fd2b66cf700e, 98fa37f3275a7ce4, 16)", "paired (S04, 90, 1a46dc5bb0b92e7d, 8a75ba7b245103c6, 5)", "paired (S05, 90, 3462e1e3c1135822, 936d345cea5042e9, 3)", "paired (S06, 90, b0455d090e2c9acb, a391096a0182ce15, 5)", "paired (S07, 90, 31dd21798b0ea22d, 48174802d93758ed, 3)", "paired (S08, 90, 08b1ed092b8b4c7a, a79dcfce0a3ef30f, 4)", "paired (S09, 90, 9c2224e235a923dd, 3a68655771c89e81, 4)", "paired (S10, 90, b21a7da62f90114d, 82037e16fad6f5da, 17)", "paired (S11, 90, fd86c5f42ca550fe, 8095fd236a7c835d, 12)", "paired (S12, 90, 78dffc7d5f1a810d, 5a01cd61fdd83a5c, 4)", "paired (S13, 90, ddea99573545d58a, 6deba6fb76dddc87, 5)", "paired (S02, 730, 69d2c386afddfd43, 12d01a5c17b57ca9, 16)"] },
  { path: ".github/workflows/m4-manager-audit-independent.yml", blob: "df5e17d97a8277fcf2bbe4f34d8063b882146a63",
    pr: [".github/workflows/m4-manager-audit-independent.yml", "tests/codex-m4-alternative-manager-audit.cjs", "prototypes/**", "tools/w6-szenarien.cjs"],
    jobs: ["reproduce (standard-etappen, 3283b7ce2844a8e4, 16780, 1548, 3000, 1200)", "reproduce (s02-werft-etappen-ersatz, abf9e75658e929e4, 11315, 417, 2010, 1404)"] },
  { path: ".github/workflows/m4-u3-ore.yml", blob: "76a136ea22ead7767639fbaaedf7679b43825e1c",
    pr: ["prototypes/welt/welt-kern.js", "prototypes/verbund/konzern-session.js", "prototypes/spiel/**", "tests/m4-u3-house-ore.test.mjs", "tests/m4-u3-ore-browser.cjs", "tests/m4-u5-*", "prototypes/welt/rule200-k7-industry-core.js", ".github/workflows/m4-u3-ore.yml"],
    dispatch: "manual",
    jobs: ["ore-original-node22", "ore-browser (chromium)", "ore-browser (webkit)"] },
  { path: ".github/workflows/m4-u4-gemini-calibration.yml", blob: "fa40c2290ddd88bbd60426bd51d2d4def74032ab",
    dispatch: "consent",
    jobs: ["preflight", "calibration"] },
  { path: ".github/workflows/m4-u4-gemini-mobile.yml", blob: "c39b79aa3ee867aa7e2e467d68c52e210ce9840c",
    dispatch: "consent",
    jobs: ["preflight", "pilot"] },
  { path: ".github/workflows/m4-u4-gemini-visual.yml", blob: "c090f763c4cd1d4e37527b8cbbfbf7d06cba9d25",
    dispatch: "consent",
    jobs: ["preflight", "pilot"] },
  { path: ".github/workflows/m4-u4-mobile-pilot.yml", blob: "cbbd5858b382a45615873979101dde3b53621c1d",
    dispatch: "consent",
    jobs: ["preflight", "pilot"] },
  { path: ".github/workflows/m4-u4-ui-relay.yml", blob: "2caab2019177b89a3225ac487ae8df197de890ce",
    pr: ["scripts/m4-u4-ui-relay.cjs", "scripts/m4-u4-model-runner.cjs", "scripts/m4-u4-startstand.cjs", "tests/m4-u4-startstand.test.cjs", "tests/m4-u4-model-runner.test.cjs", "tests/m4-u4-ui-relay.test.cjs", ".github/workflows/m4-u4-ui-relay.yml", ".github/workflows/m4-u4-mobile-pilot.yml", ".github/workflows/m4-u4-gemini-mobile.yml", "index.html", "prototypes/**"],
    dispatch: "manual",
    jobs: ["relay"] },
  { path: ".github/workflows/m4-u4-visible-controls.yml", blob: "46684d9242231b1ff52026afd189c2592ade6879",
    pr: ["scripts/m4-u4-ui-relay.cjs", "scripts/m4-u4-model-runner.cjs", "scripts/m4-u4-gemini-calibration.cjs", ".github/workflows/m4-u4-gemini-calibration.yml", "scripts/m4-u4-startstand.cjs", "tests/m4-u4-*.cjs", ".github/workflows/m4-u4-visible-controls.yml"],
    dispatch: "manual",
    jobs: ["Browser QA (chromium)", "Browser QA (webkit)"] },
  { path: ".github/workflows/p0-free-handoff.yml", blob: "326f0efeb7cd6b9e70ed6c57ed1daa8f16bfb533",
    pr: [".github/workflows/p0-free-handoff.yml", "tools/p0-free-handoff.cjs", "tests/p0-free-handoff.test.mjs", "docs/P0_FREE_WEITERBETRIEB.md"],
    dispatch: "manual",
    jobs: ["fixtures", "handoff"] },
  { path: ".github/workflows/p1-spielstart.yml", blob: "4a745d08551b9e0e5e0a59bdd0a92ac367d51097",
    pr: ["prototypes/spiel/**", "prototypes/tutorial-manager/**", "prototypes/tutorial-pilot/**", "prototypes/raum/**", "prototypes/flug2d/**", "prototypes/verbund/**", "tests/p2-*", "tests/p1-*", "tests/p4-karriere-patrouille.test.mjs", "tests/p4-karriere-duell.test.mjs", "tests/tutorial-pilot-*", "prototypes/f8-jaeger/**", "prototypes/j4c/duell.js", "prototypes/j4c/patrouille.js", "scripts/build-w5-singlefile.mjs", "index.html", ".github/workflows/p1-spielstart.yml"],
    dispatch: "manual",
    jobs: ["no-file-start-and-core-audit", "real-game-browser (chromium)", "real-game-browser (webkit)"] },
  { path: ".github/workflows/pir-1.yml", blob: "a1dc7826df42075a1aae555a0a4ca54120428028",
    pr: ["prototypes/welt/**", "prototypes/spiel/**", "prototypes/verbund/konzern-session.js", "tests/pir-1*", "tools/pir-wirtschaftsvergleich.cjs", ".github/workflows/pir-1.yml"],
    jobs: ["touch (chromium)", "touch (webkit)", ...scenarioJobs("wirtschaft")] },
  { path: ".github/workflows/w-rule208-compat.yml", blob: "6ccbbe33be66af9bb6c43dc320d3f0b519296911",
    pr: [".github/workflows/w-rule208-compat.yml", "tests/w-20261127-03-rule208-compat.cjs", "tests/w-20261127-03-npc-ore-reservation.test.mjs", "prototypes/welt/**", "prototypes/verbund/**"],
    dispatch: "manual",
    jobs: ["pinned-old-build", ...scenarioJobs("revision-longterm")] },
  { path: ".github/workflows/w5rc1-preflight.yml", blob: "4e4bc08a1935b39dbab64933445a2244c66e2724",
    pr: ["index.html", "aphros-void.html", "scripts/**", "versionen/**", "prototypes/**", "tests/**", "spieltest/w5-rc1/**", "docs/W5RC1_*", ".github/workflows/w5rc1-preflight.yml"],
    dispatch: "manual",
    jobs: ["main-safe-and-all-node22", "ipad-touch-preflight", "NAS delivery – exactly one aphros-void.html"] },
  { path: ".github/workflows/w6-p8a-silicon-status.yml", blob: "658f9eb87faba464c7f439de3ea1ad01425c7b54",
    pr: ["prototypes/spiel/silizium-versorgung.js", "prototypes/spiel/spiel.js", "prototypes/spiel/index.html", "tests/w6-p8a-*", ".github/workflows/w6-p8a-silicon-status.yml"],
    dispatch: "manual",
    jobs: ["original-supply-audit", "public-root-p8-touch (chromium)", "public-root-p8-touch (webkit)"] },
  { path: ".github/workflows/w6-p8g-p2-main-integration.yml", blob: "4415b39b087cc72038f93b58f0bc9a0ae69b6d15",
    pr: ["prototypes/welt/**", "prototypes/flug2d/flug-kern.js", "tests/w6-p8g-*.test.mjs", ".github/workflows/w6-p8g-p2-main-integration.yml"],
    push: {"branches": ["integrate/w6-p8g-rule207-p2-main-20261116"]},
    jobs: ["all-node22", ...scenarioJobs("authentic-crisis-worlds"), "actual-p1-browser-module-bridge (chromium)", "actual-p1-browser-module-bridge (webkit)"] },
  { path: ".github/workflows/w6-p8g-playable-research.yml", blob: "46a42a7c722b4133b933e2205d5026cc498370ac",
    pr: ["prototypes/spiel/**", "prototypes/verbund/konzern-session.js", "prototypes/j4c/flotten-wechsel.js", "tests/w6-p8g-research-career*.?s", ".github/workflows/w6-p8g-playable-research.yml"],
    push: {"branches": ["feat/w6-p8g-career-optin-20261116"]},
    jobs: ["node22-career", "playable-4-touch-sizes (chromium)", "playable-4-touch-sizes (webkit)"] },
]
const pagesWorkflow = {
  path: 'dynamic/pages/pages-build-deployment', external: true, jobs: ['build', 'report-build-status', 'deploy']
}

function workflowPath(value) {
  if (typeof value !== 'string') return null
  const path = value.split('@', 1)[0]
  return path.startsWith(repo + '/') ? path.slice(repo.length + 1) : path
}

const date = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)
  && Number.isFinite(Date.parse(value)) ? value : null
const glob = pattern => new RegExp('^' + pattern.replace(/[.*?]/g, (char, i) => {
  if (char === '*') return pattern[i - 1] === '*' ? '' : pattern[i + 1] === '*' ? '.*' : '[^/]*'
  if (char === '?') return '?'
  return '\\.'
}) + '$')
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

async function githubGet(endpoint, signal, responseLimit) {
  let response
  try {
    response = await exec('gh', [
      'api', '--hostname', 'github.com', '--method', 'GET', '--include',
      '-H', 'X-GitHub-Api-Version: 2022-11-28', endpoint
    ], {
      timeout: 12000, signal, maxBuffer: responseLimit, windowsHide: true,
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
  return { ...parseResponse(response.stdout), bytes: Buffer.byteLength(response.stdout) }
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
  const waiting = []
  let active = 0
  let requests = 0
  let bytes = 0
  let reserved = 0
  const responseLimit = 2 * 1024 * 1024
  async function request(endpoint) {
    if (active >= 6) await new Promise(resolve => waiting.push(resolve))
    else active++
    try {
      if (requests >= 220 || bytes + reserved + responseLimit > 48 * 1024 * 1024 || signal.aborted) {
        throw new ReadError('Abrufbudget erschöpft')
      }
      requests++
      reserved += responseLimit
      try {
        const result = await get(api + endpoint, signal, responseLimit)
        bytes += result.bytes ?? 0
        return result
      } finally {
        reserved -= responseLimit
      }
    } finally {
      const next = waiting.shift()
      if (next) next()
      else active--
    }
  }
  const problem = (label, error) => issues.push({
    source: safeText(label), reason: error instanceof ReadError ? error.message : 'Unerwarteter Lesefehler'
  })
  const object = async (endpoint, label, valid) => {
    try {
      const { data } = await request(endpoint)
      if (!valid(data)) throw new ReadError('Unerwartete Datenform')
      return data
    } catch (error) {
      problem(label, error)
      return null
    }
  }
  const pages = async (endpoint, key, label) => {
    const items = []
    const seenIds = new Set()
    for (let page = 1; page <= 3; page++) {
      try {
        const separator = endpoint.includes('?') ? '&' : '?'
        const { data, next } = await request(endpoint + separator + 'per_page=100&page=' + page)
        const rows = key ? data?.[key] : data
        if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
          throw new ReadError('Unerwartete Listenantwort')
        }
        // Named API lists have stable numeric IDs; PR files are checked by path instead.
        if (key) {
          for (const row of rows) {
            if (!positive(row.id)) throw new ReadError('Fehlende oder ungültige Listen-ID')
            if (seenIds.has(row.id)) throw new ReadError('Doppelte Listen-ID')
            seenIds.add(row.id)
          }
        }
        items.push(...rows)
        if (!next) {
          if (key && data.total_count !== items.length) {
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
      match: patterns => files.items.some(file => patterns.some(pattern => [file.filename, file.previous_filename]
        .some(path => path && glob(pattern).test(path)))),
      touchesWorkflow: path => !complete || files.items.some(file => file.filename === path || file.previous_filename === path),
      complete, changedFiles: pull.changed_files, allowedPaths: allow.map(rule => safeText(rule)),
      files: files.items.filter(hasPath).map(file => ({
        path: safeText(file.filename),
        previousPath: typeof file.previous_filename === 'string' ? safeText(file.previous_filename) : null,
        status: safeText(file.status),
        allowed: allow.length ? check(file.filename) && (!file.previous_filename || check(file.previous_filename)) : null
      }))
    }
  }

  async function definitions(ref, label) {
    if (!ref) return null
    const files = await object('/contents/.github/workflows?ref=' + ref, label, data =>
      Array.isArray(data) && data.length < 1000 && data.every(file =>
        typeof file?.path === 'string' && file.type === 'file' && sha(file.sha))
        && new Set(data.map(file => file.path)).size === data.length)
    return files && new Map(files.map(file => [file.path, file.sha]))
  }

  async function mergeCandidate() {
    if (!pull || pull.state !== 'open' || !sha(pull.merge_commit_sha)) return null
    const commit = await object('/git/commits/' + pull.merge_commit_sha, 'PR / Testmerge', data =>
      data?.sha === pull.merge_commit_sha && sha(data.tree?.sha)
      && Array.isArray(data.parents) && data.parents.every(parent => sha(parent?.sha)))
    if (!commit) return null
    const parents = commit.parents.map(parent => parent.sha)
    return { sha: commit.sha, tree: commit.tree.sha, parents,
      matchesPr: parents.length === 2 && parents[0] === pull.base.sha && parents[1] === pull.head.sha }
  }

  const mainTarget = { label: 'main', ref: 'main', event: 'push', headSha: sha(main?.commit?.sha) }
  const prTarget = pull && {
    label: 'PR #' + pr, ref: pull.head.ref, event: 'pull_request', headSha: pull.head.sha,
    isPr: true, repoId: pull.head.repo?.id, baseRef: pull.base.ref, baseSha: pull.base.sha
  }
  async function pushEvidence() {
    if (!mainTarget.headSha) return { before: null, paths: null }
    const events = await pages('/events', null, 'main / Push-Ereignisse')
    const pushes = events.items.filter(event => event.type === 'PushEvent' && event.repo?.name === repo
      && event.payload?.ref === 'refs/heads/main' && event.payload?.head === mainTarget.headSha)
    const bases = [...new Set(pushes.map(event => sha(event.payload.before)))]
    const before = bases.length === 1 ? bases[0] : null
    if (!events.complete || !before || /^0+$/.test(before) || before === mainTarget.headSha) return { before: null, paths: null }
    const comparison = await object('/compare/' + before + '...' + mainTarget.headSha + '?per_page=1',
      'main / Push-Dateien', data => data?.base_commit?.sha === before && data.merge_base_commit?.sha === before
        && data.status === 'ahead' && positive(data.total_commits) && Array.isArray(data.files)
        && data.files.every(file => typeof file?.filename === 'string'
          && (file.status !== 'renamed' || typeof file.previous_filename === 'string')))
    if (!comparison || comparison.files.length >= 300 || comparison.total_commits > 1000) return { before, paths: null }
    return { before, paths: comparison.files.flatMap(file => [file.filename, file.previous_filename].filter(Boolean)) }
  }

  const [changed, mainFiles, baseFiles, merge, push] = await Promise.all([
    pull && diff(), definitions(mainTarget.headSha, 'main / Workflow-Definitionen'),
    pull && (pull.base.sha !== mainTarget.headSha ? definitions(pull.base.sha, 'PR / Basisdefinitionen') : null),
    mergeCandidate(), pushEvidence()
  ])
  const prFiles = merge?.matchesPr ? await definitions(merge.sha, 'PR / Testmerge-Definitionen')
    : pull?.base.sha === mainTarget.headSha ? mainFiles : baseFiles

  function applies(target, workflow) {
    if (workflow.external) return 'external'
    if (target.isPr) {
      if (!workflow.pr) return 'not_applicable'
      if (!changed?.complete || changed.changedFiles > 300) return 'unknown'
      return changed.match(workflow.pr) ? 'required' : 'not_applicable'
    }
    if (!workflow.push?.branches.includes(target.ref)) return 'not_applicable'
    if (!workflow.push.paths) return 'required'
    if (!push.paths) return 'unknown'
    return workflow.push.paths.some(pattern => push.paths.some(path => glob(pattern).test(path))) ? 'required' : 'not_applicable'
  }

  function checkJobs(workflow, target, result) {
    const conditional = workflow.path.endsWith('/ui-regression.yml') ? [
      ...(!target.isPr || target.baseRef !== 'feat/sicherheitszonen' ? ['sicherheitsgeografie-vergleich'] : []),
      ...(!target.isPr ? ['wirtschaft-v10-referenz'] : [])
    ] : workflow.path.endsWith('/p0-free-handoff.yml') ? ['handoff'] : []
    return workflow.jobs.map(name => {
      const matches = result.jobs.filter(job => job.matches === name)
      const required = !conditional.includes(name)
      let state = 'unknown'
      if (result.complete && matches.length <= 1) {
        state = matches.length ? matches[0].status : required ? 'missing' : 'not_applicable'
        if (!required && state === 'skipped') state = 'not_applicable'
      }
      return { name, required, status: state, jobId: matches.length === 1 ? matches[0].id : null }
    })
  }

  async function readAttempt(run, attempt, label, workflow, testMergeSha) {
    const path = '/actions/runs/' + run.id + '/attempts/' + attempt
    const current = attempt === run.run_attempt
    const [result, metadata] = await Promise.all([
      pages(path + '/jobs', 'jobs', label + (current ? ' / Jobs' : ' / frühere Jobs')),
      current ? run : object(path, label + ' / Versuch ' + attempt, data =>
        data?.id === run.id && data.run_attempt === attempt && data.head_sha === run.head_sha && data.event === run.event)
    ])
    const jobs = result.items.map(job => {
      const stepList = Array.isArray(job.steps) ? job.steps : []
      const steps = stepList.slice(0, 80).map(step => ({
        number: positive(step?.number) ? step.number : null, name: safeText(step?.name),
        status: status(step ?? {})
      }))
      const contextSha = sha(job.head_sha)
      const belongs = job.run_id === run.id && job.run_attempt === attempt && Boolean(contextSha)
        && (contextSha === run.head_sha || contextSha === testMergeSha)
      const started = date(job.started_at)
      const ended = date(job.completed_at)
      const reportedStatus = status(job)
      const diagnostic = steps.find(step => step.status === 'failure' || step.status === 'timed_out')
        ?? steps.find(step => step.status === 'cancelled' || step.status === 'startup_failure') ?? null
      return {
        id: job.id, number: positive(job.run_attempt) ? job.run_attempt : null,
        matches: workflow.jobs.includes(job.name) ? job.name : null,
        name: safeText(job.name), status: belongs ? reportedStatus : 'unknown', reportedStatus,
        contextSha, belongs,
        url: web + '/actions/runs/' + run.id + '/job/' + job.id,
        durationSeconds: started && ended && ended >= started ? (Date.parse(ended) - Date.parse(started)) / 1000 : null,
        steps, stepsComplete: Array.isArray(job.steps) && stepList.length <= 80
          && steps.every(step => positive(step.number) && step.status !== 'unknown')
          && new Set(steps.map(step => step.number)).size === steps.length,
        diagnostic: belongs ? diagnostic : null,
        evidence: { checkout: 'unknown', tap: 'unknown', markers: 'unknown' }
      }
    })
    const complete = result.complete && jobs.every(job => job.belongs)
    if (result.complete && !complete) problem(label + ' / Jobs', new ReadError('Job, Run, SHA oder Versuch nicht zuordenbar'))
    return { attempt, complete, jobs, status: metadata ? status(metadata) : 'unknown' }
  }

  async function inspect(target, workflow, catalog, exact, files) {
    const label = target.label + ' / ' + workflow.path.split('/').at(-1)
    const definitionsForPath = catalog.items.filter(item => workflowPath(item.path) === workflow.path)
    const definition = definitionsForPath.length === 1 ? definitionsForPath[0] : null
    const knownBlob = files?.get(workflow.path) ?? null
    const touched = target.isPr && !merge?.matchesPr && changed?.touchesWorkflow(workflow.path)
    const definitionStatus = workflow.external ? 'system'
      : !workflow.blob || !files || touched || !catalog.complete || definitionsForPath.length > 1 ? 'unknown'
        : knownBlob !== workflow.blob ? 'drift' : 'verified'
    let applicability = applies(target, workflow)
    const exactForWorkflow = definition && !workflow.external && applicability !== 'not_applicable'
      ? await pages('/actions/workflows/' + definition.id + '/runs?' + new URLSearchParams({
        branch: target.ref, event: target.event, head_sha: target.headSha
      }), 'workflow_runs', label + ' / aktueller SHA')
      : { items: exact.items.filter(run => workflowPath(run.path) === workflow.path), complete: exact.complete }
    const row = {
      path: safeText(workflow.path), definition: definition ? safeText(definition.state) : null,
      definitionStatus, definitionBlob: knownBlob, definitionListComplete: catalog.complete,
      triggers: { pullRequestPaths: workflow.pr ?? null, push: workflow.push ?? null, dispatch: workflow.dispatch ?? null },
      applicability, status: 'unknown', coverage: 'unknown', relation: null, run: null,
      runsComplete: exact.complete && exactForWorkflow.complete, expectedJobs: [], expectedJob: { name: workflow.jobs[0] ?? null, status: null },
      jobs: [], attempts: [], artifacts: []
    }
    if (!target.headSha) return row

    const matching = run => run.head_branch === target.ref
      && (workflow.external ? ['dynamic', 'push'].includes(run.event) : run.event === target.event)
      && (!target.isPr || (positive(target.repoId) && run.head_repository?.id === target.repoId))
    const linkedPr = run => Array.isArray(run.pull_requests)
      ? run.pull_requests.find(item => item?.number === pr && item.base?.ref === target.baseRef
        && (!item.head?.sha || item.head.sha === run.head_sha))
      : null
    const plausible = run => matching(run) && (!target.isPr || linkedPr(run)
      || !Array.isArray(run.pull_requests) || !run.pull_requests.length)
    const ranked = runs => [...runs].sort((a, b) => positive(a.run_number) && positive(b.run_number)
      ? b.run_number - a.run_number || b.id - a.id : b.id - a.id)
    const candidates = ranked(exactForWorkflow.items.filter(run => plausible(run) && run.head_sha === target.headSha))
    let run = candidates[0]
    row.candidates = candidates.map(item => ({ id: item.id, attempt: positive(item.run_attempt) ? item.run_attempt : null,
      status: status(item), reportedBaseSha: target.isPr ? sha(linkedPr(item)?.base?.sha) : null }))
    if (!run && row.runsComplete && !workflow.external && definition && applicability !== 'not_applicable') {
      const query = new URLSearchParams({ branch: target.ref, event: target.event })
      const recent = await pages('/actions/workflows/' + definition.id + '/runs?' + query, 'workflow_runs', label + ' / Branch-Verlauf')
      row.runsComplete = recent.complete
      run = ranked(recent.items.filter(item => plausible(item) && sha(item.head_sha)
        && item.head_sha !== target.headSha && (!target.isPr || linkedPr(item))))[0]
      if (recent.items.some(item => plausible(item) && item.head_sha === target.headSha)) {
        row.runsComplete = false
        problem(label, new ReadError('Run-Liste änderte sich während des Abrufs'))
      }
    }
    if (!run) {
      row.status = !row.runsComplete || definitionStatus !== 'verified' ? 'unknown'
        : applicability === 'not_applicable' ? 'not_applicable'
          : definition?.state !== 'active' ? 'unknown'
          : applicability === 'required' ? 'missing' : 'unknown'
      row.coverage = row.status
      if (row.status === 'missing') row.expectedJobs = checkJobs(workflow, target, { complete: true, jobs: [] })
      return row
    }

    const reportedBaseSha = target.isPr ? sha(linkedPr(run)?.base?.sha) : null
    const relation = run.head_sha !== target.headSha ? 'stale_head'
      : !target.isPr ? 'current'
        : !reportedBaseSha ? 'unverified_base'
          : reportedBaseSha === target.baseSha ? 'current' : 'stale_base'
    if (relation === 'current' && applicability === 'unknown' && !target.isPr) applicability = 'observed'
    row.applicability = applicability
    row.relation = relation
    row.status = status(run)
    const attempt = positive(run.run_attempt) ? run.run_attempt : null
    const runPath = '/actions/runs/' + run.id
    row.run = {
      id: run.id, attempt, workflowId: positive(run.workflow_id) ? run.workflow_id : null, url: web + runPath + (attempt ? '/attempts/' + attempt : ''),
      headSha: sha(run.head_sha), reportedBaseSha, checkoutSha: null, checkoutTree: null
    }
    if (!attempt) {
      problem(label, new ReadError('Run-Versuch fehlt'))
      return row
    }
    const attempts = Array.from({ length: Math.min(attempt, 3) }, (_, index) => attempt - index)
    if (attempts.length !== attempt) problem(label, new ReadError('Versuchslimit erreicht'))
    const [results, artifacts] = await Promise.all([
      Promise.all(attempts.map(number => readAttempt(run, number, label, workflow,
        target.isPr && relation === 'current' && merge?.matchesPr ? merge.sha : null))),
      pages(runPath + '/artifacts', 'artifacts', label + ' / Artefakte')
    ])
    const current = results[0]
    const again = await object(runPath, label + ' / erneute Run-Prüfung', data => data?.id === run.id)
    const runStable = again ? again.run_attempt === attempt && status(again) === row.status
      && again.head_sha === run.head_sha && again.event === run.event
      && (!target.isPr || sha(linkedPr(again)?.base?.sha) === reportedBaseSha) : null
    if (runStable === false) problem(label, new ReadError('Run-Status oder Versuch änderte sich während des Abrufs'))
    row.run.stable = runStable
    row.jobsComplete = current.complete
    row.attemptsComplete = attempts.length === attempt && results.every(item => item.complete && item.status !== 'unknown')
    row.attempts = results.map((result, index) => ({
      ...result, url: web + runPath + '/attempts/' + result.attempt,
      status: index === 0 && !runStable ? 'unknown' : result.status
    }))
    row.jobs = current.jobs
    row.expectedJobs = checkJobs(workflow, target, current)
    row.expectedJob = row.expectedJobs[0] ?? row.expectedJob
    row.artifactsComplete = artifacts.complete
    row.artifacts = artifacts.items.map(artifact => ({
      id: artifact.id, name: safeText(artifact.name), scope: 'run', attempt: 'unknown',
      sizeBytes: Number.isSafeInteger(artifact.size_in_bytes) ? artifact.size_in_bytes : null,
      expired: typeof artifact.expired === 'boolean' ? artifact.expired : null,
      createdAt: date(artifact.created_at), expiresAt: date(artifact.expires_at)
    }))
    const gaps = row.expectedJobs.filter(job => job.required ? job.status !== 'success' : job.status !== 'not_applicable')
    const unexpected = current.jobs.some(job => !job.matches || (job.status === 'success'
      && (!job.stepsComplete || !job.steps.length || job.steps.some(step => ['failure', 'cancelled', 'timed_out', 'startup_failure'].includes(step.status)))))
    row.coverage = !exact.complete || !row.runsComplete || !runStable || !current.complete || !artifacts.complete
      || (relation === 'current' && applicability === 'unknown')
      || !['verified', 'system'].includes(definitionStatus) || (workflow.blob && definition?.state !== 'active') ? 'unknown'
      : relation !== 'current' ? relation
        : row.status !== 'success' ? row.status
          : gaps.length || unexpected ? 'incomplete_jobs'
            : applicability === 'not_applicable' ? 'unexpected_run' : 'metadata_success'
    return row
  }

  async function inspectTarget(target, files) {
    const exact = target.headSha ? await pages('/actions/runs?' + new URLSearchParams({
      branch: target.ref, head_sha: target.headSha
    }), 'workflow_runs', target.label + ' / Runs') : { items: [], complete: false }
    const external = target.isPr ? [] : [pagesWorkflow]
    const known = [...workflows, ...external]
    const paths = new Set(known.map(workflow => workflow.path))
    const unknown = [...new Set([...catalog.items.map(item => workflowPath(item.path)),
      ...exact.items.filter(run => run.event === target.event).map(run => workflowPath(run.path)), ...(files?.keys() ?? [])])]
      .filter(path => typeof path === 'string' && !paths.has(path) && path !== pagesWorkflow.path)
      .slice(0, 24).map(path => ({ path, jobs: [] }))
    const rows = await Promise.all([...known, ...unknown].map(workflow => inspect(target, workflow, catalog, exact, files)))
    return { rows, discoveryComplete: exact.complete && catalog.complete && unknown.length < 24 }
  }

  async function pagesDeployment() {
    if (!mainTarget.headSha) return { status: 'unknown', sha: null }
    const query = new URLSearchParams({ sha: mainTarget.headSha, environment: 'github-pages' })
    const deployments = await pages('/deployments?' + query, null, 'Pages / Deployments')
    const recent = deployments.items.filter(item => positive(item.id) && item.sha === mainTarget.headSha
      && item.environment === 'github-pages').sort((a, b) => b.id - a.id)[0]
    if (!deployments.complete || !recent || new Set(deployments.items.map(item => item.id)).size !== deployments.items.length) {
      return { status: 'unknown', sha: null }
    }
    const states = await pages('/deployments/' + recent.id + '/statuses', null, 'Pages / Deploymentstatus')
    const latest = states.items.filter(item => positive(item.id)).sort((a, b) => b.id - a.id)[0]
    const state = states.complete && latest && states.items.every(item => positive(item.id))
      && new Set(states.items.map(item => item.id)).size === states.items.length
      && /^(success|failure|error|inactive|pending|queued|in_progress)$/.test(latest.state)
      ? latest.state : 'unknown'
    return { status: state, sha: recent.sha, deploymentId: recent.id, statusId: latest?.id ?? null }
  }

  const [mainRuns, prRuns, deployment] = await Promise.all([
    inspectTarget(mainTarget, mainFiles), prTarget && inspectTarget(prTarget, prFiles), pagesDeployment()
  ])
  const [mainAgain, pullAgain] = await Promise.all([
    main && readMain('main / erneute Prüfung'),
    pull && readPr('PR / erneute Prüfung')
  ])
  const mainStable = mainAgain ? mainAgain.commit.sha === mainTarget.headSha : null
  const prStable = pullAgain ? pullAgain.head.sha === prTarget.headSha && pullAgain.head.ref === prTarget.ref
    && pullAgain.base.sha === prTarget.baseSha && pullAgain.base.ref === prTarget.baseRef
    && pullAgain.changed_files === pull.changed_files && pullAgain.state === pull.state
    && pullAgain.merge_commit_sha === pull.merge_commit_sha && pullAgain.head.repo?.id === pull.head.repo?.id : null
  if (mainStable === false) problem('main', new ReadError('SHA änderte sich während des Abrufs'))
  if (prStable === false) problem('PR', new ReadError('Head, Base oder Dateimenge änderte sich während des Abrufs'))
  for (const [target, stable] of [[mainRuns, mainStable], [prRuns, prStable]]) {
    if (target && stable !== true) {
      for (const row of target.rows) row.coverage = 'unknown'
    }
  }
  return {
    schema: 2, observedAt: now.toISOString(), repository: repo, sourceSha: sha(sourceSha),
    scope: 'ci_metadata_only',
    main: { sha: mainTarget.headSha, stable: mainStable, workflows: mainRuns.rows.filter(row => row.path !== pagesWorkflow.path),
      discoveryComplete: mainRuns.discoveryComplete, pushBeforeSha: mainStable === true ? push.before : null,
      pushPathsKnown: mainStable === true && Boolean(push.paths) },
    pages: { workflow: mainRuns.rows.find(row => row.path === pagesWorkflow.path),
      deployment: mainStable === true ? deployment : { status: 'unknown', sha: null } },
    publicRoot: { status: 'unknown', evidence: 'separate_http_browser_check' },
    pr: pr && {
      number: pr, url: web + '/pull/' + pr, stable: prStable, headSha: prTarget?.headSha ?? null,
      headRef: safeText(prTarget?.ref) || null, baseSha: prTarget?.baseSha ?? null,
      baseRef: safeText(prTarget?.baseRef) || null,
      baseMatchesMain: prTarget?.baseRef === 'main' && mainTarget.headSha ? prTarget.baseSha === mainTarget.headSha : null,
      testMerge: merge, discoveryComplete: prRuns.discoveryComplete,
      diff: { complete: changed.complete, changedFiles: changed.changedFiles,
        allowedPaths: changed.allowedPaths, files: changed.files },
      workflows: prRuns.rows
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
    report.repository + ' · ' + report.observedAt + ' · Werkzeug ' + code(report.sourceSha),
    'Testzahlen und fachliche Abnahme stehen in den Originaljobs. Dieser Bericht zeigt CI-Metadaten.', ''
  ]
  const stability = value => value === true ? 'stabil' : value === false ? 'während Abruf geändert' : 'unbestätigt'
  const abbreviate = path => path.split('/').at(-1)
  const link = (label, url) => '[' + label + '](' + url + ')'
  const summarize = rows => {
    const shown = rows.filter(row => row.coverage !== 'not_applicable')
    for (const row of shown.slice(0, 25)) {
      const required = row.expectedJobs.filter(job => job.required)
      const success = required.filter(job => job.status === 'success').length
      const blocked = row.jobs.filter(job => (job.status !== 'success' || job.diagnostic) && row.expectedJobs
        .find(expected => expected.jobId === job.id)?.status !== 'not_applicable')
      const first = blocked[0]
      const missing = required.find(job => job.status === 'missing')
      lines.push('- ' + md(abbreviate(row.path)) + ' · ' + code(row.coverage)
        + (row.coverage === row.status ? '' : ' · Run-Status ' + code(row.status))
        + (row.relation && row.relation !== 'current' ? ' · ' + code(row.relation) : '')
        + (row.definitionStatus === 'drift' ? ' · Definition geändert' : '')
        + (row.run ? ' · ' + link('Run ' + row.run.id + '/' + (row.run.attempt ?? '?'), row.run.url) : '')
        + (required.length ? ' · Jobs ' + success + '/' + required.length : '')
        + (first ? ' · ' + link(md(first.name), first.url) + ' ' + code(first.status) : '')
        + (first?.diagnostic ? ' · Schritt ' + md(first.diagnostic.name) : '')
        + (missing ? ' · fehlt ' + md(missing.name) : '')
        + (blocked.length > 1 ? ' (+' + (blocked.length - 1) + ')' : ''))
    }
    const omitted = rows.length - Math.min(shown.length, 25)
    if (omitted) lines.push('- Weitere ' + omitted + ' Workflows im JSON, einschließlich nicht zutreffender Trigger.')
    if (rows.some(row => row.jobsComplete === false)) lines.push('- Jobliste unvollständig. Einzelheiten im JSON.')
  }
  lines.push('## Main-Push', '', code(report.main.sha) + ' · ' + stability(report.main.stable)
    + (report.main.discoveryComplete ? '' : ' · Run-Erfassung unvollständig'))
  summarize(report.main.workflows)
  if (report.pr) {
    const pr = report.pr
    lines.push('', '## ' + link('PR #' + pr.number, pr.url), '',
      'Head ' + md(pr.headRef) + ' ' + code(pr.headSha) + ' · Base ' + md(pr.baseRef) + ' ' + code(pr.baseSha),
      'Stand ' + stability(pr.stable) + (pr.baseMatchesMain === false ? ' · Base weicht von main ab.' : ''),
      'Testmerge-Kandidat ' + code(pr.testMerge?.sha) + ' · Elternbezug '
      + (pr.testMerge?.matchesPr ? 'belegt' : 'unbestätigt') + ' · tatsächlicher Job-Checkout unknown')
    if (pr.diff) {
      const violations = pr.diff.files.filter(file => file.allowed === false)
      lines.push('Dateien ' + pr.diff.files.length + '/' + pr.diff.changedFiles
        + (pr.diff.complete ? '' : ' (unvollständig)') + ' · Pfadgrenze '
        + (!pr.diff.allowedPaths.length ? 'offen' : violations.length + ' außerhalb'))
      for (const file of violations.slice(0, 5)) {
        lines.push('- Außerhalb · ' + (file.previousPath ? md(file.previousPath) + ' → ' : '') + md(file.path))
      }
    }
    summarize(pr.workflows)
  }
  lines.push('', '## Veröffentlichung', '',
    'Pages-Deployment ' + code(report.pages.deployment.status) + ' · SHA ' + code(report.pages.deployment.sha),
    'Öffentlicher Root ' + code(report.publicRoot.status) + ' · separater HTTP-/Browsernachweis erforderlich.')
  summarize([report.pages.workflow])
  if (report.issues.length) {
    lines.push('', '## Abrufgrenzen und Fehler', '')
    for (const issue of report.issues.slice(0, 8)) lines.push('- ' + md(issue.source) + ' · ' + md(issue.reason))
    if (report.issues.length > 8) lines.push('- Weitere Abruflücken im JSON.')
  }
  const target = report.pr ?? report.main
  const blocked = target.stable !== true || !target.discoveryComplete
    || target.workflows.some(row => !['metadata_success', 'not_applicable'].includes(row.coverage))
  lines.push('', '**Nächstes Gate** · ' + (blocked
    ? 'Offene CI-Evidenz anhand der Originaljobs klären.'
    : 'Checkout, Testzahlen und fachliche Marker an den Originaljobs bestätigen.'))
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
