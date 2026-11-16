/* P0 archival regression: old deep links -> same working demo, no missing assets.
   CI: PLAYWRIGHT_MODULE=/path/to/playwright WELT_BROWSER=chromium|webkit
   node tests/p0-legacy-hub-browser.cjs
*/
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const browserKind=process.env.WELT_BROWSER||'chromium';
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
const server=http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=path.resolve(root,'.'+pathname);
  if(pathname.endsWith('/'))file=path.join(file,'index.html');
  if(file!==root&&!file.startsWith(root+path.sep))throw Error('Outside root');
  const stat=fs.statSync(file);
  if(!stat.isFile())throw Error('Not a file');
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
  res.end(fs.readFileSync(file));
 }catch{
  res.writeHead(404,{'Content-Type':'text/plain'});
  res.end('not found');
 }
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await pw[browserKind].launch({headless:true});
 try{
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true});
   const page=await ctx.newPage();
   const errors=[],missing=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('response',r=>{if(r.status()>=400)missing.push(r.status()+' '+r.url())});
   await page.goto(origin+'/prototypes/legacy-hub/');
   await page.waitForURL('**/prototypes/legacy-hub/archiv/index.html');
   await page.locator('.legacy-corporation h1').waitFor();
   await page.locator('#hub-nav [data-view="fitting"]').tap();
   assert.equal(await page.locator('.hub-view[data-view="fitting"]').isVisible(),true);
   await page.locator('#hub-nav [data-view="scanner"]').tap();
   assert.equal(await page.locator('.hub-view[data-view="scanner"]').isVisible(),true);
   assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   await page.goto(origin+'/prototypes/legacy-hub/core-preview.html');
   await page.waitForURL('**/prototypes/legacy-hub/archiv/core-preview.html');
   await page.locator('#core-file').setInputFiles(path.join(root,'tests/fixtures/w5t/r32-seed42.json'));
   await page.locator('#core-input button').tap();
   // 'Noch kein Core-Snapshot geladen' enthält bereits 'Core-Snapshot':
   // auf den fertigen, überprüften Importstatus warten, nicht bloß das Wort.
   await page.waitForFunction(() => document.getElementById('core-status').textContent.startsWith('Core-Snapshot · Tick '));
   assert.equal(await page.locator('.legacy-corporation h1').count()>0,true);
   assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   // Auch zwei weitere historische Deep Links muessen nach P0-Archivierung
   // mit denselben JS-/CSS-Dateien weiterhin bedienbar bleiben.
   await page.goto(origin+'/prototypes/legacy-fitting/');
   await page.waitForURL('**/prototypes/legacy-fitting/archiv/index.html');
   await page.locator('#fitting .layout').waitFor();
   await page.locator('[data-platz="platz-laser"]').tap();
   await page.locator('[data-modul="laser-S-MK2"]').tap();
   assert.match(await page.locator('#vergleich').innerText(),/Hypothetischer Vergleich/);
   assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   await page.goto(origin+'/prototypes/legacy-pilot/');
   await page.waitForURL('**/prototypes/legacy-pilot/archiv/index.html');
   await page.locator('.lp h1').waitFor();
   await page.locator('#pilot-choice').selectOption('3');
   assert.match(await page.locator('.lp h1').innerText(),/Tarek Holm/);
   await page.locator('[data-skill="combat"]').tap();
   assert.equal(await page.locator('[data-skill="combat"]').getAttribute('aria-pressed'),'true');
   assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   assert.deepEqual(missing,[]);
   assert.deepEqual(errors,[]);
   console.log('PASS P0 legacy-hub old URLs -> archived demo '+browserKind+' '+width+'x'+height);
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
