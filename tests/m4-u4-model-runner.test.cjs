'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {config,requestBody,decision,run}=require('../scripts/m4-u4-model-runner.cjs');
const cfg=config({M4_AI_MODEL:'local-test'}),response=x=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(x)}}]}));
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
 assert.equal(data.screen.length,1800);assert.equal(data.recent.length,2);assert.equal(b.max_tokens,256);assert.equal(data.secret,undefined);
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
test('quota or malformed output aborts without action; no retry',async()=>{
 for(const fetcher of [async()=>new Response('quota',{status:429}),async()=>response({action:{op:'evaluate'},note:'bad'})]){
  const f=fixture(),r=await run({relay:f.relay,cfg,module:'B',fetcher});
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
