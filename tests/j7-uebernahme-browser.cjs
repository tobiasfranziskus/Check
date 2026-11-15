// J7: tatsächliche lokale Datei-/Auditanzeige in Chromium und WebKit, kein Save-Ersatz.
'use strict';
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const Session=require('../prototypes/w5ac/session.js');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const dest=path.resolve(root,'.'+pathname);
  if(!dest.startsWith(root+path.sep+'prototypes'+path.sep)){res.writeHead(404).end();return;}
  try{const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
    res.setHeader('Content-Type',types[path.extname(dest)]||'text/plain');res.end(fs.readFileSync(dest));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browserKind=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 let browser;
 try{
  browser=await (browserKind==='webkit'?webkit:chromium).launch(browserKind==='webkit'?{}:{args:['--no-sandbox']});
  const source=Session.create(42,'private195'),saved=source.export();
  for(const [width,height] of [[1180,820],[820,1180],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
   const page=await context.newPage(),errors=[],outgoing=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('request',q=>{if(!q.url().startsWith('http://127.0.0.1:'))outgoing.push(q.url());});
   await page.goto('http://127.0.0.1:'+server.address().port+'/prototypes/verbund/index.html');
   const input=page.locator('#quelle');
   assert.equal(await input.isVisible(),true);
   assert.equal(await page.locator('#stufen li').count(),0);
   await input.setInputFiles({name:'regel195-original.json',mimeType:'application/json',buffer:Buffer.from(saved)});
   await page.waitForFunction(()=>document.querySelectorAll('#stufen li').length===6);
   assert.match(await page.locator('#ergebnis').textContent(),/Alle sechs/);
   assert.match(await page.locator('#ergebnis').textContent(),/Kein Jäger kostenlos/);
   assert.equal(await page.locator('#ergebnis').getAttribute('class'),'success');
   assert.equal(await page.locator('#stufen li').count(),6);
   assert.equal(await page.locator('#stufen li').last().textContent().then(x=>x.includes('203 → 204')),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true);
   // Mit manipuliertem Geld: kein verkäuflicher Konvertierungsstand.
   const tamper=JSON.parse(saved);tamper.owners.house.cash++;
   await input.setInputFiles({name:'gefälscht.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(tamper))});
   await page.waitForFunction(()=>document.querySelector('#ergebnis').className==='fail');
   assert.match(await page.locator('#ergebnis').textContent(),/Keine Übernahme zulässig/);
   assert.equal(await page.locator('#stufen li.fail').count(),1);
   assert.equal(await page.locator('button').count(),0,'kein versteckter Übernahme-/Importbutton');
   assert.deepEqual(outgoing,[]);assert.deepEqual(errors,[]);
   assert.equal(source.export(),saved,'195-Original blieb unverändert');
   console.log('J7_BROWSER_OK',JSON.stringify({browser:browserKind,width,height,stufen:6,manipuliertAbgewiesen:true}));
   await context.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
