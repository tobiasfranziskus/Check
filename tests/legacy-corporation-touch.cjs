// Dev-only. PLAYWRIGHT_MODULE=/path/to/playwright node tests/legacy-corporation-touch.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../prototypes/legacy-corporation');
(async()=>{
  const server=http.createServer((req,res)=>{const file=req.url==='/'?'index.html':req.url.slice(1);if(!['index.html','corporation.js','corporation.css','demo.js'].includes(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(base,file)));});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
    for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
      const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.locator('h1').waitFor();assert.match(await page.locator('.provenance').innerText(),/DEMO/);
      for(const tab of ['fleet','economy','orders','overview']){const b=page.locator('[data-tab="'+tab+'"]'),box=await b.boundingBox();assert(box.height>=48&&box.width>=48&&box.y>=0&&box.y+box.height<=height);await b.tap();assert.equal(await b.getAttribute('aria-pressed'),'true');assert(await page.locator('h2').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
      await page.locator('[data-tab="fleet"]').tap();await page.locator('[data-ship="1"]').tap();assert.match(await page.locator('.split').innerText(),/hauler-1/);
      await page.evaluate(()=>{const freeze=o=>{Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return o;};window.testSnapshot=freeze({...corporationDemo,company:{...corporationDemo.company,name:'<img src=x onerror=alert(1)>'}});window.before=JSON.stringify(testSnapshot);corporationPreview.update(testSnapshot);});
      await page.locator('[data-ship="1"]').focus();await page.evaluate(()=>{document.querySelector('.content').scrollTop=100;window.scrollBefore=document.querySelector('.content').scrollTop;for(let i=0;i<100;i++)corporationPreview.update(testSnapshot);});
      assert.equal(await page.evaluate(()=>document.activeElement.dataset.ship),'1');assert(await page.evaluate(()=>document.querySelector('.content').scrollTop===scrollBefore));assert(await page.evaluate(()=>JSON.stringify(testSnapshot)===before));assert.equal(await page.locator('img').count(),0);
      await page.keyboard.press('Enter');assert.equal(await page.locator('[data-ship="1"]').getAttribute('aria-pressed'),'true');
      await page.setViewportSize({width:height,height:width});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width,height});
      await page.locator('[data-tab="economy"]').tap();assert.match(await page.locator('main').innerText(),/Unternehmensergebnis/);
      if(process.env.SCREENSHOT_DIR){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,`${width}x${height}.png`)});}
      await page.evaluate(()=>corporationPreview.update({}));assert.match(await page.locator('main').innerText(),/Nicht verfügbar/);assert.doesNotMatch(await page.locator('main').innerText(),/NaN|undefined/);
      await page.evaluate(()=>{corporationPreview.destroy();corporationPreview.destroy();});assert.equal(await page.locator('#corporation').innerHTML(),'');assert.deepEqual(errors,[]);
      console.log(`PASS Chromium touch ${width}x${height}: navigation, selection, keyboard, rotation, freeze, focus, scroll, XSS, missing data, destroy`);await context.close();
    }
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
