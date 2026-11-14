// F8-E: 4 Touchgrössen x Chromium/WebKit, echte Treffer und Verlust im F6-Übungskern.
'use strict';
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
   const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
   if(!file.startsWith(root+'/prototypes/')||!/\.(html|css|js)$/.test(file))
     return res.writeHead(404).end();
   try{
     res.setHeader('Content-Type',file.endsWith('.html')?'text/html':
       file.endsWith('.css')?'text/css':'text/javascript');
     res.end(fs.readFileSync(file));
   }catch{res.writeHead(404).end()}
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const engine=process.env.WELT_BROWSER==='webkit'?'webkit':'chromium';
 const driver=engine==='webkit'?webkit:chromium;
 let browser;
 try{
   browser=await driver.launch(engine==='webkit'?{}:{args:['--no-sandbox']});
   for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
     const context=await browser.newContext({viewport:{width,height},hasTouch:true});
     const page=await context.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(String(e)));
     const tap=async id=>{
       await page.locator('#'+id).scrollIntoViewIfNeeded();
       await page.locator('#'+id).tap();
     };
     const get=()=>page.evaluate(()=>({
       state:JSON.parse(window.__f8.zustand()),
       v:window.__f8.status(),audit:window.__f8.audit()
     }));
     const ticks=n=>page.evaluate(n=>window.__f8.schritte(n),n);
     const start=async()=>{
       await page.locator('#zielModus').selectOption('duell');
       assert.equal((await get()).v.zielModus,'duell');
       await tap('abdocken');
       await ticks(40);
       await tap('marke');
       await ticks(225);
       const snap=await get();
       assert.equal(snap.v.sekunden,265);
       assert.equal(snap.v.lage,'frei');
       assert.equal(snap.audit.ok,true);
       assert.equal(await page.locator('#zielModus').isDisabled(),true);
     };
     try{
       await page.goto('http://127.0.0.1:'+server.address().port+
         '/prototypes/f8-jaeger/index.html');
       await page.waitForFunction(()=>Boolean(window.__f8));
       assert.equal((await get()).audit.ok,true);
       await start();
       for(let n=1;n<=3;n++){
         await tap('zielErfassen');
         await ticks(8);
         assert.equal(await page.locator('#feuern').isDisabled(),false);
         await tap('feuern');
         assert.equal(await page.locator('#feuern').isDisabled(),true,'cooldown');
         await ticks(16);
         const r=await get();
         assert.equal(r.audit.ok,true,JSON.stringify(r.audit));
         assert.equal(r.v.treffer,n);
         assert.equal(r.v.zielHp,135-n*45);
       }
       let r=await get();
       assert.equal(r.v.duellErgebnis,'sieg');
       assert.equal(r.v.pilotHp,48,'real incoming projectile damage');
       assert.equal(r.v.gegnerTreffer,2);
       assert.match(await page.locator('#duellErgebnis').innerText(),/gewonnen/);
       assert.equal(await page.locator('#feuern').isDisabled(),true);
       await tap('andocken');await ticks(750);
       r=await get();
       assert.equal(r.v.lage,'angedockt');
       assert.equal(r.audit.ok,true);
       await tap('neu');
       r=await get();
       assert.equal(r.v.sekunden,0);
       assert.equal(r.v.pilotHp,96);
       assert.equal(r.v.duellErgebnis,'zieluebung');
       await start();
       await page.locator('#kurs').evaluate(el=>{
         el.value='64';el.dispatchEvent(new Event('input',{bubbles:true}));
       });
       await page.locator('#fahrt').evaluate(el=>{
         el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));
       });
       await tap('steuern');
       await ticks(114);
       r=await get();
       assert.equal(r.v.sekunden,379);
       assert.equal(r.v.duellErgebnis,'niederlage');
       assert.equal(r.v.pilotHp,0);
       assert.equal(r.state.zielprobe.gegner.belege.length,4);
       assert.equal(r.audit.ok,true);
       assert.equal(await page.locator('#steuern').isDisabled(),true);
       assert.equal(await page.locator('#feuern').isDisabled(),true);
       assert.match(await page.locator('#duellErgebnis').innerText(),/deaktiviert/);
       await tap('neu');
       r=await get();
       assert.equal(r.v.sekunden,0);
       assert.equal(r.v.pilotHp,96);
       assert.equal(r.v.zielModus,'stationaer');
       assert.equal(r.state.zielprobe.gegner.schuesse,0);
       assert.equal(r.audit.ok,true);
       for(const field of ['owners','ledger','minted','burned','kopfgeld','rulesVersion'])
         assert.equal(Object.hasOwn(r.state,field),false,'no real economy');
       assert.deepEqual(errors,[]);
       console.log('F8E_DUEL_OK',engine,width,height,'victory & defeat without ISK');
     }finally{await context.close()}
   }
 }finally{
   if(browser)await browser.close();
   await new Promise(done=>server.close(done));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
