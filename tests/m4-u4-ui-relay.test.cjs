'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {action,session,LIMIT}=require('../scripts/m4-u4-ui-relay.cjs');
test('strict UI action protocol rejects game/state/code access',()=>{
 for(const input of [null,[],{op:'evaluate',code:'1'},{op:'click',x:1180,y:0},{op:'click',x:1,y:1,selector:'#a'},{op:'type',text:'a\nb'},{op:'wait',ms:2001},{op:'reload',url:'https://example.com'},{op:'scroll',x:1,y:1,dy:1501}])assert.throws(()=>action(input));
 for(const input of [{op:'click',x:0,y:0},{op:'type',text:'abc'},{op:'scroll',x:5,y:5,dy:-100},{op:'wait',ms:0},{op:'reload'},{op:'stop'}])assert.deepEqual(action(input),input);
});
test('browser fixture: screenshots, coordinate clicks, isolated storage, round cap',{skip:!process.env.M4_UI_BROWSER},async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'m4-fixture-')),out=path.join(root,'screens');
 fs.writeFileSync(path.join(root,'index.html'),'<html><style>body{margin:0}button{width:150px;height:100px;background:white}body.on{background:red}</style><button onclick="document.body.className=\'on\';localStorage.setItem(\'x\',\'1\')">Click</button><script>if(localStorage.getItem("x"))document.body.className="on"</script></html>');
 let s;
 try{
  s=await session(root,out);const a=await s.observe();
  const initial=fs.readFileSync(path.join(out,a.screenshot));
  assert.ok(initial.length>100);
  const b=await s.step({op:'click',x:50,y:50});
  assert.equal(b.round,1);assert.notDeepEqual(fs.readFileSync(path.join(out,b.screenshot)),initial);
  const c=await s.step({op:'reload'});assert.equal(c.round,2);
  await assert.rejects(()=>s.step({op:'evaluate',code:'1'}));
  for(let i=3;i<=LIMIT;i++){const x=await s.step({op:'wait',ms:0});assert.equal(x.round,i);assert.equal(x.done,i===LIMIT);}
  assert.equal((await s.step({op:'click',x:0,y:0})).done,true);
  s=await session(root,path.join(root,'second'));const d=await s.observe();
  assert.deepEqual(fs.readFileSync(path.join(root,'second',d.screenshot)),initial);
 }finally{if(s)await s.close();fs.rmSync(root,{recursive:true,force:true});}
});
test('actual public root copy: fresh screenshot and bounded UI observation (not blind play)',{skip:!process.env.M4_UI_BROWSER},async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'m4-root-'));let s;
 try{s=await session(path.resolve(__dirname,'..'),out);
  const a=await s.observe();assert.ok(fs.statSync(path.join(out,a.screenshot)).size>1000);
  const b=await s.step({op:'wait',ms:500});assert.equal(b.round,1);assert.equal(b.error,undefined);
 }finally{if(s)await s.close();fs.rmSync(out,{recursive:true,force:true});}
});
