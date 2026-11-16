import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=p=>readFileSync(path.join(root,p),'utf8');

test('P0: fitting and pilot preserve old deep links, archived HTML and original resources',()=>{
  for(const [area,files] of [
    ['legacy-fitting',['style.css','model.js','examples.js','view.js']],
    ['legacy-pilot',['pilot.css','pilot.js','examples.js','preview.js']]
  ]){
    const base='prototypes/'+area+'/';
    const old=source(base+'index.html'),archived=source(base+'archiv/index.html');
    assert.match(old,/<meta http-equiv="refresh" content="0; url=archiv\/index\.html">/);
    assert.match(old,/<a href="archiv\/index\.html">/);
    assert.match(archived,/<base href="\.\.\/">/);
    assert.doesNotMatch(archived,/localStorage|indexedDB/);
    for(const file of files){
      assert.ok(archived.includes('="'+file+'"'),area+'/'+file+' archived reference');
      assert.ok(source(base+file).length>0,area+'/'+file+' original source');
    }
  }
});

test('P0: static graph resolves both archived demos with no dangling assets',()=>{
  const script=path.join(root,'scripts/p0-prototype-deps.mjs');
  const {summary,files}=JSON.parse(execFileSync(process.execPath,[script,'--json'],{encoding:'utf8'}));
  assert.deepEqual(summary.missing_static_assets,[]);
  assert.deepEqual(summary.missing_archived_hub_assets,[]);
  const indexed=new Map(files.map(row=>[row.path,row]));
  for(const area of ['legacy-fitting','legacy-pilot']){
    assert.equal(indexed.get('prototypes/'+area+'/archiv/index.html')?.demo,true);
    assert.equal(indexed.get('prototypes/'+area+'/index.html')?.public,false);
  }
  for(const p of ['prototypes/legacy-fitting/model.js','prototypes/legacy-pilot/pilot.js']){
    assert.equal(indexed.get(p)?.demo,true);
  }
});
