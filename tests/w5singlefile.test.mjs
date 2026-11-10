import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('GitHub Pages and NAS single HTML are exactly the same Rule195 game',()=>{
 const a=read('aphros-void.html'),b=read('index.html');
 assert.equal(a,b);
 assert.match(a,/Aphros Void – W0–W5/);
 assert.equal([...a.matchAll(/<style data-inlined-from=/g)].length,7);
 assert.equal([...a.matchAll(/<script data-inlined-from=/g)].length,14);
 assert.doesNotMatch(a,/<script[^>]*\bsrc\s*=|<link[^>]*\brel="stylesheet"[^>]*\bhref\s*=/);
});
test('previous main remains available as playable archive without changing its original rules',()=>{
 const old=read('versionen/main-pre-w5-20261110/index.html');
 assert.match(old,/m_data_systeme/);
 assert.match(old,/m_core_index/);
 assert.ok(old.length>500000);
 assert.notEqual(old,read('index.html'));
});
