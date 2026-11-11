// Entwicklungswerkzeug (kein Spielbestandteil): liest aus dem ausgeführten Code – nicht aus
// Dateinamen oder Berichten – welche Simulationskerne, Regelprofile, Speicherablagen und
// Einstiege im Arbeitsbaum existieren. Aufruf: node tools/bestandsaufnahme.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const alle = (dir, filter, out = []) => {
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const p = path.posix.join(dir, e.name);
    if (e.isDirectory()) alle(p, filter, out); else if (filter(p)) out.push(p);
  }
  return out.sort();
};
const kurz = (text) => createHash('sha1').update(text).digest('hex').slice(0, 10);
const einzig = (xs) => [...new Set(xs)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

// 1. Simulationskerne: Dateien mit eigenem Minuten-Tick (m_core_step) – auch eingebettet in HTML.
const kandidaten = [...alle('prototypes', (p) => p.endsWith('.js')), 'index.html', 'aphros-void.html',
  ...alle('versionen', (p) => p.endsWith('.html')), ...alle('spieltest', (p) => p.endsWith('.html'))];
const kerne = [];
for (const p of kandidaten) {
  const t = lies(p);
  if (!/const m_core_step\s*=/.test(t)) continue;
  const regeln = einzig([...t.matchAll(/rulesVersion\s*[:=]\s*(\d+)/g)].map((m) => Number(m[1])));
  const forschung = einzig([...t.matchAll(/\?\s*(19\d)\s*:/g), ...t.matchAll(/rulesVersion=(19\d)/g)].map((m) => Number(m[1])));
  const start = [...t.matchAll(/id:\s*'([a-z_0-9]+)',\s*kind:\s*'[a-z0-9-]+',\s*cash:\s*(\d+)/g)];
  kerne.push({ datei: p, bytes: t.length, inhalt: kurz(t.replace(/^<!--.*?-->\n/, '')),
    regelversionen: einzig([...regeln, ...forschung]), eingebettet: p.endsWith('.html'),
    module: einzig([...t.matchAll(/const (m_(?:data|core)_[a-z0-9_]+)\s*=/g)].map((m) => m[1])).length });
}
// Gleiche Kerne (z. B. index.html = aphros-void.html, eingebettete Kopie der Quelldatei) zusammenfassen.
const quelle = lies('prototypes/w5ac/rule191-w5-ferry-core.js');
for (const k of kerne) k.enthaeltAktivenKern = k.eingebettet && lies(k.datei).includes(quelle.slice(0, 4000));

// 2. Wrapper/Kopplungen ohne eigenen Wirtschaftstick, aber mit eigener Regelkennung.
const huellen = [];
for (const p of alle('prototypes', (x) => x.endsWith('.js'))) {
  const t = lies(p);
  if (/const m_core_step\s*=/.test(t)) continue;
  const profil = [...t.matchAll(/(?:const PROFIL\s*=\s*|profil: 'K1', regel: )(19\d)/g)].map((m) => Number(m[1]));
  if (profil.length) huellen.push({ datei: p, regelkennung: einzig(profil) });
}

// 3. Speicherablagen (IndexedDB-Namen) und wer sie öffnet.
const ablagen = [];
for (const p of [...alle('prototypes', (x) => /\.(js|html)$/.test(x)), 'index.html', ...alle('versionen', (x) => x.endsWith('.html'))]) {
  const t = lies(p);
  if (!/indexedDB\.open\(/.test(t)) continue;
  // Nur Namen, die tatsächlich als Datenbank geöffnet werden (direkt oder über eine Konstante).
  const direkt = [...t.matchAll(/indexedDB\.open\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const konstanten = [...t.matchAll(/indexedDB\.open\(\s*([A-Za-z_$][\w$]*)/g)].map((m) => m[1]);
  const ueberKonstante = konstanten.flatMap((k) => [...t.matchAll(new RegExp('\\b' + k + '\\s*=\\s*[\'"]([^\'"]+)[\'"]', 'g'))].map((m) => m[1]));
  const sonst = [...t.matchAll(/(?:DB_NAME|dbName|database|DATENBANK)\w*\s*[:=]\s*['"](aphros-void[a-z0-9-]*)['"]/g)].map((m) => m[1]);
  // Namen, die über einen Ausdruck gewählt werden (frühere Forschungsablagen je Regel).
  const weitere = [...t.matchAll(/['"](aphros-void(?:-[a-z0-9]+)*)['"]/g)].map((m) => m[1]).filter((n) => /^aphros-void$|-v\d+$|-save$/.test(n));
  ablagen.push({ datei: p, datenbanken: einzig([...direkt, ...ueberKonstante, ...sonst, ...weitere]),
    loescht: /deleteDatabase|objectStore\([^)]*\)\.clear\(|[sS]tore\.clear\(/.test(t) });
}

// 4. Einstiege (HTML-Seiten) mit dem Kern, den sie laden.
const einstiege = [];
for (const p of ['index.html', 'aphros-void.html', ...alle('prototypes', (x) => x.endsWith('.html')),
  ...alle('spieltest', (x) => x.endsWith('.html')), ...alle('versionen', (x) => x.endsWith('.html'))]) {
  const t = lies(p);
  const skripte = [...t.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map((m) => path.posix.normalize(path.posix.join(path.posix.dirname(p), m[1])));
  const inline = [...t.matchAll(/data-inlined-from="([^"]+\.js)"/g)].map((m) => m[1]);
  const kern = [...skripte, ...inline].filter((s) => /core|kern/.test(s)).map((s) => s.replace(/^prototypes\//, '').replace(/^\.\.\//, ''));
  einstiege.push({ datei: p, kern: kern.length ? einzig(kern) : (/const m_core_step\s*=/.test(t) ? ['eingebettet'] : ['—']),
    titel: (t.match(/<title>([^<]*)<\/title>/) || [, ''])[1] });
}

const bericht = { kerne, huellen, ablagen, einstiege,
  kennzahlen: {
    kerndateien: kerne.filter((k) => !k.eingebettet).length,
    unterschiedlicheKerninhalte: new Set(kerne.filter((k) => !k.eingebettet).map((k) => k.inhalt)).size,
    regelkennungen: einzig([...kerne.flatMap((k) => k.regelversionen), ...huellen.flatMap((h) => h.regelkennung)]),
    datenbanken: einzig(ablagen.flatMap((a) => a.datenbanken)), einstiege: einstiege.length,
  } };
if (process.argv.includes('--json')) console.log(JSON.stringify(bericht, null, 1));
else {
  console.log('SIMULATIONSKERNE (eigener Minuten-Tick m_core_step)');
  for (const k of kerne) console.log('  ' + k.datei.padEnd(46) + String(k.bytes).padStart(7) + ' B  Module ' + String(k.module).padStart(2)
    + '  Regeln ' + k.regelversionen.join(',') + (k.enthaeltAktivenKern ? '  [enthält aktiven Kern]' : ''));
  console.log('KOPPLUNGEN MIT EIGENER REGELKENNUNG (kein eigener Wirtschaftstick)');
  for (const h of huellen) console.log('  ' + h.datei.padEnd(46) + 'Kennung ' + h.regelkennung.join(','));
  console.log('SPEICHERABLAGEN');
  for (const a of ablagen) console.log('  ' + a.datei.padEnd(46) + a.datenbanken.join(', ') + (a.loescht ? '  [enthält Löschoperation]' : ''));
  console.log('EINSTIEGE');
  for (const e of einstiege) console.log('  ' + e.datei.padEnd(46) + e.kern.join(', '));
  console.log('KENNZAHLEN ' + JSON.stringify(bericht.kennzahlen));
}
