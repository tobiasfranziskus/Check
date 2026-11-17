'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const J=require('../prototypes/verbund/konzern-session.js');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!f.startsWith(root+path.sep))return res.writeHead(403).end();
 if(req.url==='/favicon.ico')return res.writeHead(204).end();
 try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(f)]||'text/plain');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
 const kind=process.env.WELT_BROWSER||'chromium';browser=await ({chromium,webkit})[kind].launch(kind==='chromium'?{...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox']}:{});
 for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,acceptDownloads:true});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const tap=async selector=>{await page.locator(selector).scrollIntoViewIfNeeded();await page.locator(selector).tap();};
  const waitStage=async text=>page.waitForFunction(t=>document.querySelector('#pilotenausbildung-live').textContent.includes(t),text,{timeout:90000});
  const pause=async()=>{if(await page.locator('#raum-start').getAttribute('aria-pressed')==='true')await tap('#raum-start');};
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/prototypes/spiel/index.html');
   await tap('#neues-spiel');await tap('#karriere-starten');await tap('#pilotenausbildung summary');
   assert.equal(await page.locator('[data-lektion]').count(),13);assert.equal(await page.locator('[data-lektion="flugpruefung"]').isDisabled(),true);
   await tap('[data-action="buy-st_aldera-miner"]');await tap('#tab-flotte');await page.locator('[data-pilot]').first().tap();await tap('#raum-konzern');
   await tap('[data-lektion="flugpruefung"]');await waitStage('Etappe 1/5');await tap('#raum-tempo-60');await tap('#raum-abdocken');await waitStage('Etappe 2/5');await pause();
   // Pause cannot complete a stage. Only ordinary cockpit input follows.
   const paused=await page.locator('#pilotenausbildung-live').textContent();await page.waitForTimeout(300);assert.equal(await page.locator('#pilotenausbildung-live').textContent(),paused);
   await page.locator('#raum-hand').focus();for(let i=0;i<3;i++)await page.keyboard.press('ArrowUp');await page.waitForTimeout(1600);await pause();
   await tap('[data-raum="objekt-st_aldera"]');await tap('[data-raum="ziel-anfliegen"]');await waitStage('Etappe 3/5');await pause();
   await page.locator('#ziel-orbit-abstand').fill('120000');await tap('[data-raum="ziel-orbit"]');await waitStage('Etappe 4/5');await pause();
   // A real pointer drag takes over; the core must confirm the velocity turn.
   const stick=page.locator('#raum-knueppel');await stick.scrollIntoViewIfNeeded();const b=await stick.boundingBox();
   await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width-8,b.y+b.height/2,{steps:5});await page.mouse.up();
   // Ensure a deliberate turn even if the orbital tangent happened to point east.
   await page.locator('#raum-hand').focus();for(let i=0;i<8;i++)await page.keyboard.press('ArrowRight');
   await waitStage('Etappe 5/5');await pause();await tap('[data-raum="objekt-st_aldera"]');await tap('[data-raum="ziel-andocken"]');await waitStage('Flugprüfung bestanden');await pause();
   assert.match(await page.locator('#raum-lage').textContent(),/Im Dock/i);
   const downloadEvent=page.waitForEvent('download');await tap('#raum-export');const download=await downloadEvent,save=fs.readFileSync(await download.path(),'utf8');
   const j=J.erstellen();j.oeffnen204(save,true);const s=j.zustandReferenz();assert.equal(j.weltReferenz().audit(s).ok,true);assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);assert.equal(j.exportieren(),save);assert.equal(save.includes('handBasis'),false);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.deepEqual(errors,[]);
   console.log('P2_FLUGPRUEFUNG_BROWSER_OK',kind,width,height,j.ansicht().hash);
   await page.reload();await tap('#fortsetzen');assert.equal(await page.locator('#pilotenausbildung-live').isHidden(),true);
  }catch(e){await page.screenshot({path:'/tmp/p2-mission-'+kind+'-'+width+'.png',fullPage:true});throw e;}finally{await ctx.close();}
 }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
