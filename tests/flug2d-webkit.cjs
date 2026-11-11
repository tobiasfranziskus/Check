/* Independent WebKit/JavaScriptCore F0 cross-engine check; not an actual iPad Safari acceptance. */
'use strict';
const {webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const allowed=new Set([
 'prototypes/flug2d/index.html','prototypes/flug2d/flug-kern.js',
 'prototypes/flug2d/referenz.js','prototypes/flug2d/sandbox.js','prototypes/flug2d/grafik.js',
 'prototypes/w5ac/rule191-w5-ferry-core.js'
]);
async function run(){
 const server=http.createServer((req,res)=>{
  const name=req.url.split('?')[0].replace(/^\//,'').replace(/\/$/,'/index.html');
  if(!allowed.has(name)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':'text/html');
  res.end(fs.readFileSync(path.join(root,name)));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await webkit.launch({headless:true});
  for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
   await require('./flug2d-eingabe-browser.cjs')(browser,'http://127.0.0.1:'+server.address().port+'/prototypes/flug2d/index.html',width,height);
   const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,acceptDownloads:true});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto('http://127.0.0.1:'+server.address().port+'/prototypes/flug2d/index.html');
   await page.waitForFunction(()=>!!window.FlugSandbox&&document.querySelector('#hud').textContent.includes('angedockt'));
   const reference=await page.evaluate(()=>{
    const chain=FlugReferenz.kette(W5acOriginal.core);
    return {chain,expected:FlugReferenz.HASH};
   });
   assert.equal(reference.chain,'e2674c1ef11678ba','WebKit JSCore must match Node22/V8 minute chain');
   assert.equal(reference.chain,reference.expected);
   await page.locator('summary').tap();
   await page.locator('#referenz').tap();
   await page.waitForFunction(()=>document.querySelector('#pruefung').textContent.includes('Referenzlauf identisch'));
   await page.locator('#dock').tap();
   await page.waitForFunction(()=>JSON.parse(FlugSandbox.zustand()).ships.sp1.flug.lage==='frei',{},{timeout:15000});
   await page.locator('#erz').tap();
   await page.waitForFunction(()=>document.querySelector('#meldung').textContent.includes('shipApproach angenommen'));
   const flight=JSON.parse(await page.evaluate(()=>FlugSandbox.zustand())).ships.sp1.flug;
   assert.equal(flight.modus,'anflug');assert.deepEqual(flight.ziel,{art:'feld',id:'aldera:erz'});
   await page.locator('#pause').tap();
   const saved=await page.evaluate(()=>FlugSandbox.zustand());
   await page.waitForTimeout(250);
   assert.equal(await page.evaluate(()=>FlugSandbox.zustand()),saved,'pause must freeze canonical flight state');
   // Round-trip a real downloaded JSON while the ship is in flight and paused.
   await page.locator('#replay').tap();
   assert.match(await page.locator('#pruefung').innerText(), /^Replay identisch/);
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').tap()]);
   const json=fs.readFileSync(await download.path(),'utf8');
   assert.equal(json,saved);
   await page.locator('#minute').tap();
   assert.notEqual(await page.evaluate(()=>FlugSandbox.zustand()),saved);
   await page.locator('#import').setInputFiles({name:'flug.json',mimeType:'application/json',buffer:Buffer.from(json)});
   await page.waitForFunction(()=>document.querySelector('#pruefung').textContent.includes('Import geprüft'));
   assert.equal(await page.evaluate(()=>FlugSandbox.zustand()),saved);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow '+width+'x'+height);
   await require('./flug2d-grafik-browser.cjs')(page,width,height);
   assert.deepEqual(errors,[],'no runtime errors');
   await ctx.close();
   console.log('FLUG2D_WEBKIT_OK '+width+'x'+height+' '+reference.chain);
  }
 }finally{if(browser)await browser.close();server.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
