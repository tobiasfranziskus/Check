// Development-only: PLAYWRIGHT_MODULE=/path/to/playwright node tests/browser/w5-jagd.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 for(const viewport of [{width:1194,height:834},{width:834,height:1194},{width:375,height:812}]){
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:2});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:8765/prototypes/w5-jagd/jagd-vorschau.html');
  await page.waitForFunction(()=>document.querySelector('#ort').textContent.includes('Tick 120'));
  for(const h of await page.locator('button,select').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height)))assert(h>=48);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const box=await page.locator('canvas').boundingBox();
  const z=Math.min(.32,box.width/1800);
  await page.touchscreen.tap(box.x+box.width/2-620*z,box.y+box.height/2-230*z);
  assert.equal(await page.locator('#schiffe').inputValue(),'mock:sh101');
  assert.match(await page.locator('#pilot').innerText(),/XP: unbekannt/);
  const tick=await page.locator('#ort').innerText();await page.locator('#plus').tap();await page.locator('#minus').tap();assert.equal(await page.locator('#ort').innerText(),tick);
  await page.locator('#schiffe').selectOption('mock:sh303');await page.locator('[data-stufe="2"]').tap();
  assert.match(await page.locator('#abschuesse').innerText(),/1 belegte/);assert.match(await page.locator('#auswahl').innerText(),/zerstoert/);
  assert.equal(await page.locator('#ereignisse li').count(),2);
  await page.locator('[data-stufe="0"]').tap();assert.equal(await page.locator('#ereignisse li').count(),0);
  // Real Chromium multi-touch dispatch, no claim about physical iPad Safari.
  await page.locator('canvas').scrollIntoViewIfNeeded();const b=await page.locator('canvas').boundingBox(),x=b.x+b.width/2,y=b.y+b.height/2;
  const beforePinch=await page.locator('canvas').evaluate(c=>c.toDataURL());
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-40,y,id:1},{x:x+40,y,id:2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-70,y,id:1},{x:x+70,y,id:2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.notEqual(await page.locator('canvas').evaluate(c=>c.toDataURL()),beforePinch);
  assert.equal(await page.locator('#schiffe').inputValue(),'mock:sh303');assert.equal(await page.locator('#ort').innerText(),tick);
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#zentrum').tap();
  await page.setViewportSize({width:viewport.height,height:viewport.width});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize(viewport);await page.screenshot({path:'/tmp/w5-jagd-'+viewport.width+'.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({viewport,errors,passed:true}));await context.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
