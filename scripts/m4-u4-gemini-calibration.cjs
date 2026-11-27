'use strict';
// Separate technical neutral calibration; no game files, state, selectors or fixtures.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {performance}=require('node:perf_hooks');
const {config,requestBody,ask,CALIBRATION_GOAL}=require('./m4-u4-model-runner.cjs');
const {session,browserOptions,MS}=require('./m4-u4-ui-relay.cjs');
const MODEL='gemini-3.5-flash-lite';
const VIEWPORTS=Object.freeze([{width:1180,height:820},{width:1024,height:768}]);
const TARGETS=Object.freeze(['ALPHA','BETA','GAMMA','DELTA']);
const positions=[
 [[22,68],[77,31],[22,31],[77,68]],
 [[71,72],[26,36],[26,72],[71,36]]
];
function neutralPage(index){
 const targets=index===0?['ALPHA','BETA']:['BETA','ALPHA'];
 return '<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#f3f5f7;color:#18212b;font:22px sans-serif}h1{text-align:center;font-size:28px;margin-top:35px}button{position:absolute;transform:translate(-50%,-50%);width:170px;height:80px;font:22px sans-serif;color:#18212b;background:#d8e0e9;border:2px solid #53677d;border-radius:8px}button.hit{background:#75cc91}</style><h1 id="prompt"></h1>'+
 TARGETS.map((id,i)=>'<button id="'+id+'" style="left:'+positions[index][i][0]+'%;top:'+positions[index][i][1]+'%">'+id+'</button>').join('')+
 '<script>const order='+JSON.stringify(targets)+';let count=0;window.calibrationEvidence=[];const prompt=document.getElementById("prompt");function show(){prompt.textContent=count<order.length?"Klicke auf "+order[count]:"Fertig";}show();document.addEventListener("click",e=>{const id=e.target.tagName==="BUTTON"?e.target.id:null;window.calibrationEvidence.push({id,x:e.clientX,y:e.clientY,trusted:e.isTrusted});if(id===order[count]){e.target.classList.add("hit");count++;show();}});</script>';
}
function allowed(cfg){
 return cfg?.provider==='gemini'&&cfg.model===MODEL&&cfg.url==='https://generativelanguage.googleapis.com/v1beta/models/'+MODEL+':generateContent'&&cfg.screenshotOnly===true&&cfg.googleVisualConsent===true&&cfg.freeProjectConfirmed===true&&!cfg.native&&!cfg.diagnostic&&typeof cfg.key==='string'&&cfg.key.trim().length>0;
}
function safeDetail(e){
 const s=String(e?.message||'');
 if(/^Model HTTP [0-9]{3}$/.test(s)||['Invalid model decision format','Invalid model JSON','Model identity mismatch','Model output truncated','Model output empty','Gemini response blocked or incomplete','Current viewport image unavailable','Calibration budget exhausted'].includes(s))return s;
 return e?.name==='TimeoutError'?'Model timeout':'Calibration setup, transport or browser failed';
}
async function runCalibration({cfg,out,fetcher=fetch,open=session,engine='chromium',now=()=>performance.now()}){
 const started=now(),steps=[];let requests=0,model=null;
 const budget=()=>Math.floor(MS-(now()-started));
 // Count only actual transport invocations, after local payload validation.
 const boundedFetch=async(url,init)=>{
  const remaining=budget();
  if(remaining<=0||requests>=4)throw Error('Calibration budget exhausted');
  const signal=AbortSignal.any([init.signal,AbortSignal.timeout(Math.max(1,Math.min(45000,remaining)))]);
  requests++;
  return fetcher(url,{...init,signal});
 };
 fs.mkdirSync(out,{recursive:true});
 const finish=(reason,detail)=>{
  // Successful verdict includes the final observation, event read and session cleanup.
  const elapsedMs=Math.floor(now()-started);
  if(reason==='CALIBRATION_PASS'&&elapsedMs>=MS){reason='INFRASTRUCTURE';detail='Calibration budget exhausted';}
  const result={reason,detail,requests,hits:steps.filter(s=>s.hit).length,model,elapsedMs,verdict:'NOT_GAME_ACCEPTANCE',productSha:process.env.M4_PRODUCT_SHA||'UNVERIFIED',steps};
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});return result;
 };
 if(!allowed(cfg))return finish('INFRASTRUCTURE','Calibration requires explicit free visual consent');
 const transport={...cfg,calibration:true};
 try{
  for(const [index,viewport] of VIEWPORTS.entries()){
   const root=fs.mkdtempSync(path.join(os.tmpdir(),'m4-neutral-'));
   const dir=path.join(out,viewport.width+'x'+viewport.height);
   let relay,page;
   try{
    fs.writeFileSync(path.join(root,'index.html'),neutralPage(index));
    relay=await open(root,dir,{engine,viewport,screenshotOnly:true,preparePage:p=>{page=p;}});
    let obs=await relay.observe();
    const order=index===0?['ALPHA','BETA']:['BETA','ALPHA'];
    for(let i=0;i<2;i++){
     const remaining=budget();
     if(remaining<=0||requests>=4||obs.error||obs.done||!Buffer.isBuffer(obs.image))return finish('INFRASTRUCTURE','Calibration observation or budget unavailable');
     const expected=order[i];
     let decision;
     try{decision=await ask(transport,requestBody(transport,CALIBRATION_GOAL,obs,[]),Math.max(1,Math.min(45000,remaining)),boundedFetch);}
     catch(e){const detail=safeDetail(e);return finish(/^Invalid model (decision format|JSON)$/.test(detail)?'CALIBRATION_FAIL':'INFRASTRUCTURE',detail);}
     model=decision.reportedModel;
     if(budget()<=0)return finish('INFRASTRUCTURE','Calibration budget exhausted');
     if(decision.action.op!=='click'||!decision.modelAction)return finish('CALIBRATION_FAIL','Expected one normalized click');
     const after=await relay.step(decision.action);
     const expiredAfterStep=budget()<=0;
     if(after.error||after.done||!Buffer.isBuffer(after.image))return finish('INFRASTRUCTURE',expiredAfterStep?'Calibration budget exhausted':'Calibration follow-up image unavailable');
     const events=await page.evaluate(()=>window.calibrationEvidence);
     const event=Array.isArray(events)?events[i]:null;
     const valid=event&&TARGETS.includes(event.id)&&Number.isInteger(event.x)&&Number.isInteger(event.y);
     const evidence=valid?{id:event.id,x:event.x,y:event.y,trusted:event.trusted===true}:null;
     const changed=!obs.image.equals(after.image);
     const hit=!!(evidence&&events.length===i+1&&evidence.trusted&&evidence.id===expected&&evidence.x===decision.action.x&&evidence.y===decision.action.y&&changed);
     steps.push({viewport,dpr:1,expected,modelAction:decision.modelAction,action:decision.action,event:evidence,before:viewport.width+'x'+viewport.height+'/'+obs.screenshot,after:viewport.width+'x'+viewport.height+'/'+after.screenshot,changed,hit});
     if(expiredAfterStep||budget()<=0)return finish('INFRASTRUCTURE','Calibration budget exhausted');
     if(!hit)return finish('CALIBRATION_FAIL','Actual click did not hit the requested neutral target');
     obs=after;
    }
   }finally{if(relay)await relay.close();fs.rmSync(root,{recursive:true,force:true});}
  }
  return finish(requests===4&&steps.length===4&&steps.every(s=>s.hit)?'CALIBRATION_PASS':'CALIBRATION_FAIL','Four neutral clicks checked');
 }catch(e){return finish('INFRASTRUCTURE',safeDetail(e));}
}
async function main(){
 const out=process.env.M4_CALIBRATION_OUT;if(!out)throw Error('Missing output directory');
 const cfg=config(process.env);
 delete process.env.GEMINI_API_KEY;delete process.env.GOOGLE_API_KEY;delete process.env.OPENROUTER_API_KEY;
 const {engine}=browserOptions(process.env);
 const result=await runCalibration({cfg,out,engine});
 console.log(JSON.stringify({reason:result.reason,requests:result.requests,hits:result.hits,model:result.model,verdict:result.verdict}));
 if(result.reason!=='CALIBRATION_PASS')process.exitCode=1;
}
if(require.main===module)main().catch(()=>{console.error('Calibration setup failed');process.exitCode=1;});
module.exports={runCalibration};
