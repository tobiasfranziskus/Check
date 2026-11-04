// PLAYWRIGHT_MODULE=/path/to/playwright node tests/browser/miner2d.cjs
// Static test server required; no runtime dependency is added to the game.
const {chromium,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const slot='aphros-void-erzpilot-regel15-v1';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const viewport of [{width:1194,height:834},{width:834,height:1194},{width:375,height:812}]){
   const context=await browser.newContext({...devices['iPad Pro 11'],viewport,acceptDownloads:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const url=process.env.TEST_URL||'http://127.0.0.1:8765/index.html';
   const saved=()=>page.evaluate(async key=>JSON.parse(await m_ui_speicher.dbGet(key)),slot);
   await page.goto(url+'?modus=miner2d');
   await page.waitForFunction(()=>!document.querySelector('#pilot-kauf').disabled);
   assert.match(await page.locator('#m2-status').innerText(),/Noch kein eigenes Schiff/);
   // A pre-existing regular save must survive all W1 operations and mode switches.
   await page.evaluate(()=>m_ui_speicher.dbPut('slot1','LEGACY-UNVERAENDERT'));
   await page.locator('#pilot-kauf').tap();
   assert.equal(await page.locator('#m2-schiff').inputValue(),'sh002');
   assert.match(await page.locator('#pilot-kasse').innerText(),/2.400/);
   await page.waitForTimeout(100);
   const hash=await page.locator('#m2-status').innerText();
   console.log('viewport',viewport);
   await page.locator('#m2-minus').tap();
   await page.locator('canvas').scrollIntoViewIfNeeded();
   const rect=await page.locator('canvas').boundingBox();
   await page.touchscreen.tap(rect.x+rect.width/2+550*.256,rect.y+rect.height/2-180*.256);
   assert.match(await page.locator('#m2-auswahl').innerText(),/erz/);
   assert.equal(await page.locator('#m2-status').innerText(),hash);
   await page.locator('#m2-mine').tap();
   assert.match(await page.locator('#m2-status').innerText(),/Tick 0.*foerdern/);
   await page.locator('#m2-step').tap();
   assert.match(await page.locator('#m2-vertrag').innerText(),/50 Erz.*500 ISK.*98 ISK/);
   assert.match(await page.locator('#m2-status').innerText(),/Tick 1.*Fracht 1 Erz/);
   await page.locator('#m2-wait').tap();
   assert.match(await page.locator('#pilot-voll-umsatz').innerText(),/10 ISK/);
   assert.match(await page.locator('#pilot-kasse').innerText(),/2.408/);
   await page.waitForFunction(async key=>JSON.parse(await m_ui_speicher.dbGet(key)).tick===1,slot);
   const snapshot=await saved();assert.equal(snapshot.minted,0);
   await page.reload();await page.waitForFunction(()=>!document.querySelector('#pilot-kauf').disabled);
   assert.deepEqual(await saved(),snapshot);
   await page.locator('#m2-ziel').selectOption('feld:erz');await page.locator('#m2-mine').tap();
   await page.locator('#pilot-stunde').tap();
   assert.match(await page.locator('#pilot-audit').innerText(),/OK/);
   await page.waitForFunction(async key=>JSON.parse(await m_ui_speicher.dbGet(key)).tick===61,slot);
   const after=await saved();assert(after.ledger.erz.mined>=61);assert(after.ledger.erz.exported>=50);
   assert(after.stats.konto.house.erloes>=500);assert.equal(after.minted,0);
   await Promise.all([page.waitForURL('**?modus=erzpilot'),page.locator('#pilot-konten').tap()]);await page.waitForFunction(()=>!document.querySelector('#pilot-kauf').disabled);
   assert.deepEqual(await saved(),after);
   assert.equal(await page.evaluate(()=>m_ui_speicher.dbGet('slot1')),'LEGACY-UNVERAENDERT');
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#pilot-datei').tap()]);
   const exported=require('node:fs').readFileSync(await download.path(),'utf8');
   assert.deepEqual(JSON.parse(exported),after);
   page.once('dialog',d=>d.accept());
   await page.locator('#pilot-datei-input').setInputFiles({name:'w1.json',mimeType:'application/json',buffer:Buffer.from(exported)});
   await page.waitForFunction(()=>document.querySelector('#pilot-meldung').textContent.includes('geprüft und importiert'));
   assert.deepEqual(await saved(),after);

   await Promise.all([page.waitForURL('**?modus=miner2d'),page.locator('#pilot-2d').tap()]);await page.waitForFunction(()=>!document.querySelector('#pilot-kauf').disabled);
   await page.locator('#m2-plus').tap();await page.locator('#m2-minus').tap();
   await page.setViewportSize({width:viewport.height,height:viewport.width});await page.waitForTimeout(80);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   for(const h of await page.locator('#miner2d button, #miner2d select').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height)))assert(h>=48);
   await page.screenshot({path:'/tmp/w1-miner2d-'+viewport.width+'.png',fullPage:true});
   assert.deepEqual(errors,[]);await context.close();
  }
  const context=await browser.newContext({reducedMotion:'reduce'});const page=await context.newPage();
  await page.goto((process.env.TEST_URL||'http://127.0.0.1:8765/index.html')+'?modus=miner2d');await page.waitForSelector('#m2-status');
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
  // An unreadable W1 save blocks all simulation controls and remains exportable verbatim.
  const broken='{"schema":8,"rulesVersion":15,"broken":true}';
  await page.evaluate(([key,text])=>m_ui_speicher.dbPut(key,text),[slot,broken]);
  await page.reload();await page.waitForFunction(()=>document.querySelector('#pilot-meldung').textContent.includes('nicht lesbar'));
  assert.equal(await page.locator('#m2-step').isDisabled(),true);
  assert.equal(await page.locator('#m2-mine').isDisabled(),true);
  assert.equal(await page.evaluate(key=>m_ui_speicher.dbGet(key),slot),broken);
  await context.close();console.log('Browser: 3 touch viewports, rotation, purchase, escrow, partial/full delivery, stop/refund, shared Save/Load, slot1 protection, reduced motion passed (Chromium; not real iPad Safari).');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
