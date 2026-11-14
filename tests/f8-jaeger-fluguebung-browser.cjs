/* F8-A touch-preflight. Eine eigenständige Fluguebung (nicht Regel200).
 * Chromium und WebKit, vier Viewports, echter Original-Flugkern.
 */
'use strict';
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
   const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
   if(!p.startsWith(root+'/prototypes/')||!/\.(html|js|css)$/.test(p))return res.writeHead(404).end();
   try{
     res.setHeader('Content-Type',p.endsWith('.html')?'text/html':p.endsWith('.css')?'text/css':'text/javascript');
     res.end(fs.readFileSync(p));
   }catch{res.writeHead(404).end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browserName=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 const browser=await(browserName==='webkit'?webkit:chromium).launch(
   browserName==='webkit'?{}:{args:['--no-sandbox']});
 try{
   for(const [width,height]of[[1180,820],[1024,768],[820,1180],[390,844]]){
     const context=await browser.newContext({viewport:{width,height},hasTouch:true});
     const page=await context.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(String(e)));
     const tap=async id=>{await page.locator('#'+id).scrollIntoViewIfNeeded();await page.locator('#'+id).tap()};
     const get=()=>page.evaluate(()=>({state:JSON.parse(window.__f8.zustand()),
       status:window.__f8.status(),audit:window.__f8.audit()}));
     try{
       await page.goto('http://127.0.0.1:'+server.address().port+'/prototypes/f8-jaeger/index.html');
       await page.waitForFunction(()=>Boolean(window.__f8));
       let init=await get();assert.equal(init.audit.ok,true);
       assert.equal(init.state.ships.f8_training_only.klasse,'jaeger');
       assert.equal(await page.locator('#steuern').isDisabled(),true);
       assert.equal(await page.locator('#raum').isVisible(),true);
       assert.match(await page.locator('header').innerText(),/kein.*gekauftes|kein.*Schiff/i);
       await tap('abdocken');
       assert.equal((await get()).status.lage,'abdocken');
       await page.evaluate(()=>window.__f8.schritte(40));
       assert.equal((await get()).status.lage,'frei');
       assert.equal(await page.locator('#steuern').isDisabled(),false);
       await page.locator('#kurs').evaluate(el=>{
         el.value='64';el.dispatchEvent(new Event('input',{bubbles:true}));
       });
       await page.locator('#fahrt').evaluate(el=>{
         el.value='90';el.dispatchEvent(new Event('input',{bubbles:true}));
       });
       await tap('steuern');
       await page.evaluate(()=>window.__f8.schritte(30));
       let mid=await get();
       assert.ok(mid.status.y>0,'Jäger wird vom Original-Kern real geflogen');
       assert.equal(mid.audit.ok,true);
       await tap('bremsen');
       assert.equal(await page.locator('#fahrt').inputValue(),'0');
       await tap('marke');
       await page.evaluate(()=>window.__f8.schritte(600));
       let reached=await get();
       assert.equal(reached.audit.ok,true);
       assert.notEqual(reached.status.erreicht,null,'Marke langsam physisch erreicht');
       assert.equal(await page.locator('#feuern').isDisabled(),false);
       for(let n=1;n<=3;n++){
         await tap('feuern');
         assert.equal(await page.locator('#feuern').isDisabled(),true,'Schuss-/Cooldown-Gate');
         await page.evaluate(()=>window.__f8.schritte(16));
         const shot=await get();
         assert.equal(shot.audit.ok,true,JSON.stringify(shot.audit));
         assert.equal(shot.state.zielprobe.treffer,n,'echter 2D-Treffer');
         assert.equal(shot.state.zielprobe.hp,135-n*45,'Trefferschaden nur im Trainingskern');
         assert.equal(shot.state.zielprobe.belege.length,n);
       }
       assert.equal(await page.locator('#feuern').isDisabled(),true,'zerstörtes Trainingsziel');
       assert.match(await page.locator('#schussStatus').innerText(),/Trainingsziel deaktiviert/);
       await tap('andocken');
       await page.evaluate(()=>window.__f8.schritte(750));
       let docked=await get();
       assert.equal(docked.status.lage,'angedockt');
       assert.equal(docked.audit.ok,true);
       await tap('neu');
       init=await get();
       assert.equal(init.status.sekunden,0);
       assert.equal(init.status.erreicht,null);
       assert.equal(init.audit.ok,true);
       for(const f of ['owners','ledger','minted','burned','kopfgeld'])
         assert.equal(Object.hasOwn(init.state,f),false,'Training darf keine Wirtschaft schreiben');
       assert.deepEqual(errors,[]);
       console.log('F8_FIGHTER_FLIGHT_OK',browserName,width,height,reached.status.erreicht);
     }finally{await context.close()}
   }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
