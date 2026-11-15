import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=p=>readFileSync(path.join(root,p),'utf8');

test('P0 legacy hub archived HTML redirects preserve both original URLs',()=>{
 for(const name of ['index.html','core-preview.html']){
  const old=source('prototypes/legacy-hub/'+name);
  const archived=source('prototypes/legacy-hub/archiv/'+name);
  assert.match(old,new RegExp('http-equiv="refresh" content="0; url=archiv/'+name.replace('.','\\.')+'"'));
  assert.ok(old.includes('href="archiv/'+name+'"'),'noscript/fallback link');
  assert.match(archived,/<base href="\.\.\/">/);
  assert.match(archived,/src="hub\.js"/);
  assert.match(archived,/src="\.\.\/legacy-fitting\/model\.js"/);
  assert.match(archived,/src="\.\.\/legacy-pilot\/pilot\.js"/);
  assert.match(archived,/src="\.\.\/legacy-mining-scanner\/scanner\.js"/);
 }
});
test('P0 runtime/build and historical archived HTML are resolved by inventory',()=>{
 const script=path.join(root,'scripts/p0-prototype-deps.mjs');
 const output=execFileSync(process.execPath,[script,'--json'],{encoding:'utf8'});
 const {summary,files}=JSON.parse(output);
 assert.deepEqual(summary.missing_static_assets,[]);
 assert.deepEqual(summary.missing_archived_hub_assets,[]);
 const byPath=new Map(files.map(f=>[f.path,f]));
 for(const name of ['index.html','core-preview.html']){
  assert.equal(byPath.get('prototypes/legacy-hub/archiv/'+name)?.demo,true);
 }
 for(const item of ['prototypes/legacy-hub/core-adapter.js','prototypes/legacy-corporation/corporation.js','prototypes/legacy-station/station.js']){
  assert.ok(byPath.get(item)?.public || byPath.get(item)?.build,item);
 }
});
