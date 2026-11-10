import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p));
const text=p=>read(p).toString('utf8');
const blobSha=buf=>createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');

test('RC1: exact main root and v0.12.5 archive remain byte-identical',()=>{
 assert.equal(blobSha(read('versionen/main-pre-w5-20261110/index.html')),'b2ab84d5c7d5c177268fe750a6987abdc1825f78');
 assert.deepEqual(read('index.html'),read('aphros-void.html'));
 assert.equal(blobSha(read('versionen/v0.12.5/index.html')),'a2bcf5d2f9d3322c2a5edd4440eb77d094c84b9a');
 assert.ok(text('versionen/main-pre-w5-20261110/index.html').length>100000,'archived game intact');
});
test('RC1: launcher only links to research hub, does not switch main or write save slots',()=>{
 const html=text('spieltest/w5-rc1/index.html');
 assert.match(html,/href="\.\.\/\.\.\/prototypes\/w5ag\/index\.html"/);
 assert.doesNotMatch(html,/<script|location\.replace|location\.href|indexedDB|localStorage/);
 assert.match(html,/Spielstände schützen/);
});
test('RC1: all static scripts and styles of shared hub resolve to repository files',()=>{
 const filename='prototypes/w5ag/index.html',html=text(filename),base=path.dirname(filename);
 const matches=[...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)];
 assert.ok(matches.length>=12,'full hub asset list');
 for(const match of matches){
  const rel=match[1];assert.ok(!/^(?:https?:|\/\/|data:|\/)/.test(rel),'no remote runtime dependency '+rel);
  const asset=path.normalize(path.join(base,rel));
  assert.ok(asset.startsWith('prototypes'+path.sep),'asset must stay in isolated prototypes '+rel);
  assert.ok(fs.statSync(path.join(root,asset)).isFile(),'missing '+asset);
 }
});
test('RC1: original Rule195 economy, W5al finance projection and Core-bound miner exist',()=>{
 const original=read('prototypes/w5ac/rule191-w5-ferry-core.js');
 assert.ok(original.length>150000);
 assert.match(text('prototypes/w5ag/bootstrap.js'),/createPrivateWageResearch/);
 assert.match(text('prototypes/w5ag/extension.js'),/capitalBridge/);
 assert.match(text('prototypes/w5ag/miner.js'),/shipMine/);
 assert.match(text('prototypes/w5ac/session.js'),/shipSellIce/);
});