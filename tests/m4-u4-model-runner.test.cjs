'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {config,requestBody,decision,run,probe,selectProbe,AUTO_FREE_MODELS}=require('../scripts/m4-u4-model-runner.cjs');
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
 assert.equal((y.match(/secrets\.OPENROUTER_API_KEY/g)||[]).length,2);
 const probeStep=y.indexOf('      - name: Probe free models before browser installation');
 const installStep=y.indexOf('      - name: Install browser without model credentials');
 const pilotStep=y.indexOf('      - name: Run independent model pilot');
 assert.ok(probeStep>0&&probeStep<installStep&&installStep<pilotStep);
 assert.match(y.slice(probeStep,installStep),/--probe > "\$TMPDIR\/probe\.json"/);
 assert.doesNotMatch(y.slice(installStep,pilotStep),/OPENROUTER_API_KEY|continue-on-error|if: always/);
 assert.match(y,/m4-live\/probe\.json/);
 assert.match(y,/retention-days: 7/);assert.match(y,/UNREVIEWED/);
 assert.match(y,/default: 'auto-free'/);
 assert.match(y.slice(pilotStep),/M4_AI_MODEL: \$\{\{ steps\.probe\.outputs\.model \}\}/);assert.doesNotMatch(y,/M4_AI_MODEL===\x22openrouter\/free\x22/);
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
test('explicit router opt-in honors delay, fallback only before first action, model pinned',async()=>{
 const cfg=remoteCfg('openrouter/free'),f=fixture(),calls=[],delays=[],events=[];
 let clock=0;
 const result=await run({relay:f.relay,cfg,module:'A',now:()=>clock,sleep:async ms=>{delays.push(ms);clock+=ms;},emit:e=>events.push(e),fetcher:async(url,opts)=>{
  const model=JSON.parse(opts.body).model;calls.push(model);
  if(calls.length<=2)return new Response('SECRET_SENTINEL',{status:429,headers:{'retry-after':'4'}});
  if(calls.length===3)return response(click,'particle-ai/particle-1:free');
  return response(stop,'particle-ai/particle-1:free');
 }});
 assert.deepEqual(calls,[cfg.model,cfg.model,'particle-ai/particle-1:free','particle-ai/particle-1:free']);
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


test('fixed Gemma model uses JSON object format and never switches even before first action',async()=>{
 const model='google/gemma-4-26b-a4b-it:free',cfg=remoteCfg(model);
 for(const error of ['quota','different-model']){
  const f=fixture(),calls=[],delays=[];
  const result=await run({relay:f.relay,cfg,module:'A',sleep:async ms=>delays.push(ms),fetcher:async(url,opts)=>{
   const b=JSON.parse(opts.body);calls.push(b.model);
   assert.deepEqual(b.response_format,{type:'json_object'});assert.equal(b.max_tokens,1024);
   return error==='quota'?new Response('private',{status:429}):response(click,'particle-ai/particle-1:free');
  }});
  assert.deepEqual(calls,[model,model]);assert.deepEqual(delays,[error==='quota'?3000:1000]);
  assert.equal(result.reason,'INFRASTRUCTURE');assert.equal(result.actions,0);
  assert.equal(f.closed(),1);
 }
 const f=fixture(),calls=[];
 const result=await run({relay:f.relay,cfg,module:'A',fetcher:async(url,opts)=>{
  const b=JSON.parse(opts.body);calls.push(b.model);assert.deepEqual(b.response_format,{type:'json_object'});
  return response(calls.length===1?click:stop,model);
 }});
 assert.deepEqual(calls,[model,model]);assert.equal(result.model,model);assert.equal(result.actions,1);
 assert.equal(result.reason,'MODEL_STOP');
});


test('daily quota stops immediately, sanitized metadata only, fixed model unchanged',async()=>{
 const f=fixture(),events=[],calls=[];
 const result=await run({relay:f.relay,cfg:remoteCfg('google/gemma-4-26b-a4b-it:free'),module:'A',sleep:async()=>{throw Error('daily limit must not sleep');},emit:e=>events.push(e),fetcher:async(url,opts)=>{
  calls.push(JSON.parse(opts.body).model);
  return new Response(JSON.stringify({error:{message:'SECRET_SENTINEL',metadata:{limit_source:'openrouter_free_tier_daily',raw:'SECRET_SENTINEL',provider_name:'SECRET_SENTINEL'}}}),{status:429});
 }});
 assert.equal(calls.length,1);assert.equal(result.actions,0);assert.equal(result.reason,'INFRASTRUCTURE');
 assert.equal(result.quota.limitSource,'openrouter_free_tier_daily');assert.equal(f.closed(),1);
 assert.doesNotMatch(JSON.stringify(events),/SECRET_SENTINEL|MOCK_ONLY_SECRET/);
});
test('minute limit honors millisecond reset, upstream honors retry_after_seconds, no model change',async()=>{
 for(const source of ['openrouter_free_tier_per_minute','upstream_provider_shared_pool']){
  const f=fixture(),events=[],calls=[],delays=[];const model='google/gemma-4-26b-a4b-it:free';
  const reset=Date.now()+20000;
  const result=await run({relay:f.relay,cfg:remoteCfg(model),module:'A',sleep:async ms=>delays.push(ms),emit:e=>events.push(e),fetcher:async(url,opts)=>{
   calls.push(JSON.parse(opts.body).model);
   if(calls.length>1)return response(stop,model);
   const metadata=source==='openrouter_free_tier_per_minute'?{limit_source:source,headers:{'X-RateLimit-Reset':String(reset)}}:{limit_source:source,retry_after_seconds:59};
   return new Response(JSON.stringify({error:{metadata}}),{status:429});
  }});
  assert.deepEqual(calls,[model,model]);assert.equal(result.reason,'MODEL_STOP');
  assert.equal(events.find(e=>e.kind==='model_error').quota.limitSource,source);
  if(source==='openrouter_free_tier_per_minute'){assert.ok(delays[0]>=19000&&delays[0]<=21000);assert.equal(events.find(e=>e.kind==='model_error').quota.resetAt,reset);}
  else assert.deepEqual(delays,[59000]);
 }
});
test('quota reset exceeding time budget blocks retry; unknown and oversized metadata remain private',async()=>{
 for(const mode of ['future','unknown','oversize','malformed']){
  const f=fixture(),events=[];let calls=0;
  const result=await run({relay:f.relay,cfg:remoteCfg('google/gemma-4-26b-a4b-it:free'),module:'A',now:()=>0,sleep:async()=>{},emit:e=>events.push(e),fetcher:async()=>{
   calls++;
   const raw=mode==='future'?JSON.stringify({error:{metadata:{limit_source:'openrouter_free_tier_per_minute'}}}):mode==='unknown'?JSON.stringify({error:{metadata:{limit_source:'SECRET_SENTINEL',provider_name:'SECRET_SENTINEL'}}}):mode==='oversize'?'SECRET_SENTINEL'.repeat(2000):'{SECRET_SENTINEL';
   return new Response(raw,{status:429,headers:mode==='future'?{'X-RateLimit-Reset':String(Date.now()+600000)}:{}});
  }});
  assert.equal(calls,mode==='future'?1:2);assert.equal(result.reason,'INFRASTRUCTURE');assert.equal(result.actions,0);
  assert.equal(result.quota.limitSource,mode==='future'?'openrouter_free_tier_per_minute':'unknown');
  assert.doesNotMatch(JSON.stringify(events),/SECRET_SENTINEL|MOCK_ONLY_SECRET/);
 }
});
test('credit and key diagnoses never enable paid or fallback retries',async()=>{
 for(const [status,source] of [[402,'openrouter_credits'],[403,'openrouter_key_limit']]){
  const f=fixture();let calls=0;
  const result=await run({relay:f.relay,cfg:remoteCfg('openrouter/free'),module:'A',fetcher:async()=>{
   calls++;return new Response(JSON.stringify({error:{metadata:{limit_source:source}}}),{status});
  }});
  assert.equal(calls,1);assert.equal(result.quota.limitSource,source);assert.equal(result.actions,0);
 }
});


test('Particle synthetic probe uses exactly one fixed free request and no game context',async()=>{
 const model='particle-ai/particle-1:free',calls=[];
 const result=await probe({cfg:remoteCfg(model),fetcher:async(url,opts)=>{
  const b=JSON.parse(opts.body);calls.push(b);
  assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(b.model,model);assert.deepEqual(b.response_format,{type:'json_object'});
  assert.equal(b.messages.length,2);assert.doesNotMatch(opts.body,/Visible|Karriere|GOALS|MOCK_ONLY_SECRET/);
  return response({action:{op:'stop'},note:'probe'},model);
 }});
 assert.equal(calls.length,1);assert.equal(result.reason,'PROBE_OK');assert.equal(result.phase,'PROBE');
 assert.equal(result.model,model);assert.equal(result.actions,0);assert.equal(result.verdict,'UNREVIEWED');
});
test('probe rejects unavailable, wrong model and wrong response without retry or leaking raw body',async()=>{
 const model='particle-ai/particle-1:free';
 for(const kind of ['429','identity','format','wrong','timeout']){
  let calls=0;
  const result=await probe({cfg:remoteCfg(model),fetcher:async()=>{
   calls++;
   if(kind==='429')return new Response(JSON.stringify({error:{message:'SECRET_SENTINEL',metadata:{limit_source:'upstream_provider_shared_pool',raw:'SECRET_SENTINEL'}}}),{status:429});
   if(kind==='identity')return response({action:{op:'stop'},note:'probe'},'google/gemma-4-26b-a4b-it:free');
   if(kind==='format')return new Response(JSON.stringify({model,choices:[{message:{content:'SECRET_SENTINEL'}}]}));
   if(kind==='timeout')throw Object.assign(Error('SECRET_SENTINEL'),{name:'TimeoutError'});
   return response(click,model);
  }});
  assert.equal(calls,1);assert.equal(result.reason,'INFRASTRUCTURE');assert.equal(result.actions,0);
  if(kind==='429'){assert.equal(result.detail,'Model HTTP 429');assert.equal(result.quota.limitSource,'upstream_provider_shared_pool');}
  if(kind==='identity')assert.equal(result.detail,'Model identity mismatch');
  if(kind==='format')assert.equal(result.detail,'Invalid model JSON');
  if(kind==='wrong')assert.equal(result.detail,'Probe response mismatch');
  if(kind==='timeout')assert.equal(result.detail,'Model timeout');
  assert.doesNotMatch(JSON.stringify(result),/SECRET_SENTINEL|MOCK_ONLY_SECRET/);
 }
 await assert.rejects(probe({cfg:remoteCfg('openrouter/free'),fetcher:async()=>{throw Error('must not call');}}),/fixed free/);
});
test('fixed Particle pilot uses JSON mode and never switches after successful probe',async()=>{
 const model='particle-ai/particle-1:free',f=fixture(),calls=[];
 const result=await run({relay:f.relay,cfg:remoteCfg(model),module:'A',sleep:async()=>{},fetcher:async(url,opts)=>{
  const b=JSON.parse(opts.body);calls.push(b.model);assert.deepEqual(b.response_format,{type:'json_object'});
  return calls.length===1?response(click,model):new Response('private',{status:429});
 }});
 assert.deepEqual(calls,[model,model,model]);assert.equal(result.actions,1);
 assert.equal(result.reason,'INFRASTRUCTURE');assert.equal(result.model,model);
});


test('auto-free selects a verified candidate once, after provider-local 429 and malformed response',async()=>{
 const calls=[],selection='auto-free';
 const result=await selectProbe({cfg:remoteCfg(AUTO_FREE_MODELS[0]),selection,fetcher:async(url,opts)=>{
  const b=JSON.parse(opts.body);calls.push(b.model);
  assert.deepEqual(b.response_format,{type:'json_object'});
  assert.doesNotMatch(opts.body,/Karriere|MOCK_ONLY_SECRET/);
  if(calls.length===1)return new Response(JSON.stringify({error:{metadata:{limit_source:'upstream_provider_shared_pool',raw:'SECRET_SENTINEL'}}}),{status:429});
  if(calls.length===2)return response(click,b.model);
  return response({action:{op:'stop'},note:'probe'},b.model);
 }});
 assert.deepEqual(calls,AUTO_FREE_MODELS.slice(0,3));
 assert.equal(result.reason,'PROBE_OK');assert.equal(result.model,AUTO_FREE_MODELS[2]);assert.equal(result.attempts.length,3);
 assert.equal(result.actions,0);assert.equal(result.verdict,'UNREVIEWED');
 assert.doesNotMatch(JSON.stringify(result),/SECRET_SENTINEL|MOCK_ONLY_SECRET/);
 const f=fixture(),pilotCalls=[];
 await run({relay:f.relay,cfg:remoteCfg(result.model),module:'A',sleep:async()=>{},fetcher:async(url,opts)=>{
  const b=JSON.parse(opts.body);pilotCalls.push(b.model);
  assert.doesNotMatch(opts.body,/"note":"probe"/);
  return pilotCalls.length===1?response(click,b.model):new Response('private',{status:429});
 }});
 assert.deepEqual(pilotCalls,[result.model,result.model,result.model]);
});

test('auto-free exhausts at most five unique explicitly free models on provider-local limits',async()=>{
 const calls=[];
 const result=await selectProbe({cfg:remoteCfg(AUTO_FREE_MODELS[0]),selection:'auto-free',fetcher:async(url,opts)=>{
  calls.push(JSON.parse(opts.body).model);
  return new Response(JSON.stringify({error:{metadata:{limit_source:'upstream_provider_shared_pool'}}}),{status:429});
 }});
 assert.equal(AUTO_FREE_MODELS.length,5);assert.equal(new Set(AUTO_FREE_MODELS).size,5);
 assert.ok(AUTO_FREE_MODELS.every(m=>/^[A-Za-z0-9._/-]+:free$/.test(m)));
 assert.deepEqual(calls,AUTO_FREE_MODELS);assert.equal(result.attempts.length,5);
 assert.equal(result.reason,'INFRASTRUCTURE');assert.equal(result.model,undefined);assert.equal(result.actions,0);
});

test('auto-free stops at account limits, unknown rate limits and identity mismatch, never bypassing them',async()=>{
 for(const [status,source] of [[429,'openrouter_free_tier_daily'],[429,'openrouter_free_tier_per_minute'],[429,'openrouter_in_flight_budget'],[429,'unknown'],[401,'unknown'],[402,'openrouter_credits'],[403,'openrouter_key_limit'],[200,'identity']]){
  let calls=0;
  const result=await selectProbe({cfg:remoteCfg(AUTO_FREE_MODELS[0]),selection:'auto-free',fetcher:async()=>{
   calls++;
   return status===200?response({action:{op:'stop'},note:'probe'},'wrong/model:free'):new Response(JSON.stringify({error:{metadata:{limit_source:source}}}),{status});
  }});
  assert.equal(calls,1,source);assert.equal(result.attempts.length,1);assert.equal(result.reason,'INFRASTRUCTURE');
  assert.equal(result.actions,0);assert.equal(result.model,undefined);
 }
});

test('explicit named free model still probes exactly once, even on provider overload; paid/router rejected',async()=>{
 const model='particle-ai/particle-1:free';let calls=0;
 const r=await selectProbe({cfg:remoteCfg(model),selection:model,fetcher:async()=>{
  calls++;return new Response(JSON.stringify({error:{metadata:{limit_source:'upstream_provider_shared_pool'}}}),{status:429});
 }});
 assert.equal(calls,1);assert.equal(r.attempts.length,1);assert.equal(r.reason,'INFRASTRUCTURE');
 for(const selection of ['openrouter/free','some/paid'])await assert.rejects(selectProbe({cfg:remoteCfg(model),selection,fetcher:async()=>{throw Error('must not call');}}),/explicit free mode/);
});

test('local model gets longer per-request budget without changing remote or total deadlines',async()=>{
 const original=AbortSignal.timeout;
 try {
  for(const [provider,budget,expected] of [['ollama',300000,90000],['ollama',45000,45000],['openrouter',300000,20000]]){
   let clock=0,seen=[];
   const cfg=provider==='ollama'?config({M4_AI_MODEL:'gemma4:e4b'}):remoteCfg('test/model:free');
   const f=fixture();
   AbortSignal.timeout=ms=>{seen.push(ms);return original(ms);};
   const result=await run({relay:f.relay,cfg,module:'A',now:()=>clock,emit:e=>{if(e.kind==='observation')clock=300000-budget;},fetcher:async()=>response({action:{op:'stop'},note:'done'},cfg.model)});
   assert.deepEqual(seen,[expected]);assert.equal(result.reason,'MODEL_STOP');assert.equal(result.actions,0);assert.equal(f.closed(),1);
  }
 } finally {AbortSignal.timeout=original;}
});

test('native Ollama sends short non-thinking JSON requests and validates response plus safe timing metrics',async()=>{
 const {ask}=require('../scripts/m4-u4-model-runner.cjs');
 const cfg=config({M4_AI_MODEL:'gemma4:e4b',M4_OLLAMA_NATIVE:'1'});
 assert.equal(cfg.url,'http://127.0.0.1:11434/api/chat');
 const body=requestBody(cfg,'goal',{round:0,remaining:12,visibleText:'(10,10) Visible'},[]);
 const data={model:cfg.model,done:true,done_reason:'stop',message:{content:JSON.stringify({action:{op:'stop'},note:'done'}),thinking:'DO_NOT_LOG'},eval_count:20,total_duration:12000000};
 const d=await ask(cfg,body,90000,async(url,opts)=>{
  assert.equal(url,cfg.url);assert.equal(opts.headers.Authorization,undefined);
  const q=JSON.parse(opts.body);assert.equal(q.think,false);assert.deepEqual(q.format,require('../scripts/m4-u4-model-runner.cjs').DECISION_SCHEMA);assert.equal(q.options.num_predict,256);assert.equal(q.stream,false);assert.deepEqual(q.messages,body.messages);
  return new Response(JSON.stringify(data));
 });
 assert.equal(d.action.op,'stop');assert.deepEqual(d.metrics,{total_duration_ms:12,eval_count:20});assert.doesNotMatch(JSON.stringify(d),/DO_NOT_LOG/);
 for(const bad of [{...data,model:'different'},{...data,done:false},{...data,done_reason:'length'},{...data,message:{content:'{"action":{"op":"evaluate"},"note":"bad"}'}}]){
  await assert.rejects(ask(cfg,body,90000,async()=>new Response(JSON.stringify(bad))));
 }
});

test('native schema enumerates only valid UI commands with exact fields and bounds',()=>{
 const {DECISION_SCHEMA:s}=require('../scripts/m4-u4-model-runner.cjs');
 assert.deepEqual(s.required,['action','note']);assert.equal(s.additionalProperties,false);
 const v=s.properties.action.oneOf;
 assert.deepEqual(v.map(a=>a.properties.op.enum[0]),['click','scroll','type','wait','reload','stop']);
 for(const a of v){assert.equal(a.additionalProperties,false);assert.deepEqual(a.required,Object.keys(a.properties));}
 assert.deepEqual(v[0].properties.x,{type:'integer',minimum:0,maximum:1179});
 assert.deepEqual(v[0].properties.y,{type:'integer',minimum:0,maximum:819});
 assert.equal(v[3].properties.ms.maximum,2000);
});
test('native validation errors reveal only known categories, never rejected model text',async()=>{
 const {ask}=require('../scripts/m4-u4-model-runner.cjs');
 const cfg=config({M4_AI_MODEL:'gemma4:e4b',M4_OLLAMA_NATIVE:'1'});
 const responseFor=action=>new Response(JSON.stringify({model:cfg.model,done:true,message:{content:JSON.stringify({action,note:'DO_NOT_LOG'})}}));
 const err=await ask(cfg,{messages:[]},1000,async()=>responseFor({op:'click',x:9999,y:12})).catch(e=>e);
 assert.equal(err.validation,'Invalid x');
 const f=fixture(),events=[];
 const result=await run({relay:f.relay,cfg,module:'A',emit:e=>events.push(e),sleep:async()=>{},fetcher:async()=>responseFor({op:'invalid_secret'})});
 assert.equal(result.reason,'INFRASTRUCTURE');assert.equal(result.actions,0);
 assert.equal(events.filter(e=>e.validation==='Unsupported action or field').length,2);
 assert.doesNotMatch(JSON.stringify(events),/DO_NOT_LOG|invalid_secret/);
});
