import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const tool = path.resolve(import.meta.dirname, '../tools/check-doc-links.cjs');
const { targetsFromMarkdown } = require(tool);

function fixture(t, markdown, targets = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'av-links-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const docs = path.join(dir, 'docs');
  fs.mkdirSync(docs);
  const source = path.join(docs, 'source.md');
  fs.writeFileSync(source, markdown);
  for (const name of targets) {
    const target = path.join(dir, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, '# Exists\n');
  }
  const run = spawnSync(process.execPath, [tool, source], { encoding: 'utf8', cwd: dir });
  assert.equal(run.error, undefined);
  return run;
}

test('existing relative target exits 0', t => {
  const run = fixture(t, '[Doc](other.md)', ['docs/other.md']);
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /1 lokale Ziele, 0 Fehler/);
});
test('missing target exits 1 and reports file and line', t => {
  const run = fixture(t, 'First line\n[Broken](missing.md)');
  assert.equal(run.status, 1);
  assert.match(run.stderr, /source\.md:2: Zieldatei fehlt: missing\.md/);
});
test('parent-relative path resolves from source directory', t => {
  const run = fixture(t, '[Roadmap](../AGENTS.md)', ['AGENTS.md']);
  assert.equal(run.status, 0, run.stderr);
});
test('fragment is ignored when checking existence', t => {
  const run = fixture(t, '[Section](existing.md#chapter-one)', ['docs/existing.md']);
  assert.equal(run.status, 0, run.stderr);
});
test('percent-encoded spaces in paths are decoded', t => {
  const run = fixture(t, '[Doc](my%20folder/my%20file.md)', ['docs/my folder/my file.md']);
  assert.equal(run.status, 0, run.stderr);
});
test('external https, mailto and anchor-only links are ignored', t => {
  const run = fixture(t, '[Web](https://example.com/file.md) [Mail](mailto:person@example.com) [Anchor](#chapter)');
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /0 lokale Ziele/);
});
test('multiple links report every missing target with correct line', t => {
  const run = fixture(t, '[Ok](ok.md) [Bad](bad.md)\n[Also missing](another.md)', ['docs/ok.md']);
  assert.equal(run.status, 1);
  assert.match(run.stdout, /3 lokale Ziele, 2 Fehler/);
  assert.match(run.stderr, /source\.md:1: Zieldatei fehlt: bad.md/);
  assert.match(run.stderr, /source\.md:2: Zieldatei fehlt: another.md/);
});
test('image files and reference link definitions are checked', t => {
  const run = fixture(t, '![Image](diagram.svg)\n[Documentation][guide]\n\n[guide]: ../guide.md', ['docs/diagram.svg', 'guide.md']);
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /2 lokale Ziele/);
});
test('fenced and inline code do not create spurious links', t => {
  const run = fixture(t, '`[fake](no.md)`\n```md\n[also fake](no.md)\n```\n[real](ok.md)', ['docs/ok.md']);
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /1 lokale Ziele/);
});
test('angle targets, optional title and parentheses in path', t => {
  const run = fixture(t, '[One](<space name.md> "Title") [Two](part(one).md "more")',
    ['docs/space name.md', 'docs/part(one).md']);
  assert.equal(run.status, 0, run.stderr);
});
test('invalid URL encoding is reported rather than throwing', t => {
  const run = fixture(t, '[Bad](%not-encoded.md)');
  assert.equal(run.status, 1);
  assert.match(run.stderr, /ungültige URL-Kodierung/);
});
test('nested inline link labels do not break extraction', () => {
  assert.deepEqual(targetsFromMarkdown('[A [nested] label](one.md)\n[x](two.md)').map(x => x.target), ['one.md', 'two.md']);
});
