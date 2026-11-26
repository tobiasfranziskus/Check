'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {session,browserOptions,action,LIMIT,TARGETS_PER_PAGE}=require('../scripts/m4-u4-ui-relay.cjs');

const fixture=`<!doctype html><style>
body{margin:20px}p{margin:0;height:24px}select{width:180px}
.obscured{position:absolute;top:120px;right:35px}
.cover{z-index:2;background:white;width:200px;height:60px}
.nested{position:absolute;right:16px;top:270px;width:200px;height:100px;overflow:auto}
.pagination{position:absolute;left:250px;top:900px;display:grid;grid-template-columns:repeat(5,110px)}
</style>
<button title="TITLE_SECRET" aria-label="ARIA_SECRET" data-private="ATTR_SECRET">Upper button</button>
<details><summary>Details</summary><p>CLIPPED_SECRET</p></details>
<select id="choices" onchange="document.querySelector('#status').textContent='Selection changed'">
<option value="VALUE_SECRET">Current option</option><option>Other option</option><option>UNSELECTED_SECRET</option>
</select> <a href="#lower" onclick="document.querySelector('#status').textContent='Link clicked';return false">Link</a>
<span id="status">No action</span>
${Array.from({length:24},(_,i)=>`<p>Line ${i+1}: This neutral paragraph is long enough to fill the independent visible-text budget.</p>`).join('')}
<button id="lower" onclick="this.textContent='Lower clicked'">Lower button</button>
<button disabled>Disabled button</button>
<button hidden>HIDDEN_SECRET</button><button style="opacity:0">OPACITY_SECRET</button>
<button style="position:absolute;left:-1000px">OFFSCREEN_SECRET</button>
<button class="obscured">COVERED_SECRET</button><div class="cover obscured"></div>
<div class="nested"><div style="height:220px">Scroll region</div><button>Nested end</button></div>
<div class="pagination">${Array.from({length:25},(_,i)=>`<button>Page item ${i+1}</button>`).join('')}</div>
<div style="height:800px"></div>`;

for(const size of ['1180x820','1024x768']){
 const options=browserOptions({...process.env,M4_UI_VIEWPORT:size});
 test(`${options.engine} ${size} visible controls, scroll, native select, pagination and round budget`,
  {skip:!process.env.M4_UI_BROWSER,timeout:40000},async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'m4-visible-'));
  fs.writeFileSync(path.join(root,'index.html'),fixture);
  const evidence=process.env.M4_U4_EVIDENCE;
  const out=evidence?path.join(evidence,'neutral-'+options.engine+'-'+size):path.join(root,'out');
  let relay,page;
  const observations=[];
  try{
   relay=await session(root,out,{...options,textMode:true,captureScreenshots:!!evidence,preparePage:p=>{page=p;}});
   let view=await relay.observe();
   observations.push({step:'initial',view});
   const target=(label,kind)=>view.targets.find(t=>t.label===label&&(!kind||t.kind===kind));
   const step=async a=>{
    view=await relay.step(a);
    observations.push({step:a,view});
    assert.equal(view.error,undefined);
   };
   const pick=async(label,kind)=>{
    const t=target(label,kind);
    assert.ok(t,`Missing ${label}: ${JSON.stringify(view.targets)}`);
    await step({op:'pick',id:t.id});
   };
   assert.deepEqual({width:view.width,height:view.height},options.viewport);
   assert.match(view.visibleText,/Anzeige gekürzt/);
   assert.doesNotMatch(view.visibleText,/Lower button/);
   assert.ok(target('Lower button','button'));
   assert.ok(target('Details','summary'));
   assert.ok(target('Link','link'));
   assert.ok(target('Current option','select'));
   assert.doesNotMatch(JSON.stringify(view),/SECRET|Other option|Nested end|Page item|Disabled button.*"kind"/);
   assert.equal(target('Disabled button'),undefined);
   assert.equal(view.round,0);
   assert.equal(await page.locator('#status').textContent(),'No action');
   assert.equal(await page.locator('details').getAttribute('open'),null);
   assert.equal(await page.locator('#lower').textContent(),'Lower button');
   for(const a of [{op:'pick',id:20},{op:'targets',page:2},{op:'key',key:'Enter'},
    {op:'click',x:view.width,y:0},{op:'scroll',x:0,y:view.height,dy:30}]){
    await assert.rejects(relay.step(a));
   }
   // A once-visible target replaced by a covering surface must never receive a click.
   const stale=target('Upper button');
   await page.locator('button').first().evaluate(el=>{el.hidden=true;});
   await step({op:'pick',id:stale.id});
   assert.equal(await page.locator('#status').textContent(),'No action');
   await pick('Lower button','button');
   assert.equal(await page.locator('#lower').textContent(),'Lower clicked');
   await pick('Details','summary');
   assert.equal(await page.locator('details').getAttribute('open'),'');
   await pick('Link','link');
   assert.equal(await page.locator('#status').textContent(),'Link clicked');
   await pick('Current option','select');
   assert.equal(view.selectKeys,true);
   await step({op:'key',key:'ArrowDown'});
   // Chromium's popup and WebKit's headless select commit at different times.
   await step({op:'key',key:'Enter'});
   assert.ok(target('Other option','select'));
   assert.equal(await page.locator('#status').textContent(),'Selection changed');
   const nested=view.scrollRegions.find(r=>r.kind==='region'&&r.down);
   assert.ok(nested);
   await step({op:'scroll',x:nested.x,y:nested.y,dy:250});
   assert.ok(target('Nested end'));
   const documentScroll=view.scrollRegions.find(r=>r.kind==='page'&&r.down);
   assert.ok(documentScroll);
   await step({op:'scroll',x:documentScroll.x,y:documentScroll.y,dy:780});
   assert.ok(view.targetInventory.pages>1);
   assert.equal(view.targets.length,TARGETS_PER_PAGE);
   const firstPageCount=view.targetInventory.total;
   await step({op:'targets',page:2});
   assert.equal(view.targetInventory.page,2);
   assert.equal(view.targetInventory.total,firstPageCount);
   assert.ok(target('Page item 25'));
   for(let i=view.round;i<LIMIT;i++)await step({op:'wait',ms:0});
   assert.equal(view.round,LIMIT);
   assert.equal(view.done,true);
   assert.equal((await relay.step({op:'click',x:0,y:0})).round,LIMIT);
  }finally{
   if(evidence&&fs.existsSync(out))fs.writeFileSync(path.join(out,'observations.json'),JSON.stringify(observations,null,2));
   if(relay)await relay.close();
   fs.rmSync(root,{recursive:true,force:true});
  }
 });
}

for(const size of ['1180x820','1024x768']){
 const options=browserOptions({...process.env,M4_UI_VIEWPORT:size});
 for(const [name,content] of [
  ['covered','<button id="guarded">COVERED_SENTINEL</button><div class="cover"></div>'],
  ['masked','<button id="guarded" style="-webkit-text-security:disc">MASKED_SENTINEL</button>'],
  ['transparent','<button id="guarded" style="-webkit-text-fill-color:transparent">FILL_SENTINEL</button>'],
  ['replacement','<button id="guarded">Guarded control</button>'],
  ['hover-replacement','<button id="guarded">Guarded control</button>'],
  ['focus','<select id="guarded"><option>First</option><option>Second</option></select> <select id="other"><option>First</option><option>Second</option></select>'],
 ]){
  test(`${options.engine} ${size} visibility boundary: ${name}`,{
   skip:!process.env.M4_UI_BROWSER,timeout:15000
  },async()=>{
   const root=fs.mkdtempSync(path.join(os.tmpdir(),'m4-boundary-'));
   fs.writeFileSync(path.join(root,'index.html'),`<!doctype html><style>
    #guarded{position:absolute;left:40px;top:140px;width:220px;height:60px}
    .cover{position:absolute;left:30px;top:130px;width:240px;height:80px;z-index:2;background:#fff;pointer-events:none}
    </style><button>Visible control</button>${content}`);
   const evidence=process.env.M4_U4_EVIDENCE;
   const out=evidence?path.join(evidence,`boundary-${options.engine}-${size}-${name}`):path.join(root,'out');
   let relay,page;
   const observations=[];
   try{
    relay=await session(root,out,{...options,textMode:true,captureScreenshots:!!evidence,preparePage:p=>{page=p;}});
    if(name==='focus')await page.locator('#guarded').focus();
    const first=await relay.observe();
    observations.push(first);
    assert.ok(first.targets.some(t=>t.label==='Visible control'));
    if(name==='replacement'||name==='hover-replacement'){
     const target=first.targets.find(t=>t.label==='Guarded control');
     assert.ok(target);
     await page.locator('#guarded').evaluate((el,hover)=>{
      const replace=()=>{
       const replacement=el.cloneNode(true);
       replacement.addEventListener('click',()=>{replacement.textContent='Replacement clicked';});
       el.replaceWith(replacement);
      };
      if(hover)el.addEventListener('pointerenter',replace,{once:true});
      else replace();
     },name==='hover-replacement');
     const fresh=await relay.step({op:'pick',id:target.id});
     observations.push(fresh);
     assert.equal(fresh.error,undefined);
     assert.equal(await page.locator('#guarded').textContent(),'Guarded control');
     assert.deepEqual(fresh.targets,first.targets);
    }else if(name==='focus'){
     assert.equal(first.selectKeys,true);
     await page.locator('#other').focus();
     const fresh=await relay.step({op:'key',key:'ArrowDown'});
     observations.push(fresh);
     assert.equal(fresh.error,undefined);
     assert.equal(fresh.selectKeys,true);
     assert.equal(await page.locator('#other').evaluate(el=>el.selectedIndex),0);
    }else{
     const box=await page.locator('#guarded').boundingBox();
     const guarded=({x,y})=>x>=box.x&&x<box.x+box.width&&y>=box.y&&y<box.y+box.height;
     assert.deepEqual({
      sentinel:/_SENTINEL/.test(JSON.stringify(first)),
      target:first.targets.some(guarded),
     },{sentinel:false,target:false});
     assert.ok(first.visibleText.includes('Visible control'));
    }
   }finally{
    if(evidence&&fs.existsSync(out))fs.writeFileSync(path.join(out,'observations.json'),JSON.stringify(observations,null,2));
    if(relay)await relay.close();
    fs.rmSync(root,{recursive:true,force:true});
   }
  });
 }
}

test('viewport options and added actions use strict bounds',()=>{
 const small={width:1024,height:768};
 assert.throws(()=>browserOptions({M4_UI_VIEWPORT:'1024x820'}));
 assert.throws(()=>browserOptions({M4_UI_BROWSER_ENGINE:'firefox'}));
 for(const command of [{op:'click',x:1024,y:767},{op:'scroll',x:10,y:768,dy:0},{op:'click',x:1.5,y:300},
  {op:'pick',id:1,selector:'button'},{op:'targets',page:0},{op:'key',key:'Tab'},{op:'key',key:'Enter',x:1}]){
  assert.throws(()=>action(command,small));
 }
 assert.deepEqual(action({op:'click',x:1023,y:767},small),{op:'click',x:1023,y:767});
});
