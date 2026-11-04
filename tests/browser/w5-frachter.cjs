// Development-only Playwright; no package is added to the application.
const {chromium,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const viewport of [{width:1194,height:834},{width:834,height:1194},{width:375,height:812}]){
   const context=await browser.newContext({...devices['iPad Pro 11'],viewport,acceptDownloads:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(process.env.TEST_URL||'http://127.0.0.1:8765/prototypes/w5-frachter/frachter.html');
   await page.waitForFunction(()=>document.querySelector('#meldung').textContent.includes('Sitzung bereit'));
   assert(await page.locator('#start').isDisabled());
   const initial=await page.locator('#hash').innerText();
   await page.locator('#plus').tap();await page.locator('#minus').tap();
   assert.equal(await page.locator('#hash').innerText(),initial);
   await page.locator('[data-step="50"]').tap();await page.locator('#kauf').tap();
   assert.match(await page.locator('#details').innerText(),/ID sh\d+ · Eigentümer transport/);
   const bought=await page.locator('#hash').innerText();
   await page.locator('canvas').scrollIntoViewIfNeeded();
   const rect=await page.locator('canvas').boundingBox();
   // Tap and cancelled gesture can select only; neither issues an order.
   await page.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);
   await page.locator('canvas').dispatchEvent('pointerdown',{pointerId:80,clientX:rect.x+80,clientY:rect.y+80});
   await page.locator('canvas').dispatchEvent('pointercancel',{pointerId:80});
   assert.equal(await page.locator('#hash').innerText(),bought);
   await page.locator('#start').tap();assert.match(await page.locator('#route').innerText(),/Aldera → Nadir.*noch 60/);
   assert.match(await page.locator('#ladung').innerText(),/50 erz/);assert(await page.locator('#start').isDisabled());
   await page.locator('[data-step="60"]').tap();assert.match(await page.locator('#route').innerText(),/Nadir → Aldera.*noch 60/);
   assert.match(await page.locator('#ladung').innerText(),/leer/);
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').tap()]);
   const text=require('node:fs').readFileSync(await download.path(),'utf8'),hash=await page.locator('#hash').innerText();
   assert.equal(JSON.parse(text).w3.auftrag.phase,'rueck');
   await page.locator('[data-step="60"]').tap();assert.match(await page.locator('#details').innerText(),/Standort aldera/);
   page.once('dialog',d=>d.accept());
   await page.locator('#import').setInputFiles({name:'w3.json',mimeType:'application/json',buffer:Buffer.from(text)});
   await page.waitForFunction(()=>document.querySelector('#meldung').textContent.includes('geprüft und importiert'));
   assert.equal(await page.locator('#hash').innerText(),hash);
   await page.locator('#import').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{}')});
   await page.waitForFunction(()=>document.querySelector('#meldung').textContent.includes('Import abgelehnt'));
   assert.equal(await page.locator('#hash').innerText(),hash);
   await page.setViewportSize({width:viewport.height,height:viewport.width});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   for(const h of await page.locator('button,select,input').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height)))assert(h>=48);
   assert.deepEqual(errors,[]);
   await page.screenshot({path:'/tmp/w5-frachter-'+viewport.width+'.png',fullPage:true});
   await context.close();
  }
  console.log('W5-Frachter: 3 Touch-Viewports, Rotation, Kauf, Hin-/Rückflug, Auswahl/Abbruch ohne Befehl, Export/Import und Ablehnung geprüft (Chromium; kein reales Safari).');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
