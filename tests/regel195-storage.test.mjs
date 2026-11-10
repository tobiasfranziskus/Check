import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Session from '../prototypes/w5ac/session.js';
import Storage from '../prototypes/w5ag/storage.js';
const create=()=>Session.create(42,'private195');
test('Rule195 persistence validates financed in-flight cargo without changing bytes or future simulation',()=>{
 const s=create();s.command({type:'shipBuy',station:'st_aldera',klasse:'miner'});
 const id=s.snapshot().selected;s.command({type:'shipMine',schiff:id,ware:'eis'});s.advance(10);
 const json=s.export(),hash=s.snapshot().hash;
 assert.equal(Storage.validate(json,create),json);assert.equal(s.snapshot().hash,hash);
 const restored=create();restored.import(Storage.validate(json,create));
 for(const x of [s,restored]){x.advance(20);x.advance(20);x.command({type:'shipWait',schiff:id});}
 assert.equal(restored.export(),s.export());assert.equal(restored.snapshot().hash,s.snapshot().hash);
});
test('Rule195 JSON accepts whitespace and key order without relaxing fields',()=>{
 const json=create().export(),raw=JSON.parse(json);
 assert.equal(Storage.validate(JSON.stringify(Object.fromEntries(Object.entries(raw).reverse()),null,2),create),json);
});
for(const [name,mutate] of [
 ['Rule14',x=>x.rulesVersion=14],['future schema',x=>x.schema=9],
 ['future rule',x=>x.rulesVersion=196],['missing field',x=>delete x.tick],
['unfunded money',x=>x.owners.house.cash++],
 ['forged wages',x=>x.w5ag.paid.erz++]])test('Storage rejects '+name+' and preserves live state',()=>{
 const s=create(),before=s.export(),raw=JSON.parse(before);mutate(raw);
 assert.throws(()=>Storage.validate(JSON.stringify(raw),create));assert.equal(s.export(),before);
});
test('Storage rejects malformed, truncated, non-object and oversized JSON',()=>{
 for(const text of ['{','null','[]','',create().export().slice(0,-3),' '.repeat(5*1024*1024+1)])assert.throws(()=>Storage.validate(text,create));
});
test('Legacy game archive and persistence namespaces remain separate',()=>{
 assert.equal(Storage.database,'aphros-void-regel195-v1');
 const archive=fs.readFileSync(new URL('../versionen/main-pre-w5-20261110/index.html',import.meta.url),'utf8');
 assert.ok(!archive.includes(Storage.database));
});

test('Optional extension fields survive JSON validation losslessly',()=>{const raw=JSON.parse(create().export());raw.extension={note:'keep'};assert.deepEqual(JSON.parse(Storage.validate(JSON.stringify(raw),create)).extension,raw.extension);});
