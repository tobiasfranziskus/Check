// F8-D: explicit touch-preflight of the MOVING (not static) target.
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
       v:window.__f8.status(),
       audit:window.__f8.audit()
     }));
     const ticks=n=>page.evaluate(n=>window.__f8.schritte(n),n);
     try{
       await page.goto('http://127.0.0.1:'+server.address().port+
         '/prototypes/f8-jaeger/index.html');
       await page.waitForFunction(()=>Boolean(window.__f8));
       let a=await get();
       assert.equal(a.audit.ok,true);
       assert.equal(a.v.zielModus,'stationaer');
       assert.equal(await page.locator('#zielModus').isDisabled(),false);
       await page.locator('#zielModus').selectOption('beweglich');
       a=await get();
       assert.equal(a.v.zielModus,'beweglich','actual target mode from core state');
       assert.deepEqual(a.v.zielPosition,{x:816000,y:-288000});
       assert.equal(a.state.zielprobe.hp,135);
       assert.equal(await page.locator('#feuern').isDisabled(),true);
       await tap('abdocken');await ticks(40);
       assert.equal((await get()).v.lage,'frei');
       assert.equal(await page.locator('#zielModus').isDisabled(),true,
         'no unrecorded target mode switch mid-flight');
       await tap('marke');await ticks(225);
       a=await get();
       assert.equal(a.state.erreicht,265);
       assert.equal(a.audit.ok,true);
       assert.notDeepEqual(a.v.zielPosition,{x:816000,y:-288000},
         'drone must move with simulation tick, not wall time');
       for(let n=1;n<=3;n++){
         await tap('zielErfassen');
         await ticks(8);
         const before=await get();
         assert.equal(before.audit.ok,true);
         assert.equal(before.v.lage,'frei');
         await tap('feuern');
         assert.equal(await page.locator('#feuern').isDisabled(),true,
           'cooldown enforces exactly one projectile for a tap');
         await ticks(16);
         a=await get();
         assert.equal(a.audit.ok,true,JSON.stringify(a.audit));
         assert.equal(a.state.zielprobe.treffer,n,
           'shot must truly intersect moving target '+n);
         assert.equal(a.state.zielprobe.hp,135-n*45);
         assert.equal(a.state.zielprobe.belege.length,n);
       }
       assert.equal(await page.locator('#feuern').isDisabled(),true,
         'deactivated drone cannot generate more hit receipts');
       await tap('andocken');await ticks(650);
       a=await get();
       assert.equal(a.v.lage,'angedockt');
       assert.equal(a.audit.ok,true);
       await tap('neu');
       a=await get();
       assert.equal(a.v.sekunden,0);
       assert.equal(a.v.zielModus,'stationaer');
       assert.equal(a.state.zielprobe.hp,135);
       assert.equal(a.state.zielprobe.schuesse,0);
       assert.equal(a.audit.ok,true);
       for(const field of ['owners','ledger','minted','burned','kopfgeld','rulesVersion'])
         assert.equal(Object.hasOwn(a.state,field),false,
           'training must never act on a real economy');
       assert.deepEqual(errors,[]);
       console.log('F8D_MOVING_DRONE_OK',engine,width,height,
         '3 verified hits, deterministic flight and return');
     }finally{await context.close()}
   }
 }finally{
   if(browser)await browser.close();
   await new Promise(done=>server.close(done));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
