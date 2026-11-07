/* Optional: PLAYWRIGHT_MODULE=/path/to/playwright node tests/browser/legacy-mining-scanner.cjs
 * Serves repository read-only on an ephemeral loopback port; no package installation. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'../../prototypes/legacy-mining-scanner');
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
 if(!['index.html','scanner.js','scanner.css','demo.js'].includes(name)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(base,name)));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
 try {
 for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1});const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.locator('.lms canvas').waitFor();
  await page.getByRole('button',{name:/Asteroid B/}).tap();await page.locator('.lms-detail').getByRole('heading',{name:'Asteroid B'}).waitFor();assert.match(await page.locator('.lms-detail').textContent(),/Eis · 40 Einheiten/);
  await page.getByRole('button',{name:/Asteroid C/}).tap();assert.match(await page.locator('.lms-detail').textContent(),/Nicht im Snapshot enthalten/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.ok(await page.locator('.lms button').evaluateAll(bs=>bs.every(b=>b.getBoundingClientRect().height>=48)));
  // Real touch on map, using the public pure camera helper.
  await page.locator("canvas").scrollIntoViewIfNeeded();
  const p=await page.evaluate(()=>{const v=LegacyMiningScanner.normalize(demoSnapshot),c=document.querySelector('canvas'),l=LegacyMiningScanner.layout(v,c.clientWidth,c.clientHeight),p=LegacyMiningScanner.project(v.asteroids[0].position,l.camera,l.zoom,c.clientWidth,c.clientHeight),r=c.getBoundingClientRect();return {x:r.left+p.x,y:r.top+p.y};});
  await page.touchscreen.tap(p.x,p.y);await page.locator('.lms-detail').getByRole('heading',{name:'Asteroid A'}).waitFor();
  await page.evaluate(()=>{
   const c=document.querySelector('canvas'),r=c.getBoundingClientRect();
   const fire=(type,values)=>c.dispatchEvent(new PointerEvent(type,{pointerId:1,isPrimary:true,button:0,clientX:r.left+50,clientY:r.top+50,...values}));
   fire('pointerdown');fire('pointermove',{clientX:r.left+90});fire('pointerup');
   fire('pointerdown');fire('pointercancel');fire('pointerup');
   fire('pointerdown');fire('pointerdown',{pointerId:2,isPrimary:false});fire('pointerup');
  });
  assert.equal(await page.getByRole('button',{name:/Asteroid A/}).getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{
   const deepFreeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(deepFreeze);Object.freeze(o);}return o;};
   window.fixture=deepFreeze({name:'<img src=x onerror=alert(1)>',asteroids:[{id:'safe',name:'<svg onload=alert(2)>',position:{x:0,y:0},resources:[{name:'<b>Erz</b>',amount:0,unit:'t'}],hazards:[]}],fields:[],zones:[]});
   window.before=JSON.stringify(fixture);window.host=document.createElement('div');document.body.append(host);window.instance=LegacyMiningScanner.mount(host,fixture);
  });
  await page.locator('button').filter({hasText:'<svg onload=alert(2)>'}).tap();assert.equal(await page.locator('.lms img,.lms svg,.lms b').count(),0);
  const result=await page.evaluate(()=>{
   host.querySelector('button').focus();const image=host.querySelector('canvas').toDataURL();for(let i=0;i<100;i++)instance.update(fixture);
   const deterministic=image===host.querySelector('canvas').toDataURL(), unchanged=before===JSON.stringify(fixture);
   const focus=host.contains(document.activeElement);const selected=host.querySelector('button').getAttribute('aria-pressed');instance.update({asteroids:[]});const removed=host.textContent.includes('Asteroid auswählen');
   instance.destroy();instance.destroy();instance.update(fixture);return {deterministic,unchanged,focus,selected,removed,empty:host.children.length===0};
  });assert.deepEqual(result,{deterministic:true,unchanged:true,focus:true,selected:'true',removed:true,empty:true});
  await page.locator('.lms button').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.lms button').first().getAttribute('aria-pressed'),'true');
  await page.setViewportSize({width:height,height:width});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width,height});
  await page.screenshot({path:`/tmp/legacy-mining-scanner-${width}x${height}.png`,fullPage:true});assert.deepEqual(errors,[]);console.log(`PASS Chromium touch ${width}x${height}`);await context.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
