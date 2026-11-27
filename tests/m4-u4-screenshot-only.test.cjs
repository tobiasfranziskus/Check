'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {session,browserOptions,LIMIT,MS}=require('../scripts/m4-u4-ui-relay.cjs');
const {config,requestBody,run,GOALS,VISUAL_MODEL}=require('../scripts/m4-u4-model-runner.cjs');

const env={M4_OBSERVATION_MODE:'screenshot-only',M4_AI_PROVIDER:'openrouter',M4_AI_MODEL:VISUAL_MODEL,
 M4_ALLOW_REMOTE:'1',OPENROUTER_API_KEY:'synthetic-key'};
const cfg=config(env);
const reply=(action,model=VISUAL_MODEL)=>Response.json({
 model,choices:[{message:{content:JSON.stringify({action,note:''})}}]
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

for(const size of ['1180x820','1024x768']){
 const options=browserOptions({...process.env,M4_UI_VIEWPORT:size});
 const {width,height}=options.viewport;
 test(`${options.engine} ${size} visual payload and real click, scroll, reload and dialog blockade`,
  {skip:!process.env.M4_UI_BROWSER,timeout:40000},async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'m4-image-'));
  const out=process.env.M4_U4_EVIDENCE?path.join(process.env.M4_U4_EVIDENCE,'image-'+size):path.join(root,'out');
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
   const r=await run({relay,cfg,module:'F',emit:x=>observations.push(x),fetcher:async(url,init)=>{
    try{
     assert.equal(url,cfg.url);
     assert.equal(init.redirect,'error');
     assert.equal(init.headers.Authorization,'Bearer synthetic-key');
     const body=JSON.parse(init.body),round=requests++;
     assert.deepEqual(Object.keys(body).sort(),['max_tokens','messages','model','provider','response_format','stream','temperature']);
     assert.equal(body.model,VISUAL_MODEL);
     assert.deepEqual(body.provider,{require_parameters:true,max_price:{prompt:0,completion:0,image:0,request:0}});
     assert.equal(body.messages.length,2);
     assert.equal(body.messages[0].role,'system');
     const {role,content}=body.messages[1];
     assert.equal(role,'user');
     const name='round-'+String(round).padStart(2,'0')+'.png';
     const png=fs.readFileSync(path.join(out,name));
     assert.deepEqual(content,[
      {type:'text',text:JSON.stringify({goal:GOALS.F,round,remaining:LIMIT-round,viewport:{width,height}})},
      {type:'image_url',image_url:{url:'data:image/png;base64,'+png.toString('base64')}}
     ]);
     assert.doesNotMatch(init.body,/SENTINEL|synthetic-key|scrollRegions|visibleText|round-00\.png/);
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
     return reply(steps[round]);
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
