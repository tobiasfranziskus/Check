'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {config,requestBody,decision,run}=require('../scripts/m4-u4-model-runner.cjs');
const cfg=config({M4_AI_MODEL:'local-test'}),response=(x,model)=>new Response(JSON.stringify({model,choices:[{message:{content:JSON.stringify(x)}}]}));
function fixture(){
 let round=0,closed=0;const actions=[];
 const observation=()=>({round,remaining:12-round,visibleText:'(10,10) Visible '+round,done:round>=12});
 return {relay:{observe:async()=>observation(),step:async a=>{actions.push(a);round++;return observation();},close:async()=>{closed++;}},actions,closed:()=>closed};
}
test('provider explicit, local default, no arbitrary endpoint or paid remote fallback',()=>{
 assert.equal(cfg.url,'http://127.0.0.1:11434/v1/chat/completions');
 assert.throws(()=>config({}));
 assert.throws(()=>config({M4_AI_MODEL:'paid',M4_AI_PROVIDER:'openrouter',M4_ALLOW_REMOTE:'1',OPENROUTER_API_KEY:'key'}));
 assert.throws(()=>config({M4_AI_MODEL:'a:free',M4_AI_PROVIDER:'openrouter',OPENROUTER_API_KEY:'key'}));
 assert.throws(()=>config({M4_AI_MODEL:'a',M4_AI_PROVIDER:'custom'}));
 assert.equal(config({M4_AI_MODEL:'a:free',M4_AI_PROVIDER:'openrouter',M4_ALLOW_REMOTE:'1',OPENROUTER_API_KEY:'key'}).url,'https://openrouter.ai/api/v1/chat/completions');
});
test('bounded context, strict actions and model response',()=>{
 const h=Array.from({length:50},()=>({action:{op:'stop'},note:'x'.repeat(240)}));
 const b=requestBody(cfg,'goal',{round:3,remaining:9,visibleText:'x'.repeat(10000),secret:'never'},h);
 const data=JSON.parse(b.messages[1].content);
 assert.equal(data.screen.length,1800);assert.equal(data.recent.length,2);assert.equal(b.max_tokens,1024);assert.equal(data.secret,undefined);
 for(const s of ['garbage','{"action":{"op":"evaluate"},"note":"bad"}','{"action":{"op":"reload","url":"x"},"note":"bad"}','{"action":{"op":"stop"},"note":"x","extra":1}'])assert.throws(()=>decision(s));
 assert.deepEqual(decision('{"action":{"op":"stop"},"note":"uncertain"}'),{action:{op:'stop'},note:'uncertain'});
});
test('mock model drives real protocol calls; no automatic success verdict',async()=>{
 const f=fixture(),events=[],calls=[];
 const fetcher=async(url,opts)=>{
  calls.push({url,body:JSON.parse(opts.body),headers:opts.headers});
  return response(calls.length===1?{action:{op:'click',x:10,y:10},note:'First visible text'}:{action:{op:'stop'},note:'New text observed'});
 };
 const r=await run({relay:f.relay,cfg,module:'A',fetcher,emit:x=>events.push(x)});
 assert.equal(r.reason,'MODEL_STOP');assert.equal(r.verdict,'UNREVIEWED');assert.equal(r.actions,1);
 assert.deepEqual(f.actions,[{op:'click',x:10,y:10}]);assert.equal(f.closed(),1);assert.equal(calls.length,2);
 assert.match(calls[1].body.messages[1].content,/Visible 1/);assert.equal(calls[0].headers.Authorization,undefined);
 assert.equal(events.filter(x=>x.kind==='observation').length,2);
});
test('persistent quota or malformed output aborts without action',async()=>{
 for(const fetcher of [async()=>new Response('quota',{status:429}),async()=>response({action:{op:'evaluate'},note:'bad'})]){
  const f=fixture(),r=await run({relay:f.relay,cfg,module:'B',fetcher,sleep:async()=>{}});
  assert.equal(r.reason,'INFRASTRUCTURE');assert.equal(f.actions.length,0);assert.equal(f.closed(),1);
 }
});
test('round and time limits; no action after model timeout budget',async()=>{
 let f=fixture(),r=await run({relay:f.relay,cfg,module:'B',fetcher:async()=>response({action:{op:'wait',ms:0},note:'observe'})});
 assert.equal(r.reason,'LIMIT');assert.equal(f.actions.length,12);assert.equal(f.closed(),1);
 f=fixture();let clock=0;
 r=await run({relay:f.relay,cfg,module:'A',now:()=>clock,fetcher:async()=>{clock=300001;return response({action:{op:'click',x:10,y:10},note:'late'});}});
 assert.equal(r.reason,'LIMIT');assert.equal(f.actions.length,0);assert.equal(f.closed(),1);
});


test('cloud pilot dry-run: actual browser and mocked free-model transport, no API call',{skip:!process.env.M4_UI_BROWSER},async()=>{
 const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
 const {session}=require('../scripts/m4-u4-ui-relay.cjs');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'m4-mobile-mock-'));
 const remote=config({M4_AI_PROVIDER:'openrouter',M4_AI_MODEL:'test/model:free',M4_ALLOW_REMOTE:'1',OPENROUTER_API_KEY:'MOCK_ONLY_SECRET'});
 fs.writeFileSync(path.join(root,'index.html'),'<html><style>body{margin:0}button{width:220px;height:100px}</style><button onclick="this.textContent=\'RESULT_OK\'">START_TEST</button><p hidden>HIDDEN_SENTINEL</p></html>');
 const events=[],calls=[];
 let s;
 try{
  s=await session(root,path.join(root,'out'),{textMode:true});
  const result=await run({relay:s,cfg:remote,module:'A',emit:e=>events.push(e),fetcher:async(url,opts)=>{
   assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
   assert.equal(opts.headers.Authorization,'Bearer MOCK_ONLY_SECRET');
   assert.doesNotMatch(opts.body,/MOCK_ONLY_SECRET|HIDDEN_SENTINEL/);
   calls.push(JSON.parse(opts.body));
   if(calls.length===1){
    assert.match(opts.body,/START_TEST/);
    return response({action:{op:'click',x:100,y:50},note:'Visible button'},remote.model);
   }
   assert.match(opts.body,/RESULT_OK/);
   return response({action:{op:'stop'},note:'Observed changed button'},remote.model);
  }});
  assert.equal(calls.length,2);assert.equal(result.reason,'MODEL_STOP');assert.equal(result.verdict,'UNREVIEWED');assert.equal(result.actions,1);
  assert.doesNotMatch(JSON.stringify(events),/MOCK_ONLY_SECRET|HIDDEN_SENTINEL/);
 }finally{if(s)await s.close();fs.rmSync(root,{recursive:true,force:true});}
});
test('mobile workflow has explicit main consent, protected environment and no PR secret trigger',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const y=fs.readFileSync(path.join(__dirname,'../.github/workflows/m4-u4-mobile-pilot.yml'),'utf8');
 assert.match(y,/workflow_dispatch:/);assert.doesNotMatch(y,/^\s*(pull_request(?:_target)?|push|schedule):/m);
 assert.match(y,/github\.ref == 'refs\/heads\/main' && inputs\.consent == true/);
 assert.match(y,/environment: m4-blindtest/);assert.match(y,/persist-credentials: false/);
 assert.equal((y.match(/secrets\.OPENROUTER_API_KEY/g)||[]).length,1);
 assert.match(y,/retention-days: 7/);assert.match(y,/UNREVIEWED/);
});

 test('free router allowed only with explicit consent and key',()=>{
 const env={M4_AI_PROVIDER:'openrouter',M4_AI_MODEL:'openrouter/free',M4_ALLOW_REMOTE:'1',OPENROUTER_API_KEY:'mock'};
 assert.equal(config(env).model,'openrouter/free');
 assert.throws(()=>config({...env,M4_ALLOW_REMOTE:'0'}));
 assert.throws(()=>config({...env,OPENROUTER_API_KEY:''}));
 assert.throws(()=>config({...env,M4_AI_MODEL:'openrouter:free/paid'}));
 });

test('fenced JSON and one bounded retry without duplicate action',async()=>{
 const f=fixture(),events=[];let calls=0;
 const r=await run({relay:f.relay,cfg,module:'A',emit:e=>events.push(e),sleep:async()=>{},fetcher:async()=>{
  calls++;if(calls===1)return response({action:{op:'evaluate'},note:'invalid'});
  if(calls===2)return new Response(JSON.stringify({choices:[{message:{content:'```json\n{"action":{"op":"click","x":10,"y":10},"note":"visible"}\n```'}}]}));
  return response({action:{op:'stop'},note:'done'});
 }});
 assert.equal(calls,3);assert.equal(r.reason,'MODEL_STOP');assert.equal(f.actions.length,1);assert.equal(events.filter(e=>e.kind==='model_error').length,1);
});
test('authentication failure is not retried and error body is not logged',async()=>{
 const f=fixture(),events=[];let calls=0;
 const r=await run({relay:f.relay,cfg,module:'A',emit:e=>events.push(e),fetcher:async()=>{calls++;return new Response('SECRET_SENTINEL',{status:401});}});
 assert.equal(calls,1);assert.equal(r.detail,'Model HTTP 401');assert.equal(f.actions.length,0);assert.doesNotMatch(JSON.stringify(events),/SECRET_SENTINEL/);
});


const remoteCfg=model=>config({M4_AI_PROVIDER:'openrouter',M4_AI_MODEL:model,M4_ALLOW_REMOTE:'1',OPENROUTER_API_KEY:'MOCK_ONLY_SECRET'});
const click={action:{op:'click',x:10,y:10},note:'visible'};
const stop={action:{op:'stop'},note:'done'};
test('429 honors delay, fallback only before first action, router discovery pinned',async()=>{
 const cfg=remoteCfg('inclusionai/ling-3.2-flash:free'),f=fixture(),calls=[],delays=[],events=[];
 let clock=0;
 const result=await run({relay:f.relay,cfg,module:'A',now:()=>clock,sleep:async ms=>{delays.push(ms);clock+=ms;},emit:e=>events.push(e),fetcher:async(url,opts)=>{
  const model=JSON.parse(opts.body).model;calls.push(model);
  if(calls.length<=2)return new Response('SECRET_SENTINEL',{status:429,headers:{'retry-after':'4'}});
  if(calls.length===3)return response(click,'particle-ai/particle-1:free');
  return response(stop,'particle-ai/particle-1:free');
 }});
 assert.deepEqual(calls,[cfg.model,cfg.model,'openrouter/free','particle-ai/particle-1:free']);
 assert.deepEqual(delays,[4000,8000]);assert.equal(result.model,'particle-ai/particle-1:free');
 assert.equal(result.reason,'MODEL_STOP');assert.equal(result.actions,1);
 assert.equal(events.filter(e=>e.kind==='model_selected').length,1);
 assert.doesNotMatch(JSON.stringify(events),/SECRET_SENTINEL|MOCK_ONLY_SECRET/);
});
test('model switch or quota after action cannot fall back or execute extra action',async()=>{
 for(const kind of ['identity','quota']){
  const cfg=remoteCfg('openrouter/free'),f=fixture(),calls=[],events=[];
  const result=await run({relay:f.relay,cfg,module:'A',sleep:async()=>{},emit:e=>events.push(e),fetcher:async(url,opts)=>{
   calls.push(JSON.parse(opts.body).model);
   if(calls.length===1)return response(click,'particle-ai/particle-1:free');
   return kind==='quota'?new Response('private',{status:429}):response(click,'inclusionai/ling-3.2-flash:free');
  }});
  assert.equal(result.reason,'INFRASTRUCTURE');assert.equal(result.actions,1);
  assert.deepEqual(calls,['openrouter/free','particle-ai/particle-1:free','particle-ai/particle-1:free']);
  assert.equal(result.model,'particle-ai/particle-1:free');
  assert.equal(result.detail,kind==='quota'?'Model HTTP 429':'Model identity mismatch');
  assert.equal(f.closed(),1);
 }
});
test('paid, missing or drifting identity never yields a remote action',async()=>{
 for(const reported of ['paid/model',undefined,'other/free:paid']){
  const f=fixture(),result=await run({relay:f.relay,cfg:remoteCfg('openrouter/free'),module:'A',sleep:async()=>{},fetcher:async()=>response(click,reported)});
  assert.equal(result.reason,'INFRASTRUCTURE');assert.equal(result.actions,0);assert.equal(result.model,null);
 }
});
test('remote authentication and payment errors never trigger fallback; retry-after beyond budget stops',async()=>{
 for(const status of [401,402,403,429]){
  const f=fixture();let calls=0;
  const result=await run({relay:f.relay,cfg:remoteCfg('openrouter/free'),module:'A',now:()=>0,sleep:async()=>{throw Error('must not sleep');},fetcher:async()=>{
   calls++;return new Response('private',{status,headers:{'retry-after':'600'}});
  }});
  assert.equal(calls,1);assert.equal(result.reason,'INFRASTRUCTURE');assert.equal(result.actions,0);
 }
});
test('safe empty/truncated/invalid JSON diagnosis, corrective prompt and no raw content logged',async()=>{
 for(const [choice,detail] of [
  [{finish_reason:'length',message:{content:'SECRET_SENTINEL'}},'Model output truncated'],
  [{message:{content:''}},'Model output empty'],
  [{message:{content:'SECRET_SENTINEL'}},'Invalid model JSON'],
  [{message:{content:'{"action":{"op":"evaluate"},"note":"SECRET_SENTINEL"}'}},'Invalid model decision format']
 ]){
  const f=fixture(),events=[],calls=[];
  const result=await run({relay:f.relay,cfg,module:'A',sleep:async()=>{},emit:e=>events.push(e),fetcher:async(url,opts)=>{
   calls.push(JSON.parse(opts.body));
   return calls.length===1?new Response(JSON.stringify({choices:[choice]})):response(stop);
  }});
  assert.equal(result.reason,'MODEL_STOP');assert.equal(result.actions,0);
  assert.equal(events.find(e=>e.kind==='model_error').detail,detail);
  assert.match(calls[1].messages[0].content,/vorige Antwort/);
  assert.doesNotMatch(JSON.stringify(events),/SECRET_SENTINEL/);
 }
});
