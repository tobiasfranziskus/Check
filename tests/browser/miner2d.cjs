// Optional browser acceptance: PLAYWRIGHT_MODULE=/path/to/playwright node tests/browser/miner2d.cjs
const {chromium,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const viewport of [{width:1194,height:834},{width:834,height:1194},{width:375,height:812}]){
   const context=await browser.newContext({...devices['iPad Pro 11'],viewport});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto((process.env.TEST_URL||'http://127.0.0.1:8765/index.html')+'?modus=miner2d');
   await page.waitForSelector('#m2-status');assert.deepEqual(errors,[]);await page.waitForTimeout(150);
   assert.match(await page.locator('#m2-status').innerText(),/Tick 0/);
   const hash=await page.locator('#m2-status').innerText();
   await page.locator('#m2-ziel').selectOption('feld:erz');
   assert.equal(await page.locator('#m2-mine').isEnabled(),true);
   // Actual touch selection on the asteroid: selection must not advance or submit.
   await page.locator('#m2-minus').tap();
   const rect=await page.locator('canvas').boundingBox();
   await page.touchscreen.tap(rect.x+rect.width/2+550*.256,rect.y+rect.height/2-180*.256);
   assert.match(await page.locator('#m2-auswahl').innerText(),/erz/);
   assert.equal(await page.locator('#m2-status').innerText(),hash);
   await page.locator('#m2-mine').tap();assert.match(await page.locator('#m2-result').innerText(),/Queue/);
   await page.locator('#m2-step').tap();assert.match(await page.locator('#m2-status').innerText(),/Tick 1.*foerdern/);
   await page.locator('#m2-wait').tap();await page.locator('#m2-step').tap();assert.match(await page.locator('#m2-status').innerText(),/Tick 2.*halten/);
   await page.locator('#m2-plus').tap();await page.locator('#m2-minus').tap();
   await page.setViewportSize({width:viewport.height,height:viewport.width});await page.waitForTimeout(80);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   for(const box of await page.locator('#miner2d button, #miner2d select').evaluateAll(es=>es.map(e=>({h:e.getBoundingClientRect().height}))))assert(box.h>=48);
   await page.screenshot({path:'/tmp/miner2d-'+viewport.width+'.png',fullPage:true});
   assert.deepEqual(errors,[]);await context.close();
  }
  const context=await browser.newContext({reducedMotion:'reduce'});const page=await context.newPage();
  await page.goto((process.env.TEST_URL||'http://127.0.0.1:8765/index.html')+'?modus=miner2d');await page.waitForSelector('#m2-status');
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
  await context.close();console.log('Browser: 3 touch viewports, rotation, Core orders, reduced motion passed (Chromium; not real iPad Safari).');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
