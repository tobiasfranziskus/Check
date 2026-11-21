#!/usr/bin/env node
/* P0: read-only audit for local Markdown file targets. No network calls or dependencies. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_FILES = ['AGENTS.md', 'docs/ROADMAP.md', 'docs/PROJEKTSTATUS.md'];

function escaped(s, index) {
  let slashes = 0;
  for (let j = index - 1; j >= 0 && s[j] === '\\'; j--) slashes++;
  return slashes % 2 === 1;
}

function maskInlineCode(text) {
  const out = text.split('');
  for (let i = 0; i < text.length;) {
    if (text[i] !== '`' || escaped(text, i)) { i++; continue; }
    let n = 1;
    while (text[i + n] === '`') n++;
    const closing = '`'.repeat(n);
    let at = text.indexOf(closing, i + n);
    while (at >= 0 && text[at + n] === '`') at = text.indexOf(closing, at + n);
    if (at < 0) { i += n; continue; }
    for (let j = i; j < at + n; j++) out[j] = ' ';
    i = at + n;
  }
  return out.join('');
}

function closingBracket(s, start, open, close) {
  let depth = 0;
  let quote = false;
  for (let i = start; i < s.length; i++) {
    if (escaped(s, i)) continue;
    const c = s[i];
    if (open === '(' && c === '<' && depth === 1) quote = true;
    else if (open === '(' && c === '>' && quote) quote = false;
    if (quote) continue;
    if (c === open) depth++;
    else if (c === close && --depth === 0) return i;
  }
  return -1;
}

function destination(raw) {
  const s = raw.trimStart();
  if (!s) return null;
  if (s[0] === '<') {
    const end = s.indexOf('>');
    return end < 0 ? null : s.slice(1, end);
  }
  let nest = 0;
  for (let i = 0; i < s.length; i++) {
    if (escaped(s, i)) continue;
    if (s[i] === '(') nest++;
    else if (s[i] === ')' && nest) nest--;
    else if (/\s/.test(s[i]) && nest === 0) return s.slice(0, i).replace(/\\([ ()\\])/g, '$1');
  }
  return s.replace(/\\([ ()\\])/g, '$1');
}

function inlineTargets(line) {
  const targets = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== '[' || escaped(line, i)) continue;
    const endLabel = closingBracket(line, i, '[', ']');
    if (endLabel < 0) continue;
    let cursor = endLabel + 1;
    while (cursor < line.length && /[ \t]/.test(line[cursor])) cursor++;
    if (line[cursor] !== '(' || escaped(line, cursor)) { i = endLabel; continue; }
    const end = closingBracket(line, cursor, '(', ')');
    if (end < 0) { i = endLabel; continue; }
    const target = destination(line.slice(cursor + 1, end));
    if (target !== null) targets.push(target);
    i = end;
  }
  return targets;
}

function targetsFromMarkdown(content) {
  const links = [];
  let fence = null;
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const original = lines[i];
    const marker = original.match(/^ {0,3}(`{3,}|~{3,})/);
    if (marker) {
      const kind = marker[1][0], length = marker[1].length;
      if (!fence) { fence = { kind, length }; continue; }
      if (fence.kind === kind && length >= fence.length &&
          /^\s*$/.test(original.slice(marker[0].length))) { fence = null; continue; }
    }
    if (fence) continue;
    const line = maskInlineCode(original);
    const definition = line.match(/^ {0,3}\[[^\]]+\]:\s*(.*)$/);
    if (definition) {
      const target = destination(definition[1]);
      if (target !== null) links.push({ line: i + 1, target });
      continue;
    }
    for (const target of inlineTargets(line)) links.push({ line: i + 1, target });
  }
  return links;
}

function localPath(target, source) {
  if (!target || target[0] === '#' || target.startsWith('//') ||
      /^[a-z][a-z\d+.-]*:/i.test(target)) return null;
  const clean = target.split(/[?#]/, 1)[0];
  if (!clean) return null;
  let decoded;
  try { decoded = decodeURIComponent(clean); }
  catch { return { error: 'ungültige URL-Kodierung', path: clean }; }
  const dest = decoded.startsWith('/')
    ? path.resolve(ROOT, '.' + decoded)
    : path.resolve(path.dirname(source), decoded);
  return { path: dest };
}

function audit(files) {
  const problems = [];
  let checked = 0;
  for (const file of files) {
    const source = path.resolve(file);
    let contents;
    try { contents = fs.readFileSync(source, 'utf8'); }
    catch (err) {
      problems.push({ source, line: 0, target: file, reason: 'Quelldatei nicht lesbar (' + (err.code || err.message) + ')' });
      continue;
    }
    for (const { line, target } of targetsFromMarkdown(contents)) {
      const resolved = localPath(target, source);
      if (!resolved) continue;
      checked++;
      if (resolved.error) {
        problems.push({ source, line, target, reason: resolved.error });
      } else if (!fs.existsSync(resolved.path)) {
        problems.push({ source, line, target, reason: 'Zieldatei fehlt' });
      }
    }
  }
  return { checked, problems };
}

function main(args = process.argv.slice(2)) {
  const files = args.length ? args.map(a => path.resolve(a)) : DEFAULT_FILES.map(a => path.join(ROOT, a));
  const result = audit(files);
  for (const p of result.problems) {
    const name = path.relative(process.cwd(), p.source) || p.source;
    console.error(`${name}:${p.line}: ${p.reason}: ${p.target}`);
  }
  console.log(`Dokumentations-Linkprüfung: ${files.length} Dateien, ${result.checked} lokale Ziele, ${result.problems.length} Fehler`);
  return result.problems.length ? 1 : 0;
}

if (require.main === module) process.exitCode = main();
module.exports = { audit, destination, inlineTargets, targetsFromMarkdown, localPath, main };
