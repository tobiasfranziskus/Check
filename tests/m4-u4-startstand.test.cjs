'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {prepare,prepare208,importPrepared,IDS,IDS208,SLOT,SLOT208}=require('../scripts/m4-u4-startstand.cjs');
const {session,browserOptions}=require('../scripts/m4-u4-ui-relay.cjs');
const options=browserOptions(process.env);

test('B-F fixtures are independent audited standard saves with deterministic provenance',()=>{
 assert.throws(()=>prepare('A'));assert.throws(()=>prepare('../B'));
 for(const module of Object.keys(IDS)){
  const a=prepare(module),b=prepare(module);
  assert.deepEqual(a,b);assert.equal(a.id,IDS[module]);assert.match(a.sha256,/^[a-f0-9]{64}$/);
  assert.equal(JSON.parse(a.json).rulesVersion,204);
 }
});
test('prepared starts import through the actual public UI into isolated browser sessions',{skip:!process.env.M4_UI_BROWSER,timeout:180000},async()=>{
 const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'m4-prepared-'));
 try{
  for(const module of Object.keys(IDS)){
   const fixture=prepare(module);
   let s;
   try{
    s=await session(root,path.join(out,module),{...options,textMode:true,markButtons:true,preparePage:async page=>{
     await importPrepared(page,fixture);
     await page.reload();await page.locator('#fortsetzen').click();
     await page.locator('#manager-transport-status').waitFor({state:'visible'});
     assert.equal(await page.evaluate(key=>localStorage.getItem(key),SLOT),fixture.json);
    }});
    const first=await s.observe();assert.equal(first.round,0);assert.equal(first.remaining,12);
    assert.match(first.visibleText,/Kommandobrücke/);
    assert.doesNotMatch(first.visibleText,/^\s*\{/);
    assert.equal(first.error,undefined);
    assert.equal(first.visibleText.includes(fixture.hash),false);
    assert.equal(first.visibleText.includes(fixture.sha256),false);
    const next=await s.step({op:'wait',ms:0});assert.equal(next.round,1);assert.equal(next.error,undefined);
   }finally{if(s)await s.close();}
  }
 }finally{fs.rmSync(out,{recursive:true,force:true});}
});

test('Rule208 prepared starts are independent of historical Rule204, replayable and audited',()=>{
 const J8=require('../prototypes/verbund/konzern-session.js');
 assert.throws(()=>prepare208('A'));assert.throws(()=>prepare208('../B'));
 for(const module of Object.keys(IDS208)){
  const a=prepare208(module),b=prepare208(module),old=prepare(module);
  assert.deepEqual(a,b);assert.equal(a.id,IDS208[module]);assert.notEqual(a.id,old.id);
  assert.match(a.sha256,/^[a-f0-9]{64}$/);assert.notEqual(a.sha256,old.sha256);
  const raw=JSON.parse(a.json);assert.equal(raw.rulesVersion,208);assert.equal(raw.schema,8);
  assert.equal(JSON.parse(old.json).rulesVersion,204);
  assert.throws(()=>J8.erstellen().oeffnen208(old.json,true));
  assert.throws(()=>J8.erstellen().oeffnen204(a.json,true));
  console.log('QA208_PREPARED '+JSON.stringify({module,id:a.id,hash:a.hash,sha256:a.sha256,
   tick:raw.tick,cash:raw.owners.house.cash,fees:raw.kanon.spielerFrachten?.gebuehr??0,
   ships:Object.values(raw.ships).filter(s=>s.owner==='house').length}));
 }
});
for(const module of Object.keys(IDS208))test('Rule208 '+module+' real file import, resume and isolated screenshot',{skip:!process.env.M4_UI_BROWSER,timeout:60000},async()=>{
 const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'m4-prepared208-'));
 let s;
 try{
  const fixture=prepare208(module);
  s=await session(root,out,{...options,screenshotOnly:true,preparePage:async page=>{
   await importPrepared(page,fixture);
   assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT),null);
   await page.reload();await page.locator('#fortsetzen').click();
   await page.locator('#manager-transport-status').waitFor({state:'visible'});
   assert.equal(await page.evaluate(k=>localStorage.getItem(k),SLOT208),fixture.json);
  }});
  const first=await s.observe();assert.equal(first.round,0);assert.equal(first.remaining,12);
  assert.equal(first.error,undefined);
  assert.equal(first.visibleText,undefined);assert.ok(Buffer.isBuffer(first.image));assert.equal(first.screenshot,'round-00.png');
  const next=await s.step({op:'wait',ms:0});assert.equal(next.round,1);assert.equal(next.error,undefined);
  assert.ok(Buffer.isBuffer(next.image));assert.equal(next.visibleText,undefined);
 }finally{if(s)await s.close();fs.rmSync(out,{recursive:true,force:true});}
});
test('Rule208 import and default resume preserve the separate historical Rule204 career',{skip:!process.env.M4_UI_BROWSER,timeout:60000},async()=>{
 const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'m4-prepared-slots-'));
 let s;
 try{
  const old=prepare('C'),fresh=prepare208('B');
  s=await session(root,out,{...options,textMode:true,preparePage:async page=>{
   await importPrepared(page,old);await page.reload();
   await importPrepared(page,fresh);await page.reload();
   await page.locator('#fortsetzen').click();
   await page.locator('#manager-transport-status').waitFor({state:'visible'});
   const slots=()=>page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),[SLOT,SLOT208]);
   assert.deepEqual(await slots(),[old.json,fresh.json]);
   await page.locator('[data-advance="60"]').click();
   await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).tick===60,SLOT208);
   const advanced=(await slots())[1];
   assert.equal(JSON.parse(advanced).rulesVersion,208);
   assert.equal((await slots())[0],old.json);
   await page.reload();await page.locator('#fortsetzen-204').click();
   await page.locator('#manager-transport-status').waitFor({state:'visible'});
   assert.deepEqual(await slots(),[old.json,advanced]);
   await page.locator('[data-advance="60"]').click();
   await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).tick===300,SLOT);
   assert.equal(JSON.parse((await slots())[0]).rulesVersion,204);
   assert.equal((await slots())[1],advanced);
  }});
  assert.equal((await s.observe()).error,undefined);
 }finally{if(s)await s.close();fs.rmSync(out,{recursive:true,force:true});}
});
