'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {session,browserOptions,LIMIT,MS}=require('../scripts/m4-u4-ui-relay.cjs');
const {config,requestBody,run,ask,geminiProbe,GOALS,VISUAL_MODEL}=require('../scripts/m4-u4-model-runner.cjs');

const env={M4_OBSERVATION_MODE:'screenshot-only',M4_AI_PROVIDER:'openrouter',M4_AI_MODEL:VISUAL_MODEL,
 M4_ALLOW_REMOTE:'1',OPENROUTER_API_KEY:'synthetic-key'};
const cfg=config(env);
const reply=(action,model=VISUAL_MODEL)=>Response.json({
 model,choices:[{message:{content:JSON.stringify({action,note:''})}}]
});
const geminiEnv={M4_OBSERVATION_MODE:'screenshot-only',M4_AI_PROVIDER:'gemini',M4_AI_MODEL:'gemini-3.5-flash-lite',
 M4_ALLOW_REMOTE:'1',M4_GEMINI_VISUAL_CONSENT:'1',M4_GEMINI_FREE_CONFIRMED:'1',GEMINI_API_KEY:'synthetic-google-key'};
const gemini=config(geminiEnv);
const geminiReply=(action,modelVersion=gemini.model,finishReason='STOP')=>Response.json({
 modelVersion,candidates:[{finishReason,content:{parts:[{text:JSON.stringify({action,note:''})}]}}]
});
const rejectTransport=()=>assert.fail('Transport must not be called');

test('visual config admits only the fixed free image model with explicit opt-in and key',()=>{
 for(const override of [
  {M4_ALLOW_REMOTE:'0'},{OPENROUTER_API_KEY:''},{M4_AI_PROVIDER:'gemini'},
  {M4_AI_MODEL:'openrouter/free'},{M4_AI_MODEL:'auto-free'},{M4_AI_MODEL:VISUAL_MODEL.split(':')[0]},
  {M4_AI_MODEL:'particle-ai/particle-1:free'},{M4_LOCAL_DIAGNOSTIC:'1'},{M4_OLLAMA_NATIVE:'1'}
 ])assert.throws(()=>config({...env,...override}),/verified free image model/);
 assert.throws(()=>config({...env,M4_OBSERVATION_MODE:'typo'}),/observation mode/);
});

test('a missing image or reached deadline never falls back to text or a path',async()=>{
 for(const expired of [false,true]){
  let time=0,closed=false;
  const relay={observe:async()=>{
   if(expired)time=MS;
   return {width:1180,height:820,round:0,remaining:12,visibleText:'SECRET',screenshot:'/tmp/fake.png'};
  },close:async()=>{closed=true;}};
  const r=await run({relay,cfg,module:'A',now:()=>time,fetcher:rejectTransport});
  assert.equal(r.reason,expired?'LIMIT':'INFRASTRUCTURE');
  assert.equal(closed,true);
 }
});

const html=`<!doctype html><style>
body{margin:0;height:2400px;background:#fde}
#covered{position:absolute;left:40px;top:140px;width:220px;height:60px;background:black;color:white}
#shadow{position:absolute;left:-500px;top:140px;width:240px;height:60px;z-index:2;
 pointer-events:none;box-shadow:530px 0 white}
#click{position:absolute;left:40px;top:245px;width:140px;height:55px}
#dialog{position:absolute;left:220px;top:245px;width:140px;height:55px}
</style><script>history.scrollRestoration='manual'</script><button hidden>HIDDEN_SENTINEL</button>
<button id="covered">COVERED_SENTINEL</button><div id="shadow"></div>
<button id="click" aria-label="ARIA_SENTINEL" data-private="NODE_SENTINEL"
 onclick="this.style.background='#00ff00';localStorage.clicked='yes'">Visible target</button>
<button id="dialog" onclick="if(confirm('DIALOG_SENTINEL'))localStorage.accepted='yes'">Confirm</button>`;

for(const transport of [cfg,gemini])for(const size of ['1180x820','1024x768']){
 const options=browserOptions({...process.env,M4_UI_VIEWPORT:size});
 const {width,height}=options.viewport;
 test(`${options.engine} ${size} ${transport.provider} visual payload and real click, scroll, reload and dialog blockade`,
  {skip:!process.env.M4_UI_BROWSER,timeout:40000},async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'m4-image-'));
  const out=process.env.M4_U4_EVIDENCE?path.join(process.env.M4_U4_EVIDENCE,(transport===gemini?'gemini-':'')+'image-'+size):path.join(root,'out');
  fs.writeFileSync(path.join(root,'index.html'),html);
  let relay,page;
  try{
   await assert.rejects(session(root,out,{...options,screenshotOnly:true,textMode:true}),/cannot use text tools/);
   relay=await session(root,out,{...options,screenshotOnly:true,preparePage:p=>{page=p;}});
   for(const action of [{op:'pick',id:1},{op:'targets',page:1},{op:'key',key:'Enter'},{op:'dialog',choice:'accept'}]){
    await assert.rejects(relay.step(action),/Unsupported action/);
   }
   const first=await relay.observe();
   for(const model of ['google/gemma-4-26b-a4b-it','particle-ai/particle-1:free',null]){
    let calls=0;
    const result=await run({cfg,module:'A',relay:{observe:async()=>first,close:async()=>{},step:rejectTransport},
     fetcher:async()=>{calls++;return reply({op:'click',x:1,y:1},model);}});
    assert.equal(calls,1);
    assert.equal(result.reason,'INFRASTRUCTURE');
    assert.equal(result.actions,0);
   }
   const poisoned={...first,visibleText:'TEXT_SENTINEL',targets:[{id:41,label:'TARGET_SENTINEL'}],
    scrollRegions:[{x:20,y:400}],targetInventory:{pages:2},selectKeys:true,screenId:'HISTORY_SENTINEL'};
   assert.deepEqual(requestBody(cfg,GOALS.F,poisoned,[{note:'OLD_SENTINEL'}]),requestBody(cfg,GOALS.F,first,[]));
   const steps=[
    {op:'click',x:110,y:270},{op:'scroll',x:20,y:400,dy:600},{op:'reload'},{op:'click',x:280,y:270}
   ];
   let requests=0,navigations=0;
   const observations=[];
   page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
   let transportError;
   const r=await run({relay,cfg:transport,module:'F',emit:x=>observations.push(x),fetcher:async(url,init)=>{
    try{
     assert.equal(url,transport.url);
     assert.equal(init.redirect,'error');
     const body=JSON.parse(init.body),round=requests++;
     const name='round-'+String(round).padStart(2,'0')+'.png';
     const png=fs.readFileSync(path.join(out,name));
     const text=JSON.stringify({goal:GOALS.F,round,remaining:LIMIT-round,viewport:{width,height}});
     if(transport===gemini){
      assert.equal(init.headers['x-goog-api-key'],'synthetic-google-key');
      assert.equal(init.headers.Authorization,undefined);
      assert.deepEqual(Object.keys(body).sort(),['contents','generationConfig','systemInstruction']);
      assert.deepEqual(body.contents,[{role:'user',parts:[{text},{inlineData:{mimeType:'image/png',data:png.toString('base64')}}]}]);
      assert.match(body.systemInstruction.parts[0].text,/aktuellen Screenshots/);
     }else{
      assert.equal(init.headers.Authorization,'Bearer synthetic-key');
      assert.deepEqual(Object.keys(body).sort(),['max_tokens','messages','model','provider','response_format','stream','temperature']);
      assert.equal(body.model,VISUAL_MODEL);
      assert.deepEqual(body.provider,{require_parameters:true,max_price:{prompt:0,completion:0,image:0,request:0}});
      assert.equal(body.messages.length,2);
      assert.equal(body.messages[0].role,'system');
      assert.deepEqual(body.messages[1],{role:'user',content:[
       {type:'text',text},{type:'image_url',image_url:{url:'data:image/png;base64,'+png.toString('base64')}}
      ]});
     }
     assert.doesNotMatch(init.body,/SENTINEL|synthetic-(google-)?key|scrollRegions|visibleText|round-00\.png/);
     if(round===0){
      const pixel=await page.evaluate(async bytes=>{
       const canvas=document.createElement('canvas');
       const bmp=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
       canvas.width=bmp.width;canvas.height=bmp.height;
       const ctx=canvas.getContext('2d');
       ctx.drawImage(bmp,0,0);
       return Array.from(ctx.getImageData(120,170,1,1).data);
      },[...png]);
      assert.deepEqual(pixel,[255,255,255,255]);
     }
     if(round===1)assert.equal(await page.evaluate(()=>localStorage.clicked),'yes');
     if(round===2)assert.ok(await page.evaluate(()=>scrollY)>500);
     if(round===3){
      assert.equal(navigations,1);
      assert.equal(await page.evaluate(()=>localStorage.clicked),'yes');
      assert.equal(await page.evaluate(()=>scrollY),0);
     }
     return (transport===gemini?geminiReply:reply)(steps[round]);
    }catch(error){transportError??=error;throw error;}
   }});
   if(transportError)throw transportError;
   assert.equal(requests,4);
   assert.equal(r.reason,'INFRASTRUCTURE');
   assert.match(r.detail,/Native browser dialog unsupported/);
   assert.equal(r.actions,4);
   assert.equal(r.verdict,'UNREVIEWED');
   assert.doesNotMatch(JSON.stringify(observations),/SENTINEL|"image"|visibleText|scrollRegions|targets/);
  }finally{
   if(relay)await relay.close();
   fs.rmSync(root,{recursive:true,force:true});
  }
 });
}

// Build an intact, small RGB image with the dimensions of the synthetic viewport.
function mockObservation(){
 const {crc32,deflateSync}=require('node:zlib');
 const width=1024,height=768;
 const chunk=(type,data)=>{
  const output=Buffer.alloc(12+data.length);
  output.writeUInt32BE(data.length);output.write(type,4);data.copy(output,8);
  output.writeUInt32BE(crc32(output.subarray(4,-4)),output.length-4);
  return output;
 };
 const header=Buffer.alloc(13);
 header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
 const image=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),
  chunk('IDAT',deflateSync(Buffer.alloc(height*(1+width*3)))),chunk('IEND',Buffer.alloc(0))]);
 return {width,height,image,round:0,remaining:LIMIT};
}

test('Gemini visual requires Google consent, free project confirmation, fixed provider and key',async()=>{
 for(const override of [
  {M4_ALLOW_REMOTE:'0'},{M4_GEMINI_VISUAL_CONSENT:'0'},{M4_GEMINI_FREE_CONFIRMED:'0'},
  {GEMINI_API_KEY:'',OPENROUTER_API_KEY:'other-key'},{M4_AI_MODEL:'gemini-3.8-flash'},
  {M4_AI_MODEL:'gemini-3.5-flash-lite-001'},{M4_AI_MODEL:'auto-free'},
  {M4_LOCAL_DIAGNOSTIC:'1'},{M4_OLLAMA_NATIVE:'1'}
 ])assert.throws(()=>config({...geminiEnv,...override}),/explicit consent/);
 await assert.rejects(geminiProbe({cfg:gemini,fetcher:rejectTransport}),/requires configured Gemini/);
 const textConfig=config({...geminiEnv,M4_OBSERVATION_MODE:'text-diagnostic'});
 const textBody=requestBody(textConfig,GOALS.A,{visibleText:'TEXT_SENTINEL'},[]);
 await assert.rejects(ask(gemini,textBody,1000,rejectTransport),/explicit consent/);
 const imageBody=requestBody(gemini,GOALS.A,mockObservation(),[]);
 for(const override of [{url:'https://example.invalid/'},{googleVisualConsent:false},{freeProjectConfirmed:false},{native:true}]){
  await assert.rejects(ask({...gemini,...override},imageBody,1000,rejectTransport),/explicit consent/);
 }
});

test('Gemini visual rejects invalid PNG, dimensions, native dialog and exhausted budget before fetch',async()=>{
 const obs=mockObservation(),corrupt=Buffer.from(obs.image);
 corrupt[40]^=1;
 for(const override of [
  {image:undefined},{image:Buffer.alloc(50)},{image:obs.image.subarray(0,33)},{image:corrupt},
  {image:Buffer.concat([obs.image,Buffer.from('trailing data')])},{image:Buffer.alloc(8*1024*1024+1)},
  {width:1180},{width:0},{remaining:1},{dialog:'confirm'}
 ]){
  let calls=0;
  const relay={observe:async()=>({...obs,...override}),step:rejectTransport,close:async()=>{}};
  const result=await run({relay,cfg:gemini,module:'A',sleep:async()=>{},fetcher:async()=>{calls++;return geminiReply({op:'stop'});}});
  assert.equal(result.reason,'INFRASTRUCTURE');
  assert.equal(result.actions,0);
  assert.equal(calls,0);
 }
 const result=await run({cfg:gemini,module:'A',now:(()=>{let first=true;return ()=>{if(first){first=false;return 0;}return MS;};})(),
  relay:{observe:async()=>obs,close:async()=>{}},fetcher:rejectTransport});
 assert.equal(result.reason,'LIMIT');
});

test('Gemini visual payload ignores injected text, targets, history, dialog schema and credentials',async()=>{
 const obs=mockObservation();
 const body=requestBody(gemini,GOALS.B,{...obs,visibleText:'TEXT_SENTINEL',targets:[{id:1}],history:'OLD_SENTINEL',
  screenshot:'/tmp/SENTINEL.png',dom:'DOM_SENTINEL',save:'SAVE_SENTINEL'},[{note:'HISTORY_SENTINEL'}]);
 let request;
 const result=await ask(gemini,{...body,controls:[{id:1}],dialog:'confirm'},1000,async(url,init)=>{
  request={url,...init};
  return geminiReply({op:'click',x:1023,y:767});
 });
 assert.equal(result.reportedModel,gemini.model);
 assert.equal(request.url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
 assert.deepEqual(request.headers,{'Content-Type':'application/json','x-goog-api-key':'synthetic-google-key'});
 assert.doesNotMatch(request.body,/SENTINEL|synthetic-google-key|controls|targets|dialog|history/i);
 const payload=JSON.parse(request.body),{generationConfig}=payload;
 assert.deepEqual(payload.contents[0].parts,[
  {text:JSON.stringify({goal:GOALS.B,round:0,remaining:LIMIT,viewport:{width:1024,height:768}})},
  {inlineData:{mimeType:'image/png',data:obs.image.toString('base64')}}
 ]);
 assert.equal(generationConfig.maxOutputTokens,1024);
 assert.equal(generationConfig.responseMimeType,'application/json');
 assert.deepEqual(generationConfig.responseJsonSchema.properties.action.anyOf.map(x=>x.properties.op.enum[0]),
  ['click','scroll','type','wait','reload','stop']);
});

test('Gemini visual terminal identity, quota and credential errors never fall back',async()=>{
 const obs=mockObservation(),click={op:'click',x:1,y:1};
 for(const [response,detail,count] of [
  [()=>geminiReply(click,null),'Model identity mismatch',1],
  [()=>geminiReply(click,'gemini-3.8-flash'),'Model identity mismatch',1],
  [()=>geminiReply(click,'gemini-3.5-flash-lite-001'),'Model identity mismatch',1],
  ...[401,402,403,429,503].map(status=>[()=>new Response('RAW_SECRET_SENTINEL',{status,headers:{'Retry-After':'1'}}),
   'Model HTTP '+status,status===503?2:1]),
  [()=>geminiReply(click,gemini.model,'MAX_TOKENS'),'Model output truncated',2],
  [()=>geminiReply(click,gemini.model,'SAFETY'),'Gemini response blocked or incomplete',2],
  [()=>new Response(' '.repeat(65537)),'Model response too large',2],
  ...[{op:'click',x:1024,y:1},{op:'click',x:1,y:768},{op:'pick',id:1},{op:'dialog',choice:'accept'},
   {op:'click',x:1,y:1,target:'extra'}].map(action=>[()=>geminiReply(action),'Invalid model decision format',2])
 ]){
  const urls=[],events=[];
  const result=await run({cfg:gemini,module:'A',sleep:async()=>{},emit:x=>events.push(x),
   relay:{observe:async()=>obs,step:rejectTransport,close:async()=>{}},fetcher:async url=>{urls.push(url);return response();}});
  assert.deepEqual(urls,Array(count).fill(gemini.url));
  assert.equal(result.reason,'INFRASTRUCTURE');
  assert.equal(result.detail,detail);
  assert.equal(result.actions,0);
  assert.doesNotMatch(JSON.stringify(events),/RAW_SECRET_SENTINEL|synthetic-google-key/);
 }
});

test('Gemini visual CLI removes credentials before session creation',()=>{
 const {spawnSync}=require('node:child_process');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'m4-gemini-cli-'));
 try{
  const runner=path.resolve(__dirname,'../scripts/m4-u4-model-runner.cjs');
  const relay=path.resolve(__dirname,'../scripts/m4-u4-ui-relay.cjs');
  const obs=mockObservation();
  const preload=path.join(dir,'mock.cjs');
  fs.writeFileSync(preload,`
   const assert=require('node:assert/strict');
   const keys=['GEMINI_API_KEY','GOOGLE_API_KEY','OPENROUTER_API_KEY'];
   const relay=require(${JSON.stringify(relay)});
   relay.session=async(root,out,options)=>{
    for(const key of keys)assert.equal(process.env[key],undefined);
    assert.equal(options.screenshotOnly,true);
    assert.equal(options.textMode,undefined);
    return {close:async()=>{},observe:async()=>({
     ...${JSON.stringify({...obs,image:undefined})},image:Buffer.from(${JSON.stringify(obs.image.toString('base64'))},'base64')
    })};
   };
   global.fetch=async(url,init)=>{
    for(const key of keys)assert.equal(process.env[key],undefined);
    assert.equal(url,${JSON.stringify(gemini.url)});
    assert.equal(init.headers['x-goog-api-key'],'synthetic-google-key');
    assert.doesNotMatch(init.body,/synthetic-/);
    return Response.json({modelVersion:${JSON.stringify(gemini.model)},candidates:[
     {finishReason:'STOP',content:{parts:[{text:JSON.stringify({action:{op:'stop'},note:''})}]}}
    ]});
   };
  `);
  const result=spawnSync(process.execPath,['--require',preload,runner,'A'],{
   env:{...geminiEnv,GOOGLE_API_KEY:'synthetic-other',OPENROUTER_API_KEY:'synthetic-router',TMPDIR:dir},
   encoding:'utf8',timeout:5000
  });
  assert.ifError(result.error);
  assert.equal(result.status,0,result.stderr);
  assert.doesNotMatch(result.stdout+result.stderr,/synthetic-/);
  const summary=JSON.parse(result.stdout);
  assert.equal(summary.reason,'MODEL_STOP');
  assert.equal(summary.model,gemini.model);
  assert.doesNotMatch(fs.readFileSync(summary.evidence,'utf8'),/synthetic-/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('Gemini visual manual workflow gates the controller and artifact upload on both approvals on main',()=>{
 const {spawnSync}=require('node:child_process');
 const workflow=fs.readFileSync(path.resolve(__dirname,'../.github/workflows/m4-u4-gemini-visual.yml'),'utf8');
 assert.match(workflow,/^on:\n  workflow_dispatch:/m);
 assert.doesNotMatch(workflow,/^  (pull_request(?:_target)?|push|schedule):/m);
 for(const input of ['google_visual_consent','free_project_confirmed']){
  assert.match(workflow,new RegExp('^      '+input+':\\n        description: [^\\n]+\\n        type: boolean\\n        default: false$','m'));
 }
 assert.match(workflow,/needs: preflight\n    if: github\.ref == 'refs\/heads\/main' && inputs\.google_visual_consent == true && inputs\.free_project_confirmed == true/);
 assert.equal((workflow.match(/secrets\./g)||[]).length,1);
 assert.match(workflow,/Run screenshot-only module\n        env:[\s\S]*?GEMINI_API_KEY: \$\{\{ secrets\.M4_GEMINI_VISUAL_API_KEY \}\}/);
 assert.match(workflow,/retention-days: 7/);
 const preflight=workflow.split('          if [ "$GITHUB_REF"')[1].split('\n  pilot:')[0];
 const script='if [ "$GITHUB_REF"'+preflight;
 for(const ref of ['refs/heads/main','refs/heads/draft']){
  for(const consent of ['false','true'])for(const free of ['false','true']){
   const result=spawnSync('/bin/bash',['-c',script],{
    env:{GITHUB_REF:ref,M4_CONSENT:consent,M4_FREE_PROJECT:free},encoding:'utf8'
   });
   assert.equal(result.status,ref==='refs/heads/main'&&consent==='true'&&free==='true'?0:1,result.stderr);
  }
 }
});

test('Gemini visual stops at twelve actions even if the relay continues to offer observations',async()=>{
 const obs=mockObservation();
 let actions=0,requests=0;
 const observe=async()=>({...obs,round:actions,remaining:LIMIT-actions});
 const result=await run({cfg:gemini,module:'A',relay:{
  observe,step:async()=>{actions++;return observe();},close:async()=>{}
 },fetcher:async()=>{requests++;return geminiReply({op:'click',x:0,y:0});}});
 assert.equal(result.reason,'LIMIT');
 assert.equal(result.actions,LIMIT);
 assert.equal(requests,LIMIT);
});
