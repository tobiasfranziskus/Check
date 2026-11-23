import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(dir,file),'utf8');

test('P1 Root: byte-identical deterministic Pages build and unchanged standalone NAS file',()=>{
 const out=execFileSync(process.execPath,['scripts/build-w5-singlefile.mjs','--check'],
   {cwd:dir,encoding:'utf8',timeout:30_000});
 assert.match(out,/W5_SINGLEFILE_OK/);
 const pages=read('index.html'),nas=read('aphros-void.html');
 assert.ok(pages.length>nas.length);
 assert.match(pages,/<section id="root-portal"/);
 assert.match(pages,/<title>Aphros Void · Dein Weltraumkonzern<\/title>/);
 assert.match(nas,/<title>Aphros Void – W0–W5 · Spielbare Entwicklungsversion<\/title>/);
 assert.doesNotMatch(nas,/id="root-portal"|id="pages-premium-entry"/);
 assert.match(nas,/W5agStorage/);
 assert.match(pages,/W5agStorage/);
});
test('P1 Root: one first-class career CTA, explicit and still navigable legacy W0–W5 and original access',()=>{
 const pages=read('index.html'),source=read('scripts/pages-entry.html');
 assert.equal((pages.match(/<nav aria-label="Spielmodi"/g)||[]).length,1);
 assert.equal((pages.match(/href="prototypes\/spiel\/index.html"/g)||[]).length,1);
 for(const link of ['prototypes/spiel/index.html','prototypes/j4c/index.html',
                   'prototypes/verbund/konzern.html','#klassische-wirtschaft'])
   assert.ok(source.includes('href="'+link+'"'),link);
 assert.ok(pages.indexOf('id="root-portal"')<pages.indexOf('id="save"'));
 assert.ok(pages.indexOf('id="root-portal"')<pages.indexOf('id="klassische-wirtschaft"'));
 assert.match(pages,/<details id="root-legacy-info">/);
 assert.match(pages,/<section id="klassische-wirtschaft"/);
 for(const legacy of ['save','load','load-previous','export','import','ship-select','buy-miner',
                      'start-mining','stop-mining','storage-status'])
   assert.match(pages,new RegExp('id="'+legacy+'"'),'preserve original legacy control '+legacy);
 assert.match(pages,/data-inlined-from="\.\.\/w5w\/app\.js"/);
 assert.match(pages,/data-inlined-from="storage\.js"/);
 assert.doesNotMatch(source,/Regel\s*20[47]|richtiger Miner|Prototyp|F4\b|F6\b/);
});
test('P1 Root: premium portal is static, original cockpit/save slots untouched',()=>{
 const s=read('scripts/pages-entry.html'),css=read('scripts/pages-entry.css'),
   build=read('scripts/build-w5-singlefile.mjs');
 assert.doesNotMatch(s,/<script|<form|\blocalStorage\b|indexedDB|onclick=|fetch\(/i);
 assert.doesNotMatch(css,/@import|url\(|https?:\/\//);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/min-height:52px/);
 assert.match(build,/fs\.readFileSync\(path\.join\(root,'scripts\/pages-entry\.css'\)/);
 assert.match(build,/fs\.readFileSync\(path\.join\(root,'scripts\/pages-entry\.html'\)/);
 assert.match(build,/for\(const \[name,expected\] of \[\['index.html',pages\],\['aphros-void.html',out\]\]\)/);
 assert.doesNotMatch(read('aphros-void.html'),/prototypes\/spiel\/index\.html/);
});

test('M4 UX: public gateway has one primary action, collapsed alternatives and no marketing tiles',()=>{
 const source=read('scripts/pages-entry.html'),css=read('scripts/pages-entry.css');
 assert.equal((source.match(/class="root-primary"/g)||[]).length,1);
 assert.match(source,/<details class="root-more">\s*<summary>Weitere Spielmodi<\/summary>/);
 assert.doesNotMatch(source,/root-cards|root-info|root-eyebrow|root-sub|<article|<aside/);
 assert.match(css,/body:not\(:has\(:target\)\) > :is\(section,nav,main\)/);
 assert.match(css,/body:has\(#klassische-wirtschaft:target\) #root-portal\{display:none\}/);
});
