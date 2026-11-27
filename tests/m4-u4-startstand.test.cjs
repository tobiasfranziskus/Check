'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {prepare,importPrepared,IDS,SLOT}=require('../scripts/m4-u4-startstand.cjs');
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
