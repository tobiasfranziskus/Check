import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(path.join(root,p),'utf8');

test('P0 W5x: old URL remains a static fallback redirect; original Rule16 scripts still load',()=>{
 const prefix='prototypes/w5x/';
 const old=read(prefix+'index.html');
 const archived=read(prefix+'archiv/index.html');
 assert.match(old,/<meta http-equiv="refresh" content="0; url=archiv\/index\.html">/);
 assert.match(old,/<a href="archiv\/index\.html">/);
 assert.match(archived,/<base href="\.\.\/">/);
 for(const file of ['original-w2-core.js','session.js','extension.js','bootstrap.js']){
  assert.ok(archived.includes('src="'+file+'"'),file+' referenced');
  assert.ok(read(prefix+file).length>100,file+' preserved');
 }
 for(const file of ['../w5w/app.js','../legacy-hub/core-adapter.js']){
  assert.ok(archived.includes('src="'+file+'"'),file+' referenced');
 }
 assert.doesNotMatch(archived,/<script[^>]*src="https?:\/\//i);
});

test('P0 W5x: archived page is present in the static dependency inventory',()=>{
 const script=path.join(root,'scripts/p0-prototype-deps.mjs');
 const {files,summary}=JSON.parse(execFileSync(process.execPath,[script,'--json'],{encoding:'utf8'}));
 const byPath=new Map(files.map(file=>[file.path,file]));
 assert.deepEqual(summary.missing_static_assets,[]);
 assert.deepEqual(summary.missing_archived_hub_assets,[]);
 assert.equal(byPath.get('prototypes/w5x/archiv/index.html')?.demo,true);
 assert.equal(byPath.get('prototypes/w5x/original-w2-core.js')?.demo,true);
});
