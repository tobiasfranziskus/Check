/* Dev-only: PLAYWRIGHT_MODULE=/path/to/playwright node tests/legacy-station-touch.cjs
   Chromium can be selected with CHROMIUM_PATH; no package is needed by the preview. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../prototypes/legacy-station');
(async()=>{
  const server=http.createServer((req,res)=>{
    const name=req.url==='/'?'index.html':req.url.slice(1);
    if(!['index.html','station.js','station.css','preview.js'].includes(name)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html');
    res.end(fs.readFileSync(path.join(base,name)));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
    for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
      const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true});
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.locator('h1').waitFor();
      for(const tab of ['hangar','storage','industry','market','orders','connections','overview']){
        const nav=page.locator('.main-nav [data-tab="'+tab+'"]');
        const box=await nav.boundingBox();assert(box.y>=0&&box.y+box.height<=height&&box.height>=48&&box.width>=44);
        await nav.tap();assert.equal(await nav.getAttribute('aria-pressed'),'true');
        assert(await page.locator('h2').isVisible());
      }
      await page.locator('.main-nav [data-tab="hangar"]').tap();
      await page.locator('[data-ship="1"]').tap();assert.match(await page.locator('.facts').innerText(),/demo-hauler/);
      await page.locator('[data-station]').selectOption('1');assert.match(await page.locator('h1').innerText(),/Vorschau B/);
      await page.locator('[data-station]').selectOption('0');
      // Update, focus, scroll, frozen input and hostile names in a real DOM.
      await page.evaluate(()=>{
        const deepFreeze=o=>{Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object')deepFreeze(v);return o;};
        const data=deepFreeze({provenance:'Touch-Test',stations:[{id:'s',name:'<img src=x onerror=alert(1)>',ships:[{id:'v',name:'Test'}],storage:Array.from({length:60},()=>({name:'Ware',quantity:0}))}]});
        const root=document.createElement('div');root.id='station';root.className='legacy-station';document.getElementById('station').replaceWith(root);window.testUI=LegacyStation.mount(root,data);window.testData=data;window.before=JSON.stringify(data);
      });
      await page.locator('.main-nav [data-tab="storage"]').tap();
      await page.locator('.main-nav [data-tab="market"]').focus();
      await page.evaluate(()=>{document.querySelector('.content').scrollTop=80;testUI.update(testData);});
      assert.equal(await page.evaluate(()=>document.activeElement.dataset.tab),'market');
      assert.equal(await page.evaluate(()=>JSON.stringify(testData)===before),true);
      assert.equal(await page.locator('img').count(),0);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await page.locator('.main-nav [data-tab="overview"]').tap();assert.equal(await page.locator('.content').evaluate(n=>n.scrollTop),0);
      assert.deepEqual(errors,[]);
      if(process.env.SCREENSHOT_DIR){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,`${width}x${height}.png`)});}
      console.log(`PASS Chromium touch ${width}x${height}`);await context.close();
    }
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
