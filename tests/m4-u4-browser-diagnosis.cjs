'use strict';
// Technical browser diagnosis for QA. No model, no private profile, no product-state writes.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {session,browserOptions}=require('../scripts/m4-u4-ui-relay.cjs');
const {prepare,importPrepared,SLOT}=require('../scripts/m4-u4-startstand.cjs');
const root=path.resolve(__dirname,'..');
const sha=()=>execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const digest=data=>createHash('sha256').update(data).digest('hex');

async function diagnose(module,options,out,screenshotOnly){
 const fixture=prepare(module);
 const evidence={checkout:sha(),node:process.version,module,engine:options.engine,viewport:options.viewport,
  testMode:screenshotOnly?'screenshot-only-technical-test':'text-diagnostic',fixture:{id:fixture.id,hash:fixture.hash,sha256:fixture.sha256},steps:[],findings:{}};
 let relay,page,view;
 const f=evidence.findings;
 const record=step=>{
  const {image,...observation}=view;
  if(screenshotOnly&&!view.error){
   assert.ok(Buffer.isBuffer(image));
   assert.deepEqual(image,fs.readFileSync(path.join(out,view.screenshot)));
   assert.deepEqual(Object.keys(observation).sort(),['done','elapsedMs','height','remaining','round','screenshot','width']);
  }
  evidence.steps.push({step,observation});
 };
 const step=async command=>{
  view=await relay.step(command);
  record(command);
  assert.ok(!view.error,view.error);
  assert.equal(view.done,false,'Session hit its budget');
 };
 const label=async selector=>(await page.locator(selector).innerText()).trim();
 const saved=()=>page.evaluate(key=>localStorage.getItem(key),SLOT);
 async function pointInViewport(selector){
  const box=await page.locator(selector).boundingBox();
  assert.ok(box,'Expected rendered element: '+selector);
  const x=Math.floor(box.x+box.width/2),y=Math.floor(box.y+box.height/2);
  if(x<0||x>=view.width||y<0||y>=view.height)return null;
  return {x,y};
 }
 async function scrollPage(dy){
  if(screenshotOnly){
   await step({op:'scroll',x:10,y:Math.floor(view.height/2),dy});
   return;
  }
  const scroll=view.scrollRegions.find(region=>region.kind==='page'&&(dy<0?region.up:region.down));
  assert.ok(scroll,'No reachable page scroll point');
  await step({op:'scroll',x:scroll.x,y:scroll.y,dy});
 }
 async function navigate(selector){
  for(let moves=0;moves<5;moves++){
   const p=await pointInViewport(selector);
   if(p)return p;
   const box=await page.locator(selector).boundingBox();
   const dy=Math.max(-1500,Math.min(1500,Math.round(box.y+box.height/2-view.height*0.68)));
   await scrollPage(dy);
  }
  throw Error('Cannot reach '+selector);
 }
 async function pick(selector){
  const p=await navigate(selector);
  const button=page.locator(selector);
  const box=await button.boundingBox();
  if(screenshotOnly){
   assert.ok(await button.evaluate((el,p)=>el.contains(document.elementFromPoint(p.x,p.y)),p));
   await step({op:'click',...p});
   return;
  }
  const t=view.targets.find(t=>t.x>=box.x&&t.x<box.x+box.width&&t.y>=box.y&&t.y<box.y+box.height);
  assert.ok(t,`Missing target for ${selector} near ${JSON.stringify(p)}`);
  assert.ok(await button.evaluate((el,p)=>el.contains(document.elementFromPoint(p.x,p.y)),t));
  await step({op:'pick',id:t.id});
 }
 function checkpoint(name){
  record(name);
 }

 fs.mkdirSync(out,{recursive:true});
 try{
  const mode=screenshotOnly?{screenshotOnly:true}:{textMode:true,captureScreenshots:true,allowDialogs:true};
  relay=await session(root,out,{...options,...mode,preparePage:async p=>{
   page=p;
   await importPrepared(page,fixture);
   evidence.browserVersion=page.context().browser().version();
  }});
  view=await relay.observe();
  checkpoint('validated-start');
  assert.equal(view.round,0);
  if(!screenshotOnly){
   assert.match(view.visibleText,/Kommandobrücke/);
   f.initialTruncated=view.visibleText.includes('Anzeige gekürzt');
   f.initialTargets=view.targets.map(t=>t.label);
  }
  if(module==='C'){
   await navigate('#manager-erz-aktion');
   if(!screenshotOnly)assert.match(view.visibleText,/Erzgeschäft|Erzcharge|Exportkäufer/);
   checkpoint('ore-disposition');
   f.oreButton=await label('#manager-erz-aktion');
   f.oreReason=await label('#manager-erz-grund');
   f.oreEnabled=await page.locator('#manager-erz-aktion').isEnabled();
   await pick('#tab-flotte');
   await navigate('#manager-flotte-auswahl');
   if(!screenshotOnly){
    assert.ok(view.targets.some(t=>t.kind==='select'));
    f.fleetSelectLabels=view.targets.filter(t=>t.kind==='select').map(t=>t.label);
   }
   checkpoint('fleet-selector');
  }
  if(module==='D'){
   const explanation=/wenig Platz|Kleinere Lieferungen|Wasserwerk/;
   const p=await navigate('#manager-transport-grund');
   if(!screenshotOnly){
    f.blockVisibleAfterFirstScroll=explanation.test(view.visibleText);
    if(!f.blockVisibleAfterFirstScroll)await scrollPage(p.y-140);
    assert.match(view.visibleText,explanation);
   }
   checkpoint('storage-block');
   f.block=await label('#manager-transport-grund');
   assert.match(f.block,/Nadir hat zu wenig Platz/);
   assert.equal(await page.locator('#manager-transport-aktion').isEnabled(),false);
   await navigate('#manager-aussetzen-aktion');
   f.stopEnabled=await page.locator('#manager-aussetzen-aktion').isEnabled();
   f.stopReason=await label('#manager-aussetzen-grund');
   checkpoint('possible-response');
   await pick('#auftrag-details > summary');
   assert.equal(await page.locator('#auftrag-details').getAttribute('open'),'');
   checkpoint('receipts-open');
  }
  if(module==='E'){
   await navigate('#p3-invest-aktion');
   if(!screenshotOnly)assert.ok(view.targets.some(t=>t.kind==='button'&&/Miner verbindlich kaufen/.test(t.label)),
    'Investment offer missing from the visible target inventory');
   f.investment=await label('#p3-invest-ziel');
   f.investmentEnabled=await page.locator('#p3-invest-aktion').isEnabled();
   f.investmentButton=await label('#p3-invest-aktion');
   checkpoint('investment');
   await pick('#auftrag-details > summary');
   assert.equal(await page.locator('#auftrag-details').getAttribute('open'),'');
   checkpoint('receipts-open');
  }
  if(module==='F'){
   const initial={cash:await label('#hausgeld'),time:await label('#zeit'),orders:await label('#sektor-auftraege')};
   await pick('#welt-sichern');
   if(!screenshotOnly)assert.match(view.visibleText,/Karriere lokal gesichert/);
   checkpoint('saved');
   assert.equal(await saved(),fixture.json);
   f.savedSha256=digest(await saved());
   let navigations=0;
   page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
   await step({op:'reload'});
   assert.equal(navigations,1);
   assert.equal(await page.locator('#spielwelt').isVisible(),false);
   checkpoint('reloaded-menu');
   await pick('#fortsetzen');
   checkpoint('resumed-after-reload');
   if(!screenshotOnly)assert.match(view.visibleText,/Kommandobrücke/);
   assert.equal(await saved(),fixture.json);
   f.reloadedSha256=digest(await saved());
   f.initial=initial;
   f.resumed={cash:await label('#hausgeld'),time:await label('#zeit'),orders:await label('#sektor-auftraege')};
   assert.deepEqual(f.resumed,initial);
   await pick('[data-advance="60"]');
   f.afterTime=await label('#zeit');
   assert.notEqual(f.afterTime,initial.time);
   checkpoint('continued');
  }
  evidence.result='passed';
 }catch(error){
  evidence.result='failed';
  evidence.failure=String(error);
  throw error;
 }finally{
  fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2));
  if(relay)await relay.close();
 }
}

async function main(){
 const out=process.argv[2],screenshotOnly=process.argv[3]==='--screenshot-only';
 if(!out)throw Error('Usage: node tests/m4-u4-browser-diagnosis.cjs <output-directory>');
 let failures=0;
 for(const size of ['1180x820','1024x768']){
  const options=browserOptions({...process.env,M4_UI_VIEWPORT:size});
  for(const module of ['C','D','E','F']){
   const testId=`${options.engine}-${size}-${module}${screenshotOnly?'-visual':''}`;
   try{
    await diagnose(module,options,path.resolve(out,testId),screenshotOnly);
    console.log(testId,'PASS');
   }catch(error){
    failures++;
    console.error(testId,'FAIL',error.message);
   }
  }
 }
 if(failures)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
