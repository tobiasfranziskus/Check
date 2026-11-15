// J10a – echte, rein lesende Werft-/Rechte-/Finanzübersicht in Chromium/WebKit.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const OLD=require('../prototypes/w5ac/session.js');
const original=OLD.create(42,'private195').export();
(async()=>{
 const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{
   const pathname=new URL(req.url,'http://127.0.0.1').pathname,file=path.resolve(root,'.'+pathname);
   if(!file.startsWith(root+path.sep+'prototypes'+path.sep)){res.writeHead(404).end();return;}
   try{const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
      res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));
   }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const which=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium',url='http://127.0.0.1:'+server.address().port+'/prototypes/verbund/konzern.html';
 let browser;
 try{
 browser=await (which==='webkit'?webkit:chromium).launch(which==='webkit'?{}:{args:['--no-sandbox']});
 for(const [width,height] of [[1180,820],[820,1180],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});
  const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('request',q=>{if(!q.url().startsWith('http://127.0.0.1:'))external.push(q.url());});
  await page.goto(url);
  await page.locator('#quelle195').setInputFiles({name:'quelle.json',mimeType:'application/json',buffer:Buffer.from(original)});
  await page.waitForFunction(()=>document.querySelectorAll('#stufen li').length===6);
  await page.locator('#zustimmung195').check();await page.locator('#start195').click();
  assert.equal(await page.locator('#konzernwelt').isVisible(),true);
  assert.equal(await page.locator('#j10-vertraege tr').count()>=8,true,'jedes echte fremde Angebot gezeigt');
  assert.equal(await page.locator('#j10-fertige').textContent(),'0');
  assert.equal(await page.locator('#j10-bauteile').textContent(),'0 / 8');
  assert.match(await page.locator('#j10-hinweis').textContent(),/32 min|32 ISK/);
  assert.equal(await page.locator('#j10-jaeger-kaufen').isDisabled(),true,'kein gratis Sofortjäger');
  const rows=await page.locator('#j10-vertraege tr').allTextContents();
  assert.ok(rows.some(x=>/Jäger produzieren/.test(x)&&/st_nadir · nur Anzeige/.test(x)));
  assert.ok(rows.some(x=>/Werftbetrieb unterschreibt/.test(x)&&/werft_extern · nur Anzeige/.test(x)));
  assert.ok(rows.some(x=>/Jäger für 900 ISK kaufen/.test(x)&&/house · Spieler/.test(x)));
  assert.equal(await page.locator('#j10-werft button').count(),1,'kein Button für NPC- oder Werftverfügung');
  assert.match(await page.locator('#weltgeld').textContent(),/33000 ISK/);
  const cash=Number((await page.locator('#cash').textContent()).split(' ')[0]);
  await page.locator('[data-aktion="buy-st_aldera-miner"]').click();
  const reduced=Number((await page.locator('#cash').textContent()).split(' ')[0]);
  assert.equal(cash-reduced,600,'Hauskauf ist finanziert');
  assert.equal(await page.locator('#j10-jaeger-kaufen').isDisabled(),true);
  assert.equal(await page.locator('#j10-fertige').textContent(),'0');
  assert.match(await page.locator('#weltgeld').textContent(),/33000 ISK/);
  assert.equal(OLD.create(42,'private195').export(),original);
  assert.deepEqual(errors,[]);
  assert.deepEqual(external,[]);
  console.log('J10A_BROWSER_OK',JSON.stringify({browser:which,width,height,price:900,
    work:32,paidMiner:600,fighterStock:0,npcActionsReadOnly:true,money:33000}));
  await context.close();
 }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
