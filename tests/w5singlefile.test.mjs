import normalize from './p1-root-normalization.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('GitHub Pages and standalone NAS share byte-exact Rule195 game except explicit Pages-only Jäger navigation',()=>{
 const a=read('aphros-void.html'),b=read('index.html');
 const pagesNav=/<nav aria-label="Spielmodi"[\s\S]*?<\/nav>\n/g;
 const matches=[...b.matchAll(pagesNav)];
 assert.equal(matches.length,1,'exactly one public J4e navigation');
 normalize.verify(); // Remove only the Pages-only hero, recover the original NAS file byte-for-byte.
 assert.ok(matches[0][0].includes('href="prototypes/j4c/index.html"'),'real J4e cockpit linked from Pages');
 assert.ok(fs.statSync(path.join(root,'prototypes/j4c/index.html')).isFile());
 assert.doesNotMatch(a,/aria-label="Spielmodi"/,'NAS remains self-contained, without missing fighter assets');
 assert.match(a,/Aphros Void – W0–W5/);
 assert.equal([...a.matchAll(/<style data-inlined-from=/g)].length,7);
 assert.equal([...a.matchAll(/<script data-inlined-from=/g)].length,15);
 assert.doesNotMatch(a,/<script[^>]*\bsrc\s*=|<link[^>]*\brel="stylesheet"[^>]*\bhref\s*=/);
});
test('previous main remains available as playable archive without changing its original rules',()=>{
 const old=read('versionen/main-pre-w5-20261110/index.html');
 assert.match(old,/m_data_systeme/);
 assert.match(old,/m_core_index/);
 assert.ok(old.length>500000);
 assert.notEqual(old,read('index.html'));
});

test('Legacy-ShadowRoots sind aus den unveränderten Original-CSS-Quellen inline gestylt, ohne Netz-404',()=>{
 for(const [path,marker] of [
  ['prototypes/legacy-corporation/corporation.css','../legacy-corporation/corporation.css'],
  ['prototypes/legacy-station/station.css','../legacy-station/station.css']]){
  const original=read(path),serialisiert=JSON.stringify(original);
  assert.ok(original.length>1000,marker+' muss echte Styles enthalten');
  for(const page of ['index.html','aphros-void.html']){
   const html=read(page);
   assert.ok(html.includes(serialisiert),page+' hat den originalen ShadowRoot-Style '+marker);
   assert.ok(html.includes("style.textContent=css==="),page+' muss echte CSS im ShadowRoot binden');
   assert.doesNotMatch(html,/document\.createElement\('link'\);link\.rel='stylesheet';link\.href=css/,'kein externer Shadow-CSS-Laufzeitrequest');
  }
 }
});
