/* P0: W5x Rule16 archived HTML must remain accessible at the historical URL.
 * In J4e CI Chromium and WebKit each run four touch sizes; no product saves. */
'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const browserKind=process.env.WELT_BROWSER||'chromium';
const playwright=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const contentTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=path.resolve(root,'.'+pathname);
  if(pathname.endsWith('/'))file=path.join(file,'index.html');
  if(file!==root&&!file.startsWith(root+path.sep))throw Error('Outside repository');
  if(!fs.statSync(file).isFile())throw Error('Not a file');
  res.writeHead(200,{'Content-Type':contentTypes[path.extname(file)]||'application/octet-stream'});
  res.end(fs.readFileSync(file));
 }catch{
  res.writeHead(404,{'Content-Type':'text/plain'});
  res.end('not found');
 }
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await playwright[browserKind].launch({headless:true});
 try{
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true});
   const page=await context.newPage();
   const errors=[],missing=[];
   page.on('pageerror',error=>errors.push(String(error)));
   page.on('response',response=>{if(response.status()>=400)missing.push(response.status()+' '+response.url())});
   await page.goto(origin+'/prototypes/w5x/');
   await page.waitForURL('**/prototypes/w5x/archiv/index.html');
   await page.waitForFunction(()=>document.querySelector('#identity')?.textContent.includes('Original-Audit OK'));
   const identity=await page.locator('#identity').innerText();
   assert.match(identity,/Regel 16/);
   assert.match(identity,/Tick 0/);
   assert.match(await page.locator('#w2-demand').innerText(),/arbeitsbereit/);
   await page.locator('[data-view="corporation"]').tap();
   assert.equal(await page.locator('#corporation').isVisible(),true);
   await page.locator('[data-step="60"]').tap();
   await page.locator('[data-step="60"]').tap();
   await page.waitForFunction(()=>document.querySelector('#identity')?.textContent.includes('Tick 120'));
   assert.match(await page.locator('#identity').innerText(),/Original-Audit OK/);
   assert.match(await page.locator('#w2-company-stats').innerText(),/19\.000 ISK/);
   // W5x kann sein originalgetreues Tabellen-Markup mit oder ohne explizites tbody darstellen.
   const rowsInBody=await page.locator('#w2-fleet tbody tr').count();
   const rowsTotal=await page.locator('#w2-fleet tr').count();
   assert.ok(rowsInBody===2 || rowsTotal===3,'zwei bezahlte NPC-Miner in Originaltabelle');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.deepEqual(missing,[]);
   assert.deepEqual(errors,[]);
   console.log('PASS W5x P0 archive '+browserKind+' '+width+'x'+height);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
